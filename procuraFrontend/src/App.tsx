import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MaterialsPage from './pages/MaterialsPage';
import SuppliersPage from './pages/SuppliersPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import SettingsPage from './pages/SettingsPage';
import ProjectsPage from './pages/ProjectsPage';
import ContractsPage from './pages/ContractsPage';
import './App.css';

function AppNavigator() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const page = localStorage.getItem('PROCURA_PAGE');
    if (page) {
      localStorage.removeItem('PROCURA_PAGE');
      setCurrentPage(page);
    }
  }, []);

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'principal' },
    { id: 'materials', label: 'Materiales', icon: '📦', section: 'principal' },
    { id: 'suppliers', label: 'Proveedores', icon: '🏢', section: 'principal' },
    { id: 'work-orders', label: 'Órdenes de Trabajo', icon: '🔧', section: 'operaciones' },
    { id: 'contracts', label: 'Contratos', icon: '📜', section: 'operaciones' },
    { id: 'projects', label: 'Proyectos', icon: '🏗️', section: 'operaciones' },
    { id: 'settings', label: 'Configuración', icon: '⚙️', section: 'sistema' },
  ];

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <img src="/orka_logo.png" alt="Orka" style={{ height: 28, width: 'auto' }} />
            {!sidebarCollapsed && <span>Orka</span>}
          </div>
          <button 
            className="sidebar__toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="sidebar__nav">
          {/* Sección Principal */}
          <div className="sidebar__section">
            <div className="sidebar__section-title">Principal</div>
            {navItems.filter(item => item.section === 'principal').map(item => (
              <button
                key={item.id}
                className={`sidebar__link ${currentPage === item.id ? 'sidebar__link--active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Sección Operaciones */}
          <div className="sidebar__section">
            <div className="sidebar__section-title">Operaciones</div>
            {navItems.filter(item => item.section === 'operaciones').map(item => (
              <button
                key={item.id}
                className={`sidebar__link ${currentPage === item.id ? 'sidebar__link--active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Sección Sistema */}
          <div className="sidebar__section">
            <div className="sidebar__section-title">Sistema</div>
            {navItems.filter(item => item.section === 'sistema').map(item => (
              <button
                key={item.id}
                className={`sidebar__link ${currentPage === item.id ? 'sidebar__link--active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer del sidebar */}
        {!sidebarCollapsed && (
          <div className="sidebar__footer">
            <div className="sidebar__user">
              <div className="sidebar__user-avatar">
                {getInitials(user?.username || 'U')}
              </div>
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">{user?.username}</div>
                <div className="sidebar__user-role">{user?.role}</div>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      {/* Contenido principal */}
      <main className={`app-main ${sidebarCollapsed ? 'app-main--expanded' : ''}`}>
        {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
        {currentPage === 'materials' && <MaterialsPage />}
        {currentPage === 'suppliers' && <SuppliersPage />}
        {currentPage === 'work-orders' && <WorkOrdersPage />}
        {currentPage === 'projects' && <ProjectsPage />}
        {currentPage === 'contracts' && <ContractsPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppNavigator />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
