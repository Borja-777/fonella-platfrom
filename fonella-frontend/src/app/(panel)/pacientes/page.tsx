
'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Users,
  LoaderCircle,
  AlertCircle,
  UserRound,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { apiService, Paciente } from '@/services/api';
import FormularioPaciente from '@/components/pacientes/FormularioPaciente';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');
  const [modalNuevoPaciente, setModalNuevoPaciente] = useState(false);

  const cargarPacientes = async (termino?: string) => {
    try {
      setError('');

      if (termino) {
        setBuscando(true);
      } else {
        setCargando(true);
      }

      const respuesta = await apiService.buscarPacientes(termino || undefined);
      setPacientes(respuesta);
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
      setError(
        'No fue posible cargar el directorio. Verifica tu conexión e inténtalo nuevamente.'
      );
    } finally {
      setCargando(false);
      setBuscando(false);
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  const buscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const termino = busqueda.trim();

    if (termino.length > 0 && termino.length < 3) {
      setError('Escribe al menos 3 caracteres para realizar la búsqueda.');
      return;
    }

    cargarPacientes(termino);
  };

  const nombreCompleto = (paciente: Paciente) =>
    `${paciente.nombres} ${paciente.apellidos}`;

  const obtenerRemision = (tipo: Paciente['tipoRemision']) => {
    switch (tipo) {
      case 'REMISION_EXTERNA':
        return 'Remisión médica';
      case 'ESCOLAR':
        return 'Remisión escolar';
      default:
        return 'Particular';
    }
  };



  return (
    <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Encabezado */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#0AA896]">
              <Users size={18} />
              Gestión clínica
            </div>

            <h1 className="text-2xl font-bold text-[#136A7B] md:text-3xl">
              Directorio de Pacientes
            </h1>

            <p className="mt-2 text-sm text-gray-500 md:text-base">
              Consulta y administra la información de los pacientes registrados.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setModalNuevoPaciente(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#136A7B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0E5664]"
            >
              <Plus size={19} />
              Nuevo paciente
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-[#DCEAE8] bg-white px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F5F1] text-[#0AA896]">
                <Users size={21} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pacientes encontrados</p>
                <p className="text-xl font-bold text-[#136A7B]">
                  {pacientes.length}
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Buscador */}
        <div className="rounded-2xl border border-[#EAE5DC] bg-white p-4 shadow-sm md:p-6">
          <form
            onSubmit={buscar}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, apellido o documento..."
                className="w-full rounded-xl border border-gray-200 bg-[#FAF6F0]/50 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#0AA896] focus:ring-2 focus:ring-[#0AA896]/20"
              />
            </div>

            <button
              type="submit"
              disabled={buscando || cargando}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#136A7B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0E5664] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {buscando ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              Buscar
            </button>

            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                cargarPacientes();
              }}
              disabled={cargando || buscando}
              title="Actualizar directorio"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={17} />
              Actualizar
            </button>
          </form>

          <p className="mt-3 text-xs text-gray-400">
            Ingresa al menos 3 caracteres para buscar un paciente.
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-[#EAE5DC] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-[#136A7B]">
                Pacientes registrados
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Información general del directorio
              </p>
            </div>
          </div>

          {cargando ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
              <LoaderCircle size={32} className="animate-spin text-[#0AA896]" />
              <p className="text-sm">Cargando pacientes...</p>
            </div>
          ) : pacientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E6F5F1] text-[#0AA896]">
                <UserRound size={30} />
              </div>
              <h3 className="font-semibold text-gray-700">
                No se encontraron pacientes
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-400">
                {busqueda
                  ? 'No hay resultados para esta búsqueda. Intenta con otro nombre o documento.'
                  : 'Cuando se registren pacientes, aparecerán aquí.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-[#FAF6F0] text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Paciente</th>
                    <th className="px-5 py-4 font-semibold">Documento</th>
                    <th className="px-5 py-4 font-semibold">Edad</th>
                    <th className="px-5 py-4 font-semibold">Contacto</th>
                    <th className="px-5 py-4 font-semibold">Acudiente</th>
                    <th className="px-5 py-4 font-semibold">Remisión</th>
                    <th className="px-5 py-4 font-semibold">Estado</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {pacientes.map((paciente) => {
                    const acudientePrincipal =
                      paciente.acudientes?.find((a) => a.esPrincipal) ||
                      paciente.acudientes?.[0];

                    return (
                      <tr
                        key={paciente.id}
                        className="transition hover:bg-[#FAF6F0]/60"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6F5F1] text-sm font-bold text-[#136A7B]">
                              {paciente.nombres.charAt(0)}
                              {paciente.apellidos.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-700">
                              {nombreCompleto(paciente)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          <span className="font-medium">{paciente.tipoDocumento}</span>
                          <p className="text-xs text-gray-400">
                            {paciente.numeroDocumento}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {paciente.edad !== undefined
                            ? `${paciente.edad} años`
                            : '—'}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {paciente.telefonoContacto || '—'}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {acudientePrincipal ? (
                            <div>
                              <p className="font-medium">
                                {acudientePrincipal.acudiente.nombres}{' '}
                                {acudientePrincipal.acudiente.apellidos}
                              </p>
                              <p className="text-xs text-gray-400">
                                {acudientePrincipal.acudiente.telefonoPrincipal}
                              </p>
                            </div>
                          ) : (
                            'No registra'
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {obtenerRemision(paciente.tipoRemision)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            {paciente.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>


        <p className="text-xs text-gray-400">
          El directorio muestra los resultados disponibles según los permisos de tu cuenta.
        </p>
      </div>

      {/* Modal para registrar pacientes desde el directorio */}
      <FormularioPaciente
        abierto={modalNuevoPaciente}
        onCerrar={() => setModalNuevoPaciente(false)}
        onPacienteCreado={() => {
          cargarPacientes(busqueda.trim() || undefined);
        }}
      />
    </div>
  );
}
