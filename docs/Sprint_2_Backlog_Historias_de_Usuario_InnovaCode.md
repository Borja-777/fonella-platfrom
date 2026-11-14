# 🚀 INNOVACODE SOFTWARE SOLUTIONS

## Plan de Sprint 2 y Backlog Oficial de Historias de Usuario — Proyecto FONELLA

* **Cliente:** Dra. Bárbara Ccucho Delgado — Fonoaudióloga (Centro Integral de Fonoaudiología FONELLA)  
* **Equipo Scrum:** Jhoan Borja (Scrum Master / Software Architect), Diego Barrera (Product Owner), Sergio Rodríguez (Full Stack Developer)  
* **Marco Metodológico:** Scrum Ágil / Domain-Driven Architecture  
* **Repositorio Oficial:** [`Borja-777/fonella-platfrom`](https://github.com/Borja-777/fonella-platfrom)  
* **Tablero de GitHub Projects:** [`Proyecto Fonella - Sprint 2`](https://github.com/users/Borja-777/projects)

---

## 🎯 1. Objetivo y Alcance del Sprint 2

> **Objetivo del Sprint:**  
> Implementar y desplegar el **Módulo Clínico y Administrativo de Agenda Interna** (con cuadrícula de 45 minutos, descansos de 15 minutos, franja de almuerzo bloqueada y políticas de cancelación) junto con el **Directorio Centralizado de Pacientes y Acudientes Pediátricos** (con custodia legal obligatoria según `RN-06`), dejando ambos módulos 100% operativos e integrados en backend y frontend.

### Métricas del Sprint 2:
* **Total de Historias de Usuario activas:** 5 Historias de Usuario.  
* **Carga total estimada:** **21 Story Points**.  

> [!NOTE]
> **Aclaración sobre HU - Seguridad - 003: Acceso Operativo de Secretaria:**  
> Originalmente proyectada en el backlog para el Sprint 2, fue adelantada y completada con éxito en el Sprint 1 (Pull Request #28 fusionado a develop). Por tanto, el Sprint 2 queda 100% focalizado en la entrega operativa de la Agenda de Citas y el Directorio de Pacientes.

---

## 🚦 2. Propuesta de Distribución en 3 Carriles (Sin Bloqueos)

Para mantener el principio de desarrollo paralelo sin colisiones en Git:

| Carril / Enfoque | Responsable | Historias de Usuario Asignadas | Pts | Módulos y Rutas de Código | Entregable Técnico |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Carril 1: Backend de Citas y Pacientes** | **Jhoan Borja** | • **`HU - Agenda - 001`** (5 pts)<br>• **`HU - Agenda - 003`** (3 pts) | **8 pts** | • `fonella-backend/src/modules/citas/`<br>• `fonella-backend/prisma/schema.prisma` | Endpoints `POST /api/v1/citas`, `PATCH /api/v1/citas/:id/estado`, exclusión temporal de solapamiento y auditoría de cancelaciones. |
| **Carril 2: Frontend Agenda & Calendario** | **Sergio Rodríguez** | • **`HU - Agenda - 002`** (5 pts) | **5 pts** | • `fonella-frontend/src/app/(panel)/agenda/`<br>• `fonella-frontend/src/components/agenda/` | Vista diaria y semanal de 45 min, sombreado de almuerzo (12:00-14:00), código de colores por estado y modal interactivo de cita. |
| **Carril 3: Directorio de Pacientes y Acudientes** | **Diego Barrera** | • **`HU - Clínica - 001`** (5 pts)<br>• **`HU - Clínica - 002`** (3 pts) | **8 pts** | • `fonella-backend/src/modules/pacientes/`<br>• `fonella-frontend/src/app/(panel)/pacientes/` | CRUD de pacientes, buscador predictivo por documento/nombre y validación legal obligatoria de acudientes para menores (`RN-06`). |

---

## ✅ 3. Definition of Done (DoD) para el Cierre de Sprint 2

Toda Historia de Usuario del Sprint 2 para darse por completada (`Done`) debe cumplir:

1. **Criterios Gherkin Aprobados:** Todos los escenarios descritos en la issue han sido validados funcionalmente.  
2. **Tareas Técnicas al 100%:** Checkboxes interactivos marcados en GitHub Projects.  
3. **Cero Errores de Tipado:** `npm run build` o `npx tsc --noEmit` sin errores en backend y frontend.  
4. **Reglas de Negocio Blindadas:**  
   - No solapamiento de citas en base de datos.  
   - Bloqueo de almuerzo (12:00 a 14:00).  
   - Bloqueo legal de guardado si un menor no tiene acudiente (`RN-06`).  
   - Política de cancelación víspera 16:00 (mañana) o 10:00 AM (tarde).  
5. **Paleta de Marca Oficial Fonella:** Integrada con Teal `#136A7B`, Turquesa `#0AA896`, Crema `#FAF6F0` / `#F5ECDD`.  
6. **PR Revisado y Aprobado:** Pull Request con plantilla oficial fusionado a la rama `develop`.
