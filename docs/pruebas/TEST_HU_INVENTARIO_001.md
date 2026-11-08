# INFORME DE PRUEBA Y AUDITORÍA DE INVENTARIO (HU-INVENTARIO-001)
## Control de Inventario Didáctico y Margen de Ganancia (#20)
**Equipo InnovaCode:** Jhoan Borja (Scrum Master / Arquitecto), Diego Barrera (Product Owner), Sergio Rodríguez (Desarrollador)  
**Fecha de Ejecución:** 7 de Noviembre de 2026  
**Historia de Usuario:** `HU - Inventario - 001: Control de Inventario y Margen de Ganancia #20`  
**Rama Oficial:** `feat/hu-inventario-001-control-margen`  
**Estado:** Superado 100% y Verificado ✅ | **Dominio:** Negocio, Finanzas Clínicas y Control de Stock

---

## 1. Contexto Clínico y Comercial
En el Centro Integral de Fonoaudiología **FONELLA**, la Dra. Bárbara Ccucho comercializa juguetes didácticos y herramientas terapéuticas (mordedores sensoriales de silicona, tarjetas fonéticas, burbujas de respiración, juegos de encaje). El módulo de inventario permite gestionar el inventario físico, los costos de adquisición con proveedores y la rentabilidad comercial neta por producto.

---

## 2. Fórmulas Matemáticas Implementadas en Tiempo Real

1. **Ganancia Neta Unitaria ($ COP):**
   $$\text{Ganancia Neta} = \text{Precio de Venta al Público} - \text{Costo Unitario de Compra}$$

2. **Margen Comercial de Rentabilidad (%):**
   $$\text{Margen \%} = \left( \frac{\text{Precio de Venta} - \text{Costo Unitario}}{\text{Precio de Venta}} \right) \times 100$$

3. **Regla de Negocio Anti-Pérdidas:**
   El sistema bloquea la creación o actualización de cualquier producto si:
   $$\text{Precio de Venta} \le \text{Costo Unitario de Compra}$$

---

## 3. Matriz de Control de Acceso Basado en Roles (RBAC Financiero)

| Información / Acción | Rol FONOAUDIOLOGA (Titular) | Rol ASISTENTE (Recepción) |
| :--- | :---: | :---: |
| **Acceso a Inventario (`/inventario`)** | Permitido | Permitido |
| **Registrar Nuevo Juguete** | **Permitido** | ❌ Oculto |
| **Costo de Compra del Juguete** | **Visible** | ❌ **Oculto por RBAC** |
| **Ganancia Unitaria Neta ($)** | **Visible** | ❌ **Oculto por RBAC** |
| **Margen Comercial (%)** | **Visible** | ❌ **Oculto por RBAC** |
| **Precio de Venta al Público** | Visible | Visible |
| **Stock Disponible y Alertas** | Visible | Visible |
| **Registrar Venta Directa** | **Permitido** | **Permitido** |

---

## 4. Matriz de Casos de Prueba Ejecutados

### Caso 1: Cálculo Automático de Ganancia y Margen en Creación
* **Procedimiento:** Abrir modal `+ Registrar Nuevo Juguete`, ingresar Costo de Compra ($15.000) y Precio de Venta ($25.000).
* **Resultado:** La tarjeta interactiva calcula al vuelo una ganancia neta de **$10.000** y un margen de rentabilidad del **40.0%**.
* **Estado:** **SUPERADO ✅**

---

### Caso 2: Bloqueo de Precios No Rentables
* **Procedimiento:** Ingresar un Precio de Venta ($14.000) menor o igual al Costo ($15.000).
* **Resultado:** La tarjeta cambia a color rojo, advierte que el precio debe ser superior al costo y el botón *"Guardar Producto"* se deshabilita para impedir pérdidas financieras.
* **Estado:** **SUPERADO ✅**

---

### Caso 3: Descuento de Stock y Transacción Financiera de Venta
* **Procedimiento:** En cualquier producto con stock, presionar *"Vender"*, ingresar cantidad (ej. 2 unidades) y método de pago (Efectivo/Transferencia).
* **Resultado:** La base de datos descuenta las existencias, registra el movimiento en `movimientos_inventario` (Kardex `SALIDA_VENTA`), guarda la venta en `ventas_juguetes` y actualiza la tabla de inmediato.
* **Estado:** **SUPERADO ✅**

---

### Caso 4: Privacidad Financiera para la Secretaria
* **Procedimiento:** Iniciar sesión con rol `ASISTENTE` (ej. Valeria o Jhoan Daner) y navegar a `/inventario`.
* **Resultado:** La asistente puede consultar el catálogo, buscar productos y registrar ventas, pero las columnas de costo, ganancia neta y margen porcentual son completamente omitidas del DOM y de la API.
* **Estado:** **SUPERADO ✅**
