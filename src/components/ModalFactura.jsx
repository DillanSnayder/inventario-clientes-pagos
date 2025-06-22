import React, { forwardRef } from "react";

const ModalFactura = forwardRef(({ visible, factura, onImprimir, onCerrar }, ref) => {
  if (!visible || !factura) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg" ref={ref}>
        <h2 className="text-xl font-bold mb-4">Factura #{factura.id}</h2>
        <div>Cliente: {factura.cliente}</div>
        <div>Fecha: {factura.fecha}</div>
        <table className="w-full my-4">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {factura.productos.map((p, i) => (
              <tr key={i}>
                <td>{p.nombre}</td>
                <td>{p.cantidad}</td>
                <td>{p.precio}</td>
                <td>{p.cantidad * p.precio}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="font-bold">Total: {factura.total}</div>
        <div className="flex gap-4 mt-6">
          <button className="btn-primary" onClick={onImprimir}>Imprimir</button>
          <button className="btn-secondary" onClick={onCerrar}>Finalizar</button>
        </div>
      </div>
    </div>
  );
});

export default ModalFactura;