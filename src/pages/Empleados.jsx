import { useEffect, useState } from "react";
import { db, storage } from "../services/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function formatCurrency(num) {
  return Number(num).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
}

// MODALES PARA CADA FUNCIONALIDAD EXTRA
function ModalHorario({ visible, onClose, empleado, onGuardar }) {
  // Horario: [{dia: "Lunes", entrada: "08:00", salida: "17:00"}, ...]
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

function ModalAusencia({ visible, onClose, empleado, onRegistrar }) {
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

function ModalVacacionPermiso({ visible, onClose, empleado, onRegistrar, tipo }) {
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

function ModalDocumentos({ visible, onClose, empleado, onSubir }) {
  const [archivo, setArchivo] = useState(null);
  const [nombre, setNombre] = useState("");
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

// PRINCIPAL
export default function Empleados() {
const [empleados, setEmpleados] = useState([]);
const [modal, setModal] = useState(false);
  const [empleadoHorario, setEmpleadoHorario] = useState(null);
  const [modalHorario, setModalHorario] = useState(false);
  const [modalAusencia, setModalAusencia] = useState(false);
  const [empleadoAusencia, setEmpleadoAusencia] = useState(null);
  const [modalVacacion, setModalVacacion] = useState(false);
  const [modalPermiso, setModalPermiso] = useState(false);
  const [empleadoVacacion, setEmpleadoVacacion] = useState(null);
  const [empleadoPermiso, setEmpleadoPermiso] = useState(null);
  const [modalDocumentos, setModalDocumentos] = useState(false);
  const [empleadoDocumentos, setEmpleadoDocumentos] = useState(null);

  // ... cargar empleados y sus relaciones, estados de ausencias, vacaciones, permisos, docs ...

  // guardar/actualizar horario
  const guardarHorario = async (horario) => {
    const ref = doc(db, "empleados", empleadoHorario.id);
    await updateDoc(ref, { horario });
    setEmpleadoHorario(null);
    setModalHorario(false);
    // refrescar empleados...
  };

  // registrar ausencia
  const registrarAusencia = async ({ fecha, justificacion }) => {
    await addDoc(collection(db, "ausencias"), {
      empleadoId: empleadoAusencia.id,
      nombre: empleadoAusencia.nombre,
      fecha,
      justificacion,
      creado: Timestamp.now(),
    });
    setModalAusencia(false);
    setEmpleadoAusencia(null);
    // refrescar ausencias...
  };

  // registrar vacacion/permiso
  const registrarVacPerm = async ({ inicio, fin, motivo, tipo }) => {
    await addDoc(collection(db, tipo === "vacacion" ? "vacaciones" : "permisos"), {
      empleadoId: tipo === "vacacion" ? empleadoVacacion.id : empleadoPermiso.id,
      nombre: tipo === "vacacion" ? empleadoVacacion.nombre : empleadoPermiso.nombre,
      inicio,
      fin,
      motivo,
      creado: Timestamp.now(),
    });
    if (tipo === "vacacion") {
      setEmpleadoVacacion(null);
      setModalVacacion(false);
    } else {
      setEmpleadoPermiso(null);
      setModalPermiso(false);
    }
    // refrescar...
  };

  // subir documento
  const subirDocumento = async (archivo, nombreDoc) => {
    const storageRef = ref(storage, `empleados/${empleadoDocumentos.id}/${archivo.name}`);
    await uploadBytes(storageRef, archivo);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, "documentos"), {
      empleadoId: empleadoDocumentos.id,
      nombre: empleadoDocumentos.nombre,
      nombreDoc,
      url,
      creado: Timestamp.now(),
    });
    setModalDocumentos(false);
    setEmpleadoDocumentos(null);
    // refrescar documentos...
  };

  // ... resto del CRUD de empleados, nómina, etc ...

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-blue-900">Empleados</h2>
        <button className="btn-primary" /* ...nuevo empleado... */>
          + Nuevo empleado
        </button>
      </div>
      {/* TABLA DE EMPLEADOS */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-900">
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Cédula</th>
              <th className="px-4 py-2">Cargo</th>
              <th className="px-4 py-2">Salario</th>
              <th className="px-4 py-2">Nacimiento</th> {/* NUEVO */}
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((emp) => (
              <tr key={emp.id}>
                <td className="px-4 py-2">{emp.nombre}</td>
                <td className="px-4 py-2">{emp.cedula}</td>
                <td className="px-4 py-2">{emp.cargo}</td>
                <td className="px-4 py-2">{formatCurrency(emp.salario)}</td>
                <td className="px-4 py-2 font-bold text-pink-700">
                  {emp.fechaNacimiento}
                  {/* Puedes poner un 🎂 si hoy es su cumpleaños */}
                  {emp.fechaNacimiento &&
                    (() => {
                      const hoy = new Date();
                      const [anio, mes, dia] = emp.fechaNacimiento.split("-");
                      return hoy.getMonth() + 1 === Number(mes) && hoy.getDate() === Number(dia)
                        ? <span> 🎂</span>
                        : null;
                    })()}
                </td>
                <td className="px-4 py-2 flex flex-col gap-1 md:flex-row">
                  {/* ...editar, eliminar, pagar nomina... */}
                  <button className="btn-table" onClick={() => { setEmpleadoHorario(emp); setModalHorario(true); }}>Horario</button>
                  <button className="btn-table" onClick={() => { setEmpleadoAusencia(emp); setModalAusencia(true); }}>Ausencia</button>
                  <button className="btn-table" onClick={() => { setEmpleadoVacacion(emp); setModalVacacion(true); }}>Vacaciones</button>
                  <button className="btn-table" onClick={() => { setEmpleadoPermiso(emp); setModalPermiso(true); }}>Permiso</button>
                  <button className="btn-table" onClick={() => { setEmpleadoDocumentos(emp); setModalDocumentos(true); }}>Documento</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aquí puedes mostrar: */}
      {/* - Horario actual de cada empleado */}
      {/* - Historial de ausencias con justificación */}
      {/* - Lista de vacaciones y permisos */}
      {/* - Documentos adjuntos */}
      {/* - Resaltar cumpleaños del mes, etc. */}

      {/* MODALES */}
      <ModalHorario
        visible={modalHorario}
        onClose={() => setModalHorario(false)}
        empleado={empleadoHorario}
        onGuardar={guardarHorario}
      />
      <ModalAusencia
        visible={modalAusencia}
        onClose={() => setModalAusencia(false)}
        empleado={empleadoAusencia}
        onRegistrar={registrarAusencia}
      />
      <ModalVacacionPermiso
        visible={modalVacacion}
        onClose={() => setModalVacacion(false)}
        empleado={empleadoVacacion}
        onRegistrar={registrarVacPerm}
        tipo="vacacion"
      />
      <ModalVacacionPermiso
        visible={modalPermiso}
        onClose={() => setModalPermiso(false)}
        empleado={empleadoPermiso}
        onRegistrar={registrarVacPerm}
        tipo="permiso"
      />
      <ModalDocumentos
        visible={modalDocumentos}
        onClose={() => setModalDocumentos(false)}
        empleado={empleadoDocumentos}
        onSubir={subirDocumento}
      />
    </div>
  );
}