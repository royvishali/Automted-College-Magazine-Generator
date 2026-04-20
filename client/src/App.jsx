import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Topbar from './components/Layout/Topbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ArticleSubmit from './pages/ArticleSubmit';
import MyArticles from './pages/MyArticles';
import ArticleReview from './pages/ArticleReview';
import MagazineEditor from './pages/MagazineEditor';
import ActivityLog from './pages/ActivityLog';
import AboutTeam from './pages/AboutTeam';
import UserManagement from './pages/UserManagement';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/submit': 'Submit Article',
  '/my-articles': 'My Articles',
  '/review': 'Article Review',
  '/magazine': 'Magazine Editor',
  '/activity': 'Activity Log',
  '/about': 'About the Development Team',
  '/users': 'User Management',
};

const AppLayout = ({ children, path }) => {
  const { user } = useAuth();
  if (!user) return children;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={PAGE_TITLES[path] || ''} />
        <div className="page-container">{children}</div>
      </div>
    </div>
  );
};

function App() {
  const { user } = useAuth();

  const getDefaultRoute = () => {
    if (!user) return '/login';
    return '/dashboard';
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected — All roles */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout path="/dashboard"><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/about" element={
        <ProtectedRoute>
          <AppLayout path="/about"><AboutTeam /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Student */}
      <Route path="/submit" element={
        <ProtectedRoute roles={['student']}>
          <AppLayout path="/submit"><ArticleSubmit /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/my-articles" element={
        <ProtectedRoute roles={['student']}>
          <AppLayout path="/my-articles"><MyArticles /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Faculty + Lab Assistant */}
      <Route path="/review" element={
        <ProtectedRoute roles={['faculty', 'lab_assistant']}>
          <AppLayout path="/review"><ArticleReview /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/activity" element={
        <ProtectedRoute roles={['faculty', 'lab_assistant']}>
          <AppLayout path="/activity"><ActivityLog /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Lab Assistant only */}
      <Route path="/magazine" element={
        <ProtectedRoute roles={['lab_assistant']}>
          <AppLayout path="/magazine"><MagazineEditor /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute roles={['lab_assistant']}>
          <AppLayout path="/users"><UserManagement /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} />} />
      <Route path="/unauthorized" element={
        <div className="auth-bg" style={{ flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem' }}>🚫</h1>
          <h2>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to view this page.</p>
          <a href="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go to Dashboard</a>
        </div>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
