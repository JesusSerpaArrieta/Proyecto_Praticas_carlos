const { upload } = require('../services/uploadService');

function subirImagen(req, res) {
  upload.single('imagen')(req, res, (err) => {
    if (err) return res.status(422).json({ error: true, message: err.message });
    if (!req.file) return res.status(400).json({ error: true, message: 'No se recibió ningún archivo.' });
    // En producción (BACKEND_URL definida), devolver URL absoluta
    const base = process.env.BACKEND_URL ? process.env.BACKEND_URL : '';
    const url = `${base}/uploads/${req.file.filename}`;
    res.json({ url });
  });
}

module.exports = { subirImagen };
