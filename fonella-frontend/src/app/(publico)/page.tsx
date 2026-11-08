
import HeaderPublico from '../../components/publico/HeaderPublico';
import PresentacionProfesional from '../../components/publico/PresentacionProfesional';
import CatalogoServicios from '../../components/publico/CatalogoServicios';
import CatalogoDidacticos from '../../components/publico/CatalogoDidacticos';
import BotonFlotanteWhatsApp from '../../components/ui/BotonFlotanteWhatsApp';

export default function HomePage() {
  return (
    <>
      <HeaderPublico />

      <main>
        <PresentacionProfesional />
        <CatalogoServicios />
        <CatalogoDidacticos />

        <section
          id="contacto"
          className="border-t border-fonella-secundario/30 bg-fonella-crema px-4 py-12 text-center"
        >
          <h2 className="text-2xl font-extrabold text-fonella-primario">
            Estamos aquí para acompañarte
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600">
            Comunícate con FONELLA para conocer nuestros servicios y
            materiales terapéuticos.
          </p>

          <p className="mt-4 text-sm font-semibold text-fonella-turquesa">
            Comunicación que Transforma ♥
          </p>
        </section>
      </main>

      <BotonFlotanteWhatsApp />
    </>
  );
}
