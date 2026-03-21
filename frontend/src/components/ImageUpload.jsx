import React, { useState } from 'react';
import apiClient from '../api/apiClient';

export default function ImageUpload({ value, onChange, label = 'Foto' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(''); setUploading(true);
    try {
      const form = new FormData();
      form.append('imagen', file);
      const { data } = await apiClient.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir imagen.');
    } finally { setUploading(false); }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {value && (
          <img src={value} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
        )}
        <label className={`cursor-pointer border-2 border-dashed rounded-lg px-4 py-2 text-sm transition-colors ${uploading ? 'border-gray-200 text-gray-400' : 'border-indigo-300 text-indigo-600 hover:border-indigo-400'}`}>
          {uploading ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
        {value && !uploading && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-600">Quitar</button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
