import React, { useState, useEffect } from 'react';
import {
  AppSettings,
  Booking,
  BookingStatus,
  Complaint,
  ComplaintStatus,
  InstallationMilestoneStatus,
  InstallationStatus,
  QuoteRequest,
  QuoteStatus,
  SiteInstallation,
  Technician,
  TechJobProgress,
  UserProfile,
  UserRole,
} from './types';
import { StorageService } from './services/storage';
import { MobileFrame } from './components/MobileFrame';
import { MobileHome } from './components/MobileHome';
import { MobileBookWash } from './components/MobileBookWash';
import { InverterSection } from './components/InverterSection';
import { OrdersTracker } from './components/OrdersTracker';
import { SolarCalculator } from './components/SolarCalculator';
import { AdminPanel } from './components/AdminPanel';
import { TechnicianPortal } from './components/TechnicianPortal';
import { ComplaintModal } from './components/ComplaintModal';
import { BookingModal } from './components/BookingModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { CityPickerModal } from './components/CityPickerModal';
import { AuthScreen } from './components/AuthScreen';
import { SiteInstallationModal } from './components/SiteInstallationModal';
import { ReferralModal } from './components/ReferralModal';
import { AccountScreen } from './components/AccountScreen';
import { ComplaintsScreen } from './components/ComplaintsScreen';
import { SolarInstallationScreen } from './components/SolarInstallationScreen';
import { WarrantySearchModal } from './components/WarrantyModals';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(() => StorageService.getSessionUser());
  // App opens directly into the dashboard (guest allowed to browse washing, complaints, installation, calculator)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTargetRole, setAuthTargetRole] = useState<UserRole>('customer');

  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [bookings, setBookings] = useState<Booking[]>(() => StorageService.getBookings());
  const [complaints, setComplaints] = useState<Complaint[]>(() => StorageService.getComplaints());
  const [quotes, setQuotes] = useState<QuoteRequest[]>(() => StorageService.getQuotes());
  const [technicians, setTechnicians] = useState<Technician[]>(() => StorageService.getTechnicians());
  const [installations, setInstallations] = useState<SiteInstallation[]>(() => StorageService.getSiteInstallations());

  const [activeTechnicianId, setActiveTechnicianId] = useState<string>(() => {
    const session = StorageService.getSessionUser();
    if (session?.activeTechnicianId) return session.activeTechnicianId;
    return StorageService.getTechnicians()[0]?.id || 'tech-1';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const session = StorageService.getSessionUser();
    if (session?.role === 'admin') return 'admin';
    if (session?.role === 'technician') return 'technician';
    return 'home';
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    const session = StorageService.getSessionUser();
    return session?.role === 'admin';
  });

  // Navigation History Stack so pressing Back always returns to the previous page/modal
  const [navHistory, setNavHistory] = useState<string[]>(['home']);

  const [isCityPickerOpen, setIsCityPickerOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isSiteInstallationModalOpen, setIsSiteInstallationModalOpen] = useState<boolean>(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState<boolean>(false);
  const [isWarrantySearchOpen, setIsWarrantySearchOpen] = useState<boolean>(false);

  // Navigate to a new tab and push it onto the history stack
  const navigateToTab = (tab: string, pushHistory = true) => {
    if (tab === activeTab) return;

    // Feature locking: non-logged-in users cannot access inverters, orders, account, admin, or technician
    if (!user && (tab === 'inverters' || tab === 'orders' || tab === 'account' || tab === 'admin' || tab === 'technician')) {
      handleRequestAuthRole(tab === 'admin' ? 'admin' : tab === 'technician' ? 'technician' : 'customer');
      return;
    }

    if (tab === 'admin' && user?.role !== 'admin' && !user?.isAdmin) {
      handleRequestAuthRole('admin');
      return;
    }
    if (tab === 'technician' && user?.role !== 'technician') {
      // Admin has super-admin privileges to inspect the technician portal without logging out or being prompted for re-auth
      if (user?.role === 'admin' || user?.isAdmin) {
        // Admin stays logged in as admin
      } else {
        handleRequestAuthRole('technician');
        return;
      }
    }

    if (pushHistory) {
      setNavHistory((prev) => [...prev, tab]);
    }
    setActiveTab(tab);
    if (tab === 'admin') {
      setIsAdminMode(true);
    } else if (user?.role === 'admin' || user?.isAdmin) {
      // Retain admin privileges permanently across all tabs
      setIsAdminMode(true);
    } else if (tab !== 'technician') {
      setIsAdminMode(false);
    }
  };

  // Universal Back Handler: closes modals first, then pops tab history
  const handleNavigateBack = (): boolean => {
    if (isWarrantySearchOpen) {
      setIsWarrantySearchOpen(false);
      return true;
    }
    if (isCityPickerOpen) {
      setIsCityPickerOpen(false);
      return true;
    }
    if (isReferralModalOpen) {
      setIsReferralModalOpen(false);
      return true;
    }
    if (isBookingModalOpen) {
      setIsBookingModalOpen(false);
      return true;
    }
    if (isComplaintModalOpen) {
      setIsComplaintModalOpen(false);
      return true;
    }
    if (isInstallModalOpen) {
      setIsInstallModalOpen(false);
      return true;
    }
    if (isSiteInstallationModalOpen) {
      setIsSiteInstallationModalOpen(false);
      return true;
    }
    if (isAuthModalOpen) {
      setIsAuthModalOpen(false);
      return true;
    }

    // Pop the previous tab from history stack
    if (navHistory.length > 1) {
      const nextHistory = [...navHistory];
      nextHistory.pop(); // remove current active tab
      const prevTab = nextHistory[nextHistory.length - 1];
      setNavHistory(nextHistory);
      setActiveTab(prevTab);
      if (prevTab === 'admin') {
        setIsAdminMode(true);
      } else if (user?.role === 'admin' || user?.isAdmin) {
        setIsAdminMode(true);
      } else if (prevTab !== 'technician') {
        setIsAdminMode(false);
      }
      return true;
    }

    // If on a sub-tab, return to home or admin dashboard
    if (activeTab !== 'home' && user?.role === 'customer') {
      setActiveTab('home');
      setNavHistory(['home']);
      return true;
    }
    if (activeTab !== 'admin' && (user?.role === 'admin' || user?.isAdmin)) {
      setActiveTab('admin');
      setNavHistory(['admin']);
      setIsAdminMode(true);
      return true;
    }

    // Already at root home screen with no modals
    return false;
  };

  // Expose back navigation handler to Android WebView wrapper and notify ReactNative
  useEffect(() => {
    (window as any).__handleAndroidBack = handleNavigateBack;

    const canGoBack =
      navHistory.length > 1 ||
      (activeTab !== 'home' && user?.role === 'customer') ||
      isWarrantySearchOpen ||
      isCityPickerOpen ||
      isReferralModalOpen ||
      isBookingModalOpen ||
      isComplaintModalOpen ||
      isInstallModalOpen ||
      isSiteInstallationModalOpen;

    if ((window as any).ReactNativeWebView) {
      try {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'CAN_GO_BACK', canGoBack })
        );
      } catch (e) {}
    }
  }, [
    navHistory,
    activeTab,
    isWarrantySearchOpen,
    isCityPickerOpen,
    isReferralModalOpen,
    isBookingModalOpen,
    isComplaintModalOpen,
    isInstallModalOpen,
    isSiteInstallationModalOpen,
    isAuthModalOpen,
    user,
  ]);

  // Root-Level Silent Tracking Engine:
  // Runs resilient background tracking whenever a technician is logged in, or if tracking
  // was previously active before mobile restart / browser reload.
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    try {
      const isTrackingPersisted = localStorage.getItem('ks_solar_tracking_enabled') === 'true';
      const savedTechId = localStorage.getItem('ks_solar_active_tracking_tech_id') || activeTechnicianId;
      const isTechContext = user?.role === 'technician' || activeTab === 'technician' || isTrackingPersisted;

      if (isTechContext && savedTechId) {
        cleanup = StorageService.startSilentTechnicianTracking(savedTechId);
      }
    } catch {
      // ignore
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [user?.role, activeTab, activeTechnicianId]);

  // Authentication Handlers
  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setIsAuthModalOpen(false);

    if (loggedInUser.role === 'admin') {
      setIsAdminMode(true);
      setActiveTab('admin');
    } else if (loggedInUser.role === 'technician') {
      setIsAdminMode(false);
      setActiveTab('technician');
      if (loggedInUser.activeTechnicianId) {
        setActiveTechnicianId(loggedInUser.activeTechnicianId);
      }
    } else {
      setIsAdminMode(false);
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setIsAuthModalOpen(false);
    setActiveTab('home');
    setAuthTargetRole('customer');
  };

  const handleRequestAuthRole = (role: UserRole) => {
    if (user && user.role === role) {
      if (role === 'admin') {
        setIsAdminMode(true);
        setActiveTab('admin');
      } else if (role === 'technician') {
        setActiveTab('technician');
      } else {
        setActiveTab('home');
      }
    } else {
      setAuthTargetRole(role);
      setIsAuthModalOpen(true);
    }
  };

  const handleUpdateCity = (city: string) => {
    if (!user) return;
    const updated = { ...user, city };
    setUser(updated);
    StorageService.saveUser(updated);
  };

  const handleToggleAdminMode = () => {
    if (user?.role !== 'admin') {
      handleRequestAuthRole('admin');
      return;
    }
    const next = !isAdminMode;
    setIsAdminMode(next);
    if (next) {
      setActiveTab('admin');
    } else if (activeTab === 'admin') {
      setActiveTab('home');
    }
  };

  const handleBookingCreated = (booking: Booking) => {
    const updated = [booking, ...bookings];
    setBookings(updated);
    StorageService.addBooking(booking);
  };

  const handleUpdateBookingStatus = (id: string, status: BookingStatus) => {
    const updated = StorageService.updateBookingStatus(id, status);
    setBookings(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleAssignBookingTech = (
    bookingId: string,
    techId: string,
    techName: string,
    notes?: string
  ) => {
    const updated = StorageService.assignBookingTechnician(bookingId, techId, techName, notes);
    setBookings(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleUpdateBookingTechProgress = (
    bookingId: string,
    progress: TechJobProgress,
    notes?: string
  ) => {
    const updated = StorageService.updateBookingTechProgress(bookingId, progress, notes);
    setBookings(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleComplaintCreated = (complaint: Complaint) => {
    const updated = [complaint, ...complaints];
    setComplaints(updated);
    StorageService.addComplaint(complaint);
  };

  const handleUpdateComplaintStatus = (id: string, status: ComplaintStatus) => {
    const updated = StorageService.updateComplaintStatus(id, status);
    setComplaints(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleAssignComplaintTech = (
    complaintId: string,
    techId: string,
    techName: string,
    notes?: string
  ) => {
    const updated = StorageService.assignComplaintTechnician(complaintId, techId, techName, notes);
    setComplaints(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleUpdateComplaintTechNotes = (
    complaintId: string,
    notes: string,
    status?: ComplaintStatus
  ) => {
    const updated = StorageService.updateComplaintTechNotes(complaintId, notes, status);
    setComplaints(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleQuoteSubmitted = (quote: QuoteRequest) => {
    const updated = [quote, ...quotes];
    setQuotes(updated);
    StorageService.addQuote(quote);
  };

  const handleUpdateQuoteStatus = (id: string, status: QuoteStatus) => {
    const updated = StorageService.updateQuoteStatus(id, status);
    setQuotes(updated);
  };

  const handleAssignQuoteTech = (
    quoteId: string,
    techId: string,
    techName: string,
    surveyDate?: string,
    notes?: string
  ) => {
    const updated = StorageService.assignQuoteTechnician(quoteId, techId, techName, surveyDate, notes);
    setQuotes(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleAddTechnician = (
    tech: Omit<Technician, 'id' | 'activeJobsCount' | 'completedJobsCount' | 'rating' | 'joinedDate'>
  ) => {
    StorageService.addTechnician(tech);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleUpdateTechStatus = (techId: string, status: Technician['status']) => {
    const updated = StorageService.updateTechnicianStatus(techId, status);
    setTechnicians(updated);
  };

  const handleUpdateQuoteNotes = (quoteId: string, notes: string) => {
    const updated = StorageService.updateQuoteNotes(quoteId, notes);
    setQuotes(updated);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  // Multi-Technician Assignment Handlers
  const handleAssignBookingTechs = (
    bookingId: string,
    techIds: string[],
    techNames: string[],
    notes?: string
  ) => {
    const updated = StorageService.assignBookingTechnicians(bookingId, techIds, techNames, notes);
    setBookings(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleAssignComplaintTechs = (
    complaintId: string,
    techIds: string[],
    techNames: string[],
    notes?: string
  ) => {
    const updated = StorageService.assignComplaintTechnicians(complaintId, techIds, techNames, notes);
    setComplaints(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleAssignQuoteTechs = (
    quoteId: string,
    techIds: string[],
    techNames: string[],
    surveyDate?: string,
    notes?: string
  ) => {
    const updated = StorageService.assignQuoteTechnicians(quoteId, techIds, techNames, surveyDate, notes);
    setQuotes(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleAssignInstallationTechs = (
    installationId: string,
    techIds: string[],
    techNames: string[],
    notes?: string
  ) => {
    const updated = StorageService.assignInstallationTechnicians(installationId, techIds, techNames, notes);
    setInstallations(updated);
    setTechnicians(StorageService.getTechnicians());
  };

  const handleCreateInstallation = (data: SiteInstallation) => {
    StorageService.addSiteInstallation(data);
    setInstallations(StorageService.getSiteInstallations());
    setTechnicians(StorageService.getTechnicians());
  };

  const handleUpdateInstallationStatus = (id: string, status: InstallationStatus) => {
    const updated = StorageService.updateInstallationStatus(id, status);
    setInstallations(updated);
  };

  const handleUpdateInstallationMilestone = (
    id: string,
    milestoneId: string,
    status: InstallationMilestoneStatus,
    notes?: string
  ) => {
    const updated = StorageService.updateInstallationMilestone(id, milestoneId, status, notes);
    setInstallations(updated);
  };

  const handleOpenTechPortal = (techId?: string) => {
    if (techId) {
      setActiveTechnicianId(techId);
    }
    setActiveTab('technician');
  };

  // Metrics for badges
  const activeTech = technicians.find((t) => t.id === activeTechnicianId) || technicians[0];
  const pendingTechJobsCount = activeTech
    ? bookings.filter((b) => b.assignedTechnicianId === activeTech.id && b.status !== 'completed' && b.status !== 'cancelled').length +
      complaints.filter((c) => c.assignedTechnicianId === activeTech.id && c.status !== 'resolved').length
    : 0;

  const pendingAdminJobsCount =
    bookings.filter((b) => !b.assignedTechnicianId && b.status !== 'cancelled').length +
    complaints.filter((c) => !c.assignedTechnicianId && c.status !== 'resolved').length;

  // Safe fallback user for subcomponents if user is currently null but modal is open
  const effectiveUser: UserProfile = user || {
    id: 'guest',
    name: 'Guest User',
    email: 'guest@kssolar.pk',
    phone: '0300-0000000',
    role: 'customer',
    isAdmin: false,
    city: 'Lahore',
  };

  return (
    <div className="w-full min-h-screen bg-stone-50 flex flex-col items-center justify-start">
      {/* Edge-to-Edge Responsive Layout Fitting Phone Screen Directly */}
      <MobileFrame
        user={user}
        activeTab={activeTab}
        onNavigateTab={navigateToTab}
        onNavigateBack={handleNavigateBack}
        canGoBack={navHistory.length > 1 || activeTab !== 'home'}
        isAdminMode={isAdminMode || activeTab === 'admin'}
        onToggleAdminMode={handleToggleAdminMode}
        onOpenCityPicker={() => setIsCityPickerOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenReferralModal={() => setIsReferralModalOpen(true)}
        whatsappSupportNumber={settings.whatsapp_support}
        pendingTechJobsCount={pendingTechJobsCount}
        pendingAdminJobsCount={pendingAdminJobsCount}
        onLogout={handleLogout}
        onRequestAuthRole={handleRequestAuthRole}
      >
        {/* If Authentication is required or user is switching portals */}
        {isAuthModalOpen ? (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            targetRole={authTargetRole}
            onCancel={() => setIsAuthModalOpen(false)}
          />
        ) : (
          <>
            {/* Screen 1: Mobile Home Dashboard (Customer) */}
            {activeTab === 'home' && (
              <MobileHome
                user={effectiveUser}
                bookings={bookings}
                settings={settings}
                onNavigateTab={navigateToTab}
                onRequestSignIn={() => handleRequestAuthRole('customer')}
                onOpenComplaintModal={() => navigateToTab('complaints')}
                onOpenCityPicker={() => setIsCityPickerOpen(true)}
                onOpenInstallModal={() => setIsInstallModalOpen(true)}
                onOpenReferralModal={() => {
                  if (!user) {
                    handleRequestAuthRole('customer');
                  } else {
                    setIsReferralModalOpen(true);
                  }
                }}
                onOpenSiteInstallationModal={() => {
                  if (user?.role === 'admin') {
                    navigateToTab('admin');
                  } else {
                    navigateToTab('installation');
                  }
                }}
                onLogout={handleLogout}
              />
            )}

            {/* Screen 2: Dedicated Mobile Panel Wash Booking */}
            {activeTab === 'booking' && (
              <MobileBookWash
                user={effectiveUser}
                onBookingCreated={handleBookingCreated}
                onNavigateHome={() => navigateToTab('home')}
                onNavigateBack={handleNavigateBack}
                whatsappNumber={settings.whatsapp_booking}
              />
            )}

            {/* Screen 3: Inverter Telemetry Portals */}
            {activeTab === 'inverters' && (
              <InverterSection onNavigateBack={handleNavigateBack} />
            )}

            {/* Screen 4: Track Orders */}
            {activeTab === 'orders' && (
              <OrdersTracker
                user={effectiveUser}
                bookings={bookings}
                complaints={complaints}
                quotes={quotes}
                onUpdateStatus={handleUpdateBookingStatus}
                onOpenBookingModal={() => navigateToTab('booking')}
                onOpenComplaintModal={() => navigateToTab('complaints')}
                onOpenQuoteModal={() => navigateToTab('installation')}
                onNavigateBack={handleNavigateBack}
                onRequestSignIn={() => handleRequestAuthRole('customer')}
                whatsappNumber={settings.whatsapp_booking}
              />
            )}

            {/* Screen 5: Solar Sizing & ROI Calculator */}
            {activeTab === 'calculator' && (
              <SolarCalculator
                user={effectiveUser}
                onSubmitQuote={handleQuoteSubmitted}
                onNavigateBack={handleNavigateBack}
              />
            )}

            {/* Screen 6: Account Screen (Matches Screenshots 4, 5, 6) */}
            {activeTab === 'account' && (
              <AccountScreen
                user={effectiveUser}
                onUpdateUser={(updated) => {
                  setUser(updated);
                  StorageService.saveUser(updated);
                }}
                onOpenReferralModal={() => setIsReferralModalOpen(true)}
                onOpenWarrantySearch={() => setIsWarrantySearchOpen(true)}
                onNavigateBack={handleNavigateBack}
                whatsappNumber={settings.whatsapp_support}
              />
            )}

            {/* Screen 7: Complaints Registration & Tracking (Matches Screenshot 2.58.34) */}
            {activeTab === 'complaints' && (
              <ComplaintsScreen
                user={effectiveUser}
                complaints={complaints}
                onComplaintCreated={(newComplaint) => {
                  handleComplaintCreated(newComplaint);
                }}
                onNavigateHome={() => navigateToTab('home')}
                onNavigateBack={handleNavigateBack}
                onNavigateMyOrders={() => navigateToTab('orders')}
                whatsappNumber={settings.whatsapp_support}
              />
            )}

            {/* Screen 8: Solar Installation Multi-Step Quotation (Matches Screenshots 2.57.33 - 2.57.34) */}
            {activeTab === 'installation' && (
              <SolarInstallationScreen
                user={effectiveUser}
                onQuoteCreated={(newQuote) => {
                  handleQuoteSubmitted(newQuote);
                }}
                onNavigateHome={() => navigateToTab('home')}
                onNavigateBack={handleNavigateBack}
                onNavigateMyOrders={() => navigateToTab('orders')}
                whatsappNumber={settings.whatsapp_booking || settings.whatsapp_support}
              />
            )}

            {/* Screen 6: Field Technician Portal */}
            {activeTab === 'technician' && (
              <TechnicianPortal
                technicians={technicians}
                activeTechId={activeTechnicianId}
                onSelectTechnician={setActiveTechnicianId}
                onUpdateTechStatus={handleUpdateTechStatus}
                bookings={bookings}
                complaints={complaints}
                quotes={quotes}
                settings={settings}
                onUpdateBookingProgress={handleUpdateBookingTechProgress}
                onUpdateComplaintStatus={(cId, status, notes) =>
                  handleUpdateComplaintTechNotes(cId, notes || '', status)
                }
                onUpdateQuoteNotes={handleUpdateQuoteNotes}
                onNavigateHome={() => navigateToTab(user?.role === 'admin' || user?.isAdmin ? 'admin' : 'home')}
                onLogout={handleLogout}
              />
            )}

            {/* Screen 7: Operations & Admin Console */}
            {activeTab === 'admin' && (
              <AdminPanel
                bookings={bookings}
                complaints={complaints}
                quotes={quotes}
                technicians={technicians}
                settings={settings}
                installations={installations}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onAssignBookingTech={handleAssignBookingTech}
                onAssignBookingTechs={handleAssignBookingTechs}
                onUpdateComplaintStatus={handleUpdateComplaintStatus}
                onAssignComplaintTech={handleAssignComplaintTech}
                onAssignComplaintTechs={handleAssignComplaintTechs}
                onUpdateQuoteStatus={handleUpdateQuoteStatus}
                onAssignQuoteTech={handleAssignQuoteTech}
                onAssignQuoteTechs={handleAssignQuoteTechs}
                onAssignInstallationTechs={handleAssignInstallationTechs}
                onCreateInstallation={handleCreateInstallation}
                onCreateBooking={handleBookingCreated}
                onCreateComplaint={handleComplaintCreated}
                onCreateQuote={handleQuoteSubmitted}
                onUpdateInstallationStatus={handleUpdateInstallationStatus}
                onUpdateInstallationMilestone={handleUpdateInstallationMilestone}
                onAddTechnician={handleAddTechnician}
                onSaveSettings={handleSaveSettings}
                onOpenTechPortal={handleOpenTechPortal}
                onNavigateHome={() => navigateToTab('home')}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </MobileFrame>

      {/* Mobile Modals & Sheets */}
      <CityPickerModal
        isOpen={isCityPickerOpen}
        onClose={() => setIsCityPickerOpen(false)}
        currentCity={effectiveUser.city}
        onSelectCity={handleUpdateCity}
      />

      <ComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        user={effectiveUser}
        onComplaintCreated={handleComplaintCreated}
        whatsappNumber={settings.whatsapp_complaint}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        user={effectiveUser}
        onBookingCreated={handleBookingCreated}
      />

      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Site Installation Request Modal */}
      {isSiteInstallationModalOpen && (
        <SiteInstallationModal
          isOpen={isSiteInstallationModalOpen}
          user={effectiveUser}
          technicians={technicians}
          whatsappNumber={settings.whatsapp_booking}
          onClose={() => setIsSiteInstallationModalOpen(false)}
          onInstallationCreated={(data) => {
            handleCreateInstallation(data);
            setIsSiteInstallationModalOpen(false);
          }}
        />
      )}

      {/* Referral & Cash Rewards Modal */}
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        user={effectiveUser}
        settings={settings}
        onUserUpdated={(updatedUser) => {
          setUser(updatedUser);
          StorageService.saveUser(updatedUser);
        }}
      />

      {/* Global Warranty Search Modal */}
      <WarrantySearchModal
        isOpen={isWarrantySearchOpen}
        onClose={() => setIsWarrantySearchOpen(false)}
        userPhone={effectiveUser.phone}
        whatsappNumber={settings.whatsapp_support}
      />
    </div>
  );
};

export default App;
