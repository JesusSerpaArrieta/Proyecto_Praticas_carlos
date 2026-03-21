# Documento de Requisitos

## Introducción

Sistema de gestión de alquiler de prendas para eventos (togas de grado, vestidos de matrimonio, vestidos de baile, entre otros). El sistema permite a la empresa controlar su inventario de prendas, gestionar la información de clientes, registrar y hacer seguimiento de alquileres, controlar la disponibilidad en tiempo real y generar facturas imprimibles. El objetivo es digitalizar y profesionalizar la operación del negocio, reduciendo errores manuales y mejorando la experiencia del cliente.

---

## Glosario

- **Sistema**: La aplicación web de gestión de alquiler de prendas.
- **Prenda**: Artículo de ropa disponible para alquiler (toga, vestido de matrimonio, vestido de baile, etc.).
- **Cliente**: Persona natural registrada en el sistema que puede realizar alquileres.
- **Alquiler**: Registro que asocia un Cliente con una Prenda durante un período de tiempo determinado.
- **Factura**: Documento generado por el Sistema que detalla el costo de un Alquiler.
- **Gestor_Inventario**: Módulo del Sistema encargado de administrar el catálogo de Prendas.
- **Gestor_Clientes**: Módulo del Sistema encargado de administrar la información de Clientes.
- **Gestor_Alquileres**: Módulo del Sistema encargado de registrar y hacer seguimiento de Alquileres.
- **Gestor_Facturas**: Módulo del Sistema encargado de generar y administrar Facturas.
- **Gestor_Reportes**: Módulo del Sistema encargado de generar reportes del negocio.
- **Estado_Prenda**: Condición actual de una Prenda: `Disponible`, `Alquilada` o `En_Mantenimiento`.
- **Estado_Alquiler**: Condición actual de un Alquiler: `Activo`, `Devuelto` o `Vencido`.
- **Cédula**: Número de identificación nacional único de un Cliente.
- **Fecha_Alquiler**: Fecha en que el Cliente recibe la Prenda.
- **Fecha_Devolucion**: Fecha acordada en que el Cliente debe retornar la Prenda.

---

## Requisitos

### Requisito 1: Gestión de Inventario de Prendas

**Historia de usuario:** Como administrador del negocio, quiero registrar y gestionar el catálogo de prendas disponibles, para tener un control preciso del inventario y su estado.

#### Criterios de Aceptación

1. THE Gestor_Inventario SHALL registrar una Prenda con los campos: identificador único, tipo de prenda, talla, color, precio de alquiler por día y Estado_Prenda inicial `Disponible`.
2. WHEN el administrador proporciona una imagen para una Prenda, THE Gestor_Inventario SHALL almacenar la referencia a la foto asociada a esa Prenda.
3. WHEN el administrador solicita editar una Prenda existente, THE Gestor_Inventario SHALL actualizar los campos modificados y conservar el identificador único de la Prenda.
4. WHEN el administrador solicita eliminar una Prenda con Estado_Prenda `Disponible`, THE Gestor_Inventario SHALL eliminar el registro de la Prenda del catálogo.
5. IF el administrador intenta eliminar una Prenda con Estado_Prenda `Alquilada`, THEN THE Gestor_Inventario SHALL rechazar la operación y mostrar un mensaje indicando que la Prenda tiene un Alquiler activo.
6. WHEN el administrador solicita listar el inventario, THE Gestor_Inventario SHALL retornar todas las Prendas con su Estado_Prenda actual.
7. WHEN el administrador aplica un filtro por Estado_Prenda, tipo de prenda, talla o color, THE Gestor_Inventario SHALL retornar únicamente las Prendas que coincidan con los criterios del filtro.
8. IF el administrador proporciona un precio de alquiler menor o igual a cero al registrar una Prenda, THEN THE Gestor_Inventario SHALL rechazar el registro y mostrar un mensaje de error indicando que el precio debe ser mayor a cero.

---

### Requisito 2: Gestión de Clientes

**Historia de usuario:** Como administrador del negocio, quiero registrar y gestionar la información de los clientes, para poder asociarlos a alquileres y mantener un historial de sus transacciones.

#### Criterios de Aceptación

1. THE Gestor_Clientes SHALL registrar un Cliente con los campos: identificador único, nombre completo, cédula, teléfono, dirección y correo electrónico.
2. IF el administrador intenta registrar un Cliente con una cédula ya existente en el Sistema, THEN THE Gestor_Clientes SHALL rechazar el registro y mostrar un mensaje indicando que la cédula ya está registrada.
3. IF el administrador intenta registrar un Cliente con un correo electrónico que no cumple el formato estándar de correo electrónico, THEN THE Gestor_Clientes SHALL rechazar el registro y mostrar un mensaje de error de formato.
4. WHEN el administrador solicita editar un Cliente existente, THE Gestor_Clientes SHALL actualizar los campos modificados y conservar el identificador único del Cliente.
5. WHEN el administrador busca un Cliente por nombre completo o cédula, THE Gestor_Clientes SHALL retornar los Clientes que coincidan con el criterio de búsqueda.
6. WHEN el administrador solicita ver el historial de un Cliente, THE Gestor_Clientes SHALL retornar todos los Alquileres asociados a ese Cliente ordenados por Fecha_Alquiler descendente.
7. IF el administrador intenta eliminar un Cliente que tiene Alquileres con Estado_Alquiler `Activo`, THEN THE Gestor_Clientes SHALL rechazar la operación y mostrar un mensaje indicando que el Cliente tiene alquileres activos.

---

### Requisito 3: Gestión de Alquileres

**Historia de usuario:** Como administrador del negocio, quiero registrar alquileres de prendas a clientes, para llevar un control preciso de qué prendas están en uso y cuándo deben ser devueltas.

#### Criterios de Aceptación

1. WHEN el administrador registra un nuevo Alquiler, THE Gestor_Alquileres SHALL asociar un Cliente existente con una Prenda existente, registrar la Fecha_Alquiler, la Fecha_Devolucion y calcular el precio total del Alquiler.
2. WHEN el Gestor_Alquileres registra un nuevo Alquiler exitosamente, THE Gestor_Inventario SHALL actualizar el Estado_Prenda de la Prenda asociada a `Alquilada`.
3. IF el administrador intenta registrar un Alquiler para una Prenda con Estado_Prenda diferente a `Disponible`, THEN THE Gestor_Alquileres SHALL rechazar el registro y mostrar un mensaje indicando que la Prenda no está disponible.
4. IF el administrador proporciona una Fecha_Devolucion anterior o igual a la Fecha_Alquiler, THEN THE Gestor_Alquileres SHALL rechazar el registro y mostrar un mensaje indicando que la Fecha_Devolucion debe ser posterior a la Fecha_Alquiler.
5. WHEN el administrador registra la devolución de una Prenda, THE Gestor_Alquileres SHALL actualizar el Estado_Alquiler a `Devuelto` y THE Gestor_Inventario SHALL actualizar el Estado_Prenda de la Prenda a `Disponible`.
6. WHEN el administrador consulta los alquileres activos, THE Gestor_Alquileres SHALL retornar todos los Alquileres con Estado_Alquiler `Activo` incluyendo el nombre del Cliente, el tipo de Prenda y la Fecha_Devolucion.
7. WHILE la fecha actual es posterior a la Fecha_Devolucion de un Alquiler con Estado_Alquiler `Activo`, THE Gestor_Alquileres SHALL marcar ese Alquiler con Estado_Alquiler `Vencido`.
8. WHEN el administrador consulta alquileres por rango de fechas, THE Gestor_Alquileres SHALL retornar únicamente los Alquileres cuya Fecha_Alquiler se encuentre dentro del rango especificado.

---

### Requisito 4: Control de Disponibilidad de Prendas

**Historia de usuario:** Como administrador del negocio, quiero consultar en tiempo real qué prendas están disponibles o alquiladas, para responder rápidamente a las solicitudes de los clientes.

#### Criterios de Aceptación

1. WHEN el administrador consulta la disponibilidad del inventario, THE Gestor_Inventario SHALL retornar el conteo de Prendas agrupado por Estado_Prenda.
2. WHEN el administrador consulta las Prendas disponibles, THE Gestor_Inventario SHALL retornar únicamente las Prendas con Estado_Prenda `Disponible`.
3. WHEN el administrador consulta las Prendas alquiladas, THE Gestor_Inventario SHALL retornar las Prendas con Estado_Prenda `Alquilada` junto con el nombre del Cliente y la Fecha_Devolucion del Alquiler activo asociado.
4. WHEN el administrador cambia el Estado_Prenda de una Prenda a `En_Mantenimiento`, THE Gestor_Inventario SHALL registrar el cambio y la Prenda no SHALL aparecer como disponible para nuevos Alquileres.
5. WHEN el administrador cambia el Estado_Prenda de una Prenda de `En_Mantenimiento` a `Disponible`, THE Gestor_Inventario SHALL registrar el cambio y la Prenda SHALL estar disponible para nuevos Alquileres.

---

### Requisito 5: Generación de Facturas

**Historia de usuario:** Como administrador del negocio, quiero generar facturas para cada alquiler, para tener un registro formal de las transacciones y poder entregárselas al cliente.

#### Criterios de Aceptación

1. WHEN el administrador solicita generar una Factura para un Alquiler, THE Gestor_Facturas SHALL crear una Factura con: número de factura único, fecha de emisión, datos del Cliente, descripción de la Prenda, Fecha_Alquiler, Fecha_Devolucion y precio total del Alquiler.
2. THE Gestor_Facturas SHALL asignar a cada Factura un número de factura único e incremental.
3. WHEN el administrador solicita imprimir o exportar una Factura, THE Gestor_Facturas SHALL generar un documento en formato PDF con el contenido de la Factura.
4. WHEN el administrador consulta el historial de facturas, THE Gestor_Facturas SHALL retornar todas las Facturas ordenadas por fecha de emisión descendente.
5. WHEN el administrador busca una Factura por número de factura o por nombre de Cliente, THE Gestor_Facturas SHALL retornar las Facturas que coincidan con el criterio de búsqueda.
6. IF el administrador intenta generar una Factura para un Alquiler que ya tiene una Factura emitida, THEN THE Gestor_Facturas SHALL mostrar la Factura existente en lugar de crear un duplicado.

---

### Requisito 6: Reportes del Negocio

**Historia de usuario:** Como administrador del negocio, quiero consultar reportes de ingresos y actividad, para tomar decisiones informadas sobre el negocio.

#### Criterios de Aceptación

1. WHEN el administrador solicita el reporte de ingresos por período, THE Gestor_Reportes SHALL calcular y mostrar el total de ingresos sumando los precios de todos los Alquileres con Estado_Alquiler `Devuelto` dentro del período especificado.
2. WHEN el administrador solicita el reporte de prendas más alquiladas, THE Gestor_Reportes SHALL retornar las Prendas ordenadas de mayor a menor por número de veces que han sido alquiladas.
3. WHEN el administrador solicita el reporte de alquileres vencidos, THE Gestor_Reportes SHALL retornar todos los Alquileres con Estado_Alquiler `Vencido` incluyendo el nombre del Cliente, la Prenda y los días de retraso.
4. WHEN el administrador solicita el reporte de ocupación del inventario, THE Gestor_Reportes SHALL mostrar el porcentaje de Prendas en cada Estado_Prenda respecto al total del inventario.
5. WHEN el administrador solicita exportar un reporte, THE Gestor_Reportes SHALL generar el reporte en formato PDF.

---

### Requisito 7: Autenticación y Seguridad

**Historia de usuario:** Como administrador del negocio, quiero que el sistema requiera autenticación para acceder, para proteger la información del negocio y de los clientes.

#### Criterios de Aceptación

1. WHEN un usuario intenta acceder al Sistema, THE Sistema SHALL requerir credenciales de acceso (usuario y contraseña) antes de mostrar cualquier módulo.
2. IF un usuario proporciona credenciales incorrectas, THEN THE Sistema SHALL rechazar el acceso y mostrar un mensaje de error genérico sin revelar cuál campo es incorrecto.
3. IF un usuario falla la autenticación 5 veces consecutivas, THEN THE Sistema SHALL bloquear el acceso desde esa sesión por 15 minutos.
4. WHEN un usuario autenticado cierra sesión, THE Sistema SHALL invalidar la sesión activa y redirigir al usuario a la pantalla de inicio de sesión.
5. THE Sistema SHALL almacenar las contraseñas de los usuarios usando un algoritmo de hash seguro (bcrypt con factor de costo mínimo de 10).
