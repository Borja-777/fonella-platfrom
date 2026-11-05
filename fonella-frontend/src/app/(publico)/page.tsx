import Link from 'next/link';
import BotonFlotanteWhatsApp from '@/components/ui/BotonFlotanteWhatsApp';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F5ECDD] p-8 flex flex-col items-center justify-center relative">
      <h1 className="text-4xl font-bold mb-4 text-center text-[#136A7B]">
        Consultorio Fonoaudiológico FONELLA
      </h1>
      <p className="text-lg mb-8 text-center max-w-xl text-slate-700">
        Comunicación que Transforma. Atención especializada en evaluación y tratamiento fonoaudiológico.
      </p>
      
      {/* Botón central que lleva a la solicitud asistida */}
      <Link 
        href="/solicitar-cita"
        className="bg-[#0AA896] hover:bg-[#088778] text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
      >
        Solicitar Cita Asistida
      </Link>

      {/* Botón flotante en la esquina inferior derecha */}
      <BotonFlotanteWhatsApp />
    </main>
  );
}