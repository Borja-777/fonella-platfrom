'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SolicitarCitaPage() {
  const [tipoPaciente, setTipoPaciente] = useState<'MENOR' | 'ADULTO'>('MENOR');
  const [acudiente, setAcudiente] = useState('');
  const [parentesco, setParentesco] = useState('Madre');
  const [paciente, setPaciente] = useState('');
  const [edad, setEdad] = useState('');
  const [servicio, setServicio] = useState('Evaluación e intervención del lenguaje y del habla');
  const [jornada, setJornada] = useState('Mañana (8:00 a.m. - 12:00 m.)');
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);

  const mensajePreview = tipoPaciente === 'MENOR'
    ? `Hola Consultorio FONELLA (Dra. Bárbara Ccucho) 👋.
Deseo agendar una cita fonoaudiológica:

- *Tipo:* Paciente Pediátrico
- *Acudiente:* 
${acudiente.trim() || '___'} (${parentesco})
- *Paciente:* 
${paciente.trim() || '___'} (${edad.trim() || '___'})
- *Servicio:* 
${servicio} (45 min)
- *Jornada preferida:* 
${jornada}
- *Motivo:* 
${motivo.trim() || 'Sin especificar.'}

Quedo atento(a) a la disponibilidad en agenda. ¡Gracias!`
    : `Hola Consultorio FONELLA (Dra. Bárbara Ccucho) 👋.
Deseo agendar una cita fonoaudiológica:

- *Tipo:* Paciente Adulto
- *Paciente:* 
${paciente.trim() || '___'} (${edad.trim() || '___'})
- *Servicio:* 
${servicio} (45 min)
- *Jornada preferida:* 
${jornada}
- *Motivo:* 
${motivo.trim() || 'Sin especificar.'}

Quedo atento(a) a la disponibilidad en agenda. ¡Gracias!`;

  const whatsappUrl = `https://wa.me/573104686733?text=${encodeURIComponent(mensajePreview)}`;

  const handleEnviarYSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      const payload = {
        tipoPaciente: tipoPaciente, // 'MENOR' o 'ADULTO'
        acudiente: tipoPaciente === 'MENOR' ? (acudiente.trim() || null) : null,
        parentesco: tipoPaciente === 'MENOR' ? parentesco : null,
        paciente: paciente.trim(),
        edad: edad.trim(),
        servicio: servicio,
        jornada: jornada,
        motivo: motivo.trim() || null,
      };

      await fetch('http://localhost:4000/api/v1/citas/solicitud-publica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Error en la petición al backend:', error);
    } finally {
      setCargando(false);
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl border border-[#136A7B]/15 overflow-hidden">
        
        <div className="bg-[#136A7B] text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Solicitud Asistida de Cita Fonoaudiológica</h2>
            <p className="text-xs text-[#F5ECDD] mt-1">
              Completa los datos para estructurar tu mensaje clínico directo al WhatsApp del consultorio.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
          >
            ← Volver al Portal
          </Link>
        </div>

        <form onSubmit={handleEnviarYSolicitar} className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-[#136A7B] uppercase mb-2">
                1. ¿Para quién es la valoración o terapia?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoPaciente('MENOR')}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    tipoPaciente === 'MENOR'
                      ? 'border-[#0AA896] bg-[#0AA896]/10 text-[#136A7B]'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-extrabold text-sm">👶 Niño / Adolescente</div>
                  <div className="text-xs text-slate-600">Requiere datos de Acudiente</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoPaciente('ADULTO')}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    tipoPaciente === 'ADULTO'
                      ? 'border-[#0AA896] bg-[#0AA896]/10 text-[#136A7B]'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-extrabold text-sm">🧑 Paciente Adulto</div>
                  <div className="text-xs text-slate-500">Agenda a nombre propio</div>
                </button>
              </div>
            </div>

            {tipoPaciente === 'MENOR' && (
              <div className="p-4 rounded-xl bg-[#F5ECDD]/70 border border-[#DF9B78]/50 space-y-3">
                <div className="text-xs font-bold text-[#136A7B]">
                  👨‍👩‍👧 Datos del Acudiente Responsable (Regla Pediátrica)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre del Acudiente *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Carolina Mendoza"
                      value={acudiente}
                      onChange={(e) => setAcudiente(e.target.value)}
                      required={tipoPaciente === 'MENOR'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#0AA896]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Parentesco *
                    </label>
                    <select
                      value={parentesco}
                      onChange={(e) => setParentesco(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#0AA896]"
                    >
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Abuelo/a">Abuelo/a</option>
                      <option value="Tutor Legal">Tutor Legal</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tipoPaciente === 'MENOR' ? 'Nombre del Niño/a (Paciente) *' : 'Nombre Completo del Paciente *'}
                </label>
                <input
                  type="text"
                  placeholder={tipoPaciente === 'MENOR' ? 'Ej. Matías Gómez Mendoza' : 'Ej. Juan Pérez'}
                  value={paciente}
                  onChange={(e) => setPaciente(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0AA896]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Edad *</label>
                <input
                  type="text"
                  placeholder="Ej. 4 años"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0AA896]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Servicio Clínico de Interés *
                </label>
                <select
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#0AA896]"
                >
                  <option value="Evaluación e intervención del lenguaje y del habla">Evaluación del lenguaje y habla</option>
                  <option value="Estimulación temprana">Estimulación temprana</option>
                  <option value="Lectoescritura">Lectoescritura</option>
                  <option value="Voz y comunicación">Voz y comunicación</option>
                  <option value="Terapia Miofuncional">Terapia Miofuncional</option>
                  <option value="Terapia ABA y neurodesarrollo">Terapia ABA y neurodesarrollo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Jornada Preferida *
                </label>
                <select
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#0AA896]"
                >
                  <option value="Mañana (8:00 a.m. - 12:00 m.)">Mañana (8:00 a.m. - 12:00 m.)</option>
                  <option value="Tarde (2:00 p.m. - 6:00 p.m.)">Tarde (2:00 p.m. - 6:00 p.m.)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. Breve motivo de consulta
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Presenta dificultad para pronunciar los fonemas /r/ y /s/ y queremos valoración inicial."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0AA896]"
              />
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between bg-[#ECE5DD] rounded-2xl p-4 border border-slate-300">
            <div>
              <div className="flex items-center gap-2.5 bg-[#075E54] text-white px-3.5 py-2.5 rounded-t-xl -mx-4 -mt-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#0AA896] flex items-center justify-center font-bold text-xs">
                  FN
                </div>
                <div>
                  <div className="text-xs font-bold">Consultorio FONELLA · Recepción</div>
                  <div className="text-xs text-emerald-200">En línea · Respuesta asistida</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-2 font-semibold">
                Vista previa del mensaje autogenerado:
              </p>
              
              <div className="bg-[#DCF8C6] text-slate-800 p-3.5 rounded-xl rounded-tl-none shadow-sm text-xs whitespace-pre-line leading-relaxed border border-emerald-200">
                {mensajePreview}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-300/80 space-y-2">
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{cargando ? 'Guardando en Fonella...' : '📲 Enviar Solicitud por WhatsApp'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </section>
  );
}