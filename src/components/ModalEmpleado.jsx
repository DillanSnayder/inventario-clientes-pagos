import { useEffect, useState } from "react";

// MODAL: HORARIO
export function ModalHorario({ visible, onClose, empleado, onGuardar }) {
  const [horario, setHorario] = useState([
    { dia: "Lunes", entrada: "", salida: "" },
    { dia: "Martes", entrada: "", salida: "" },
    { dia: "Miércoles", entrada: "", salida: "" },
    { dia: "Jueves", entrada: "", salida: "" },
    { dia: "Viernes", entrada: "", salida: "" },
    { dia: "Sábado", entrada: "", salida: "" },
    { dia: "Domingo", entrada: "", salida: "" },
  ]);

  useEffect(() => {
    if (empleado?.horario) setHorario(empleado.horario);
    else setHorario([
      { dia: "Lunes", entrada: "", salida: "" },
      { dia: "Martes", entrada: "", salida: "" },
      { dia: "Miércoles", entrada: "", salida: "" },
      { dia: "Jueves", entrada: "", salida: "" },
      { dia: "Viernes", entrada: "", salida: "" },
      { dia: "Sábado", entrada: "", salida: "" },
      { dia: "Domingo", entrada: "", salida: "" },
    ]);
  }, [empleado, visible]);

  if (!visible || !empleado) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-blue-700">Horario de {empleado.nombre}</h3>
        <table className="mb-4 w-full text-xs">
          <tbody>
            {horario.map((h, idx) => (
              <tr key={h.dia}>
                <td className="pr-2">{h.dia}</td>
                <td>
                  <input
                    className="input"
                    type="time"
                    value={h.entrada}
                    onChange={e => {
                      const n = [...horario];
                      n[idx].entrada = e.target.value;
                      setHorario(n);
                    }}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    type="time"
                    value={h.salida}
                    onChange={e => {
                      const n = [...horario];
                      n[idx].salida = e.target.value;
                      setHorario(n);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={() => { onGuardar(horario); onClose(); }}>
            Guardar
          </button>
          <button className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// MODAL: AUSENCIA
export function ModalAusencia({ visible, onClose, empleado, onRegistrar }) {
  const [fecha, setFecha] = useState("");
  const [justificacion, setJustificacion] = useState("");
  useEffect(() => { setFecha(""); setJustificacion(""); }, [visible]);
  if (!visible || !empleado) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-red-700">Registrar Ausencia</h3>
        <div className="mb-3">
          <label className="block text-xs mb-1">Fecha:</label>
          <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
        <div className="mb-3">
          <textarea className="input" rows={2} value={justificacion}
            placeholder="Justificación (obligatoria)" onChange={e => setJustificacion(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={!fecha || !justificacion}
            onClick={() => { onRegistrar({ fecha, justificacion }); onClose(); }}>
            Registrar
          </button>
          <button className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// MODAL: VACACIONES Y PERMISO
export function ModalVacacionPermiso({ visible, onClose, empleado, onRegistrar, tipo }) {
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [motivo, setMotivo] = useState("");
  useEffect(() => { setInicio(""); setFin(""); setMotivo(""); }, [visible]);
  if (!visible || !empleado) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-orange-700">
          Registrar {tipo === "vacacion" ? "Vacaciones" : "Permiso"}
        </h3>
        <div className="mb-3">
          <label className="block text-xs mb-1">Desde:</label>
          <input className="input" type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block text-xs mb-1">Hasta:</label>
          <input className="input" type="date" value={fin} onChange={e => setFin(e.target.value)} />
        </div>
        <div className="mb-3">
          <textarea className="input" rows={2} value={motivo}
            placeholder="Motivo" onChange={e => setMotivo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={!inicio || !fin || !motivo}
            onClick={() => { onRegistrar({ inicio, fin, motivo, tipo }); onClose(); }}>
            Registrar
          </button>
          <button className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// MODAL: DOCUMENTOS
export function ModalDocumentos({ visible, onClose, empleado, onSubir }) {
  const [archivo, setArchivo] = useState(null);
  const [nombre, setNombre] = useState("");
  useEffect(() => { setArchivo(null); setNombre(""); }, [visible]);
  if (!visible || !empleado) return null;
  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
        <h3 className="text-xl font-bold mb-4 text-blue-800">Adjuntar Documento</h3>
        <div className="mb-3">
          <input className="input" placeholder="Nombre documento" value={nombre}
            onChange={e => setNombre(e.target.value)} />
        </div>
        <div className="mb-3">
          <input type="file" onChange={e => setArchivo(e.target.files[0])} />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={!archivo || !nombre}
            onClick={() => { onSubir(archivo, nombre); onClose(); }}>
            Subir
          </button>
          <button className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}