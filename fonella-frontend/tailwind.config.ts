import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fonella: {
          primario: '#136A7B',    // Teal Clínico Profundo (Encabezados, Sidebar, Iconos)
          turquesa: '#0AA896',    // Turquesa Esmeralda (Marca FONELLA, CTAs, Activos)
          secundario: '#DF9B78',  // Terracota Cálido (Acentos, Eslogan, Calidez Pediátrica)
          cielo: '#5A96C8',       // Azul Cielo Suave (Isotipo Oído, Categorías)
          crema: '#F5ECDD',       // Crema Cálido / Arena (Fondo Hero y Portal Público)
          fondo: '#FAF6F0',       // Blanco Marfil Clínico (Fondo de Lectura Descansada)
          whatsapp: '#25D366',    // Verde Conversión WhatsApp (HU-08, HU-09)
        },
      },
    },
  },
  plugins: [],
};

export default config;
