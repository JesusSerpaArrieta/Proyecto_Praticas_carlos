import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

const NAV = [
  { to: '/',           label: 'Dashboard',  icon: '📊' },
  { to: '/inventario', label: 'Inventario', icon: '👗' },
  { to: '/clientes',   label: 'Clientes',   icon: '👥' },
  { to: '/alquileres', label: 'Alquileres', icon: '📋' },
  { to: '/facturas',   label: 'Facturas',   icon: '🧾' },
  { to: '/reportes',   label: 'Reportes',   icon: '📈' },
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showCambiarPass, setShowCambiarPass] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-indigo-900 text-white flex flex-col transition-all duration-200 shrink-0`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-indigo-700">
          {!collapsed && <span className="font-bold text-lg tracking-wide">👗 Las Togas</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-indigo-300 hover:text-white text-xl ml-auto">
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg mx-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-indigo-700 space-y-1">
          <button
            onClick={() => setShowCambiarPass(true)}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-indigo-200 hover:bg-indigo-800 hover:text-white rounded-lg transition-colors"
          >
            <span className="text-lg">🔑</span>
            {!collapsed && <span>Cambiar Contraseña</span>}
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-indigo-200 hover:bg-indigo-800 hover:text-white rounded-lg transition-colors"
          >
            <span className="text-lg">🚪</span>
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {showCambiarPass && <CambiarPasswordModal onClose={() => setShowCambiarPass(false)} />}
    </div>
  );
}

function CambiarPasswordModal({ onClose }) {
  const [form, setForm] = useState({ password_actual: '', password_nuevo: '', confirmar: '' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password_nuevo !== form.confirmar) { setError('Las contraseñas nuevas no coinciden.'); return; }
    if (form.password_nuevo.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    setSaving(true);
    try {
      await apiClient.post('/auth/cambiar-password', {
        password_actual: form.password_actual,
        password_nuevo: form.password_nuevo,
      });
      setOk(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Cambiar Contraseña</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">
          {ok ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">✅</div>
              <p className="text-green-700 font-medium">Contraseña actualizada correctamente.</p>
              <button onClick={onClose} className="bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700">Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Contraseña actual', name: 'password_actual' },
                { label: 'Nueva contraseña', name: 'password_nuevo' },
                { label: 'Confirmar nueva contraseña', name: 'confirmar' },
              ].map(({ label, name }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type="password" value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              ))}
              {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                  {saving ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
