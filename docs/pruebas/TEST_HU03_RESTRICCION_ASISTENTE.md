# INFORME DE PRUEBA Y AUDITORÍA DE SEGURIDAD (HU-03)
## Acceso Operativo con Permisos Restringidos (Rol Asistente / Secretaria)
**Equipo InnovaCode:** Jhoan Borja (Scrum Master / Arquitecto), Diego Barrera (Product Owner), Sergio Rodríguez (Desarrollador)  
**Fecha de Ejecución y Validación:** 7 de Noviembre de 2026  
**Historia de Usuario:** `HU - Personal - 003: Acceso Operativo con Permisos Restringidos (Rol Secretaria / Asistente) #3`  
**Rama:** `feat/hu-personal-003-acceso-restringido-asistente`  
**Estado:** Superado 100% y Verificado ✅ | **Cumplimiento:** Ley 1581 de 2012 (Habeas Data) & Secreto Profesional Médico

---

## 1. Contexto y Objetivos de Seguridad
El personal de recepción y secretaría desempeña un rol fundamental en la logística diaria de **FONELLA**: agendamiento de turnos, confirmación de padres de familia y recepción en sala de espera. Sin embargo, por normatividad legal de salud en Colombia, la información diagnóstica y la administración de cuentas de personal están estrictamente reservadas para la **Fonoaudióloga Titular** (Dra. Bárbara Ccucho Delgado).

---

## 2. Matriz de Control de Acceso Basado en Roles (RBAC)

| Módulo / Recurso | Rol FONOAUDIOLOGA (Titular) | Rol ASISTENTE (Recepción) | Mecanismo de Seguridad |
| :--- | :---: | :---: | :--- |
| **Inicio de Sesión (`/login`)** | Redirige a `/personal` | Redirige a `/agenda` | Cookie `fonella_rol` + JWT Payload |
| **Agenda Clínica (`/agenda`)** | Permitido | **Permitido (Área Principal)** | Interfaz Operativa de Turnos |
| **Gestión de Personal (`/personal`)** | **Permitido** | ❌ **BLOQUEADO (403)** | Middleware + RolesGuard Backend |
| **Historias Clínicas (`/historia-clinica`)** | **Permitido** | ❌ **BLOQUEADO (403)** | Middleware + RolesGuard Backend |
| **Anamnesis y Diagnósticos Médicos** | Visibles | ❌ **Ocultos por Diseño** | DTOs de Recepción filtrados |

---

## 3. Matriz de Casos de Prueba Ejecutados

### Caso 1: Inicio de Sesión de Asistente y Redirección Operativa (Camino Feliz)
* **Procedimiento:** Iniciar sesión con una cuenta de asistente activa (ej. `valeria@gmail.com`).
* **Resultado:** El sistema autentica la cuenta, emite la cookie `fonella_rol=ASISTENTE` y redirige directamente al panel de `/agenda`. El menú lateral oculta por completo la pestaña de *"Gestión de Personal"*.
* **Estado:** **SUPERADO ✅**

---

### Caso 2: Bloqueo de Acceso Directo por URL a Gestión de Personal (Manejo de Errores)
* **Procedimiento:** Estando autenticado como Asistente, escribir manualmente en la barra de direcciones: `http://localhost:3000/personal`.
* **Resultado:** El `middleware.ts` intercepta la petición, verifica que el rol es `ASISTENTE`, rechaza la entrada y redirige inmediatamente a `http://localhost:3000/agenda?error=forbidden`.
* **Estado:** **SUPERADO ✅**

---

### Caso 3: Despliegue de Alerta de Seguridad 403 en Interfaz
* **Procedimiento:** Observar la pantalla de `/agenda?error=forbidden` tras el intento de acceso no autorizado.
* **Resultado:** Se muestra en la parte superior un banner prominente de advertencia con ícono de escudo:
  > *"Acceso Restringido 403: Módulo Clínico o Administrativo Bloqueado. Tu cuenta tiene rol operativo de ASISTENTE / RECEPCIÓN. Por normatividad legal de reserva médica y protección de datos (Ley 1581 de 2012), la Gestión de Cuentas de Personal y las Historias Clínicas están reservadas con exclusividad a la Fonoaudióloga Titular."*
* **Estado:** **SUPERADO ✅**

---

### Caso 4: Protección de Backend ante Invocaciones Directas a la API (`RolesGuard`)
* **Procedimiento:** Ejecutar una petición HTTP GET/POST a `/api/v1/usuarios` enviando el token JWT de la asistente.
* **Resultado:** NestJS evalúa `@Roles(RolUsuario.FONOAUDIOLOGA)` en el `RolesGuard` y rechaza la solicitud retornando código HTTP `403 Forbidden` (`{"statusCode": 403, "message": "Forbidden resource"}`).
* **Estado:** **SUPERADO ✅**

---

### Caso 5: Protección de Datos Médicos en el Listado de Citas (Habeas Data)
* **Procedimiento:** Inspeccionar la tabla operativa de citas de la asistente.
* **Resultado:** La asistente visualiza únicamente datos de coordinación (nombre del niño, edad, nombre del acudiente, teléfono para WhatsApp y servicio solicitado). No se exponen notas clínicas, diagnósticos ni antecedentes patológicos.
* **Estado:** **SUPERADO ✅**
