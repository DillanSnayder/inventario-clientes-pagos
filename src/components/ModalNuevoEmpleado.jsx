import { useState } from "react";

export function ModalNuevoEmpleado({ visible, onClose, onCrear }) {
  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    cargo: "",
    salario: "",
    fechaNacimiento: "",
    fechaIngreso: "",
  });
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || !form.cedula || !form.cargo || !form.salario || !form.fechaNacimiento || !form.fechaIngreso) {
      setError("Todos los campos son obligatorios");
      return;
    }
    setError("");
    onCrear(form);
    setForm({
      nombre: "",
      cedula: "",
      cargo: "",
      salario: "",
      fechaNacimiento: "",
      fechaIngreso: "",
    });
  }

  if (!visible) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-blue-900">Nuevo Empleado</h3>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs mb-1">Nombre</label>
            <input className="input" placeholder="Nombre" value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Cédula</label>
            <input className="input" placeholder="Cédula" value={form.cedula}
              onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Cargo</label>
            <input className="input" placeholder="Cargo" value={form.cargo}
              onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Salario</label>
            <input className="input" placeholder="Salario" type="number" value={form.salario}
              onChange={e => setForm(f => ({ ...f, salario: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Fecha de nacimiento</label>
            <input className="input" type="date" value={form.fechaNacimiento}
              onChange={e => setForm(f => ({ ...f, fechaNacimiento: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs mb-1">Fecha de ingreso</label>
            <input className="input" type="date" value={form.fechaIngreso}
              onChange={e => setForm(f => ({ ...f, fechaIngreso: e.target.value }))} />
          </div>
          {error && <div className="text-red-600 text-xs">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">Crear</button>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}