import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { SplashScreen } from './components/SplashScreen';
import { Config } from './lib/config';
import { FeatureGate } from './components/FeatureGate';
import { CompanyProvider, useCompany } from './lib/CompanyProvider';
import { toCssImageUrl } from './lib/cmsDefaults';

const AdminLayout = lazy(() => import('./layouts/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics').then((module) => ({ default: module.AdminAnalytics })));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings').then((module) => ({ default: module.AdminBookings })));
const AdminCalendar = lazy(() => import('./pages/admin/AdminCalendar').then((module) => ({ default: module.AdminCalendar })));
const AdminCourts = lazy(() => import('./pages/admin/AdminCourts').then((module) => ({ default: module.AdminCourts })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then((module) => ({ default: module.AdminLogin })));
const ChangePassword = lazy(() => import('./pages/admin/AdminChangepassword').then((module) => ({ default: module.ChangePassword })));
const TimeSlotManagement = lazy(() => import('./pages/admin/TimeSlotManagement').then((module) => ({ default: module.TimeSlotManagement })));
const AdminQRCodes = lazy(() => import('./pages/admin/AdminQRCodes').then((module) => ({ default: module.AdminQRCodes })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((module) => ({ default: module.AdminSettings })));
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-bg-user" aria-hidden="true" />
  );
}

function ThemeVariables() {
  const { company } = useCompany();

  useEffect(() => {
    const theme = company.themeConfig || {};
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primary || Config.theme.primary);
    root.style.setProperty('--theme-primary-light', theme.primaryLight || Config.theme.primaryLight);
    root.style.setProperty('--theme-primary-dark', theme.primaryDark || Config.theme.primaryDark);
    root.style.setProperty('--theme-secondary', theme.secondary || Config.theme.secondary);
    root.style.setProperty('--theme-secondary-light', theme.secondaryLight || Config.theme.secondaryLight);
    root.style.setProperty('--theme-background-light', theme.backgroundLight || '#fff8e7');
    root.style.setProperty('--theme-background-surface', theme.backgroundSurface || '#fffaf0');

    const sectionBackgrounds = company.siteImages?.sectionBackgrounds || {};
    ['offers', 'courts', 'contact', 'parking', 'footer'].forEach((section) => {
      const cssImage = toCssImageUrl(sectionBackgrounds[section]);
      if (cssImage) {
        root.style.setProperty(`--section-${section}-background`, cssImage);
      } else {
        root.style.removeProperty(`--section-${section}-background`);
      }
    });
  }, [company.siteImages, company.themeConfig]);

  return null;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryProvider>
      <CompanyProvider>
        <ThemeVariables />
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<AdminLogin />} />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="courts" element={<AdminCourts />} />
                <Route path="calendar" element={<AdminCalendar />} />
                <Route path="analytics" element={
                  <FeatureGate feature="analytics">
                    <AdminAnalytics />
                  </FeatureGate>
                } />
                <Route path="change-password" element={<ChangePassword />} />
                <Route path="time-slots" element={
                  <FeatureGate feature="timeSlots">
                    <TimeSlotManagement />
                  </FeatureGate>
                } />
                <Route path="qr-codes" element={
                  <FeatureGate feature="qrCodes">
                    <AdminQRCodes />
                  </FeatureGate>
                } />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CompanyProvider>
    </QueryProvider>
  );
}

export default App;
