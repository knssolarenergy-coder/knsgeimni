import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: config.projectId,
  appId: config.appId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  firestoreDatabaseId: config.firestoreDatabaseId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

// Initialize Auth
export const auth = getAuth(app);

export default app;
