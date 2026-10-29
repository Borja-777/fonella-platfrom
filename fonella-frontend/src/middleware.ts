import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Mecanismo de Seguridad en Cliente: Protección de rutas privadas del panel (HU-01, HU-03, HU-04)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('fonella_token')?.value;
  const rol = request.cookies.get('fonella_rol')?.value;
  const { pathname } = request.nextUrl;

  const RutasPrivadas = ['/personal', '/agenda', '/pacientes', '/historia-clinica', '/inventario-ventas'];
  const esRutaPrivada = RutasPrivadas.some((ruta) => pathname.startsWith(ruta));

  if (esRutaPrivada && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // HU-03: Bloquear acceso de Secretaria a Historia Clínica y Gestión de Cuentas de Personal
  if (rol === 'ASISTENTE' && (pathname.startsWith('/historia-clinica') || pathname.startsWith('/personal'))) {
    return NextResponse.redirect(new URL('/agenda', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/personal/:path*', '/agenda/:path*', '/pacientes/:path*', '/historia-clinica/:path*', '/inventario-ventas/:path*'],
};
