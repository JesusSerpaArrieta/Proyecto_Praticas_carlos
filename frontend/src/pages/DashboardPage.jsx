import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [disp, setDisp] = useState({ Disponible: 0, Alquilada: 0, En_Mantenimiento: 0 });
  const [alquileres, setAlquileres] = useState([]);
  const [ingresos, setIngresos] = useState(null);
  const [sinFacturar, setSinFacturar] = useState(0);
  const [facturasPendientes, setFacturasPendientes] = useState(0);

  useEffect(() => {
    apiClient.get('/prendas/disponibilidad').then(r => setDisp(r.data)).catch(() => {});

    Promise.all([
      apiClient.get('/alquileres', { params: { estado: 'Activo' } }).catch(() => ({ data: [] })),
      apiClient.get('/alquileres', { params: { estado: 'Vencido' } }).catch(() => ({ data: [] })),
      apiClient.get('/alquileres', { params: { estado: 'Devuelto' } }).catch(() => ({ data: [] })),
      apiClient.get('/facturas').catch(() => ({ data: [] })),
    ]).then(([activos, vencidos, devueltos, facturas]) => {
      setAlquileres([...activos.data, ...vencidos.data]);
      setSinFacturar(devueltos.data.filter(a => !a.factura).length);
      setFacturasPendientes(facturas.data.filter(f => f.estado_pago === 'Pendiente').length);
    });

    // Ingresos del mes actual
    const hoy = new Date();
    const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
    const hasta = hoy.toISOString().split('T')[0];
    apiClient.get('/reportes/ingresos', { params: { desde, hasta } })
      .then(r => {
        const total = (r.data || []).reduce((s, row) => s + parseFloat(row.total_ingresos || 0), 0);
        setIngresos(total);
      }).catch(() => {});
  }, []);

  const hoy = new Date();
  const en3dias = new Date(hoy.getTime() + 3 * 86400000);
  const proximos = alquileres.filter(a => {
    const dev = new Date(a.fecha_devolucion);
    return a.estado === 'Activo' && dev >= hoy && dev <= en3dias;
  });
  const vencidos = alquileres.filter(a => a.estado === 'Vencido');
  const total = disp.Disponible + disp.Alquilada + disp.En_Mantenimiento;
  const pctDisp = total ? Math.round((disp.Disponible / total) * 100) : 0;
  const pctAlq  = total ? Math.round((disp.Alquilada / total) * 100) : 0;
  const pctMant = total ? Math.round((disp.En_Mantenimiento / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{hoy.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Alertas rápidas */}
      {(vencidos.length > 0 || proximos.length > 0 || sinFacturar > 0) && (
        <div className="flex flex-wrap gap-3">
          {vencidos.length > 0 && (
            <button onClick={() => navigate('/alquileres')}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-100 transition-colors">
              🚨 {vencidos.length} alquiler{vencidos.length > 1 ? 'es' : ''} vencido{vencidos.length > 1 ? 's' : ''}
            </button>
          )}
          {proximos.length > 0 && (
            <button onClick={() => navigate('/alquileres')}
              className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-yellow-100 transition-colors">
              ⏰ {proximos.length} devolución{proximos.length > 1 ? 'es' : ''} próxima{proximos.length > 1 ? 's' : ''} (hoy - 3 días)
            </button>
          )}
          {sinFacturar > 0 && (
            <button onClick={() => navigate('/alquileres')}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors">
              💳 {sinFacturar} pendiente{sinFacturar > 1 ? 's' : ''} de facturar
            </button>
          )}
          {facturasPendientes > 0 && (
            <button onClick={() => navigate('/facturas')}
              className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-green-100 transition-colors">
              💰 {facturasPendientes} factura{facturasPendientes > 1 ? 's' : ''} sin cobrar
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Prendas"    value={total}                  color="border-indigo-400" bg="bg-indigo-50"  icon="👗" />
        <StatCard label="Disponibles"      value={disp.Disponible}        color="border-green-400"  bg="bg-green-50"   icon="✅" sub={`${pctDisp}% del inventario`} />
        <StatCard label="Alquiladas"       value={disp.Alquilada}         color="border-blue-400"   bg="bg-blue-50"    icon="📦" sub={`${pctAlq}% del inventario`} />
        <StatCard label="Mantenimiento"    value={disp.En_Mantenimiento}  color="border-orange-400" bg="bg-orange-50"  icon="🔧" sub={`${pctMant}% del inventario`} />
      </div>

      {/* Barra de ocupación */}
      {total > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700 text-sm">Ocupación del inventario</h2>
            <span className="text-xs text-gray-400">{total} prendas totales</span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
            {pctAlq > 0  && <div style={{ width: `${pctAlq}%` }}  className="bg-blue-400 transition-all" title={`Alquiladas: ${disp.Alquilada}`} />}
            {pctMant > 0 && <div style={{ width: `${pctMant}%` }} className="bg-orange-400 transition-all" title={`Mantenimiento: ${disp.En_Mantenimiento}`} />}
            {pctDisp > 0 && <div style={{ width: `${pctDisp}%` }} className="bg-green-400 transition-all" title={`Disponibles: ${disp.Disponible}`} />}
          </div>
          <div className="flex gap-4 mt-2">
            {[
              { label: 'Disponibles', color: 'bg-green-400', pct: pctDisp },
              { label: 'Alquiladas',  color: 'bg-blue-400',  pct: pctAlq },
              { label: 'Mantenimiento', color: 'bg-orange-400', pct: pctMant },
            ].map(({ label, color, pct }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label} {pct}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingresos del mes + accesos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-sm p-5 text-white">
          <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide mb-1">Ingresos este mes</p>
          <p className="text-3xl font-bold">
            {ingresos === null ? '...' : `$${Number(ingresos).toLocaleString('es-CO')}`}
          </p>
          <p className="text-indigo-200 text-xs mt-2">Solo alquileres devueltos</p>
          <button onClick={() => navigate('/reportes')}
            className="mt-4 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
            Ver reportes →
          </button>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: 'Nuevo Alquiler',  icon: '➕', color: 'bg-blue-50 border-blue-200 text-blue-700',   path: '/alquileres' },
            { label: 'Nueva Prenda',    icon: '👗', color: 'bg-green-50 border-green-200 text-green-700', path: '/inventario' },
            { label: 'Nuevo Cliente',   icon: '👤', color: 'bg-purple-50 border-purple-200 text-purple-700', path: '/clientes' },
            { label: 'Ver Facturas',    icon: '🧾', color: 'bg-amber-50 border-amber-200 text-amber-700',  path: '/facturas' },
          ].map(({ label, icon, color, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className={`flex items-center gap-3 border rounded-xl p-4 text-sm font-semibold transition-all hover:shadow-md ${color}`}>
              <span className="text-2xl">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tablas de atención */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertaTable
          titulo="Vencidos"
          icono="🚨"
          badgeColor="bg-red-100 text-red-700"
          rows={vencidos}
          empty="Sin alquileres vencidos."
          onVerTodos={() => navigate('/alquileres')}
        />
        <AlertaTable
          titulo="Próximas devoluciones (3 días)"
          icono="⏰"
          badgeColor="bg-yellow-100 text-yellow-700"
          rows={proximos}
          empty="Sin alquileres próximos a vencer."
          onVerTodos={() => navigate('/alquileres')}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, color, bg, icon, sub }) {
  return (
    <div className={`${bg} rounded-xl shadow-sm border-l-4 ${color} p-5`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <div className="text-2xl font-bold text-gray-800">{value}</div>
          <div className="text-xs font-medium text-gray-600">{label}</div>
          {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function AlertaTable({ titulo, icono, badgeColor, rows, empty, onVerTodos }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icono}</span>
        <h2 className="font-semibold text-gray-800 text-sm">{titulo}</h2>
        {rows.length > 0 && (
          <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{rows.length}</span>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">{empty}</p>
      ) : (
        <>
          <div className="space-y-2">
            {rows.slice(0, 4).map(a => {
              const dias = Math.ceil((new Date(a.fecha_devolucion) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.cliente?.nombre_completo}</p>
                    <p className="text-xs text-gray-400">{a.prenda?.tipo} · {a.prenda?.talla}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{a.fecha_devolucion}</p>
                    {dias < 0
                      ? <span className="text-xs font-semibold text-red-600">{Math.abs(dias)}d vencido</span>
                      : <span className="text-xs font-semibold text-yellow-600">{dias}d restantes</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
          {rows.length > 4 && (
            <button onClick={onVerTodos} className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Ver todos ({rows.length}) →
            </button>
          )}
        </>
      )}
    </div>
  );
}
