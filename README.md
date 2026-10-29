# 🏥 Plataforma Web FONELLA — InnovaCode Solutions

Sistema integral de gestión clínica fonoaudiológica, agendamiento de citas en bloques de 45 minutos, catálogo didáctico y control de inventario para el consultorio **FONELLA** (Dra. Bárbara Ccucho Delgado).

* **Equipo InnovaCode:** Jhoan Borja, Diego Barrera, Sergio Rodríguez
* **Universidad del Valle — Sede Palmira (2026)**

---

## 🏗️ Arquitectura del Monorepo

```text
fonella-platform/
├── .github/                  # Workflows CI/CD, Plantilla de PR y CODEOWNERS
├── docker-compose.yml        # Contenedor local de PostgreSQL 16
├── fonella-backend/          # Contenedor API REST & Workers (NestJS + Prisma ORM)
└── fonella-frontend/         # Contenedor Web SSR/SPA (Next.js + Tailwind CSS)
```

---

## 🔒 Mecanismos de Seguridad Implementados
1. **Autenticación en Cookies `HttpOnly`, `Secure`, `SameSite=Strict` (`ADR-03`):** Inmunidad frente a robo de sesión por XSS.
2. **Control de Acceso Basado en Roles (`RBAC`):** Guardia `RolesGuard` y decorador `@Roles('FONOAUDIOLOGA', 'ASISTENTE')` en NestJS + `middleware.ts` en Next.js (`HU-01`, `HU-02`, `HU-03`).
3. **Expiración por Inactividad (`HU-04`):** Tiempo de vida del token configurado a 30 minutos (`JWT_EXPIRES_IN="30m"`).
4. **Cabeceras Seguras y Sanitización Global:** Uso de `helmet`, `CORS` restrictivo con credenciales y `ValidationPipe` con `whitelist: true` y `forbidNonWhitelisted: true`.

---

## 🌿 Estructura de Ramas (Git Flow)
* **`main`:** Rama protegida de producción (solo recibe PRs desde `develop`).
* **`develop`:** Rama protegida de integración del Sprint.
* **Ramas de trabajo del Sprint 1:**
  * `feat/hu-01-02-auth-personal` (Carril 1: Login Admin + Gestión de Cuentas Secretaria)
  * `feat/hu-05-06-07-portal-catalogo` (Carril 2: Perfil Profesional, Servicios y Catálogo de Juguetes)
  * `feat/hu-08-09-whatsapp-cita` (Carril 3: Botón Flotante WhatsApp + Formulario Asistido de Cita)

---

## 🚀 Inicio Rápido para Desarrolladores

```bash
# 1. Levantar Base de Datos PostgreSQL 16
docker compose up -d

# 2. Configurar y levantar Backend (Puerto 4000)
cd fonella-backend
cp .env.example .env
npm install
npx prisma migrate dev --name init_fonella
npx prisma db seed
npm run start:dev

# 3. Configurar y levantar Frontend (Puerto 3000)
cd ../fonella-frontend
cp .env.example .env.local
npm install
npm run dev
```
