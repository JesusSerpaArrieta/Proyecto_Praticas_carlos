import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const LoginPage     = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InventarioPage = lazy(() => import('./pages/InventarioPage'));
const ClientesPage  = lazy(() => import('./pages/ClientesPage'));
const AlquileresPage = lazy(() => import('./pages/AlquileresPage'));
const FacturasPage  = lazy(() => import('./pages/FacturasPage'));
const ReportesPage  = lazy(() => import('./pages/ReportesPage'));

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="flex items-center justify-center h-screen text-indigo-600 text-lg">Cargando...</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/"           element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/inventario" element={<ProtectedLayout><InventarioPage /></ProtectedLayout>} />
          <Route path="/clientes"   element={<ProtectedLayout><ClientesPage /></ProtectedLayout>} />
          <Route path="/alquileres" element={<ProtectedLayout><AlquileresPage /></ProtectedLayout>} />
          <Route path="/facturas"   element={<ProtectedLayout><FacturasPage /></ProtectedLayout>} />
          <Route path="/reportes"   element={<ProtectedLayout><ReportesPage /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
