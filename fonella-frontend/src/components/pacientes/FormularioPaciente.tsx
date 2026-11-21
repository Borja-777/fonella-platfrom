
'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, Search, UserPlus, X } from 'lucide-react';
import {
  apiService,
  CrearPacienteData,
  Paciente,
  TipoDocumento,
  TipoRemision,
} from '@/services/api';
import { calcularEdadDesdeFecha, obtenerHoyColombia } from '@/app/(panel)/agenda/components/agendaUtils';
import {
  DOCUMENTOS_MENOR_COLOMBIA,
  PARENTESCOS_ACUDIENTE,
  REGLAS_DOCUMENTO_COLOMBIA,
  limpiarEntradaDocumento,
  limpiarEntradaTelefono,
  validarDocumentoColombia,
  validarTelefonoColombia,
} from '@/utils/validaciones-colombia';

interface FormularioPacienteProps {
  abierto: boolean;
  onCerrar: () => void;
  onPacienteCreado: (paciente: Paciente) => void;
}

const formularioInicial = {
  tipoDoc: 'CC' as TipoDocumento,
  numDoc: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  genero: '',
  telefonoContacto: '',
  email: '',
  ciudad: '',
  tipoRemision: 'PARTICULAR' as TipoRemision,
  institucionRemitente: '',
  profesionalRemitente: '',
  acudTipoDoc: 'CC' as TipoDocumento,
  acudNumDoc: '',
  acudNombres: '',
  acudApellidos: '',
  acudParentesco: 'Madre',
  acudParentescoOtro: '',
  acudTelefono: '',
  acudEmail: '',
};

type DatosFormulario = typeof formularioInicial;

export default function FormularioPaciente({
  abierto,
  onCerrar,
  onPacienteCreado,
}: FormularioPacienteProps) {
  const [datos, setDatos] = useState<DatosFormulario>(formularioInicial);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [buscandoAcudiente, setBuscandoAcudiente] = useState(false);
  const [mensajeAcudiente, setMensajeAcudiente] = useState('');

  const hoyColombia = obtenerHoyColombia();
  const edad = calcularEdadDesdeFecha(datos.fechaNacimiento);
  const requiereAcudiente = edad !== null && edad < 18;

  useEffect(() => {
    if (abierto) {
      setDatos(formularioInicial);
      setError('');
      setMensajeAcudiente('');
    }
  }, [abierto]);

  useEffect(() => {
    if (
      requiereAcudiente &&
      !DOCUMENTOS_MENOR_COLOMBIA.includes(datos.tipoDoc)
    ) {
      setDatos((prev) => ({
        ...prev,
        tipoDoc: 'TI',
        numDoc: limpiarEntradaDocumento(prev.numDoc, 'TI'),
      }));
    }
  }, [requiereAcudiente, datos.tipoDoc]);

  const actualizar = <K extends keyof DatosFormulario>(
    campo: K,
    valor: DatosFormulario[K],
  ) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const buscarAcudiente = async () => {
    if (!datos.acudNumDoc.trim()) {
      setError('Escribe el documento del acudiente para buscarlo.');
      return;
    }

    setBuscandoAcudiente(true);
    setMensajeAcudiente('');
    setError('');

    try {
      const acudiente = await apiService.buscarAcudientePorDocumento(
        datos.acudNumDoc,
      );

      setDatos((prev) => ({
        ...prev,
        acudTipoDoc: acudiente.tipoDocumento,
        acudNombres: acudiente.nombres,
        acudApellidos: acudiente.apellidos,
        acudTelefono: acudiente.telefonoPrincipal,
        acudEmail: acudiente.email || '',
      }));

      setMensajeAcudiente('Acudiente existente cargado automáticamente.');
    } catch {
      setMensajeAcudiente(
        'No existe aún; puedes registrarlo como acudiente nuevo.',
      );
    } finally {
      setBuscandoAcudiente(false);
    }
  };

  const guardarPaciente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!datos.fechaNacimiento || datos.fechaNacimiento > hoyColombia) {
      setError('La fecha de nacimiento no puede ser mayor a la fecha actual.');
      return;
    }

    if (
      requiereAcudiente &&
      !DOCUMENTOS_MENOR_COLOMBIA.includes(datos.tipoDoc)
    ) {
      setError('El documento de un menor debe ser RC, TI o PA.');
      return;
    }

    const errorDocumento = validarDocumentoColombia(
      datos.numDoc,
      datos.tipoDoc,
      'El documento del paciente',
    );

    if (errorDocumento) {
      setError(errorDocumento);
      return;
    }

    if (!datos.nombres.trim() || !datos.apellidos.trim()) {
      setError('Los nombres y apellidos del paciente son obligatorios.');
      return;
    }

    if (!datos.genero || !datos.ciudad.trim()) {
      setError('El género y la ciudad del paciente son obligatorios.');
      return;
    }

    const errorTelefono = validarTelefonoColombia(
      datos.telefonoContacto,
      'El teléfono de contacto',
    );

    if (errorTelefono) {
      setError(errorTelefono);
      return;
    }

    const parentesco =
      datos.acudParentesco === 'Otro'
        ? datos.acudParentescoOtro.trim()
        : datos.acudParentesco;

    if (requiereAcudiente) {
      if (
        !datos.acudNumDoc.trim() ||
        !datos.acudNombres.trim() ||
        !datos.acudApellidos.trim() ||
        !datos.acudTelefono.trim() ||
        !parentesco
      ) {
        setError('El paciente menor de edad debe tener los datos completos de su acudiente (RN-06).');
        return;
      }

      const errorDocAcudiente = validarDocumentoColombia(
        datos.acudNumDoc,
        datos.acudTipoDoc,
        'El documento del acudiente',
      );

      if (errorDocAcudiente) {
        setError(errorDocAcudiente);
        return;
      }

      const errorTelAcudiente = validarTelefonoColombia(
        datos.acudTelefono,
        'El teléfono principal del acudiente',
      );

      if (errorTelAcudiente) {
        setError(errorTelAcudiente);
        return;
      }
    }

    setGuardando(true);

    try {
      if (datos.email.trim()) {
        await apiService.validarEmail(datos.email);
      }

      if (requiereAcudiente && datos.acudEmail.trim()) {
        await apiService.validarEmail(datos.acudEmail);
      }

      const payload: CrearPacienteData = {
        tipoDocumento: datos.tipoDoc,
        numeroDocumento: datos.numDoc.trim(),
        nombres: datos.nombres.trim(),
        apellidos: datos.apellidos.trim(),
        fechaNacimiento: datos.fechaNacimiento,
        genero: datos.genero.trim(),
        telefonoContacto: datos.telefonoContacto.trim(),
        email: datos.email.trim() || undefined,
        ciudad: datos.ciudad.trim(),
        tipoRemision: datos.tipoRemision,
        institucionRemitente:
          datos.tipoRemision !== 'PARTICULAR'
            ? datos.institucionRemitente.trim() || undefined
            : undefined,
        profesionalRemitente:
          datos.tipoRemision !== 'PARTICULAR'
            ? datos.profesionalRemitente.trim() || undefined
            : undefined,
        acudiente: requiereAcudiente
          ? {
              tipoDocumento: datos.acudTipoDoc,
              numeroDocumento: datos.acudNumDoc.trim(),
              nombres: datos.acudNombres.trim(),
              apellidos: datos.acudApellidos.trim(),
              parentesco: parentesco || 'Acudiente',
              telefonoPrincipal: datos.acudTelefono.trim(),
              email: datos.acudEmail.trim() || undefined,
            }
          : undefined,
      };

      const pacienteCreado = await apiService.crearPaciente(payload);

      onPacienteCreado(pacienteCreado);
      onCerrar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible registrar el paciente.',
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  const campo =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0AA896] focus:ring-2 focus:ring-[#0AA896]/15';

  const etiqueta = 'mb-1 block text-xs font-semibold text-slate-600';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#136A7B] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-2">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="font-bold">Registrar nuevo paciente</h2>
              <p className="text-xs text-white/75">
                Completa la información del paciente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 transition hover:bg-white/15"
            aria-label="Cerrar formulario"
          >
            <X size={21} />
          </button>
        </div>

        <form
          onSubmit={guardarPaciente}
          className="space-y-5 overflow-y-auto p-5"
        >
          <section className="space-y-3">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#136A7B]">
              Datos personales
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={etiqueta}>Tipo de documento *</label>
                <select
                  className={campo}
                  value={datos.tipoDoc}
                  onChange={(e) => {
                    const tipo = e.target.value as TipoDocumento;
                    setDatos((prev) => ({
                      ...prev,
                      tipoDoc: tipo,
                      numDoc: limpiarEntradaDocumento(prev.numDoc, tipo),
                    }));
                  }}
                >
                  <option value="RC">RC - Registro Civil</option>
                  <option value="TI">TI - Tarjeta de Identidad</option>
                  {!requiereAcudiente && (
                    <>
                      <option value="CC">CC - Cédula</option>
                      <option value="CE">CE - Extranjería</option>
                    </>
                  )}
                  <option value="PA">PA - Pasaporte</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={etiqueta}>Número de documento *</label>
                <input
                  required
                  className={campo}
                  value={datos.numDoc}
                  maxLength={REGLAS_DOCUMENTO_COLOMBIA[datos.tipoDoc].max}
                  placeholder="Número de documento"
                  onChange={(e) =>
                    actualizar(
                      'numDoc',
                      limpiarEntradaDocumento(e.target.value, datos.tipoDoc),
                    )
                  }
                />
              </div>

              <div>
                <label className={etiqueta}>Nombres *</label>
                <input
                  required
                  className={campo}
                  value={datos.nombres}
                  onChange={(e) => actualizar('nombres', e.target.value)}
                />
              </div>

              <div>
                <label className={etiqueta}>Apellidos *</label>
                <input
                  required
                  className={campo}
                  value={datos.apellidos}
                  onChange={(e) => actualizar('apellidos', e.target.value)}
                />
              </div>

              <div>
                <label className={etiqueta}>Fecha de nacimiento *</label>
                <input
                  required
                  type="date"
                  max={hoyColombia}
                  className={campo}
                  value={datos.fechaNacimiento}
                  onChange={(e) => actualizar('fechaNacimiento', e.target.value)}
                />
                {edad !== null && (
                  <p className="mt-1 text-xs text-slate-500">
                    Edad: {edad} años
                  </p>
                )}
              </div>

              <div>
                <label className={etiqueta}>Género *</label>
                <select
                  required
                  className={campo}
                  value={datos.genero}
                  onChange={(e) => actualizar('genero', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className={etiqueta}>Teléfono de contacto *</label>
                <input
                  required
                  type="tel"
                  maxLength={10}
                  className={campo}
                  placeholder="3001234567"
                  value={datos.telefonoContacto}
                  onChange={(e) =>
                    actualizar(
                      'telefonoContacto',
                      limpiarEntradaTelefono(e.target.value),
                    )
                  }
                />
              </div>

              <div>
                <label className={etiqueta}>Correo electrónico</label>
                <input
                  type="email"
                  className={campo}
                  value={datos.email}
                  onChange={(e) => actualizar('email', e.target.value)}
                />
              </div>

              <div>
                <label className={etiqueta}>Ciudad *</label>
                <input
                  required
                  maxLength={100}
                  className={campo}
                  placeholder="Ej. Palmira"
                  value={datos.ciudad}
                  onChange={(e) => actualizar('ciudad', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#136A7B]">
              Información de remisión
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={etiqueta}>Tipo de remisión</label>
                <select
                  className={campo}
                  value={datos.tipoRemision}
                  onChange={(e) =>
                    actualizar('tipoRemision', e.target.value as TipoRemision)
                  }
                >
                  <option value="PARTICULAR">Particular</option>
                  <option value="REMISION_EXTERNA">Remisión médica</option>
                  <option value="ESCOLAR">Remisión escolar</option>
                </select>
              </div>

              {datos.tipoRemision !== 'PARTICULAR' && (
                <>
                  <div>
                    <label className={etiqueta}>Institución remitente</label>
                    <input
                      className={campo}
                      value={datos.institucionRemitente}
                      onChange={(e) =>
                        actualizar('institucionRemitente', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className={etiqueta}>Profesional que remite</label>
                    <input
                      className={campo}
                      value={datos.profesionalRemitente}
                      onChange={(e) =>
                        actualizar('profesionalRemitente', e.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {requiereAcudiente && (
            <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Datos del acudiente *
                </h3>
                <p className="mt-1 text-xs text-amber-800">
                  Es obligatorio registrar un acudiente para pacientes menores de 18 años (RN-06).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={etiqueta}>Tipo de documento</label>
                  <select
                    className={campo}
                    value={datos.acudTipoDoc}
                    onChange={(e) => {
                      const tipo = e.target.value as TipoDocumento;
                      setDatos((prev) => ({
                        ...prev,
                        acudTipoDoc: tipo,
                        acudNumDoc: limpiarEntradaDocumento(prev.acudNumDoc, tipo),
                      }));
                    }}
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PA">PA</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={etiqueta}>Documento del acudiente *</label>
                  <div className="flex gap-2">
                    <input
                      required
                      className={campo}
                      value={datos.acudNumDoc}
                      maxLength={REGLAS_DOCUMENTO_COLOMBIA[datos.acudTipoDoc].max}
                      onChange={(e) => {
                        actualizar(
                          'acudNumDoc',
                          limpiarEntradaDocumento(e.target.value, datos.acudTipoDoc),
                        );
                        setMensajeAcudiente('');
                      }}
                    />
                    <button
                      type="button"
                      onClick={buscarAcudiente}
                      disabled={buscandoAcudiente}
                      className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {buscandoAcudiente ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Search size={16} />
                      )}
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              {mensajeAcudiente && (
                <p className="text-xs font-medium text-amber-900">
                  {mensajeAcudiente}
                </p>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={etiqueta}>Nombres *</label>
                  <input
                    required
                    className={campo}
                    value={datos.acudNombres}
                    onChange={(e) => actualizar('acudNombres', e.target.value)}
                  />
                </div>
                <div>
                  <label className={etiqueta}>Apellidos *</label>
                  <input
                    required
                    className={campo}
                    value={datos.acudApellidos}
                    onChange={(e) => actualizar('acudApellidos', e.target.value)}
                  />
                </div>
                <div>
                  <label className={etiqueta}>Parentesco *</label>
                  <select
                    className={campo}
                    value={datos.acudParentesco}
                    onChange={(e) => actualizar('acudParentesco', e.target.value)}
                  >
                    {PARENTESCOS_ACUDIENTE.map((parentesco) => (
                      <option key={parentesco} value={parentesco}>
                        {parentesco}
                      </option>
                    ))}
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className={etiqueta}>Teléfono principal *</label>
                  <input
                    required
                    type="tel"
                    maxLength={10}
                    className={campo}
                    value={datos.acudTelefono}
                    onChange={(e) =>
                      actualizar(
                        'acudTelefono',
                        limpiarEntradaTelefono(e.target.value),
                      )
                    }
                  />
                </div>

                {datos.acudParentesco === 'Otro' && (
                  <div>
                    <label className={etiqueta}>Especificar parentesco *</label>
                    <input
                      required
                      className={campo}
                      value={datos.acudParentescoOtro}
                      onChange={(e) =>
                        actualizar('acudParentescoOtro', e.target.value)
                      }
                    />
                  </div>
                )}

                <div>
                  <label className={etiqueta}>Correo del acudiente</label>
                  <input
                    type="email"
                    className={campo}
                    value={datos.acudEmail}
                    onChange={(e) => actualizar('acudEmail', e.target.value)}
                  />
                </div>
              </div>
            </section>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#136A7B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0E5664] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Guardar paciente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
