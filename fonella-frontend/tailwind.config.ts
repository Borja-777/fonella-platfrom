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
          primario: '#136A7B',    // Teal Clínico Oficial
          secundario: '#DF9B78',  // Terracota Cálido Oficial
          fondo: '#F8FAFC',       // Blanco Humo Clínico
          whatsapp: '#25D366',    // Verde Conversión WhatsApp
        },
      },
    },
  },
  plugins: [],
};

export default config;
