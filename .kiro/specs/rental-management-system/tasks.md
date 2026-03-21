# Plan de Implementación: Sistema de Gestión de Alquiler de Prendas

## Descripción General

Implementación incremental del sistema usando React + Vite (frontend), Node.js + Express + Sequelize (backend) y MySQL (base de datos). Cada tarea construye sobre la anterior, comenzando por la infraestructura base hasta llegar a la integración completa.

## Tareas

- [x] 1. Configurar estructura del proyecto y dependencias
  - Crear monorepo con carpetas `backend/` y `frontend/`
  - Inicializar `backend/` con Express, Sequelize, MySQL2, JWT, bcrypt, pdfkit, cors, dotenv
  - Inicializar `frontend/` con Vite + React, Axios, React Router
  - Configurar Jest + fast-check en `backend/` para pruebas
  - Crear archivo `.env.example` con variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, JWT_SECRET
  - _Requisitos: 7.1, 7.5_

- [x] 2. Crear migraciones y modelos Sequelize
  - [x] 2.1 Crear migración y modelo `Usuario` (id, nombre, email, password_hash, created_at)
    - _Requisitos: 7.1, 7.5_
  - [x] 2.2 Crear migración y modelo `Prenda` (id, tipo, talla, color, precio_por_dia, estado ENUM, foto_url, timestamps)
    - _Requisitos: 1.1, 1.2_
  - [x] 2.3 Crear migración y modelo `Cliente` (id, nombre_completo, cedula UNIQUE, telefono, direccion, email, created_at)
    - _Requisitos: 2.1, 2.2_
  - [x] 2.4 Crear migración y modelo `Alquiler` con FK a clientes y prendas, CHECK fecha_devolucion > fecha_alquiler
    - _Requisitos: 3.1, 3.4_
  - [x] 2.5 Crear migración y modelo `Factura` con FK a alquiler (UNIQUE), numero_factura UNIQUE
    - _Requisitos: 5.1, 5.2_
  - [x] 2.6 Crear migración y modelo `IntentoLogin` (email UNIQUE, intentos_fallidos, bloqueado_hasta)
    - _Requisitos: 7.3_
  - [x] 2.7 Definir asociaciones Sequelize: Cliente hasMany Alquiler, Prenda hasMany Alquiler, Alquiler hasOne Factura
    - _Requisitos: 3.1, 5.1_

- [x] 3. Implementar AuthModule (backend)
  - [x] 3.1 Crear `authService.js`: login con bcrypt.compare, registro de intentos fallidos en `intentos_login`, bloqueo a los 5 intentos por 15 min, generación de JWT
    - _Requisitos: 7.1, 7.2, 7.3, 7.5_
  - [x] 3.2 Crear middleware `authMiddleware.js`: verificar JWT en header Authorization, responder 401 si inválido o ausente
    - _Requisitos: 7.1_
  - [x] 3.3 Crear `authController.js` y router: POST /api/auth/login, POST /api/auth/logout (invalidar token con blacklist en memoria)
    - _Requisitos: 7.1, 7.4_
  - [x] 3.4 Escribir prueba de propiedad para AuthModule
    - **Propiedad 27: Rutas protegidas requieren token válido**
    - **Valida: Requisitos 7.1**
  - [x] 3.5 Escribir prueba de propiedad para AuthModule
    - **Propiedad 28: Credenciales inválidas siempre son rechazadas**
    - **Valida: Requisitos 7.2**
  - [x] 3.6 Escribir prueba de propiedad para AuthModule
    - **Propiedad 29: Token invalidado tras logout no permite acceso**
    - **Valida: Requisitos 7.4**
  - [x] 3.7 Escribir pruebas unitarias para AuthModule
    - Caso: login exitoso retorna JWT; login con contraseña incorrecta retorna error genérico; bloqueo tras 5 intentos; logout invalida token
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_

- [x] 4. Implementar InventarioModule (backend)
  - [x] 4.1 Crear `prendaService.js`: crear prenda (validar precio > 0), editar, eliminar (rechazar si estado = Alquilada), listar con filtros, cambiar estado
    - _Requisitos: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 4.4, 4.5_
  - [x] 4.2 Crear `prendaController.js` y router con los endpoints: GET/POST /api/prendas, PUT/DELETE /api/prendas/:id, PATCH /api/prendas/:id/estado
    - _Requisitos: 1.1, 1.6, 1.7_
  - [x] 4.3 Escribir prueba de propiedad para InventarioModule
    - **Propiedad 1: Registro de prenda es recuperable**
    - **Valida: Requisitos 1.1**
  - [x] 4.4 Escribir prueba de propiedad para InventarioModule
    - **Propiedad 2: Edición conserva el identificador único**
    - **Valida: Requisitos 1.3**
  - [x] 4.5 Escribir prueba de propiedad para InventarioModule
    - **Propiedad 3: Eliminación de prenda disponible es efectiva**
    - **Valida: Requisitos 1.4**
  - [x] 4.6 Escribir prueba de propiedad para InventarioModule
    - **Propiedad 4: No se puede eliminar una prenda alquilada**
    - **Valida: Requisitos 1.5**
  - [x] 4.7 Escribir prueba de propiedad para InventarioModule
    - **Propiedad 5: El filtro de inventario retorna solo coincidencias**
    - **Valida: Requisitos 1.7**
  - [x] 4.8 Escribir prueba de propiedad para InventarioModule
    - **Propiedad 6: Precio no positivo es rechazado**
    - **Valida: Requisitos 1.8**
  - [x] 4.9 Escribir pruebas unitarias para InventarioModule
    - Caso: crear prenda con precio 0 retorna 422; eliminar prenda alquilada retorna 409; filtro por estado retorna solo ese estado
    - _Requisitos: 1.5, 1.7, 1.8_

- [x] 5. Implementar ClientesModule (backend)
  - [x] 5.1 Crear `clienteService.js`: crear cliente (validar cédula única, formato email), editar, eliminar (rechazar si tiene alquileres activos), buscar por nombre/cédula, obtener historial ordenado por fecha desc
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - [x] 5.2 Crear `clienteController.js` y router: GET/POST /api/clientes, PUT/DELETE /api/clientes/:id, GET /api/clientes/:id/historial
    - _Requisitos: 2.1, 2.5, 2.6_
  - [x] 5.3 Escribir prueba de propiedad para ClientesModule
    - **Propiedad 7: Unicidad de cédula de cliente**
    - **Valida: Requisitos 2.2**
  - [x] 5.4 Escribir prueba de propiedad para ClientesModule
    - **Propiedad 8: Validación de formato de email**
    - **Valida: Requisitos 2.3**
  - [x] 5.5 Escribir prueba de propiedad para ClientesModule
    - **Propiedad 9: Búsqueda retorna solo coincidencias**
    - **Valida: Requisitos 2.5**
  - [x] 5.6 Escribir prueba de propiedad para ClientesModule
    - **Propiedad 10: Historial ordenado por fecha descendente**
    - **Valida: Requisitos 2.6**
  - [x] 5.7 Escribir prueba de propiedad para ClientesModule
    - **Propiedad 11: No se puede eliminar cliente con alquileres activos**
    - **Valida: Requisitos 2.7**
  - [x] 5.8 Escribir pruebas unitarias para ClientesModule
    - Caso: cédula duplicada retorna 409; email inválido retorna 422; eliminar cliente con alquiler activo retorna 409
    - _Requisitos: 2.2, 2.3, 2.7_

- [x] 6. Implementar AlquileresModule (backend)
  - [x] 6.1 Crear `alquilerService.js`: registrar alquiler en transacción (validar prenda Disponible, fecha_devolucion > fecha_alquiler, calcular precio_total = precio_por_dia × días, actualizar estado prenda a Alquilada), registrar devolución (actualizar estado alquiler a Devuelto y prenda a Disponible), listar con filtros por estado y rango de fechas
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8_
  - [x] 6.2 Crear función `marcarVencidos()` en `alquilerService.js`: actualizar a Vencido todos los alquileres Activos con fecha_devolucion < hoy; configurar ejecución periódica con `setInterval` al iniciar el servidor
    - _Requisitos: 3.7_
  - [x] 6.3 Crear `alquilerController.js` y router: GET /api/alquileres, POST /api/alquileres, PATCH /api/alquileres/:id/devolucion
    - _Requisitos: 3.1, 3.6_
  - [x] 6.4 Escribir prueba de propiedad para AlquileresModule
    - **Propiedad 12: Cálculo correcto del precio total del alquiler**
    - **Valida: Requisitos 3.1**
  - [x] 6.5 Escribir prueba de propiedad para AlquileresModule
    - **Propiedad 13: Round-trip de alquiler y devolución restaura disponibilidad**
    - **Valida: Requisitos 3.2, 3.5**
  - [x] 6.6 Escribir prueba de propiedad para AlquileresModule
    - **Propiedad 14: No se puede alquilar una prenda no disponible**
    - **Valida: Requisitos 3.3**
  - [x] 6.7 Escribir prueba de propiedad para AlquileresModule
    - **Propiedad 15: Fecha de devolución debe ser posterior a fecha de alquiler**
    - **Valida: Requisitos 3.4**
  - [x] 6.8 Escribir prueba de propiedad para AlquileresModule
    - **Propiedad 16: Consulta de alquileres por estado retorna solo ese estado**
    - **Valida: Requisitos 3.6**
  - [x] 6.9 Escribir prueba de propiedad para AlquileresModule
    - **Propiedad 17: Alquileres vencidos son marcados automáticamente**
    - **Valida: Requisitos 3.7**
  - [x] 6.10 Escribir prueba de propiedad para AlquileresModule
    - **Propiedad 18: Consulta por rango de fechas retorna solo alquileres en rango**
    - **Valida: Requisitos 3.8**
  - [x] 6.11 Escribir pruebas unitarias para AlquileresModule
    - Caso: alquiler con prenda Alquilada retorna 409; fecha_devolucion igual a fecha_alquiler retorna 422; devolución actualiza estado prenda y alquiler
    - _Requisitos: 3.3, 3.4, 3.5_

- [x] 7. Implementar módulo de Disponibilidad (backend)
  - [x] 7.1 Agregar endpoint GET /api/prendas/disponibilidad en `prendaController.js`: retornar conteo agrupado por estado (Disponible, Alquilada, En_Mantenimiento)
    - _Requisitos: 4.1_
  - [x] 7.2 Agregar endpoint GET /api/prendas/alquiladas en `prendaController.js`: retornar prendas Alquiladas con nombre del cliente y fecha_devolucion del alquiler activo (JOIN con alquileres y clientes)
    - _Requisitos: 4.3_
  - [x] 7.3 Escribir prueba de propiedad para DisponibilidadModule
    - **Propiedad 19: Los conteos de disponibilidad suman el total del inventario**
    - **Valida: Requisitos 4.1**
  - [x] 7.4 Escribir prueba de propiedad para DisponibilidadModule
    - **Propiedad 20: Round-trip de estado de mantenimiento**
    - **Valida: Requisitos 4.4, 4.5**
  - [x] 7.5 Escribir pruebas unitarias para DisponibilidadModule
    - Caso: prenda en mantenimiento no aparece en disponibles; cambio a Disponible la incluye nuevamente
    - _Requisitos: 4.4, 4.5_

- [x] 8. Implementar FacturasModule (backend)
  - [x] 8.1 Crear `facturaService.js`: generar factura para un alquiler (idempotente: si ya existe retornar la existente), asignar numero_factura único e incremental, listar ordenado por fecha_emision desc, buscar por numero_factura o nombre de cliente
    - _Requisitos: 5.1, 5.2, 5.4, 5.5, 5.6_
  - [x] 8.2 Crear `pdfService.js`: función `generarFacturaPDF(factura)` usando pdfkit que incluya todos los campos requeridos (número, fecha, datos cliente, prenda, fechas, precio total)
    - _Requisitos: 5.3_
  - [x] 8.3 Crear `facturaController.js` y router: GET /api/facturas, POST /api/facturas, GET /api/facturas/:id/pdf
    - _Requisitos: 5.1, 5.3, 5.4_
  - [x] 8.4 Escribir prueba de propiedad para FacturasModule
    - **Propiedad 21: Factura contiene todos los campos requeridos**
    - **Valida: Requisitos 5.1**
  - [x] 8.5 Escribir prueba de propiedad para FacturasModule
    - **Propiedad 22: Números de factura son únicos**
    - **Valida: Requisitos 5.2**
  - [x] 8.6 Escribir prueba de propiedad para FacturasModule
    - **Propiedad 23: Generación de factura es idempotente**
    - **Valida: Requisitos 5.6**
  - [x] 8.7 Escribir pruebas unitarias para FacturasModule
    - Caso: generar factura dos veces retorna la misma; búsqueda por número retorna coincidencia exacta; historial ordenado descendente
    - _Requisitos: 5.4, 5.5, 5.6_

- [x] 9. Implementar ReportesModule (backend)
  - [x] 9.1 Crear `reporteService.js`: calcular ingresos por período (solo alquileres Devueltos), prendas más alquiladas ordenadas desc, alquileres vencidos con días de retraso, porcentaje de ocupación por estado
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_
  - [x] 9.2 Agregar función `generarReportePDF(tipo, datos)` en `pdfService.js` para exportar reportes
    - _Requisitos: 6.5_
  - [x] 9.3 Crear `reporteController.js` y router: GET /api/reportes/ingresos, GET /api/reportes/prendas-populares, GET /api/reportes/vencidos, GET /api/reportes/ocupacion, GET /api/reportes/:tipo/pdf
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 9.4 Escribir prueba de propiedad para ReportesModule
    - **Propiedad 24: Reporte de ingresos incluye solo alquileres devueltos**
    - **Valida: Requisitos 6.1**
  - [x] 9.5 Escribir prueba de propiedad para ReportesModule
    - **Propiedad 25: Reporte de prendas populares está ordenado descendentemente**
    - **Valida: Requisitos 6.2**
  - [x] 9.6 Escribir prueba de propiedad para ReportesModule
    - **Propiedad 26: Reporte de vencidos incluye solo alquileres vencidos con días de retraso positivos**
    - **Valida: Requisitos 6.3**
  - [x] 9.7 Escribir pruebas unitarias para ReportesModule
    - Caso: ingresos excluyen alquileres Activos y Vencidos; ocupación suma 100% del inventario; vencidos tienen días_retraso > 0
    - _Requisitos: 6.1, 6.3, 6.4_

- [x] 10. Punto de control — Backend completo
  - Asegurar que todos los tests pasen con `jest --runInBand`
  - Verificar que todos los endpoints respondan correctamente con un cliente HTTP (ej. curl o Postman)
  - Preguntar al usuario si hay ajustes antes de continuar con el frontend

- [x] 11. Implementar frontend — Infraestructura base
  - [x] 11.1 Configurar React Router con rutas: `/login` (pública) y rutas protegidas (`/`, `/inventario`, `/clientes`, `/alquileres`, `/facturas`, `/reportes`)
    - _Requisitos: 7.1_
  - [x] 11.2 Crear `apiClient.js` con instancia de Axios: interceptor de request para adjuntar JWT, interceptor de response para redirigir a `/login` en 401
    - _Requisitos: 7.1, 7.4_
  - [x] 11.3 Crear `AuthContext.jsx`: estado de sesión, funciones login/logout, persistencia de token en localStorage
    - _Requisitos: 7.1, 7.4_
  - [x] 11.4 Crear componente `ProtectedRoute.jsx` que redirija a `/login` si no hay sesión activa
    - _Requisitos: 7.1_

- [x] 12. Implementar LoginPage y DashboardPage (frontend)
  - [x] 12.1 Crear `LoginPage.jsx`: formulario usuario/contraseña, llamada a POST /api/auth/login, manejo de error genérico, redirección al dashboard tras éxito
    - _Requisitos: 7.1, 7.2_
  - [x] 12.2 Crear `DashboardPage.jsx`: tarjetas de resumen (total prendas, disponibles, alquiladas, en mantenimiento) consumiendo GET /api/prendas/disponibilidad; lista de alquileres próximos a vencer (próximos 3 días) y vencidos
    - _Requisitos: 4.1, 3.7_

- [x] 13. Implementar InventarioPage (frontend)
  - [x] 13.1 Crear `InventarioPage.jsx`: tabla de prendas con columnas (ID, tipo, talla, color, precio/día, estado), filtros por estado/tipo/talla/color consumiendo GET /api/prendas
    - _Requisitos: 1.6, 1.7_
  - [x] 13.2 Crear `PrendaFormModal.jsx`: formulario crear/editar prenda con validación de precio > 0, llamadas a POST y PUT /api/prendas
    - _Requisitos: 1.1, 1.3, 1.8_
  - [x] 13.3 Agregar acciones en tabla: Eliminar (DELETE /api/prendas/:id con confirmación), Cambiar Estado (PATCH /api/prendas/:id/estado)
    - _Requisitos: 1.4, 1.5, 4.4, 4.5_

- [x] 14. Implementar ClientesPage (frontend)
  - [x] 14.1 Crear `ClientesPage.jsx`: tabla de clientes con búsqueda por nombre/cédula consumiendo GET /api/clientes?q=
    - _Requisitos: 2.1, 2.5_
  - [x] 14.2 Crear `ClienteFormModal.jsx`: formulario crear/editar cliente con validación de formato email, llamadas a POST y PUT /api/clientes
    - _Requisitos: 2.1, 2.3, 2.4_
  - [x] 14.3 Crear `ClienteHistorialModal.jsx`: tabla de alquileres del cliente consumiendo GET /api/clientes/:id/historial
    - _Requisitos: 2.6_

- [x] 15. Implementar AlquileresPage (frontend)
  - [x] 15.1 Crear `AlquileresPage.jsx`: tabla de alquileres con filtros por estado y rango de fechas consumiendo GET /api/alquileres
    - _Requisitos: 3.6, 3.8_
  - [x] 15.2 Crear `NuevoAlquilerModal.jsx`: selector de cliente (búsqueda), selector de prenda disponible, campos fecha_alquiler y fecha_devolucion con validación fecha_devolucion > fecha_alquiler, llamada a POST /api/alquileres
    - _Requisitos: 3.1, 3.3, 3.4_
  - [x] 15.3 Agregar botón "Registrar Devolución" en tabla: llamada a PATCH /api/alquileres/:id/devolucion con confirmación
    - _Requisitos: 3.5_

- [x] 16. Implementar FacturasPage (frontend)
  - [x] 16.1 Crear `FacturasPage.jsx`: tabla de facturas con búsqueda por número o cliente consumiendo GET /api/facturas?q=, botón "Exportar PDF" por fila (GET /api/facturas/:id/pdf)
    - _Requisitos: 5.4, 5.5_
  - [x] 16.2 Agregar botón "Generar Factura" en `AlquileresPage.jsx` que llame a POST /api/facturas y redirija a FacturasPage
    - _Requisitos: 5.1, 5.6_

- [x] 17. Implementar ReportesPage (frontend)
  - Crear `ReportesPage.jsx`: selector de tipo de reporte (ingresos, prendas populares, vencidos, ocupación), filtros de período (fecha desde/hasta), tabla de resultados, botón "Exportar PDF" (GET /api/reportes/:tipo/pdf)
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 18. Punto de control final — Integración completa
  - Asegurar que todos los tests del backend pasen con `jest --runInBand`
  - Verificar flujo completo: login → crear prenda → crear cliente → registrar alquiler → generar factura → exportar PDF → ver reporte
  - Preguntar al usuario si hay ajustes antes de dar por finalizada la implementación

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los puntos de control garantizan validación incremental antes de avanzar
- Las pruebas de propiedades usan `fc.assert` con `numRuns: 100` según lo definido en el diseño
- Las pruebas unitarias cubren casos borde y condiciones de error concretas
- Todas las operaciones de alquiler (crear + cambiar estado prenda) deben ejecutarse en una transacción Sequelize

- [x] 19. Módulo de daños de prendas
  - [x] 19.1 Crear modelo `DañoPrenda` (id, prenda_id, alquiler_id nullable, descripcion, foto_url, resuelto, timestamps) y migración `20240007-create-daños-prenda.js`
  - [x] 19.2 Registrar modelo en `models/index.js` con asociaciones: Prenda hasMany DañoPrenda, Alquiler hasMany DañoPrenda
  - [x] 19.3 Crear `dañoService.js`: registrarDaño (validar prenda existe y descripción no vacía), listarDaños por prenda (orden desc), marcarResuelto
  - [x] 19.4 Crear `dañoController.js` y agregar rutas en `routes/prendas.js`: GET /api/prendas/:id/daños, POST /api/prendas/:id/daños, PATCH /api/prendas/:id/daños/:dañoId/resolver
  - [x] 19.5 Modificar `registrarDevolucion` en `alquilerService.js`: acepta `{ con_daño, descripcion_daño, foto_url_daño }` — si hay daño, crea registro DañoPrenda y deja prenda en `En_Mantenimiento` en la misma transacción; si no, vuelve a `Disponible`
  - [x] 19.6 Actualizar `alquilerController.js` para pasar `req.body` completo a `registrarDevolucion`
  - [x] 19.7 Actualizar `AlquileresPage.jsx`: reemplazar confirm() por modal `DevolucionModal` con checkbox "devuelta con daño", campo descripción y URL de foto opcional
  - [x] 19.8 Actualizar `InventarioPage.jsx`: agregar botón "Daños" por prenda que abre `DañosModal` con historial de daños, opción de registrar daño manual y botón "Marcar resuelto" por daño pendiente

- [x] 20. Subida de imágenes (reemplazar URL por upload real)
  - [x] 20.1 Crear `uploadService.js` con multer diskStorage en `/app/uploads`
  - [x] 20.2 Crear `uploadController.js` con endpoint `POST /api/uploads`
  - [x] 20.3 Actualizar `index.js`: crear carpeta uploads, servir estáticos en `/uploads/`, registrar ruta `/api/uploads`
  - [x] 20.4 Actualizar `nginx.conf` para proxear `/uploads/` al backend
  - [x] 20.5 Actualizar `docker-compose.yml` con volumen `uploads_data:/app/uploads`
  - [x] 20.6 Crear componente `ImageUpload.jsx` reutilizable (reemplaza campos de URL)
  - [x] 20.7 Usar `ImageUpload` en `InventarioPage.jsx` y `AlquileresPage.jsx`

- [x] 21. Costo de daño + reporte de daños
  - [x] 21.1 Agregar campo `costo_dano DECIMAL(10,2)` al modelo `DañoPrenda` y migración
  - [x] 21.2 Actualizar `dañoService.js`: `registrarDaño` acepta `costo_dano`; nueva función `reporteDanos({ desde, hasta })`
  - [x] 21.3 Actualizar `alquilerService.js`: `registrarDevolucion` pasa `costo_dano` al crear el daño
  - [x] 21.4 Actualizar `reporteController.js` y `routes/reportes.js`: nueva ruta `GET /api/reportes/danos`
  - [x] 21.5 Actualizar `AlquileresPage.jsx`: campo de costo en `DevolucionModal`
  - [x] 21.6 Actualizar `InventarioPage.jsx`: campo de costo en `DañosModal`, mostrar en historial
  - [x] 21.7 Actualizar `ReportesPage.jsx`: nueva pestaña "Daños de Prendas" con total de costos
  - [x] 21.8 Ejecutar `ALTER TABLE danos_prenda ADD costo_dano DECIMAL(10,2) NULL` en SQL Server (columna nueva en tabla existente, sync() no la agrega automáticamente)

- [x] 22. Correcciones y mejoras post-revisión
  - [x] 22.1 Fix búsqueda de facturas — reescrita en `facturaService.js`: búsqueda numérica exacta por `numero_factura`, búsqueda por nombre/cédula de cliente en memoria (evita problemas con Sequelize + SQL Server)
  - [x] 22.2 Bloquear eliminación de cliente con alquiler `Vencido` además de `Activo` en `clienteService.js`
  - [x] 22.3 Agregar campo `estado_pago` (Pendiente/Pagado) al modelo `Factura` + `ensureColumns()` en `index.js`
  - [x] 22.4 Nuevo endpoint `PATCH /api/facturas/:id/estado-pago` para alternar estado de pago
  - [x] 22.5 `FacturasPage.jsx`: columna "Estado" con botón toggle Pendiente/Pagado con colores diferenciados
  - [x] 22.6 Extensión de alquiler: `extenderAlquiler()` en `alquilerService.js`, endpoint `PATCH /api/alquileres/:id/extender`, `ExtenderModal` en `AlquileresPage.jsx`
  - [x] 22.7 Botones "Extender" y "Devolver" separados en secciones Vencidos y Activos de `AlquileresPage.jsx`

- [x] 23. Mejoras de UX y funcionalidad adicional
  - [x] 23.1 Tallas estandarizadas con select en `PrendaFormModal` (XS/S/M/L/XL/XXL + tallas numéricas 34-50 + Única)
  - [x] 23.2 Campo `notas` en modelo `Alquiler` + `ensureColumns()` + visible en `NuevoAlquilerModal` y en tarjetas de alquiler
  - [x] 23.3 Filtro "Vencen esta semana" en `AlquileresPage` — toggle que filtra por `fecha_devolucion` en los próximos 7 días
  - [x] 23.4 Alerta "facturas sin cobrar" en `DashboardPage` — cuenta facturas con `estado_pago = Pendiente`
  - [x] 23.5 Cambiar contraseña desde sidebar en `Layout.jsx` — modal con validación, endpoint `POST /api/auth/cambiar-password`
  - [x] 23.6 Renombrar app de "RentApp" a "Las Togas" en sidebar

- [x] 24. Migración a PostgreSQL + preparación para deploy gratuito
  - [x] 24.1 Reemplazar `tedious`/`mssql` por `pg` + `pg-hstore` en `package.json`
  - [x] 24.2 Actualizar `models/index.js` — dialecto `postgres`, soporte `DATABASE_URL` y SSL
  - [x] 24.3 Reescribir `ensureColumns()` en `index.js` con sintaxis PostgreSQL (`DO $$ ... $$`)
  - [x] 24.4 Eliminar `ensureDatabase()` — en Postgres la DB ya existe en el proveedor
  - [x] 24.5 Actualizar `docker-compose.yml` — `postgres:16-alpine` en lugar de SQL Server
  - [x] 24.6 Actualizar `.env` y `.env.example` con variables PostgreSQL
  - [x] 24.7 `apiClient.js` — soporte `VITE_API_URL` para producción
  - [x] 24.8 `uploadController.js` — URLs absolutas con `BACKEND_URL` en producción
  - [x] 24.9 CORS configurado con `FRONTEND_URL`
  - [x] 24.10 Crear `render.yaml` para deploy automático en Render
  - [x] 24.11 Crear `DEPLOY.md` con guía paso a paso: Neon + Render + Vercel
