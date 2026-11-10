'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface OpcionesInactividad {
  tiempoAdvertenciaMs?: number; // Tiempo hasta mostrar advertencia (por defecto: 25 min)
  tiempoCierreMs?: number;      // Tiempo hasta cierre definitivo (por defecto: 30 min)
  onCierre: () => void;         // Callback a ejecutar al agotar tiempo
  activo?: boolean;             // Habilitar o pausar el hook
}

/**
 * Hook HU-04: Cierre Automático de Sesión por Inactividad (Seguridad Clínica)
 * Monitorea la actividad global del usuario (mouse, teclado, touch, scroll)
 * y emite una advertencia preventiva a los 25 minutos antes del cierre forzoso a los 30 minutos.
 * Implementado con reloj de pared (Date.now()) y latido heartbeat inmune a re-renders.
 */
export function useInactividad({
  tiempoAdvertenciaMs = 25 * 60 * 1000, // 25 minutos
  tiempoCierreMs = 30 * 60 * 1000,      // 30 minutos
  onCierre,
  activo = true,
}: OpcionesInactividad) {
  const [mostrarModalAdvertencia, setMostrarModalAdvertencia] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);

  // Referencias mutables para evitar desconexión por re-renders
  const ultimaActividadRef = useRef<number>(Date.now());
  const onCierreRef = useRef(onCierre);
  onCierreRef.current = onCierre;

  const advertenciaAbiertaRef = useRef(false);
  advertenciaAbiertaRef.current = mostrarModalAdvertencia;

  const sesionCerradaRef = useRef(false);

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

  // 2. Latido Heartbeat cada 1000ms basado en Date.now()
  useEffect(() => {
    if (!activo) return;

    sesionCerradaRef.current = false;
    ultimaActividadRef.current = Date.now();

    const intervalId = setInterval(() => {
      if (sesionCerradaRef.current) return;

      const tiempoInactivo = Date.now() - ultimaActividadRef.current;

      // Caso A: Expiró el tiempo total (30 minutos)
      if (tiempoInactivo >= tiempoCierreMs) {
        sesionCerradaRef.current = true;
        setMostrarModalAdvertencia(false);
        advertenciaAbiertaRef.current = false;
        clearInterval(intervalId);
        onCierreRef.current();
        return;
      }

      // Caso B: Superó el tiempo de advertencia (25 minutos)
      if (tiempoInactivo >= tiempoAdvertenciaMs) {
        const msRestantes = Math.max(0, tiempoCierreMs - tiempoInactivo);
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
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activo, tiempoAdvertenciaMs, tiempoCierreMs]);

  return {
    mostrarModalAdvertencia,
    segundosRestantes,
    extenderSesion,
  };
}
