'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface OpcionesInactividad {
  tiempoAdvertenciaMs?: number; // Tiempo hasta mostrar advertencia (por defecto: 25 min)
  tiempoCierreMs?: number;      // Tiempo hasta cierre definitivo (por defecto: 30 min)
  onCierre: () => void;         // Callback a ejecutar al agotar tiempo
  activo?: boolean;             // Habilitar o pausar
}

/**
 * Hook HU-04: Cierre Automático de Sesión por Inactividad (Seguridad Clínica)
 * Implementado con reloj de pared (Date.now()) y latido heartbeat para inmunidad contra
 * re-renders de React, throttling de navegador y pérdida de referencias en hooks.
 */
export function useInactividad({
  tiempoAdvertenciaMs = 25 * 60 * 1000,
  tiempoCierreMs = 30 * 60 * 1000,
  onCierre,
  activo = true,
}: OpcionesInactividad) {
  const [mostrarModalAdvertencia, setMostrarModalAdvertencia] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);
  const [esModoPrueba, setEsModoPrueba] = useState(false);

  // Referencias mutables para evitar desconexión por re-renders
  const ultimaActividadRef = useRef<number>(Date.now());
  const onCierreRef = useRef(onCierre);
  onCierreRef.current = onCierre;

  const advertenciaAbiertaRef = useRef(false);
  advertenciaAbiertaRef.current = mostrarModalAdvertencia;

  const sesionCerradaRef = useRef(false);

  // Detectar parámetro ?testInactividad=true de inmediato
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('testInactividad') === 'true') {
        setEsModoPrueba(true);
      }
    }
  }, []);

  // Tiempos efectivos: 15s/30s si es prueba, 25m/30m si es producción clínica
  const tiempoAdvEfectivo = esModoPrueba ? 15 * 1000 : tiempoAdvertenciaMs;
  const tiempoCierreEfectivo = esModoPrueba ? 30 * 1000 : tiempoCierreMs;

  const extenderSesion = useCallback(() => {
    ultimaActividadRef.current = Date.now();
    setMostrarModalAdvertencia(false);
    advertenciaAbiertaRef.current = false;
  }, []);

  // 1. Escuchar eventos de interacción física del usuario
  useEffect(() => {
    if (!activo) return;

    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const manejarActividad = () => {
      // Si la ventana de advertencia ya está abierta, un roce accidental del ratón NO la cierra
      if (!advertenciaAbiertaRef.current) {
        ultimaActividadRef.current = Date.now();
      }
    };

    eventos.forEach((ev) => window.addEventListener(ev, manejarActividad, { passive: true }));

    return () => {
      eventos.forEach((ev) => window.removeEventListener(ev, manejarActividad));
    };
  }, [activo]);

  // 2. Latido Heartbeat cada 500ms basado en Date.now()
  useEffect(() => {
    if (!activo) return;

    sesionCerradaRef.current = false;
    ultimaActividadRef.current = Date.now();

    const intervalId = setInterval(() => {
      if (sesionCerradaRef.current) return;

      const tiempoInactivo = Date.now() - ultimaActividadRef.current;

      // Caso A: Expiró el tiempo total (30s en prueba / 30m en producción)
      if (tiempoInactivo >= tiempoCierreEfectivo) {
        sesionCerradaRef.current = true;
        setMostrarModalAdvertencia(false);
        advertenciaAbiertaRef.current = false;
        clearInterval(intervalId);
        onCierreRef.current();
        return;
      }

      // Caso B: Superó el tiempo de advertencia (15s en prueba / 25m en producción)
      if (tiempoInactivo >= tiempoAdvEfectivo) {
        const msRestantes = Math.max(0, tiempoCierreEfectivo - tiempoInactivo);
        const seg = Math.ceil(msRestantes / 1000);
        setSegundosRestantes(seg);
        setMostrarModalAdvertencia(true);
        advertenciaAbiertaRef.current = true;
      } else {
        // En actividad normal, el modal debe estar apagado
        if (advertenciaAbiertaRef.current) {
          setMostrarModalAdvertencia(false);
          advertenciaAbiertaRef.current = false;
        }
      }
    }, 500);

    return () => clearInterval(intervalId);
  }, [activo, tiempoAdvEfectivo, tiempoCierreEfectivo]);

  return {
    mostrarModalAdvertencia,
    segundosRestantes,
    extenderSesion,
    esModoPrueba,
  };
}
