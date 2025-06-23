import { useState, useEffect, forwardRef } from "react";
import { db } from "../services/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { formatCurrency } from "../utils/formatCurrency";

const ModalFactura = forwardRef(function ModalFactura({ visible, factura, onImprimir, onCerrar }, ref) {
  const [negocio, setNegocio] = useState(null);

  useEffect(() => {
    async function cargar() {
      const snap = await getDoc(doc(db, "configuracion", "negocio"));
      if (snap.exists()) setNegocio(snap.data());
    }
    if (visible) cargar();
  }, [visible]);

  if (!visible || !factura) return null;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full relative" ref={ref}>
        <button className="absolute top-3 right-3 btn-secondary" onClick={onCerrar}>Cerrar</button>
        <div className="text-center border-b pb-4 mb-4">
          {negocio?.logo && <img src={negocio.logo} alt="Logo" className="h-16 mx-auto mb-2" />}
          <div className="text-2xl font-bold">{negocio?.nombre || "Mi Negocio"}</div>
          <div>{negocio?.direccion} {negocio?.ciudad}</div>
          <div>NIT: {negocio?.nit}</div>
          <div>Tel: {negocio?.telefono} - {negocio?.correo}</div>
        </div>
        <div className="mb-4">
          <div className="font-bold">Factura #{factura.id?.slice(-8)}</div>
          <div>Fecha: {factura.fecha}</div>
          <div>Cliente: {factura.cliente}</div>
        </div>
        <table className="w-full mb-4 text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left">Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {factura.productos.map((p,i) => (
              <tr key={i}>
                <td>{p.nombre}</td>
                <td className="text-center">{p.cantidad}</td>
                <td className="text-right">{formatCurrency(p.precio)}</td>
                <td className="text-right">{formatCurrency(p.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right font-bold text-lg">Total: {formatCurrency(factura.total)}</div>
        <div className="mt-2">
          <span className="font-semibold">Método de pago:</span> {factura.pago?.metodo || "N/A"}
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button className="btn-secondary" onClick={onImprimir}>Imprimir</button>
        </div>
      </div>
    </div>
  );
});

export default ModalFactura;