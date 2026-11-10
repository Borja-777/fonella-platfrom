import HeaderPublico from '../../components/publico/HeaderPublico';
import PresentacionProfesional from '../../components/publico/PresentacionProfesional';
import CatalogoServicios from '../../components/publico/CatalogoServicios';
import CatalogoDidacticos from '../../components/publico/CatalogoDidacticos';
import BotonFlotanteWhatsApp from '../../components/ui/BotonFlotanteWhatsApp';

export default function HomePage() {
  return (
    <>
      <HeaderPublico />

      <main className="bg-[#FAF6F0]">
        <PresentacionProfesional />
        <CatalogoServicios />
        <CatalogoDidacticos />

        <section
          id="contacto"
          className="relative border-t border-[#136A7B]/10 bg-[#FAF8F5] px-4 py-16 text-center overflow-hidden"
        >
          {/* Resplandor sutil de fondo */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#0AA896]/5 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black text-[#08424E] tracking-tight">
              Estamos aquí para acompañarte
            </h2>

            <p className="mt-3 text-sm text-[#136A7B] leading-relaxed font-medium">
              Comunícate con FONELLA para conocer nuestros servicios y
              materiales terapéuticos.
            </p>

            <p className="mt-4 text-xs sm:text-sm font-black tracking-wider uppercase text-[#0AA896]">
              Comunicación que Transforma ♥
            </p>
          </div>
        </section>
      </main>

      {/* Pie de página integrado con el azul petróleo profundo */}
      <footer className="bg-[#08424E] border-t border-[#136A7B]/30 py-8 text-center text-xs text-teal-100/70">
        <p className="font-medium text-white/95">
          © 2026 FONELLA · Todos los derechos reservados · Dra. Bárbara Ccucho Delgado
        </p>
        <p className="text-[10px] text-teal-200/80 mt-1">
          Centro Integral de Fonoaudiología · Palmira, Colombia
        </p>
      </footer>

      <BotonFlotanteWhatsApp />
    </>
  );
}
