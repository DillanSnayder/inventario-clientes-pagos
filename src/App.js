import React, { useState } from "react";
import Clientes from "./pages/Clientes";
import Proveedores from "./pages/Proveedores";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import NotificacionesStock from './components/NotificacionesStock';
import Empleados from "./pages/Empleados";
import Estadisticas from "./pages/Estadisticas";
import Negocio from "./pages/Negocio";
import Finanzas from "./pages/Finanzas";

function Sidebar({ selected, setSelected }) {
  const items = [
    { label: "Empresa", icon: "🏢" },
    { label: "Finanzas", icon: "💶" },
    { label: "Ventas", icon: "🛒" },
    { label: "Clientes", icon: "👤" },
    { label: "Proveedor", icon: "🏢" },
    { label: "Productos", icon: "📦" },
    { label: "Empleados", icon: "🫂" },
    { label: "Estadisticas", icon: "↗️" },
  ];
  return (
    <aside className="bg-gray-900 text-white w-56 min-h-screen p-5 flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-8">Inventario Dashboard</h2>
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => setSelected(item.label)}
          className={`flex items-center gap-3 px-4 py-2 rounded transition ${
            selected === item.label
              ? "bg-blue-600 font-bold"
              : "hover:bg-gray-700"
          }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </aside>
  );
}

function MainContent({ selected, onVentaFinalizada }) {
  return (
    <div className="flex-1 p-10 bg-gray-50 min-h-screen">
      {selected === "Ventas" && <Ventas onVentaFinalizada={onVentaFinalizada} />}
      {selected === "Clientes" && <Clientes />}
      {selected === "Proveedor" && <Proveedores />}
      {selected === "Productos" && <Productos />}
      {selected === "Empleados" && <Empleados/>}
      {selected === "Estadisticas" && <Estadisticas/>}
      {selected === "Empresa" && <Negocio/>}
      {selected === "Finanzas" && <Finanzas/>}
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState("Ventas");
  const [reloadStockKey, setReloadStockKey] = useState(0);

  // Esta función se pasa a Ventas y se llama después de finalizar una venta
  const handleVentaFinalizada = () => setReloadStockKey(k => k + 1);

  return (
    <div className="flex min-h-screen">
      <Sidebar selected={selected} setSelected={setSelected} />
      <div className="flex-1 relative">
        <NotificacionesStock umbral={5} reloadKey={reloadStockKey} />
        <MainContent selected={selected} onVentaFinalizada={handleVentaFinalizada} />
      </div>
    </div>
  );
}