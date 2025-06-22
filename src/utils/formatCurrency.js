// Devuelve el número con separador de miles y sin decimales
export function formatCurrency(n) {
  const number = Number(String(n).replace(/[.,]/g, "").replace(/\D/g, "")) || 0;
  return number.toLocaleString("es-CO");
}