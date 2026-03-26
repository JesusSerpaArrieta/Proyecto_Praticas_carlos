const { upload, subirACloudinary } = require('../services/uploadService');

async function subirImagen(req, res) {
  upload.single('imagen')(req, res, async (err) => {
    if (err) return res.status(422).json({ error: true, message: err.message });
    if (!req.file) return res.status(400).json({ error: true, message: 'No se recibió ningún archivo.' });
    try {
      const url = await subirACloudinary(req.file.buffer);
      res.json({ url });
    } catch (e) {
      res.status(500).json({ error: true, message: 'Error al subir imagen a Cloudinary.' });
    }
  });
}

module.exports = { subirImagen };
