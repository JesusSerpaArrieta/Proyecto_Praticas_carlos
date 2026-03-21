/**
 * Sequelize con el dialecto mssql (tedious) a veces envuelve los resultados
 * de findAll en { value: [...], Count: N } en lugar de devolver el array directamente.
 * Esta función normaliza eso.
 */
function normalizeResult(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.value)) return result.value;
  return [];
}

module.exports = { normalizeResult };
