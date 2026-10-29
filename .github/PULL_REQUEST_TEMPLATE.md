## 📌 Descripción del Pull Request
- **Historia(s) de Usuario asociada(s):** `HU-XX`
- **Carril del Sprint:** `Carril 1 / Carril 2 / Carril 3`

## ✅ Checklist de Seguridad y Calidad (Definition of Done - InnovaCode)
- [ ] El código compila sin errores de TypeScript (`npm run build`).
- [ ] No se subieron archivos `.env` ni credenciales en texto plano.
- [ ] Los endpoints privados validan sesión mediante `JwtAuthGuard` (Cookie `HttpOnly`) y permisos mediante `RolesGuard` (`@Roles`).
- [ ] Los datos de entrada están validados o sanitizados (`ValidationPipe` / `encodeURIComponent`).
- [ ] Probado localmente en vista móvil (*Mobile-First*) y escritorio.
