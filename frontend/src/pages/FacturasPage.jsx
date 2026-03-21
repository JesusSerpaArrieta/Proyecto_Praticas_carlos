import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/apiClient';

const hoy = new Date().toISOString().split('T')[0];

function esHoy(fecha) {
  if (!fecha) return false;
  return new Date(fecha).toISOString().split('T')[0] === hoy;
}

export default function FacturasPage() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/facturas', { params: q ? { q } : {} });
      setFacturas(data);
    } catch {} finally { setLoading(false); }
  }, [q]);

  useEffect(() => { fetchFacturas(); }, [fetchFacturas]);

  const togglePago = async (f) => {
    const nuevoEstado = f.estado_pago === 'Pagado' ? 'Pendiente' : 'Pagado';
    try {
      await apiClient.patch(`/facturas/${f.id}/estado-pago`, { estado_pago: nuevoEstado });
      setFacturas(prev => prev.map(x => x.id === f.id ? { ...x, estado_pago: nuevoEstado } : x));
    } catch { alert('Error al actualizar estado de pago.'); }
  };

  const handlePDF = (f) => {    const token = localStorage.getItem('token');
    fetch(`${apiClient.defaults.baseURL}/facturas/${f.id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.blob())
      .then(b => window.open(URL.createObjectURL(b), '_blank'))
      .catch(() => alert('Error al exportar PDF.'));
  };

  const nuevasHoy = facturas.filter(f => esHoy(f.fecha_emision)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Facturas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {facturas.length} emitidas
            {nuevasHoy > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {nuevasHoy} hoy
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="🔍  Buscar por número o cliente..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['N° Factura', 'Cliente', 'Prenda', 'Alquiler', 'Devolución', 'Total', 'Estado', 'Acciones'].map(c => (
                  <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facturas.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No se encontraron facturas.</td></tr>
              ) : facturas.map(f => {
                const nueva = esHoy(f.fecha_emision);
                const pagada = f.estado_pago === 'Pagado';
                return (
                  <tr key={f.id} className={`transition-colors ${nueva ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-base ${nueva ? 'text-indigo-600' : 'text-gray-700'}`}>
                          #{f.numero_factura}
                        </span>
                        {nueva && (
                          <span className="bg-indigo-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {f.alquiler?.cliente?.nombre_completo || '—'}
                      <p className="text-xs text-gray-400">{f.alquiler?.cliente?.cedula || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {f.alquiler?.prenda?.tipo || '—'}
                      <p className="text-xs text-gray-400">{f.alquiler?.prenda?.talla} · {f.alquiler?.prenda?.color}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {f.alquiler?.fecha_alquiler || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {f.alquiler?.fecha_devolucion || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold text-sm ${nueva ? 'text-indigo-700' : 'text-gray-800'}`}>
                        ${Number(f.alquiler?.precio_total || 0).toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePago(f)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                          pagada
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                        }`}
                      >
                        {pagada ? '✓ Pagado' : '⏳ Pendiente'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handlePDF(f)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
