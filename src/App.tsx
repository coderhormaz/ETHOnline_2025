import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MobileNav } from './components/MobileNav';
import { DesktopNav } from './components/DesktopNav';
import { Onboarding, shouldShowOnboarding } from './components/Onboarding';
import { PageLoader } from './components/LoadingStates';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Send = lazy(() => import('./pages/Send').then(m => ({ default: m.Send })));
const Invest = lazy(() => import('./pages/Invest').then(m => ({ default: m.Invest })));
const PortfolioDetails = lazy(() => import('./pages/PortfolioDetails').then(m => ({ default: m.PortfolioDetails })));
const Transactions = lazy(() => import('./pages/Transactions').then(m => ({ default: m.Transactions })));
const Receive = lazy(() => import('./pages/Receive').then(m => ({ default: m.Receive })));
const WalletOverview = lazy(() => import('./pages/WalletOverview').then(m => ({ default: m.WalletOverview })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const PaymentLink = lazy(() => import('./pages/PaymentLink').then(m => ({ default: m.PaymentLink })));
const PaymentLinks = lazy(() => import('./pages/PaymentLinks').then(m => ({ default: m.default })));

function AppContent() {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const showMobileNav = !['/home', '/', '/signup'].includes(location.pathname) && 
                        !location.pathname.startsWith('/pay/');

  useEffect(() => {
    // Check if user needs onboarding after first login
    if (showMobileNav && shouldShowOnboarding()) {
      setShowOnboarding(true);
    }
  }, [showMobileNav]);

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <>
      {showMobileNav && <DesktopNav />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pay/:linkId" element={<PaymentLink />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/send"
            element={
              <ProtectedRoute>
                <Send />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invest"
            element={
              <ProtectedRoute>
                <Invest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invest/:portfolioId"
            element={
              <ProtectedRoute>
                <PortfolioDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receive"
            element={
              <ProtectedRoute>
                <Receive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <WalletOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-links"
            element={
              <ProtectedRoute>
                <PaymentLinks />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        {showMobileNav && <MobileNav />}
      </Suspense>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <AppContent />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
