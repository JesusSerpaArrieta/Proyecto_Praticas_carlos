import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/apiClient';
import ImageUpload from '../components/ImageUpload';

export default function InventarioPage() {
  const [prendas, setPrendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [estadoTarget, setEstadoTarget] = useState(null);
  const [danosTarget, setDanosTarget] = useState(null);

  const fetchPrendas = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.get('/prendas');
      setPrendas(data);
    } catch { setError('Error al cargar las prendas.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrendas(); }, [fetchPrendas]);

  const handleEliminar = (p) => {
    if (!window.confirm(`¿Eliminar la prenda #${p.id} (${p.tipo})?`)) return;
    apiClient.delete(`/prendas/${p.id}`)
      .then(fetchPrendas)
      .catch(err => alert(err.response?.data?.error || 'Error al eliminar.'));
  };

  const filtrar = (lista) => {
    if (!busqueda.trim()) return lista;
    const q = busqueda.toLowerCase();
    return lista.filter(p =>
      p.tipo?.toLowerCase().includes(q) ||
      p.talla?.toLowerCase().includes(q) ||
      p.color?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    );
  };

  const disponibles    = filtrar(prendas.filter(p => p.estado === 'Disponible'));
  const alquiladas     = filtrar(prendas.filter(p => p.estado === 'Alquilada'));
  const mantenimiento  = filtrar(prendas.filter(p => p.estado === 'En_Mantenimiento'));

  const acciones = (p) => (
    <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
      <button onClick={() => { setEditTarget(p); setShowForm(true); }}
        className="flex-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 py-1.5 rounded-lg transition-colors">
        Editar
      </button>
      <button onClick={() => setEstadoTarget(p)}
        className="flex-1 text-xs font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-50 py-1.5 rounded-lg transition-colors">
        Estado
      </button>
      <button onClick={() => setDanosTarget(p)}
        className="flex-1 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 py-1.5 rounded-lg transition-colors">
        Daños
      </button>
      <button onClick={() => handleEliminar(p)}
        className="flex-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 py-1.5 rounded-lg transition-colors">
        Eliminar
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">{prendas.length} prendas en total</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Nueva Prenda
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍  Buscar por tipo, talla, color o ID..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">Cargando...</div>
      ) : (
        <>
          {mantenimiento.length > 0 && (
            <Section titulo="En Mantenimiento" count={mantenimiento.length} color="orange" icono="🔧">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                {mantenimiento.map(p => <TarjetaPrenda key={p.id} prenda={p} acciones={acciones(p)} />)}
              </div>
            </Section>
          )}
          {disponibles.length > 0 && (
            <Section titulo="Disponibles" count={disponibles.length} color="green" icono="✅">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                {disponibles.map(p => <TarjetaPrenda key={p.id} prenda={p} acciones={acciones(p)} />)}
              </div>
            </Section>
          )}
          {alquiladas.length > 0 && (
            <Section titulo="Alquiladas" count={alquiladas.length} color="blue" icono="📋" colapsable>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                {alquiladas.map(p => <TarjetaPrenda key={p.id} prenda={p} acciones={acciones(p)} />)}
              </div>
            </Section>
          )}
          {prendas.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">👗</div>
              <p className="text-gray-400 text-sm">No hay prendas en el inventario.</p>
            </div>
          )}
        </>
      )}

      {showForm && <PrendaFormModal prenda={editTarget} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchPrendas(); }} />}
      {estadoTarget && <CambiarEstadoModal prenda={estadoTarget} onClose={() => setEstadoTarget(null)} onSaved={() => { setEstadoTarget(null); fetchPrendas(); }} />}
      {danosTarget && <DanosModal prenda={danosTarget} onClose={() => { setDanosTarget(null); fetchPrendas(); }} />}
    </div>
  );
}

function Section({ titulo, count, color, icono, children, colapsable = false }) {
  const [abierto, setAbierto] = useState(true);
  const colors = { green: 'border-green-200 bg-green-50', blue: 'border-blue-200 bg-blue-50', orange: 'border-orange-200 bg-orange-50' };
  const textColors = { green: 'text-green-700', blue: 'text-blue-700', orange: 'text-orange-700' };
  const badgeColors = { green: 'bg-green-200 text-green-800', blue: 'bg-blue-200 text-blue-800', orange: 'bg-orange-200 text-orange-800' };
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className={`flex items-center justify-between px-5 py-3 border-b ${colors[color]} ${colapsable ? 'cursor-pointer select-none' : ''}`}
        onClick={colapsable ? () => setAbierto(v => !v) : undefined}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{icono}</span>
          <span className={`font-semibold text-sm ${textColors[color]}`}>{titulo}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColors[color]}`}>{count}</span>
        </div>
        {colapsable && <span className={`text-xs ${textColors[color]}`}>{abierto ? '▲ ocultar' : '▼ mostrar'}</span>}
      </div>
      {abierto && children}
    </div>
  );
}

function TarjetaPrenda({ prenda: p, acciones }) {
  const estadoColor = { Disponible: 'bg-green-100 text-green-700', Alquilada: 'bg-blue-100 text-blue-700', En_Mantenimiento: 'bg-orange-100 text-orange-700' };
  return (
    <div className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
        {p.foto_url ? <img src={p.foto_url} alt={p.tipo} className="w-full h-full object-cover" /> : <span className="text-4xl">👗</span>}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-gray-800 text-sm leading-tight">{p.tipo}</p>
          <span className="text-xs text-gray-400 shrink-0">#{p.id}</span>
        </div>
        <p className="text-xs text-gray-500">{p.talla} · {p.color}</p>
        <p className="text-sm font-bold text-gray-800">${Number(p.precio_por_dia).toLocaleString('es-CO')}<span className="text-xs font-normal text-gray-400">/día</span></p>
        <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${estadoColor[p.estado] || 'bg-gray-100 text-gray-600'}`}>
          {p.estado === 'En_Mantenimiento' ? 'Mantenimiento' : p.estado}
        </span>
        {acciones}
      </div>
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

function PrendaFormModal({ prenda, onClose, onSaved }) {
  const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '34', '36', '38', '40', '42', '44', '46', '48', '50', 'Única'];
  const [form, setForm] = useState({ tipo: prenda?.tipo || '', talla: prenda?.talla || '', color: prenda?.color || '', precio_por_dia: prenda?.precio_por_dia || '', foto_url: prenda?.foto_url || '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (Number(form.precio_por_dia) <= 0) { setError('El precio debe ser mayor a 0.'); return; }
    setSaving(true);
    try {
      prenda ? await apiClient.put(`/prendas/${prenda.id}`, form) : await apiClient.post('/prendas', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Error al guardar.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={prenda ? 'Editar Prenda' : 'Nueva Prenda'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <input type="text" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Talla</label>
          <select value={form.talla} onChange={e => setForm(p => ({ ...p, talla: e.target.value }))} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">-- Seleccionar talla --</option>
            {TALLAS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input type="text" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio por Día</label>
          <input type="number" value={form.precio_por_dia} onChange={e => setForm(p => ({ ...p, precio_por_dia: e.target.value }))} required min="0.01" step="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <ImageUpload value={form.foto_url} onChange={url => setForm(p => ({ ...p, foto_url: url }))} label="Foto de la prenda" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CambiarEstadoModal({ prenda, onClose, onSaved }) {
  const [nuevoEstado, setNuevoEstado] = useState(prenda.estado === 'En_Mantenimiento' ? 'Disponible' : 'En_Mantenimiento');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await apiClient.patch(`/prendas/${prenda.id}/estado`, { estado: nuevoEstado });
      onSaved();
    } catch (err) { setError(err.response?.data?.error || 'Error al cambiar estado.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Cambiar Estado" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">Prenda: <span className="font-semibold">{prenda.tipo}</span> — Estado actual: <span className="font-semibold">{prenda.estado}</span></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Estado</label>
          <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            {['Disponible', 'En_Mantenimiento'].map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DanosModal({ prenda, onClose }) {
  const [danos, setDanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ descripcion: '', foto_url: '', costo_dano: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [danoDetalle, setDanoDetalle] = useState(null);

  const fetchDanos = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/prendas/${prenda.id}/danos`);
      setDanos(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchDanos(); }, []);

  const handleResolver = async (danoId) => {
    try {
      await apiClient.patch(`/prendas/${prenda.id}/danos/${danoId}/resolver`);
      fetchDanos();
    } catch (err) { alert(err.response?.data?.message || 'Error.'); }
  };

  const handleRegistrar = async (e) => {
    e.preventDefault(); setError('');
    if (!form.descripcion.trim()) { setError('La descripción es requerida.'); return; }
    setSaving(true);
    try {
      await apiClient.post(`/prendas/${prenda.id}/danos`, form);
      setForm({ descripcion: '', foto_url: '', costo_dano: '' });
      setShowForm(false);
      fetchDanos();
    } catch (err) { setError(err.response?.data?.message || 'Error al registrar.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Daños — {prenda.tipo}</h2>
            <p className="text-xs text-gray-400">#{prenda.id} · {prenda.talla} · {prenda.color}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <p className="text-center text-gray-400 py-6">Cargando...</p>
          ) : danos.length === 0 ? (
            <p className="text-center text-gray-400 py-6">Sin daños registrados.</p>
          ) : danos.map(d => (
            <div key={d.id} onClick={() => setDanoDetalle(d)}
              className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${d.resuelto ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{d.descripcion}</p>
                  {d.foto_url && <p className="text-xs text-indigo-500 mt-1">📷 Tiene foto</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {d.alquiler_id ? `Alquiler #${d.alquiler_id} · ` : ''}{new Date(d.created_at).toLocaleDateString('es-CO')}
                    {d.costo_dano ? ` · $${Number(d.costo_dano).toLocaleString('es-CO')}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.resuelto ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                    {d.resuelto ? 'Resuelto' : 'Pendiente'}
                  </span>
                  {!d.resuelto && (
                    <button onClick={e => { e.stopPropagation(); handleResolver(d.id); }}
                      className="text-xs text-green-600 hover:text-green-800 font-medium">Marcar resuelto</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t space-y-3">
          {showForm ? (
            <form onSubmit={handleRegistrar} className="space-y-3">
              <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} rows={2}
                placeholder="Descripción del daño..." required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input type="number" min="0" step="100" value={form.costo_dano}
                  onChange={e => setForm(p => ({ ...p, costo_dano: e.target.value }))}
                  placeholder="Costo del daño (opcional)"
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <ImageUpload value={form.foto_url} onChange={url => setForm(p => ({ ...p, foto_url: url }))} label="Foto del daño (opcional)" />
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
                  {saving ? 'Guardando...' : 'Registrar Daño'}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full border-2 border-dashed border-red-300 text-red-500 hover:border-red-400 hover:text-red-600 text-sm font-medium py-2 rounded-lg transition-colors">
              + Registrar nuevo daño
            </button>
          )}
        </div>
      </div>

      {/* Modal detalle daño */}
      {danoDetalle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setDanoDetalle(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-base font-semibold text-gray-800">Detalle del daño</h3>
              <button onClick={() => setDanoDetalle(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {danoDetalle.foto_url && (
                <img src={danoDetalle.foto_url} alt="Foto del daño"
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-200" />
              )}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Descripción</p>
                  <p className="text-sm text-gray-800 mt-0.5">{danoDetalle.descripcion}</p>
                </div>
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Estado</p>
                    <span className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${danoDetalle.resuelto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {danoDetalle.resuelto ? 'Resuelto' : 'Pendiente'}
                    </span>
                  </div>
                  {danoDetalle.costo_dano && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Costo</p>
                      <p className="text-sm text-gray-800 mt-0.5">${Number(danoDetalle.costo_dano).toLocaleString('es-CO')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Fecha</p>
                    <p className="text-sm text-gray-800 mt-0.5">{new Date(danoDetalle.created_at).toLocaleDateString('es-CO')}</p>
                  </div>
                  {danoDetalle.alquiler_id && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Alquiler</p>
                      <p className="text-sm text-gray-800 mt-0.5">#{danoDetalle.alquiler_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
