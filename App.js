import { registerRootComponent } from 'expo';
import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Platform,
  ActivityIndicator,
  Text,
  AppState,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { embeddedHtml } from './embeddedHtml';

const BACKGROUND_LOCATION_TASK = 'KS_SOLAR_BACKGROUND_LOCATION_TASK';

// Native Android Headless Background Task
// This task runs directly in the Android OS background even when the app is minimized,
// closed, or the screen is locked!
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[BackgroundTracking] Task error:', error.message);
    return;
  }

  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const loc = locations[locations.length - 1];
      const { latitude, longitude, speed, heading, accuracy } = loc.coords;
      const speedKmh = speed ? Math.round(speed * 3.6) : 0;

      try {
        const stored = await AsyncStorage.getItem('ks_solar_active_tech_info');
        const techInfo = stored ? JSON.parse(stored) : null;
        const techId = techInfo ? techInfo.technicianId : null;

        if (techId) {
          const nowIso = new Date().toISOString();
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/elemental-set-gcb1c/databases/ai-studio-knsfullbackupcom-f76278f8-4cde-4f41-9bdb-b474fd501d81/documents/tech_locations/${techId}?key=AIzaSyApS_IePPMhYF3PG4M_uOOS-ipLCEX51rc`;

          const body = {
            fields: {
              technicianId: { stringValue: techId },
              technicianName: { stringValue: techInfo.name || 'Technician' },
              phone: { stringValue: techInfo.phone || '' },
              city: { stringValue: techInfo.city || 'Bhakkar' },
              lat: { doubleValue: latitude },
              lng: { doubleValue: longitude },
              speedKmh: { integerValue: String(speedKmh) },
              heading: { doubleValue: heading || 0 },
              accuracy: { integerValue: String(Math.round(accuracy || 10)) },
              status: { stringValue: speedKmh > 3 ? 'moving' : 'at_customer' },
              lastPing: { stringValue: nowIso },
              isLiveBeaconActive: { booleanValue: true },
              backgroundServiceActive: { booleanValue: true },
            },
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          await fetch(firestoreUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
        }
      } catch (err) {
        // Silent catch in background
      }
    }
  }
});

// Helper to start and maintain 24/7 background location updates
async function startAlwaysOnTracking(techInfo) {
  try {
    if (techInfo) {
      await AsyncStorage.setItem('ks_solar_active_tech_info', JSON.stringify(techInfo));
    }

    // Android 13+ (API 33+) requires runtime notification permission to display Foreground Service
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      } catch (notifErr) {}
    }

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      return false;
    }

    // Request Background "Allow all the time" permission
    await Location.requestBackgroundPermissionsAsync().catch(() => {});

    // Check if task is already running; restart to ensure fresh options
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
    }

    // Start 24/7 Foreground Service location stream
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 0,
      deferredUpdatesInterval: 5000,
      deferredUpdatesDistance: 0,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'K&S Solar Operations Service',
        notificationBody: 'Field operations & job dispatch sync active',
        notificationColor: '#00838f',
        killServiceOnDestroy: false,
      },
    });

    return true;
  } catch (err) {
    console.warn('[Tracking] Start always-on tracking error:', err);
    return false;
  }
}

function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoBackInApp, setCanGoBackInApp] = useState(false);

  // Auto-resume tracking on app startup if technician was previously logged in
  useEffect(() => {
    const resumeSavedTracking = async () => {
      try {
        const stored = await AsyncStorage.getItem('ks_solar_active_tech_info');
        if (stored) {
          const techInfo = JSON.parse(stored);
          if (techInfo && techInfo.technicianId) {
            startAlwaysOnTracking(techInfo);
          }
        }
      } catch (err) {}
    };

    resumeSavedTracking();

    // Re-arm tracking whenever the app returns to foreground
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        resumeSavedTracking();
      }
    });

    return () => sub.remove();
  }, []);

  // Handle hardware Android back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBackInApp || canGoBack) {
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              (function() {
                try {
                  if (typeof window.__handleAndroidBack === 'function') {
                    window.__handleAndroidBack();
                  } else if (window.history.length > 1) {
                    window.history.back();
                  }
                } catch(e) {}
              })();
              true;
            `);
            return true;
          }
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }
  }, [canGoBack, canGoBackInApp]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#072844" />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: embeddedHtml, baseUrl: 'https://kssolar.pk/' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        androidLayerType="hardware"
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        geolocationEnabled={true}
        cacheEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (!data) return;

            // Handle back navigation
            if (typeof data.canGoBack === 'boolean') {
              setCanGoBackInApp(data.canGoBack);
            }

            // Handle open phone app settings request
            if (data.type === 'OPEN_APP_SETTINGS') {
              Linking.openSettings().catch(() => {});
            }

            // Handle technician 1st-time or ongoing login: start 24/7 background tracking!
            if (data.type === 'TECHNICIAN_LOGGED_IN' && data.technicianId) {
              startAlwaysOnTracking({
                technicianId: data.technicianId,
                name: data.name,
                phone: data.phone,
                city: data.city,
              });
            }

            // Handle explicit logout: stop background task
            if (data.type === 'TECHNICIAN_LOGGED_OUT') {
              AsyncStorage.removeItem('ks_solar_active_tech_info').catch(() => {});
              Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
            }
          } catch (e) {}
        }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={styles.loadingText}>Loading K&S Solar Energy...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#072844',
  },
  webview: {
    flex: 1,
    backgroundColor: '#072844',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#072844',
  },
  loadingText: {
    color: '#f59e0b',
    marginTop: 12,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default registerRootComponent(App);
