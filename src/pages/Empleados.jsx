import { useEffect, useState } from "react";
import { db, storage } from "../services/firebaseConfig";
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, orderBy, query, Timestamp, where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  ModalHorario,
  ModalAusencia,
  ModalVacacionPermiso,
  ModalDocumentos,
} from "../components/ModalEmpleado";
import { ModalNuevoEmpleado } from "../components/ModalNuevoEmpleado";

function formatCurrency(num) {
  return Number(num).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
}

function TablaRegistros({ tipo, registros, onEliminar, seleccionados, setSeleccionados }) {
  const allSelected = registros.length > 0 && Object.keys(seleccionados).length === registros.length;
  return (
    <div className="mb-4">
      <h4 className="font-bold mb-1 capitalize">{tipo} <span className="text-xs text-gray-500">({registros.length})</span></h4>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allSelected} onChange={() => {
                if (allSelected) setSeleccionados({});
                else {
                  const obj = {};
                  registros.forEach(r => { obj[r.id] = true; });
                  setSeleccionados(obj);
                }
              }} /></th>
              {tipo === "ausencias" && <>
                <th>Fecha</th><th>Justificación</th>
              </>}
              {tipo === "vacaciones" && <>
                <th>Inicio</th><th>Fin</th><th>Motivo</th>
              </>}
              {tipo === "permisos" && <>
                <th>Inicio</th><th>Fin</th><th>Motivo</th>
              </>}
              {tipo === "documentos" && <>
                <th>Nombre</th><th>Ver</th>
              </>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {registros.map(r => (
              <tr key={r.id}>
                <td>
                  <input type="checkbox"
                    checked={!!seleccionados[r.id]}
                    onChange={e => setSeleccionados(sel => ({
                      ...sel,
                      [r.id]: e.target.checked
                    }))}
                  />
                </td>
                {tipo === "ausencias" && <>
                  <td>{r.fecha}</td>
                  <td>{r.justificacion}</td>
                </>}
                {tipo === "vacaciones" && <>
                  <td>{r.inicio}</td>
                  <td>{r.fin}</td>
                  <td>{r.motivo}</td>
                </>}
                {tipo === "permisos" && <>
                  <td>{r.inicio}</td>
                  <td>{r.fin}</td>
                  <td>{r.motivo}</td>
                </>}
                {tipo === "documentos" && <>
                  <td>{r.nombreDoc}</td>
                  <td>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Ver</a>
                  </td>
                </>}
                <td>
                  <button className="btn-danger" onClick={() => onEliminar([r.id])}>Eliminar</button>
                </td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td colSpan={tipo === "documentos" ? 4 : 5} className="text-center text-gray-400 py-2">Sin registros</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2">
        <button
          className="btn-danger"
          disabled={Object.values(seleccionados).filter(Boolean).length === 0}
          onClick={() => onEliminar(Object.keys(seleccionados))}
        >Eliminar seleccionados</button>
      </div>
    </div>
  );
}

function LiquidacionSimulador({ empleado }) {
  if (!empleado?.fechaIngreso || !empleado?.salario) return null;
  const hoy = new Date();
  const ingreso = new Date(empleado.fechaIngreso);
  const ms = hoy - ingreso;
  const diasTrabajados = Math.floor(ms / (1000 * 60 * 60 * 24));
  const salario = Number(empleado.salario);
  const cesantias = (salario * diasTrabajados) / 360;
  const vacaciones = (salario * diasTrabajados) / 720;
  return (
    <div className="bg-yellow-50 rounded-xl p-4 mt-4">
      <h4 className="font-bold mb-2 text-yellow-800">Simulación de liquidación</h4>
      <p><b>Días laborados:</b> {diasTrabajados}</p>
      <p><b>Cesantías (aprox):</b> {formatCurrency(cesantias)}</p>
      <p><b>Vacaciones (aprox):</b> {formatCurrency(vacaciones)}</p>
    </div>
  );
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [modalNuevo, setModalNuevo] = useState(false);
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

  const [ausencias, setAusencias] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [selAus, setSelAus] = useState({});
  const [selVac, setSelVac] = useState({});
  const [selPer, setSelPer] = useState({});
  const [selDoc, setSelDoc] = useState({});
  const [empleadoSel, setEmpleadoSel] = useState(null);

  useEffect(() => {
    async function cargar() {
      const q = query(collection(db, "empleados"), orderBy("nombre"));
      const snap = await getDocs(q);
      setEmpleados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    cargar();
  }, []);

  async function recargarEmpleados() {
    const q = query(collection(db, "empleados"), orderBy("nombre"));
    const snap = await getDocs(q);
    setEmpleados(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function crearEmpleado(form) {
    await addDoc(collection(db, "empleados"), {
      ...form,
      salario: Number(form.salario),
      creado: Timestamp.now(),
    });
    setModalNuevo(false);
    await recargarEmpleados();
  }

  useEffect(() => {
    async function cargarRegistros() {
      if (!empleadoSel) return;
      const qA = query(collection(db, "ausencias"), where("empleadoId", "==", empleadoSel.id));
      const qV = query(collection(db, "vacaciones"), where("empleadoId", "==", empleadoSel.id));
      const qP = query(collection(db, "permisos"), where("empleadoId", "==", empleadoSel.id));
      const qD = query(collection(db, "documentos"), where("empleadoId", "==", empleadoSel.id));
      setSelAus({}); setSelVac({}); setSelPer({}); setSelDoc({});
      const [sA, sV, sP, sD] = await Promise.all([
        getDocs(qA), getDocs(qV), getDocs(qP), getDocs(qD)
      ]);
      setAusencias(sA.docs.map(d => ({ id: d.id, ...d.data() })));
      setVacaciones(sV.docs.map(d => ({ id: d.id, ...d.data() })));
      setPermisos(sP.docs.map(d => ({ id: d.id, ...d.data() })));
      setDocumentos(sD.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    cargarRegistros();
  }, [empleadoSel, modalAusencia, modalVacacion, modalPermiso, modalDocumentos]);

  async function eliminarRegistros(ids, coleccion, setSeleccionados, recargar) {
    for (const id of ids) {
      await deleteDoc(doc(db, coleccion, id));
    }
    setSeleccionados({});
    recargar();
  }

  const guardarHorario = async (horario) => {
    const ref = doc(db, "empleados", empleadoHorario.id);
    await updateDoc(ref, { horario });
    setEmpleadoHorario(null);
    setModalHorario(false);
    setEmpleados(e => e.map(emp =>
      emp.id === empleadoHorario.id ? { ...emp, horario } : emp
    ));
  };

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
  };

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
  };

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
  };

  function HorarioResumen({ horario }) {
    if (!horario?.length) return <span className="text-xs text-gray-400">Sin horario</span>;
    return (
      <table className="text-xs border">
        <tbody>
          {horario.map((h, i) => (
            <tr key={h.dia}>
              <td>{h.dia.slice(0,3)}:</td>
              <td>{h.entrada || "--:--"}</td>
              <td>-</td>
              <td>{h.salida || "--:--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-blue-900">Empleados</h2>
        <button className="btn-primary" onClick={() => setModalNuevo(true)}>
          + Nuevo empleado
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-900">
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Cédula</th>
              <th className="px-4 py-2">Cargo</th>
              <th className="px-4 py-2">Salario</th>
              <th className="px-4 py-2">Nacimiento</th>
              <th className="px-4 py-2">Ingreso</th>
              <th className="px-4 py-2">Horario</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((emp) => (
              <tr key={emp.id} className={empleadoSel?.id === emp.id ? "bg-blue-50" : ""}>
                <td className="px-4 py-2 cursor-pointer"
                  onClick={() => setEmpleadoSel(empleadoSel?.id === emp.id ? null : emp)}>
                  {emp.nombre}
                </td>
                <td className="px-4 py-2">{emp.cedula}</td>
                <td className="px-4 py-2">{emp.cargo}</td>
                <td className="px-4 py-2">{formatCurrency(emp.salario)}</td>
                <td className="px-4 py-2 font-bold text-pink-700">
                  {emp.fechaNacimiento}
                  {emp.fechaNacimiento &&
                    (() => {
                      const hoy = new Date();
                      const [anio, mes, dia] = emp.fechaNacimiento.split("-");
                      return hoy.getMonth() + 1 === Number(mes) && hoy.getDate() === Number(dia)
                        ? <span> 🎂</span>
                        : null;
                    })()}
                </td>
                <td className="px-4 py-2">{emp.fechaIngreso}</td>
                <td className="px-4 py-2">
                  <HorarioResumen horario={emp.horario} />
                  <button className="btn-table mt-1" onClick={() => { setEmpleadoHorario(emp); setModalHorario(true); }}>Editar</button>
                </td>
                <td className="px-4 py-2 flex flex-col gap-1 md:flex-row">
                  <button className="btn-table" onClick={() => { setEmpleadoAusencia(emp); setModalAusencia(true); }}>Ausencia</button>
                  <button className="btn-table" onClick={() => { setEmpleadoVacacion(emp); setModalVacacion(true); }}>Vacaciones</button>
                  <button className="btn-table" onClick={() => { setEmpleadoPermiso(emp); setModalPermiso(true); }}>Permiso</button>
                  <button className="btn-table" onClick={() => { setEmpleadoDocumentos(emp); setModalDocumentos(true); }}>Documento</button>
                  <button className="btn-table" onClick={() => setEmpleadoSel(empleadoSel?.id === emp.id ? null : emp)}>
                    {empleadoSel?.id === emp.id ? "Ocultar detalles" : "Ver detalles"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {empleadoSel && (
        <div className="mb-8 bg-blue-50 rounded-xl p-4">
          <h3 className="font-bold mb-2 text-blue-900">Registros de {empleadoSel.nombre}</h3>
          <p>
            <span className="font-bold">Ingreso:</span>{" "}
            {empleadoSel.fechaIngreso}
            {" | "}
            <span className="font-bold">Antigüedad:</span>{" "}
            {empleadoSel.fechaIngreso ? (
              (() => {
                const hoy = new Date();
                const ingreso = new Date(empleadoSel.fechaIngreso);
                const ms = hoy - ingreso;
                const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
                return `${dias} días`;
              })()
            ) : "N/A"}
          </p>
          <LiquidacionSimulador empleado={empleadoSel} />
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <TablaRegistros
              tipo="ausencias"
              registros={ausencias}
              onEliminar={ids => eliminarRegistros(ids, "ausencias", setSelAus, () => setAusencias(ausencias => ausencias.filter(a => !ids.includes(a.id))))}
              seleccionados={selAus}
              setSeleccionados={setSelAus}
            />
            <TablaRegistros
              tipo="vacaciones"
              registros={vacaciones}
              onEliminar={ids => eliminarRegistros(ids, "vacaciones", setSelVac, () => setVacaciones(vacaciones => vacaciones.filter(v => !ids.includes(v.id))))}
              seleccionados={selVac}
              setSeleccionados={setSelVac}
            />
            <TablaRegistros
              tipo="permisos"
              registros={permisos}
              onEliminar={ids => eliminarRegistros(ids, "permisos", setSelPer, () => setPermisos(permisos => permisos.filter(p => !ids.includes(p.id))))}
              seleccionados={selPer}
              setSeleccionados={setSelPer}
            />
            <TablaRegistros
              tipo="documentos"
              registros={documentos}
              onEliminar={ids => eliminarRegistros(ids, "documentos", setSelDoc, () => setDocumentos(documentos => documentos.filter(d => !ids.includes(d.id))))}
              seleccionados={selDoc}
              setSeleccionados={setSelDoc}
            />
          </div>
        </div>
      )}
      <ModalNuevoEmpleado
        visible={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onCrear={crearEmpleado}
      />
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