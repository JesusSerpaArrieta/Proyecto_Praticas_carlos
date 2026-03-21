const PDFDocument = require('pdfkit');

function generarFacturaPDF(factura) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const alquiler = factura.alquiler || {};
    const cliente = alquiler.cliente || {};
    const prenda = alquiler.prenda || {};

    doc.fontSize(20).text('FACTURA DE ALQUILER', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Numero de Factura: ${factura.numero_factura}`);
    doc.text(`Fecha de Emision: ${factura.fecha_emision}`);
    doc.moveDown();

    doc.text('--- DATOS DEL CLIENTE ---');
    doc.text(`Nombre: ${cliente.nombre_completo || '-'}`);
    doc.text(`Cedula: ${cliente.cedula || '-'}`);
    doc.text(`Telefono: ${cliente.telefono || '-'}`);
    doc.text(`Email: ${cliente.email || '-'}`);
    doc.moveDown();

    doc.text('--- PRENDA ALQUILADA ---');
    doc.text(`Tipo: ${prenda.tipo || '-'}`);
    doc.text(`Talla: ${prenda.talla || '-'}`);
    doc.text(`Color: ${prenda.color || '-'}`);
    doc.moveDown();

    doc.text('--- DETALLES DEL ALQUILER ---');
    doc.text(`Fecha de Alquiler: ${alquiler.fecha_alquiler || '-'}`);
    doc.text(`Fecha de Devolucion: ${alquiler.fecha_devolucion || '-'}`);
    doc.text(`Precio Alquiler: $${Number(alquiler.precio_total || 0).toFixed(2)}`);

    // Danos del alquiler
    const danos = alquiler['da\u00f1os'] || alquiler.danos || [];
    const totalDanos = danos.reduce((sum, d) => sum + (parseFloat(d.costo_dano) || 0), 0);

    if (danos.length > 0) {
      doc.moveDown();
      doc.text('--- DANOS REGISTRADOS ---');
      danos.forEach((d, i) => {
        const costo = d.costo_dano ? `$${Number(d.costo_dano).toFixed(2)}` : 'Sin costo registrado';
        doc.text(`${i + 1}. ${d.descripcion} - ${costo}`);
      });
      doc.moveDown();
      doc.text(`Subtotal danos: $${totalDanos.toFixed(2)}`);
    }

    doc.moveDown();
    const totalFinal = Number(alquiler.precio_total || 0) + totalDanos;
    doc.fontSize(14).text(`TOTAL A PAGAR: $${totalFinal.toFixed(2)}`, { underline: true });

    doc.end();
  });
}

function generarReportePDF(tipo, datos) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const titulos = {
      ingresos: 'Reporte de Ingresos',
      'prendas-populares': 'Reporte de Prendas Mas Alquiladas',
      vencidos: 'Reporte de Alquileres Vencidos',
      ocupacion: 'Reporte de Ocupacion del Inventario',
    };

    doc.fontSize(20).text(titulos[tipo] || `Reporte: ${tipo}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generado: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    if (Array.isArray(datos)) {
      datos.forEach((item, i) => {
        doc.text(`${i + 1}. ${JSON.stringify(item)}`);
      });
    } else {
      doc.text(JSON.stringify(datos, null, 2));
    }

    doc.end();
  });
}

module.exports = { generarFacturaPDF, generarReportePDF };
