'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface OpcionesInactividad {
  tiempoAdvertenciaMs?: number; // Tiempo hasta mostrar la advertencia (por defecto: 25 min)
  tiempoCierreMs?: number;      // Tiempo hasta el cierre definitivo (por defecto: 30 min)
  onCierre: () => void;         // Callback a ejecutar cuando se agota el tiempo
  activo?: boolean;             // Habilitar o pausar el hook
}

/**
 * Hook HU-04: Cierre Automático de Sesión por Inactividad (Seguridad Clínica)
 * Monitorea la actividad global del usuario (mouse, teclado, touch, scroll)
 * y emite una advertencia preventiva antes de destruir la sesión por inactividad.
 */
export function useInactividad({
  tiempoAdvertenciaMs = 25 * 60 * 1000, // 25 minutos por defecto
  tiempoCierreMs = 30 * 60 * 1000,      // 30 minutos por defecto
  onCierre,
  activo = true,
}: OpcionesInactividad) {
  const [mostrarModalAdvertencia, setMostrarModalAdvertencia] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);
  const [esModoPrueba, setEsModoPrueba] = useState(false);

  // Detección de parámetro de prueba rápida (?testInactividad=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('testInactividad') === 'true') {
        setEsModoPrueba(true);
      }
    }
  }, []);

  // En modo prueba: 15s para advertencia, 30s para cierre definitivo
  const tiempoAdvEfectivo = esModoPrueba ? 15 * 1000 : tiempoAdvertenciaMs;
  const tiempoCierreEfectivo = esModoPrueba ? 30 * 1000 : tiempoCierreMs;

  const timerAdvertenciaRef = useRef<NodeJS.Timeout | null>(null);
  const timerCierreRef = useRef<NodeJS.Timeout | null>(null);
  const intervalCuentaRegresivaRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar todos los temporizadores activos
  const limpiarTemporizadores = useCallback(() => {
    if (timerAdvertenciaRef.current) clearTimeout(timerAdvertenciaRef.current);
    if (timerCierreRef.current) clearTimeout(timerCierreRef.current);
    if (intervalCuentaRegresivaRef.current) clearInterval(intervalCuentaRegresivaRef.current);
  }, []);

  // Función que reinicia el ciclo de inactividad
  const reiniciarInactividad = useCallback(() => {
    if (!activo) return;

    limpiarTemporizadores();
    setMostrarModalAdvertencia(false);

    // 1. Temporizador de Advertencia Preventiva (15s en test, 25m en prod)
    timerAdvertenciaRef.current = setTimeout(() => {
      setMostrarModalAdvertencia(true);

      const msRestantes = Math.max(0, tiempoCierreEfectivo - tiempoAdvEfectivo);
      let seg = Math.round(msRestantes / 1000);
      setSegundosRestantes(seg);

      // Cuenta regresiva visible segundo a segundo en el modal
      intervalCuentaRegresivaRef.current = setInterval(() => {
        setSegundosRestantes((prev) => {
          if (prev <= 1) {
            if (intervalCuentaRegresivaRef.current) clearInterval(intervalCuentaRegresivaRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, tiempoAdvEfectivo);

    // 2. Temporizador de Cierre Definitivo (30s en test, 30m en prod)
    timerCierreRef.current = setTimeout(() => {
      limpiarTemporizadores();
      setMostrarModalAdvertencia(false);
      onCierre();
    }, tiempoCierreEfectivo);
  }, [activo, tiempoAdvEfectivo, tiempoCierreEfectivo, onCierre, limpiarTemporizadores]);

  // Acción explícita del usuario para extender su sesión activa
  const extenderSesion = useCallback(() => {
    reiniciarInactividad();
  }, [reiniciarInactividad]);

  // Escuchar eventos globales del usuario
  useEffect(() => {
    if (!activo) return;

    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const manejarActividad = () => {
      // Si el modal de advertencia preventiva ya está abierto, un movimiento accidental del ratón
      // no debe cerrarlo: el usuario debe hacer clic deliberadamente en "Continuar trabajando".
      if (!mostrarModalAdvertencia) {
        reiniciarInactividad();
      }
    };

    eventos.forEach((evento) => {
      window.addEventListener(evento, manejarActividad, { passive: true });
    });

    reiniciarInactividad();

    return () => {
      eventos.forEach((evento) => {
        window.removeEventListener(evento, manejarActividad);
      });
      limpiarTemporizadores();
    };
  }, [activo, mostrarModalAdvertencia, reiniciarInactividad, limpiarTemporizadores]);

  return {
    mostrarModalAdvertencia,
    segundosRestantes,
    extenderSesion,
    reiniciarInactividad,
    esModoPrueba,
  };
}
