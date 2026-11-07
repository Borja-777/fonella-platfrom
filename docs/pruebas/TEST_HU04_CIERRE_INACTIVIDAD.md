# INFORME DE PRUEBA Y AUDITORÍA DE SEGURIDAD (HU-04)
## Cierre Automático de Sesión por Inactividad (Seguridad Clínica 30m)
**Equipo InnovaCode:** Jhoan Borja (Scrum Master / Arquitecto), Diego Barrera (Product Owner), Sergio Rodríguez (Desarrollador)  
**Fecha de Ejecución:** 7 de Noviembre de 2026  
**Historia de Usuario:** `HU - Seguridad - 004: Cierre Automático de Sesión por Inactividad #4`  
**Rama:** `feat/hu-seguridad-004-cierre-inactividad`  
**Estado:** Superado 100% ✅ | **Nivel de Seguridad:** Cumplimiento Clínico Habeas Data & Confidencialidad Médica

---

## 1. Contexto Clínico y Justificación
En el Centro Integral de Fonoaudiología **FONELLA**, los puestos de atención médica y recepción manejan historias clínicas confidenciales de pacientes (niños y familias). La normatividad de protección de datos de salud exige que las estaciones de trabajo no queden con sesiones abiertas de forma desatendida.

---

## 2. Parámetros de Operación

| Parámetro | Modo Producción (Clínico Oficial) | Modo de Prueba Rápida (`?testInactividad=true`) |
| :--- | :--- | :--- |
| **Monitoreo de Eventos** | `mousemove`, `keydown`, `click`, `scroll`, `touchstart` | `mousemove`, `keydown`, `click`, `scroll`, `touchstart` |
| **Tiempo de Advertencia** | **25 minutos** | **15 segundos** |
| **Tiempo Cierre Definitivo** | **30 minutos** | **30 segundos** |
| **Cuenta Regresiva Modal** | 5 minutos visibles segundo a segundo (`05:00` a `00:00`) | 15 segundos visibles segundo a segundo (`00:15` a `00:00`) |
| **Redirección de Expulsión** | `/login?inactividad=true` | `/login?inactividad=true` |
| **Destrucción de Cookie** | `fonella_rol` (Max-Age=0) + `apiService.logout()` | `fonella_rol` (Max-Age=0) + `apiService.logout()` |

---

## 3. Matriz de Casos de Prueba Ejecutados

### Caso 1: Detección Preventiva y Activación del Modal
* **Procedimiento:** Iniciar sesión con cualquier rol y acceder con el parámetro `http://localhost:3000/personal?testInactividad=true`. Dejar de interactuar con el mouse/teclado durante 15 segundos.
* **Resultado Esperado:** Al llegar a los 15s de inactividad, emerge un modal centrado con fondo oscuro desenfocado, icono de escudo ámbar con pulso, badge `"MODO DE PRUEBA (15S / 30S)"`, y un temporizador regresivo dinámico que descuenta segundo a segundo.
* **Estado:** **SUPERADO ✅**

---

### Caso 2: Extensión Explícita de Sesión ("Seguir trabajando")
* **Procedimiento:** Con el modal de advertencia desplegado, hacer clic en el botón turquesa `"Seguir trabajando"`.
* **Resultado Esperado:** El modal se cierra inmediatamente, los temporizadores se reinician a cero y el usuario continúa en su pantalla actual sin interrupción ni pérdida de datos.
* **Estado:** **SUPERADO ✅**

---

### Caso 3: Cierre Anticipado Voluntario ("Cerrar ahora")
* **Procedimiento:** Con el modal desplegado, hacer clic en el botón secundario `"Cerrar ahora"`.
* **Resultado Esperado:** La sesión se cierra de inmediato y el usuario es redirigido a `/login`.
* **Estado:** **SUPERADO ✅**

---

### Caso 4: Expiración Definitiva por Inactividad Continua
* **Procedimiento:** Ignorar el modal de advertencia y dejar que el contador llegue a `00:00` (segundo 30).
* **Resultado Esperado:** El sistema ejecuta el cierre forzoso, limpia la cookie de rol, invoca el backend para invalidar el token y redirige a `/login?inactividad=true`.
* **Estado:** **SUPERADO ✅**

---

### Caso 5: Feedback de Seguridad en Pantalla de Login
* **Procedimiento:** Inspeccionar la vista de login tras ser expulsado o visitando directamente `http://localhost:3000/login?inactividad=true`.
* **Resultado Esperado:** En la parte superior del formulario de autenticación se presenta una alerta informativa ámbar:
  > *"Sesión cerrada por inactividad: Tu sesión se cerró automáticamente tras 30 minutos sin actividad para proteger los expedientes clínicos de los pacientes. Por favor ingresa nuevamente."*
* **Estado:** **SUPERADO ✅**

---

### Caso 6: Protección Anti-Accidental (Mouse Movement Guard)
* **Procedimiento:** Una vez que el modal de advertencia está abierto, mover el ratón por la pantalla sin presionar los botones.
* **Resultado Esperado:** El modal **NO** se cierra ante movimientos casuales del ratón. Se requiere una decisión humana explícita haciendo clic en *"Seguir trabajando"*.
* **Estado:** **SUPERADO ✅**

---

## 4. Guía Rápida para el Evaluador / Product Owner
Para comprobar el funcionamiento en menos de 1 minuto:
1. Ingresa a: **`http://localhost:3000/login`**
2. Inicia sesión como fonoaudióloga:
   - **Correo:** `admin@fonella.com`
   - **Contraseña:** `AdminFonella2026*`
3. Agrega al final de la URL en el navegador:
   - **`http://localhost:3000/personal?testInactividad=true`**
4. Suelta el ratón durante **15 segundos**:
   - Observa cómo aparece el modal de advertencia y descuenta desde `00:15` hasta `00:00`.
5. Deja correr los 15 segundos restantes:
   - El sistema te expulsará automáticamente al login mostrando el banner ámbar de seguridad clínica.
