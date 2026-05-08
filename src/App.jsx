import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { SplashScreen } from './components/SplashScreen';
import { Config } from './lib/config';
import { FeatureGate } from './components/FeatureGate';

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
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-bg-user" aria-hidden="true" />
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', Config.theme.primary);
    root.style.setProperty('--theme-primary-light', Config.theme.primaryLight);
    root.style.setProperty('--theme-primary-dark', Config.theme.primaryDark);
    root.style.setProperty('--theme-secondary', Config.theme.secondary);
    root.style.setProperty('--theme-secondary-light', Config.theme.secondaryLight);
  }, []);

  return (
    <QueryProvider>
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
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
