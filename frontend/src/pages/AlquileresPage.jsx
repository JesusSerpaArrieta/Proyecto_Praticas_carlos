import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ImageUpload from '../components/ImageUpload';

const hoy = new Date().toISOString().split('T')[0];

function diasRestantes(fecha) {
  // Comparar solo fechas sin timezone para evitar desfases
  const [ay, am, ad] = hoy.split('-').map(Number);
  const [fy, fm, fd] = fecha.split('-').map(Number);
  const fechaHoy  = new Date(ay, am - 1, ad);
  const fechaDev  = new Date(fy, fm - 1, fd);
  return Math.round((fechaDev - fechaHoy) / (1000 * 60 * 60 * 24));
}

export default function AlquileresPage() {
  const navigate = useNavigate();
  const [alquileres, setAlquileres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSemana, setFiltroSemana] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [devolucionTarget, setDevolucionTarget] = useState(null);
  const [extenderTarget, setExtenderTarget] = useState(null);

  const fetchAlquileres = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/alquileres');
      setAlquileres(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAlquileres(); }, [fetchAlquileres]);

  const [facturando, setFacturando] = useState(null);

  const handleFactura = (a) => {
    if (facturando === a.id) return;
    setFacturando(a.id);
    apiClient.post('/facturas', { alquiler_id: a.id })
      .then(() => navigate('/facturas'))
      .catch(err => alert(err.response?.data?.message || 'Error al generar factura.'))
      .finally(() => setFacturando(null));
  };

  const filtrar = (lista) => {
    let result = lista;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(a =>
        a.cliente?.nombre_completo?.toLowerCase().includes(q) ||
        a.prenda?.tipo?.toLowerCase().includes(q) ||
        String(a.id).includes(q)
      );
    }
    if (filtroSemana) {
      const en7 = new Date(hoy);
      en7.setDate(en7.getDate() + 7);
      const hasta = en7.toISOString().split('T')[0];
      result = result.filter(a => a.fecha_devolucion >= hoy && a.fecha_devolucion <= hasta);
    }
    return result;
  };

  const vencidos    = filtrar(alquileres.filter(a => a.estado === 'Vencido'));
  const activos     = filtrar(alquileres.filter(a => a.estado === 'Activo'));
  const sinFacturar = filtrar(alquileres.filter(a => a.estado === 'Devuelto' && !a.factura));
  const facturados  = filtrar(alquileres.filter(a => a.estado === 'Devuelto' && a.factura));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Alquileres</h1>
          <p className="text-gray-500 text-sm mt-1">{alquileres.length} registros en total</p>
        </div>
        <button onClick={() => setShowNuevo(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Nuevo Alquiler
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍  Buscar por cliente, prenda o ID..."
          className="flex-1 min-w-[200px] max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button
          onClick={() => setFiltroSemana(v => !v)}
          className={`text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${filtroSemana ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
        >
          📅 Vencen esta semana
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">Cargando...</div>
      ) : (
        <>
          {/* VENCIDOS — máxima urgencia */}
          {vencidos.length > 0 && (
            <Section
              titulo="Vencidos"
              count={vencidos.length}
              color="red"
              icono="🚨"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                {vencidos.map(a => (
                  <TarjetaAlquiler key={a.id} alquiler={a}
                    accion={
                      <div className="flex gap-2">
                        <button onClick={() => setExtenderTarget(a)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                          📅 Extender
                        </button>
                        <button onClick={() => setDevolucionTarget(a)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                          Devolver
                        </button>
                      </div>
                    }
                    badge={<span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">Vencido</span>}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* ACTIVOS */}
          {activos.length > 0 && (
            <Section titulo="Activos" count={activos.length} color="blue" icono="📋">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                {activos.map(a => {
                  const dias = diasRestantes(a.fecha_devolucion);
                  return (
                    <TarjetaAlquiler key={a.id} alquiler={a}
                    accion={
                        <div className="flex gap-2">
                          <button onClick={() => setExtenderTarget(a)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                            📅 Extender
                          </button>
                          <button onClick={() => setDevolucionTarget(a)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                            Devolver
                          </button>
                        </div>
                      }
                      badge={
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          dias < 0  ? 'bg-red-100 text-red-700' :
                          dias === 0 ? 'bg-red-100 text-red-700' :
                          dias <= 2  ? 'bg-orange-100 text-orange-700' :
                                       'bg-blue-100 text-blue-700'
                        }`}>
                          {dias < 0  ? `Vencido hace ${Math.abs(dias)}d` :
                           dias === 0 ? 'Vence hoy' :
                           `${dias}d restantes`}
                        </span>
                      }
                    />
                  );
                })}
              </div>
            </Section>
          )}

          {/* DEVUELTOS SIN FACTURAR */}
          {sinFacturar.length > 0 && (
            <Section titulo="Pendientes de facturar" count={sinFacturar.length} color="amber" icono="💳">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
                {sinFacturar.map(a => (
                  <TarjetaAlquiler key={a.id} alquiler={a}
                    accion={<button onClick={() => handleFactura(a)} disabled={facturando === a.id}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                      {facturando === a.id ? 'Generando...' : '💳 Generar Factura'}
                    </button>}
                    badge={<span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">Sin facturar</span>}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* FACTURADOS — tabla compacta */}
          {facturados.length > 0 && (
            <Section titulo="Completados" count={facturados.length} color="green" icono="✅" colapsable>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['ID', 'Cliente', 'Prenda', 'Devolución', 'Total', 'Factura'].map(c => (
                    <th key={c} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{c}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {facturados.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">#{a.id}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{a.cliente?.nombre_completo}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{a.prenda?.tipo} · {a.prenda?.talla}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{a.fecha_devolucion}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs font-medium">${Number(a.precio_total).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-2.5">
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          ✓ #{a.factura?.numero_factura}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {alquileres.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-400 text-sm">No hay alquileres registrados aún.</p>
            </div>
          )}
        </>
      )}

      {showNuevo && <NuevoAlquilerModal onClose={() => setShowNuevo(false)} onSaved={() => { setShowNuevo(false); fetchAlquileres(); }} />}
      {devolucionTarget && <DevolucionModal alquiler={devolucionTarget} onClose={() => setDevolucionTarget(null)} onSaved={() => { setDevolucionTarget(null); fetchAlquileres(); }} />}
      {extenderTarget && <ExtenderModal alquiler={extenderTarget} onClose={() => setExtenderTarget(null)} onSaved={() => { setExtenderTarget(null); fetchAlquileres(); }} />}
    </div>
  );
}

// Componente sección con header coloreado
function Section({ titulo, count, color, icono, children, colapsable = false }) {
  const [abierto, setAbierto] = useState(true);

  const colors = {
    red:   'border-red-200 bg-red-50',
    blue:  'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    green: 'border-green-200 bg-green-50',
  };
  const textColors = {
    red: 'text-red-700', blue: 'text-blue-700', amber: 'text-amber-700', green: 'text-green-700',
  };
  const badgeColors = {
    red: 'bg-red-200 text-red-800', blue: 'bg-blue-200 text-blue-800',
    amber: 'bg-amber-200 text-amber-800', green: 'bg-green-200 text-green-800',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div
        className={`flex items-center justify-between px-5 py-3 border-b ${colors[color]} ${colapsable ? 'cursor-pointer select-none' : ''}`}
        onClick={colapsable ? () => setAbierto(v => !v) : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icono}</span>
          <span className={`font-semibold text-sm ${textColors[color]}`}>{titulo}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColors[color]}`}>{count}</span>
        </div>
        {colapsable && (
          <span className={`text-xs ${textColors[color]}`}>{abierto ? '▲ ocultar' : '▼ mostrar'}</span>
        )}
      </div>
      {abierto && children}
    </div>
  );
}

// Tarjeta individual de alquiler
function TarjetaAlquiler({ alquiler: a, accion, badge }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{a.cliente?.nombre_completo}</p>
          <p className="text-xs text-gray-500">{a.prenda?.tipo} · {a.prenda?.talla} · {a.prenda?.color}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-400">#{a.id}</span>
          {badge}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
        <div><span className="text-gray-400">Alquiler:</span> {a.fecha_alquiler}</div>
        <div><span className="text-gray-400">Devol.:</span> {a.fecha_devolucion}</div>
      </div>
      {a.notas && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1 italic">📝 {a.notas}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-800">${Number(a.precio_total).toLocaleString('es-CO')}</span>
      </div>
      {accion}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function NuevoAlquilerModal({ onClose, onSaved }) {
  const [clienteQ, setClienteQ] = useState('');
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [prendas, setPrendas] = useState([]);
  const [form, setForm] = useState({ cliente_id: '', prenda_id: '', fecha_alquiler: '', fecha_devolucion: '', notas: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    apiClient.get('/prendas', { params: { estado: 'Disponible' } }).then(r => setPrendas(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!clienteQ || clienteSeleccionado) { setClientes([]); setShowDropdown(false); return; }
    const t = setTimeout(() => {
      apiClient.get('/clientes', { params: { q: clienteQ } })
        .then(r => { setClientes(r.data); setShowDropdown(r.data.length > 0); })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [clienteQ, clienteSeleccionado]);

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const seleccionarCliente = (c) => {
    setClienteSeleccionado(c);
    setClienteQ(c.nombre_completo);
    setForm(p => ({ ...p, cliente_id: c.id }));
    setShowDropdown(false);
  };

  const limpiarCliente = () => {
    setClienteSeleccionado(null);
    setClienteQ('');
    setForm(p => ({ ...p, cliente_id: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.cliente_id) { setError('Selecciona un cliente.'); return; }
    if (!form.prenda_id) { setError('Selecciona una prenda.'); return; }
    if (!form.fecha_alquiler) { setError('Selecciona la fecha de alquiler.'); return; }
    if (!form.fecha_devolucion) { setError('Selecciona la fecha de devolución.'); return; }
    if (form.fecha_devolucion <= form.fecha_alquiler) { setError('La fecha de devolución debe ser al menos un día después de la fecha de alquiler.'); return; }
    setSaving(true);
    try { await apiClient.post('/alquileres', form); onSaved(); }
    catch (err) { setError(err.response?.data?.error || 'Error al registrar.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Nuevo Alquiler" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <input
                value={clienteQ}
                onChange={e => { setClienteQ(e.target.value); setClienteSeleccionado(null); setForm(p => ({ ...p, cliente_id: '' })); }}
                onFocus={() => clientes.length > 0 && setShowDropdown(true)}
                placeholder="Buscar por nombre o cédula..."
                readOnly={!!clienteSeleccionado}
                className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${clienteSeleccionado ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-medium' : 'border-gray-300'}`}
              />
              {clienteSeleccionado && (
                <button type="button" onClick={limpiarCliente} className="text-gray-400 hover:text-gray-600 px-2 text-lg">×</button>
              )}
            </div>
            {showDropdown && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {clientes.map(c => (
                  <li key={c.id}>
                    <button type="button" onClick={() => seleccionarCliente(c)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors">
                      <span className="font-medium text-gray-800">{c.nombre_completo}</span>
                      <span className="text-gray-400 ml-2 text-xs">{c.cedula}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prenda Disponible</label>
          {prendas.length === 0 ? (
            <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">No hay prendas disponibles.</p>
          ) : (
            <select value={form.prenda_id} onChange={e => setForm(p => ({ ...p, prenda_id: e.target.value }))} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">-- Seleccionar prenda --</option>
              {prendas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.tipo} · {p.talla} · {p.color} — ${Number(p.precio_por_dia).toFixed(2)}/día
                </option>
              ))}
            </select>
          )}
        </div>

        {[{ label: 'Fecha de Alquiler', name: 'fecha_alquiler' }, { label: 'Fecha de Devolución', name: 'fecha_devolucion' }].map(({ label, name }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type="date" value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} required
              min={hoy}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} rows={2}
            placeholder="Ej: Cliente pagó anticipo, requiere ajuste en talla..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
        </div>

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DevolucionModal({ alquiler, onClose, onSaved }) {  const [conDaño, setConDaño] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [costoDano, setCostoDano] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (conDaño && !descripcion.trim()) { setError('Describe el daño antes de continuar.'); return; }
    setSaving(true);
    try {
      await apiClient.patch(`/alquileres/${alquiler.id}/devolucion`, {
        con_daño: conDaño,
        descripcion_daño: descripcion,
        foto_url_daño: fotoUrl,
        costo_dano: costoDano !== '' ? Number(costoDano) : null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar devolución.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Devolución — Alquiler #${alquiler.id}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Cliente: <span className="font-semibold">{alquiler.cliente?.nombre_completo}</span><br />
          Prenda: <span className="font-semibold">{alquiler.prenda?.tipo}</span>
        </p>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" checked={conDaño} onChange={e => setConDaño(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-400" />
          <span className="text-sm font-medium text-gray-700">La prenda fue devuelta con daño</span>
        </label>

        {conDaño && (
          <div className="space-y-3 border border-red-200 bg-red-50 rounded-lg p-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del daño</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} required
                placeholder="Ej: Mancha en la manga derecha, rasgadura en el dobladillo..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo del daño (opcional)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input type="number" min="0" step="100" value={costoDano} onChange={e => setCostoDano(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
            <ImageUpload value={fotoUrl} onChange={setFotoUrl} label="Foto del daño (opcional)" />
            <p className="text-xs text-red-600">La prenda quedará en "En Mantenimiento" hasta resolver el daño.</p>
          </div>
        )}

        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Guardando...' : 'Confirmar Devolución'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExtenderModal({ alquiler, onClose, onSaved }) {
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!nuevaFecha) { setError('Selecciona la nueva fecha de devolución.'); return; }
    if (nuevaFecha <= alquiler.fecha_devolucion) { setError(`La nueva fecha debe ser posterior a la devolución actual (${alquiler.fecha_devolucion}).`); return; }
    setSaving(true);
    try {
      await apiClient.patch(`/alquileres/${alquiler.id}/extender`, { nueva_fecha_devolucion: nuevaFecha });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al extender el alquiler.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Extender Alquiler #${alquiler.id}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Cliente: <span className="font-semibold">{alquiler.cliente?.nombre_completo}</span><br />
          Prenda: <span className="font-semibold">{alquiler.prenda?.tipo} · {alquiler.prenda?.talla}</span><br />
          Devolución actual: <span className="font-semibold text-orange-600">{alquiler.fecha_devolucion}</span>
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha de devolución</label>
          <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} required
            min={hoy}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button type="submit" disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Guardando...' : 'Confirmar Extensión'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
