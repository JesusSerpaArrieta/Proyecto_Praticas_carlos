import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/apiClient';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [historialTarget, setHistorialTarget] = useState(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/clientes', { params: q ? { q } : {} });
      setClientes(data);
    } catch {} finally { setLoading(false); }
  }, [q]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const handleEliminar = (c) => {
    if (!window.confirm(`¿Eliminar a ${c.nombre_completo}?`)) return;
    apiClient.delete(`/clientes/${c.id}`).then(fetchClientes).catch(err => alert(err.response?.data?.error || 'Error al eliminar.'));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes registrados</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍  Buscar por nombre o cédula..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Cargando...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['ID', 'Nombre', 'Cédula', 'Teléfono', 'Email', 'Acciones'].map(c => (
                  <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No se encontraron clientes.</td></tr>
              ) : clientes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-500">#{c.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nombre_completo}</td>
                  <td className="px-4 py-3 text-gray-600">{c.cedula}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditTarget(c); setShowForm(true); }} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Editar</button>
                      <button onClick={() => setHistorialTarget(c)} className="text-green-600 hover:text-green-800 text-xs font-medium">Historial</button>
                      <button onClick={() => handleEliminar(c)} className="text-red-500 hover:text-red-700 text-xs font-medium">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && <ClienteFormModal cliente={editTarget} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchClientes(); }} />}
      {historialTarget && <ClienteHistorialModal cliente={historialTarget} onClose={() => setHistorialTarget(null)} />}
    </div>
  );
}

function Modal({ title, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ClienteFormModal({ cliente, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre_completo: cliente?.nombre_completo || '', cedula: cliente?.cedula || '', telefono: cliente?.telefono || '', direccion: cliente?.direccion || '', email: cliente?.email || '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Formato de email inválido.'); return; }
    setSaving(true);
    try {
      cliente ? await apiClient.put(`/clientes/${cliente.id}`, form) : await apiClient.post('/clientes', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={cliente ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Nombre Completo', name: 'nombre_completo', required: true },
          { label: 'Cédula', name: 'cedula', required: true },
          { label: 'Teléfono', name: 'telefono' },
          { label: 'Dirección', name: 'direccion' },
          { label: 'Email', name: 'email', type: 'email' },
        ].map(({ label, name, type = 'text', required }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input name={name} type={type} value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} required={required}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        ))}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ClienteHistorialModal({ cliente, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/clientes/${cliente.id}/historial`).then(r => setHistorial(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [cliente.id]);

  const BADGE = { Activo: 'bg-blue-100 text-blue-700', Devuelto: 'bg-green-100 text-green-700', Vencido: 'bg-red-100 text-red-700' };

  return (
    <Modal title={`Historial — ${cliente.nombre_completo}`} onClose={onClose} wide>
      {loading ? <p className="text-gray-400 text-sm">Cargando...</p> : historial.length === 0 ? <p className="text-gray-400 text-sm">Sin alquileres registrados.</p> : (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>{['ID', 'Prenda', 'Alquiler', 'Devolución', 'Estado', 'Total'].map(c => (
                <th key={c} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historial.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500">#{a.id}</td>
                  <td className="px-3 py-2 font-medium">{a.prenda?.tipo}</td>
                  <td className="px-3 py-2">{a.fecha_alquiler}</td>
                  <td className="px-3 py-2">{a.fecha_devolucion}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BADGE[a.estado] || 'bg-gray-100 text-gray-600'}`}>{a.estado}</span></td>
                  <td className="px-3 py-2 font-medium">${Number(a.precio_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
