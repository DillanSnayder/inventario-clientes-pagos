import React, { useState } from "react";
import Clientes from "./pages/Clientes";
import Proveedores from "./pages/Proveedores";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";

function Sidebar({ selected, setSelected }) {
  const items = [
    { label: "Ventas", icon: "🛒" },
    { label: "Clientes", icon: "👤" },
    { label: "Proveedor", icon: "🏢" },
    { label: "Productos", icon: "📦" },
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

function MainContent({ selected }) {
  return (
    <div className="flex-1 p-10 bg-gray-50 min-h-screen">
      {selected === "Ventas" && <Ventas />}
      {selected === "Clientes" && <Clientes />}
      {selected === "Proveedor" && <Proveedores />}
      {selected === "Productos" && <Productos />}
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState("Ventas");
  return (
    <div className="flex min-h-screen">
      <Sidebar selected={selected} setSelected={setSelected} />
      <MainContent selected={selected} />
    </div>
  );
}