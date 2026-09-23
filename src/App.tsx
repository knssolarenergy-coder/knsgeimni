import React, { useState } from 'react';
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !StorageService.getSessionUser());
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

  const [isCityPickerOpen, setIsCityPickerOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isSiteInstallationModalOpen, setIsSiteInstallationModalOpen] = useState<boolean>(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState<boolean>(false);
  const [isWarrantySearchOpen, setIsWarrantySearchOpen] = useState<boolean>(false);

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
    setIsAuthModalOpen(true);
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
    <div className="w-full min-h-screen bg-stone-950 flex flex-col items-center justify-center">
      {/* Native Mobile App Device Chassis & Presentation */}
      <MobileFrame
        user={user}
        activeTab={activeTab}
        onNavigateTab={(tab) => {
          if (tab === 'admin' && user?.role !== 'admin') {
            handleRequestAuthRole('admin');
            return;
          }
          if (tab === 'technician' && user?.role !== 'technician') {
            handleRequestAuthRole('technician');
            return;
          }
          setActiveTab(tab);
          if (tab === 'admin') setIsAdminMode(true);
          else setIsAdminMode(false);
        }}
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
        {(!user || isAuthModalOpen) ? (
          <AuthScreen
            onLoginSuccess={handleLoginSuccess}
            targetRole={authTargetRole}
            onCancel={user ? () => setIsAuthModalOpen(false) : undefined}
          />
        ) : (
          <>
            {/* Screen 1: Mobile Home Dashboard (Customer) */}
            {activeTab === 'home' && (
              <MobileHome
                user={effectiveUser}
                bookings={bookings}
                settings={settings}
                onNavigateTab={(tab) => {
                  if (tab === 'admin' && user?.role !== 'admin') {
                    handleRequestAuthRole('admin');
                    return;
                  }
                  if (tab === 'technician' && user?.role !== 'technician') {
                    handleRequestAuthRole('technician');
                    return;
                  }
                  setActiveTab(tab);
                }}
                onOpenComplaintModal={() => setActiveTab('complaints')}
                onOpenCityPicker={() => setIsCityPickerOpen(true)}
                onOpenInstallModal={() => setIsInstallModalOpen(true)}
                onOpenReferralModal={() => setIsReferralModalOpen(true)}
                onOpenSiteInstallationModal={() => {
                  if (user?.role === 'admin') {
                    setActiveTab('admin');
                  } else {
                    setActiveTab('installation');
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
                onNavigateHome={() => setActiveTab('home')}
                whatsappNumber={settings.whatsapp_booking}
              />
            )}

            {/* Screen 3: Inverter Telemetry Portals */}
            {activeTab === 'inverters' && <InverterSection />}

            {/* Screen 4: Track Orders */}
            {activeTab === 'orders' && (
              <OrdersTracker
                bookings={bookings}
                complaints={complaints}
                quotes={quotes}
                onUpdateStatus={handleUpdateBookingStatus}
                onOpenBookingModal={() => setIsBookingModalOpen(true)}
                onOpenComplaintModal={() => setActiveTab('complaints')}
                onOpenQuoteModal={() => setActiveTab('installation')}
                whatsappNumber={settings.whatsapp_booking}
              />
            )}

            {/* Screen 5: Solar Sizing & ROI Calculator */}
            {activeTab === 'calculator' && (
              <SolarCalculator user={effectiveUser} onSubmitQuote={handleQuoteSubmitted} />
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
                onNavigateHome={() => setActiveTab('home')}
                onNavigateMyOrders={() => setActiveTab('orders')}
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
                onNavigateHome={() => setActiveTab('home')}
                onNavigateMyOrders={() => setActiveTab('orders')}
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
                onNavigateHome={() => setActiveTab('home')}
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
                onUpdateInstallationStatus={handleUpdateInstallationStatus}
                onUpdateInstallationMilestone={handleUpdateInstallationMilestone}
                onAddTechnician={handleAddTechnician}
                onSaveSettings={handleSaveSettings}
                onOpenTechPortal={handleOpenTechPortal}
                onNavigateHome={() => setActiveTab('home')}
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
