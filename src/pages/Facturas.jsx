import { useEffect, useState, useRef } from "react";
import { db } from "../services/firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import ModalFactura from "../components/ModalFactura";

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const facturaRef = useRef();

  useEffect(() => {
    const cargar = async () => {
      const q = query(collection(db, "facturas"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setFacturas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    cargar();
  }, []);

  function verFactura(f) {
    setFacturaSeleccionada(f);
    setMostrarModal(true);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Facturas</h1>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Ver</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map(f => (
            <tr key={f.id}>
              <td>{f.id}</td>
              <td>{f.cliente}</td>
              <td>{f.fecha}</td>
              <td>{f.total}</td>
              <td>
                <button className="btn-table" onClick={() => verFactura(f)}>Ver/Imprimir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ModalFactura
        visible={mostrarModal}
        factura={facturaSeleccionada}
        onImprimir={() => window.print()}
        onCerrar={() => setMostrarModal(false)}
        ref={facturaRef}
      />
    </div>
  );
}