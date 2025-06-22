import { useState, useEffect } from "react";

export default function ModalEmpleado({ visible, onClose, onGuardar, empleadoEdit }) {
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [cargo, setCargo] = useState("");
  const [salario, setSalario] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [observacion, setObservacion] = useState("");

  useEffect(() => {
    if (empleadoEdit) {
      setNombre(empleadoEdit.nombre || "");
      setCedula(empleadoEdit.cedula || "");
      setCargo(empleadoEdit.cargo || "");
      setSalario(empleadoEdit.salario || "");
      setFechaIngreso(
        empleadoEdit.fechaIngreso
          ? empleadoEdit.fechaIngreso.split("T")[0]
          : ""
      );
      setFechaNacimiento(empleadoEdit.fechaNacimiento || "");
      setObservacion(empleadoEdit.observacion || "");
    } else {
      setNombre("");
      setCedula("");
      setCargo("");
      setSalario("");
      setFechaIngreso("");
      setFechaNacimiento("");
      setObservacion("");
    }
  }, [empleadoEdit, visible]);

  if (!visible) return null;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div
        className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto"
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3 className="text-xl font-bold mb-4 text-blue-700">
          {empleadoEdit ? "Editar Empleado" : "Agregar Empleado"}
        </h3>
        <div className="mb-3">
          <input
            className="input"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-3">
          <input
            className="input"
            placeholder="Cédula"
            value={cedula}
            type="number"
            onChange={(e) => setCedula(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <input
            className="input"
            placeholder="Cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <input
            className="input"
            placeholder="Salario"
            value={salario}
            type="number"
            onChange={(e) => setSalario(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block text-gray-700 text-xs mb-1">Fecha de Ingreso:</label>
          <input
            className="input"
            type="date"
            value={fechaIngreso}
            onChange={(e) => setFechaIngreso(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block text-gray-700 text-xs mb-1">Fecha de Nacimiento:</label>
          <input
            className="input"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <textarea
            className="input"
            placeholder="Observaciones (opcional)"
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1"
            disabled={
              !nombre ||
              !cedula ||
              !cargo ||
              !salario ||
              !fechaIngreso ||
              !fechaNacimiento
            }
            onClick={() => {
              onGuardar({
                nombre,
                cedula,
                cargo,
                salario: Number(salario),
                fechaIngreso,
                fechaNacimiento,
                observacion,
              });
              onClose();
            }}
          >
            Guardar
          </button>
          <button className="btn-secondary flex-1" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}