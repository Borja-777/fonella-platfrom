import Link from 'next/link';
import BotonFlotanteWhatsApp from '../../components/ui/BotonFlotanteWhatsApp';

export default function HomePage() {
  return (
    <main 
      className="min-h-screen p-8 flex flex-col items-center justify-center"
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5ECDD',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'sans-serif'
      }}
    >
      <h1 
        className="text-4xl font-bold mb-4 text-center"
        style={{ color: '#136A7B', fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}
      >
        Consultorio Fonoaudiológico FONELLA
      </h1>
      <p 
        className="text-lg mb-8 text-center max-w-xl"
        style={{ color: '#4A5568', fontSize: '1.125rem', marginBottom: '2rem', textAlign: 'center', maxWidth: '36rem' }}
      >
        Comunicación que Transforma. Atención especializada en evaluación y tratamiento fonoaudiológico.
      </p>
      
      <Link 
        href="/solicitar-cita"
        style={{
          backgroundColor: '#0AA896',
          color: '#ffffff',
          fontWeight: '600',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        Solicitar Cita Asistida
      </Link>

      <BotonFlotanteWhatsApp />
    </main>
  );
}
