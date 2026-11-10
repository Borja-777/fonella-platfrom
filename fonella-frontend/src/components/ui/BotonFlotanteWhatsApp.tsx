'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BotonFlotanteProps {
  numeroTelefono?: string;
  mensajePredeterminado?: string;
}

export default function BotonFlotanteWhatsApp({
  numeroTelefono = '573104686733',
  mensajePredeterminado = 'Hola, deseo obtener más información sobre las consultas fonoaudiológicas en FONELLA.',
}: BotonFlotanteProps) {
  const urlWhatsApp = `https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensajePredeterminado)}`;
  const fabRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const isDockedRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const addTimer = (fn: () => void, ms: number) => {
    const timer = setTimeout(fn, ms);
    timersRef.current.push(timer);
    return timer;
  };

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    const targetBtn = document.getElementById('boton-recepcion-contacto');
    const fab = fabRef.current;
    const label = labelRef.current;
    if (!targetBtn || !fab || !label) return;

    // Si la página carga ya ubicada en la sección de contacto, acoplar de inmediato sin animación
    const initialTargetRect = targetBtn.getBoundingClientRect();
    const windowH = window.innerHeight;
    if (initialTargetRect.top < windowH * 0.85 && initialTargetRect.bottom > 80) {
      isDockedRef.current = true;
      targetBtn.classList.add('docked-whatsapp-active');
      fab.style.display = 'none';
    }

    const startDocking = () => {
      if (isDockedRef.current || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      clearAllTimers();

      // PASO 1: Contracción en la esquina (Rectángulo mayor hasta el menor)
      // El texto se contrae a 0 y el botón se convierte en círculo compacto
      fab.style.display = 'flex';
      fab.style.transition = 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), padding 200ms cubic-bezier(0.4, 0, 0.2, 1)';
      fab.style.width = '48px';
      fab.style.padding = '12px 13px';
      
      label.style.transition = 'max-width 180ms ease, opacity 140ms ease, margin 180ms ease';
      label.style.maxWidth = '0px';
      label.style.opacity = '0';
      label.style.marginLeft = '0px';

      // PASO 2: Vuelo del botón compacto hacia su sitio de destino
      addTimer(() => {
        const freshTargetRect = targetBtn.getBoundingClientRect();
        const freshFabRect = fab.getBoundingClientRect();

        const deltaX = (freshTargetRect.left + freshTargetRect.width / 2) - (freshFabRect.left + freshFabRect.width / 2);
        const deltaY = (freshTargetRect.top + freshTargetRect.height / 2) - (freshFabRect.top + freshFabRect.height / 2);

        fab.style.transition = 'transform 360ms cubic-bezier(0.25, 1, 0.5, 1)';
        fab.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;

        // PASO 3: Puesta del botón dentro de su sitio (Del rectángulo menor al mayor)
        addTimer(() => {
          label.textContent = 'Hablar con Recepción';
          
          fab.style.transition = 'width 240ms cubic-bezier(0.34, 1.3, 0.64, 1), padding 240ms ease';
          fab.style.width = `${freshTargetRect.width}px`;
          fab.style.padding = '12px 24px';

          label.style.transition = 'max-width 240ms ease, opacity 200ms ease 40ms, margin 240ms ease';
          label.style.maxWidth = '180px';
          label.style.opacity = '1';
          label.style.marginLeft = '8px';

          // PASO 4: Acople completado en el sitio
          addTimer(() => {
            targetBtn.classList.add('docked-whatsapp-active');
            fab.style.display = 'none';
            isDockedRef.current = true;
            isAnimatingRef.current = false;
          }, 250);

        }, 370);

      }, 210);
    };

    const startUndocking = () => {
      if (!isDockedRef.current || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      clearAllTimers();

      const freshTargetRect = targetBtn.getBoundingClientRect();
      const cornerCenterX = window.innerWidth - 24 - freshTargetRect.width / 2;
      const cornerCenterY = window.innerHeight - 24 - freshTargetRect.height / 2;
      const targetCenterX = freshTargetRect.left + freshTargetRect.width / 2;
      const targetCenterY = freshTargetRect.top + freshTargetRect.height / 2;

      const deltaX = targetCenterX - cornerCenterX;
      const deltaY = targetCenterY - cornerCenterY;

      // Desactivar el botón nativo y colocar el FAB exactamente encima
      targetBtn.classList.remove('docked-whatsapp-active');
      fab.style.display = 'flex';
      fab.style.transition = 'none';
      fab.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      fab.style.width = `${freshTargetRect.width}px`;
      fab.style.padding = '12px 24px';
      
      label.textContent = 'Hablar con Recepción';
      label.style.transition = 'none';
      label.style.maxWidth = '180px';
      label.style.opacity = '1';
      label.style.marginLeft = '8px';

      // PASO 1 de retorno: Contracción en el sitio (Rectángulo mayor a menor)
      requestAnimationFrame(() => {
        fab.style.transition = 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), padding 200ms cubic-bezier(0.4, 0, 0.2, 1)';
        fab.style.width = '48px';
        fab.style.padding = '12px 13px';

        label.style.transition = 'max-width 180ms ease, opacity 140ms ease, margin 180ms ease';
        label.style.maxWidth = '0px';
        label.style.opacity = '0';
        label.style.marginLeft = '0px';

        // PASO 2 de retorno: Vuelo de regreso a la esquina
        addTimer(() => {
          fab.style.transition = 'transform 360ms cubic-bezier(0.25, 1, 0.5, 1)';
          fab.style.transform = 'translate3d(0, 0, 0)';

          // PASO 3 de retorno: Expansión en la esquina (Rectángulo menor al mayor)
          addTimer(() => {
            label.textContent = 'Contactar Recepción';

            fab.style.transition = 'width 240ms cubic-bezier(0.34, 1.3, 0.64, 1), padding 240ms ease';
            fab.style.width = '190px';
            fab.style.padding = '12px 20px';

            label.style.transition = 'max-width 240ms ease, opacity 200ms ease 40ms, margin 240ms ease';
            label.style.maxWidth = '180px';
            label.style.opacity = '1';
            label.style.marginLeft = '8px';

            addTimer(() => {
              isDockedRef.current = false;
              isAnimatingRef.current = false;
              fab.style.width = 'auto';
            }, 250);

          }, 370);

        }, 210);
      });
    };

    const checkPosition = () => {
      const targetRect = targetBtn.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // El área cómoda de la sección de contacto
      const shouldBeDocked = targetRect.top < windowHeight * 0.85 && targetRect.bottom > 80;

      if (shouldBeDocked && !isDockedRef.current && !isAnimatingRef.current) {
        startDocking();
      } else if (!shouldBeDocked && isDockedRef.current && !isAnimatingRef.current) {
        startUndocking();
      }
    };

    let ticking = false;
    const onScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      clearAllTimers();
    };
  }, []);

  return (
    <>
      <style>{`
        #boton-recepcion-contacto.docked-whatsapp-active {
          background-color: #25D366 !important;
          color: #ffffff !important;
          border-color: #25D366 !important;
          box-shadow: 0 14px 28px -4px rgba(37, 211, 102, 0.45), 0 4px 10px -2px rgba(37, 211, 102, 0.25) !important;
        }
        #boton-recepcion-contacto.docked-whatsapp-active:hover {
          background-color: #20bd5a !important;
          border-color: #20bd5a !important;
          box-shadow: 0 16px 32px -4px rgba(37, 211, 102, 0.55) !important;
        }
        #boton-recepcion-contacto.docked-whatsapp-active svg {
          fill: #ffffff !important;
          transform: scale(1.1);
        }
      `}</style>

      <a
        ref={fabRef}
        href={urlWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#25D366',
          color: '#ffffff',
          height: '48px',
          padding: '12px 20px',
          borderRadius: '9999px',
          boxShadow: '0 10px 22px -3px rgba(37, 211, 102, 0.45), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
          textDecoration: 'none',
          fontWeight: '900',
          fontSize: '13px',
          fontFamily: 'inherit',
          transformOrigin: 'center center',
          boxSizing: 'border-box',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          willChange: 'transform, width, padding',
        }}
        aria-label="Contactar por WhatsApp"
      >
        <svg
          style={{ width: '22px', height: '22px', fill: 'currentColor', flexShrink: 0 }}
          viewBox="0 0 24 24"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        <span
          ref={labelRef}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: '180px',
            opacity: 1,
            marginLeft: '8px',
          }}
        >
          Contactar Recepción
        </span>
      </a>
    </>
  );
}
