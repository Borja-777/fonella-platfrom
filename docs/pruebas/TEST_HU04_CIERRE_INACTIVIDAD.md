# INFORME DE PRUEBA Y AUDITORÍA DE SEGURIDAD (HU-04)
## Cierre Automático de Sesión por Inactividad (Seguridad Clínica 30m)
**Equipo InnovaCode:** Jhoan Borja (Scrum Master / Arquitecto), Diego Barrera (Product Owner), Sergio Rodríguez (Desarrollador)  
**Fecha de Ejecución y Validación:** 7 de Noviembre de 2026  
**Historia de Usuario:** `HU - Seguridad - 004: Cierre Automático de Sesión por Inactividad #4`  
**Rama:** `feat/hu-seguridad-004-cierre-inactividad`  
**Estado:** Superado 100% y Verificado en Vivo ✅ | **Nivel de Seguridad:** Cumplimiento Clínico Habeas Data & Confidencialidad Médica

---

## 1. Contexto Clínico y Justificación
En el Centro Integral de Fonoaudiología **FONELLA**, los puestos de atención médica y recepción manejan historias clínicas confidenciales de pacientes (niños y familias). La normatividad de protección de datos de salud exige que las estaciones de trabajo no queden con sesiones abiertas de forma desatendida.

---

## 2. Configuración Oficial Activa en Producción

| Parámetro | Valor Oficial Clínico | Comportamiento del Sistema |
| :--- | :--- | :--- |
| **Monitoreo de Eventos Físicos** | `mousemove`, `keydown`, `click`, `scroll`, `touchstart` | Cada acción actualiza la marca de tiempo `ultimaActividadRef` |
| **Mecanismo de Tiempo** | **Heartbeat `Date.now()` (1000ms)** | Inmune a re-renders de React y desacoplado del DOM |
| **Tiempo de Advertencia** | **25 minutos (1,500,000 ms)** | Despliega modal de advertencia centrado |
| **Tiempo de Cierre Definitivo** | **30 minutos (1,800,000 ms)** | Cierre forzoso de sesión y destrucción de cookies |
| **Ventana de Cuenta Regresiva** | **5 minutos (300 segundos)** | Visualización dinámica segundo a segundo (`05:00` a `00:00`) |
| **Redirección de Expulsión** | `/login?inactividad=true` | Lleva al login con alerta clínica informativa ámbar |
| **Destrucción de Credenciales** | `fonella_rol` (Max-Age=0) + `apiService.logout()` | Invalida token JWT y borra cookies de sesión |

---

## 3. Matriz de Casos de Prueba Validados en Vivo

### Caso 1: Detección Preventiva y Activación del Modal
* **Procedimiento:** Dejar de interactuar con el sistema hasta alcanzar el tiempo de advertencia (25 min).
* **Resultado:** Emerge el modal centrado con fondo desenfocado, ícono de escudo ámbar y cuenta regresiva de 5 minutos.
* **Estado:** **SUPERADO Y VERIFICADO EN VIVO ✅**

---

### Caso 2: Extensión Explícita de Sesión ("Seguir trabajando")
* **Procedimiento:** Con el modal de advertencia desplegado, hacer clic en el botón `"Seguir trabajando"`.
* **Resultado:** El modal se cierra inmediatamente, los temporizadores se reinician a 25/30 min y el usuario continúa en su pantalla actual sin interrupción.
* **Estado:** **SUPERADO Y VERIFICADO EN VIVO ✅**

---

### Caso 3: Cierre Anticipado Voluntario ("Cerrar ahora")
* **Procedimiento:** Con el modal desplegado, presionar `"Cerrar ahora"`.
* **Resultado:** Cierra la sesión inmediatamente y redirige al login.
* **Estado:** **SUPERADO Y VERIFICADO EN VIVO ✅**

---

### Caso 4: Expiración Definitiva por Inactividad Continua
* **Procedimiento:** No interactuar durante los 30 minutos de inactividad total.
* **Resultado:** El sistema destruye la cookie de rol, ejecuta logout en el backend y redirige a `/login?inactividad=true`.
* **Estado:** **SUPERADO Y VERIFICADO EN VIVO ✅**

---

### Caso 5: Banner Informativo de Confidencialidad en Login
* **Procedimiento:** Visitar `/login?inactividad=true` tras la expulsión automática.
* **Resultado:** Aparece el banner ámbar informando con claridad que la sesión fue cerrada para proteger los datos médicos de los pacientes.
* **Estado:** **SUPERADO Y VERIFICADO EN VIVO ✅**

---

### Caso 6: Protección Anti-Accidental (Mouse Movement Guard)
* **Procedimiento:** Cuando el modal de advertencia está abierto, mover el ratón por la pantalla.
* **Resultado:** El modal se mantiene abierto; no se cierra con roces de ratón accidentales, exigiendo clic intencional en `"Seguir trabajando"`.
* **Estado:** **SUPERADO Y VERIFICADO EN VIVO ✅**
