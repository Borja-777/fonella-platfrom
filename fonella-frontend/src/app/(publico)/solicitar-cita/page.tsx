'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SolicitarCitaPage() {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    tipoConsulta: 'Evaluación Fonoaudiológica',
    motivo: '',
  });
  const [cargando, setCargando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      await fetch('http://localhost:4000/api/v1/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch (err) {
      console.error('Error al conectar con el backend:', err);
    } finally {
      setCargando(false);

      const numeroRecepcion = '573104686733';
      
      const textoMensaje = `*Solicitud de Cita - FONELLA*\n\n` +
        `*Paciente:* ${formData.nombreCompleto}\n` +
        `*Contacto:* ${formData.telefono}\n` +
        `*Servicio:* ${formData.tipoConsulta}\n` +
        `*Motivo/Detalles:* ${formData.motivo || 'N/A'}`;

      window.open(`https://wa.me/${numeroRecepcion}?text=${encodeURIComponent(textoMensaje)}`, '_blank');
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#F5ECDD', padding: '2.5rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#136A7B', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
          ← Volver al Inicio
        </Link>

        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#136A7B', marginBottom: '0.5rem' }}>
            Solicitar Cita Fonoaudiológica
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#4A5568', marginBottom: '1.5rem' }}>
            Completa los campos para registrar tu solicitud y ser redirigido a recepción vía WhatsApp.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2D3748', marginBottom: '0.25rem' }}>
                Nombre Completo del Paciente *
              </label>
              <input
                type="text"
                name="nombreCompleto"
                required
                value={formData.nombreCompleto}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E0', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2D3748', marginBottom: '0.25rem' }}>
                Teléfono de Contacto *
              </label>
              <input
                type="tel"
                name="telefono"
                required
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej. 3001234567"
                style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E0', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2D3748', marginBottom: '0.25rem' }}>
                Tipo de Consulta *
              </label>
              <select
                name="tipoConsulta"
                value={formData.tipoConsulta}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E0', outline: 'none', backgroundColor: '#fff' }}
              >
                <option value="Evaluación Fonoaudiológica">Evaluación Fonoaudiológica</option>
                <option value="Terapia del Lenguaje / Habla">Terapia del Lenguaje / Habla</option>
                <option value="Terapia de Deglución / Motricidad Orofacial">Terapia de Deglución / Motricidad Orofacial</option>
                <option value="Control / Seguimiento">Control / Seguimiento</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2D3748', marginBottom: '0.25rem' }}>
                Motivo de la consulta / Observaciones
              </label>
              <textarea
                name="motivo"
                rows={3}
                value={formData.motivo}
                onChange={handleChange}
                placeholder="Describe brevemente la razón de la consulta..."
                style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #CBD5E0', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              style={{
                backgroundColor: cargando ? '#A0AEC0' : '#25D366',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: cargando ? 'not-allowed' : 'pointer',
                marginTop: '1rem',
                fontSize: '1rem'
              }}
            >
              {cargando ? 'Enviando...' : 'Enviar Solicitud por WhatsApp'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
