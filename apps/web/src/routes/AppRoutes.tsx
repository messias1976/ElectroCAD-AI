import { Component, lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import SubscriberAccessRoute from '../components/SubscriberAccessRoute';

// Public pages are loaded first so a problem in an authenticated module
// cannot prevent the landing page from rendering.
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/Login/LoginPage'));
const RegisterPage = lazy(() => import('../pages/Login/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const ProjectsPage = lazy(() => import('../pages/Projects/ProjectsPage'));
const AutoDesignerPage = lazy(() => import('../pages/Projects/AutoDesignerPage'));
const PlantDesignerPage = lazy(() => import('../pages/Projects/PlantDesignerProfessionalPage'));
const ClientsPage = lazy(() => import('../pages/Clients/ClientsPage'));
const SubscriptionsPage = lazy(() => import('../pages/Subscriptions/SubscriptionsPage'));
const MetricsPage = lazy(() => import('../pages/Metrics/MetricsPage'));
const ProfessorPage = lazy(() => import('../pages/AI/ProfessorPage'));
const AISettingsPage = lazy(() => import('../pages/AI/AISettingsPage'));
const SubscribePage = lazy(() => import('../pages/Subscriptions/SubscribePage'));

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
          <h2 className="text-xl font-bold">Não foi possível abrir esta página</h2>
          <p className="mt-2 text-sm">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center shadow-xl">
        <div className="mb-2 text-2xl">⚡ ElectroCAD AI</div>
        <div className="text-sm text-slate-300">Carregando...</div>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <RouteErrorBoundary><Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/planta" element={<ProtectedRoute><SubscriberAccessRoute><PlantDesignerPage /></SubscriberAccessRoute></ProtectedRoute>} />
        <Route path="/planta-eletrica" element={<ProtectedRoute><SubscriberAccessRoute><PlantDesignerPage /></SubscriberAccessRoute></ProtectedRoute>} />
        <Route path="/projetista" element={<ProtectedRoute><SubscriberAccessRoute><AutoDesignerPage /></SubscriberAccessRoute></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><SubscriberAccessRoute><ProjectsPage /></SubscriberAccessRoute></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><SubscriberAccessRoute><ClientsPage /></SubscriberAccessRoute></ProtectedRoute>} />
        <Route path="/professor" element={<ProtectedRoute><SubscriberAccessRoute><ProfessorPage /></SubscriberAccessRoute></ProtectedRoute>} />
        <Route path="/subscriptions" element={<ProtectedRoute roles={['ADMIN']}><SubscriptionsPage /></ProtectedRoute>} />
        <Route path="/assinar" element={<ProtectedRoute><SubscribePage /></ProtectedRoute>} />
        <Route path="/configuracoes-ia" element={<ProtectedRoute roles={['ADMIN']}><AISettingsPage /></ProtectedRoute>} />
        <Route path="/metrics" element={<ProtectedRoute roles={['ADMIN']}><MetricsPage /></ProtectedRoute>} />
      </Routes>
    </Suspense></RouteErrorBoundary>
  );
}
