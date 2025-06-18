import './App.css';
import { useEffect, useState } from 'react';
import { db } from './services/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

function App() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const obtenerClientes = async () => {
      try {
        const clientesRef = collection(db, 'clientes');
        const snapshot = await getDocs(clientesRef);
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClientes(lista);
      } catch (error) {
        console.error('Error al obtener clientes:', error);
      }
    };

    obtenerClientes();
  }, []);

  return (
    <div className="App">
      <h1>Lista de Clientes</h1>
      <ul>
        {clientes.map(cliente => (
          <li key={cliente.id}>
            {cliente.nombre} - {cliente.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

