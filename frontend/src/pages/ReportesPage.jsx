import React, { useState } from 'react';
import apiClient from '../api/apiClient';

const TIPOS = [
  { value: 'ingresos',          label: 'Ingresos por Período',       icon: '💰' },
  { value: 'prendas-populares', label: 'Prendas Más Alquiladas',     icon: '🏆' },
  { value: 'vencidos',          label: 'Alquileres Vencidos',        icon: '🚨' },
  { value: 'ocupacion',         label: 'Ocupación del Inventario',   icon: '📊' },
  { value: 'danos',             label: 'Daños de Prendas',           icon: '🔧' },
];

const COLS = {
  ingresos:            ['Fecha', 'Cliente', 'Prenda', 'Total'],
  'prendas-populares': ['ID', 'Tipo', 'Talla', 'Color', 'Total Alquileres'],
  vencidos:            ['ID', 'Cliente', 'Prenda', 'Fecha Devolución', 'Días Retraso'],
  ocupacion:           ['Estado', 'Cantidad', 'Porcentaje'],
  danos:               ['Prenda', 'Descripción', 'Costo', 'Estado', 'Fecha'],
};

function renderRow(tipo, row, idx) {
  const cell = (v) => <td key={v} className="px-4 py-3 text-gray-700">{v}</td>;
  switch (tipo) {
    case 'ingresos':
      return (
        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
          {[row.periodo || '-', row.cliente || '-', row.prenda || '-', `$${Number(row.total_ingresos || 0).toFixed(2)}`].map((v, i) => (
            <td key={i} className="px-4 py-3 text-gray-700">{v}</td>
          ))}
        </tr>
      );
    case 'prendas-populares': return <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">{[row.id, row.tipo, row.talla, row.color, row.total_alquileres ?? row.count ?? '-'].map(cell)}</tr>;
    case 'vencidos':          return <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">{[row.id, row.cliente?.nombre_completo || row.cliente, row.prenda?.tipo || row.prenda, row.fecha_devolucion, row.dias_retraso].map(cell)}</tr>;
    case 'ocupacion':         return <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">{[row.estado, row.cantidad, `${Number(row.porcentaje || 0).toFixed(1)}%`].map(cell)}</tr>;
    case 'danos':
      return (
        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
          <td className="px-4 py-3 text-gray-700">{row.prenda?.tipo || '-'} {row.prenda?.talla || ''}</td>
          <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{row.descripcion}</td>
          <td className="px-4 py-3 font-medium text-red-600">{row.costo_dano ? `$${Number(row.costo_dano).toLocaleString()}` : '—'}</td>
          <td className="px-4 py-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.resuelto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {row.resuelto ? 'Resuelto' : 'Pendiente'}
            </span>
          </td>
          <td className="px-4 py-3 text-gray-500">{new Date(row.created_at).toLocaleDateString()}</td>
        </tr>
      );
    default: return null;
  }
}

export default function ReportesPage() {
  const [tipo, setTipo] = useState('ingresos');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [resultados, setResultados] = useState([]);
  const [totalCostosDanos, setTotalCostosDanos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerar = async () => {
    setLoading(true); setError(''); setResultados([]); setTotalCostosDanos(null);
    try {
      const params = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      const { data } = await apiClient.get(`/reportes/${tipo}`, { params });
      if (tipo === 'danos') {
        setResultados(data.daños || []);
        setTotalCostosDanos(data.total_costos || 0);
      } else {
        setResultados(Array.isArray(data) ? data : (data.data || []));
      }
    } catch { setError('Error al generar el reporte.'); }
    finally { setLoading(false); }
  };

  const handlePDF = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const url = `${apiClient.defaults.baseURL}/reportes/${tipo}/pdf${params.toString() ? '?' + params.toString() : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(b => window.open(URL.createObjectURL(b), '_blank'))
      .catch(() => alert('Error al exportar PDF.'));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Análisis y estadísticas del sistema</p>
      </div>

      {/* Selector de tipo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TIPOS.map(t => (
          <button key={t.value} onClick={() => { setTipo(t.value); setResultados([]); }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${tipo === t.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}>
            <div className="text-2xl mb-1">{t.icon}</div>
            <div className={`text-sm font-semibold ${tipo === t.value ? 'text-indigo-700' : 'text-gray-700'}`}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Filtros y acciones */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button onClick={handleGenerar} disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
          {loading ? 'Generando...' : 'Generar'}
        </button>
        {resultados.length > 0 && (
          <button onClick={handlePDF} className="inline-flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            📄 Exportar PDF
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {resultados.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {tipo === 'danos' && totalCostosDanos > 0 && (
            <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex justify-between items-center">
              <span className="text-sm font-medium text-red-700">Total costos de daños</span>
              <span className="text-lg font-bold text-red-700">${Number(totalCostosDanos).toLocaleString()}</span>
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{(COLS[tipo] || []).map(c => (
                <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{c}</th>
              ))}</tr>
            </thead>
            <tbody>{resultados.map((row, idx) => renderRow(tipo, row, idx))}</tbody>
          </table>
        </div>
      )}

      {!loading && resultados.length === 0 && !error && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-gray-400 text-sm">Selecciona un tipo de reporte y haz clic en "Generar"</p>
        </div>
      )}
    </div>
  );
}
