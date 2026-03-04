---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/ui-templates).
:::

# Plantillas de UI

## Introducción

Las plantillas de interfaz de usuario (UI) se utilizan para reutilizar las configuraciones en la construcción de interfaces, reduciendo la configuración repetitiva y manteniendo múltiples configuraciones sincronizadas cuando sea necesario.

Actualmente, los tipos de plantillas compatibles incluyen:

- **Plantilla de bloque**: Reutiliza configuraciones completas de bloques.
- **Plantilla de campo**: Reutiliza la configuración del "área de campos" en bloques de formulario o de detalles.
- **Plantilla de ventana emergente**: Reutiliza configuraciones de ventanas emergentes activadas por acciones o campos.

## Conceptos básicos

### Referencia y Copia

Normalmente existen dos formas de utilizar las plantillas:

- **Referencia**: Varios lugares comparten la misma configuración de plantilla; al modificar la plantilla o cualquier punto de referencia, las actualizaciones se sincronizarán en todos los demás puntos de referencia.
- **Copia**: Se duplica como una configuración independiente; las modificaciones posteriores no se afectan entre sí.

### Guardar como plantilla

Cuando un bloque o ventana emergente ya está configurado, usted puede usar la opción `Guardar como plantilla` en su menú de configuración y elegir el método de guardado:

- **Convertir el actual... en plantilla**: Después de guardar, la posición actual cambiará a una forma que hace referencia a esa plantilla.
- **Copiar el actual... como plantilla**: Solo crea la plantilla; la posición actual permanece sin cambios.

## Plantilla de bloque

### Guardar bloque como plantilla

1) Abra el menú de configuración del bloque de destino y haga clic en `Guardar como plantilla`.  
2) Complete el `Nombre de la plantilla` / `Descripción de la plantilla` y elija el modo de guardado:
   - **Convertir bloque actual en plantilla**: Después de guardar, la posición actual se reemplazará por un bloque de tipo `Plantilla de bloque` (es decir, haciendo referencia a esa plantilla).
   - **Copiar bloque actual como plantilla**: Solo crea la plantilla; el bloque actual permanece sin cambios.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Usar plantilla de bloque

1) Añadir bloque → "Otros bloques" → `Plantilla de bloque`.  
2) En la configuración, seleccione:
   - **Plantilla**: Elija una plantilla.
   - **Modo**: `Referencia` o `Copia`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Convertir referencia en copia

Cuando un bloque está haciendo referencia a una plantilla, usted puede usar la opción `Convertir referencia en copia` en el menú de configuración del bloque para cambiar el bloque actual a un bloque normal (desconectando la referencia); las modificaciones posteriores no se afectarán entre sí.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Notas

- El modo `Copia` regenerará los UID para el bloque y sus nodos hijos; es posible que algunas configuraciones que dependen de los UID deban reconfigurarse.

## Plantilla de campo

Las plantillas de campo se utilizan para reutilizar las configuraciones del área de campos (selección de campos, diseño y configuración de campos) en **bloques de formulario** y **bloques de detalles**, evitando la adición repetitiva de campos en múltiples páginas o bloques.

> Las plantillas de campo solo afectan al "área de campos" y no reemplazan el bloque completo. Para reutilizar un bloque completo, utilice la Plantilla de bloque descrita anteriormente.

### Usar plantilla de campo en bloques de formulario/detalles

1) Entre en el modo de configuración, abra el menú "Campos" en un bloque de formulario o de detalles.  
2) Seleccione `Plantilla de campo`.  
3) Elija una plantilla y seleccione el modo: `Referencia` o `Copia`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Aviso de sobrescritura

Cuando ya existen campos en el bloque, el uso del modo **Referencia** generalmente solicitará una confirmación (porque los campos referenciados reemplazarán el área de campos actual).

### Convertir campos referenciados en copia

Cuando un bloque está haciendo referencia a una plantilla de campo, usted puede usar la opción `Convertir campos referenciados en copia` en el menú de configuración del bloque para que el área de campos actual sea una configuración independiente (desconectando la referencia); las modificaciones posteriores no se afectarán entre sí.

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Notas

- Las plantillas de campo solo se aplican a **bloques de formulario** y **bloques de detalles**.
- Cuando la plantilla y el bloque actual están vinculados a diferentes tablas de datos, la plantilla se mostrará como no disponible en el selector y se indicará el motivo.
- Si desea realizar "ajustes personalizados" en los campos del bloque actual, se recomienda utilizar el modo `Copia` directamente, o ejecutar primero "Convertir campos referenciados en copia".

## Plantilla de ventana emergente

Las plantillas de ventana emergente se utilizan para reutilizar un conjunto de interfaces de ventana emergente y lógica de interacción. Para configuraciones generales como el método de apertura y el tamaño de la ventana emergente, consulte [Editar ventana emergente](/interface-builder/actions/action-settings/edit-popup).

### Guardar ventana emergente como plantilla

1) Abra el menú de configuración de un botón o campo que pueda activar una ventana emergente y haga clic en `Guardar como plantilla`.  
2) Complete el nombre/descripción de la plantilla y elija el modo de guardado:
   - **Convertir ventana emergente actual en plantilla**: Después de guardar, la ventana emergente actual cambiará a una referencia de esa plantilla.
   - **Copiar ventana emergente actual como plantilla**: Solo crea la plantilla; la ventana emergente actual permanece sin cambios.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Usar plantilla en la configuración de ventana emergente

1) Abra la configuración de la ventana emergente del botón o campo.  
2) Seleccione una plantilla en `Plantilla de ventana emergente` para reutilizarla.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Condiciones de uso (Alcance de disponibilidad de la plantilla)

Las plantillas de ventana emergente están relacionadas con el escenario de la acción que activa la ventana. El selector filtrará o desactivará automáticamente las plantillas incompatibles según el escenario actual (mostrando los motivos cuando no se cumplan las condiciones).

| Tipo de acción actual | Plantillas de ventana emergente disponibles |
| --- | --- |
| **Acción de colección** | Plantillas creadas por acciones de colección de la misma colección |
| **Acción de registro sin asociación** | Plantillas creadas por acciones de colección o acciones de registro sin asociación de la misma colección |
| **Acción de registro con asociación** | Plantillas creadas por acciones de colección o acciones de registro sin asociación de la misma colección; o plantillas creadas por acciones de registro con asociación del mismo campo de asociación |

### Ventanas emergentes de datos de asociación

Las ventanas emergentes activadas por datos de asociación (campos de asociación) tienen reglas de coincidencia especiales:

#### Coincidencia estricta para plantillas de asociación

Cuando se crea una plantilla de ventana emergente a partir de una **acción de registro con asociación** (la plantilla tiene un `associationName`), esa plantilla solo puede ser utilizada por acciones o campos con el **mismo campo de asociación exacto**.

Por ejemplo: una plantilla creada en el campo de asociación `Pedido.Cliente` solo puede ser utilizada por otras acciones del campo de asociación `Pedido.Cliente`. No puede ser utilizada por el campo de asociación `Pedido.Referidor` (incluso si ambos apuntan a la misma tabla de datos `Cliente`).

Esto se debe a que las variables internas y las configuraciones de las plantillas de asociación dependen del contexto específico de la relación de asociación.

#### Acciones de asociación que reutilizan plantillas de la colección de destino

Los campos o acciones de asociación pueden reutilizar **plantillas de ventana emergente sin asociación de la tabla de datos de destino** (plantillas creadas por acciones de colección o acciones de registro sin asociación), siempre que la tabla de datos coincida.

Por ejemplo: el campo de asociación `Pedido.Cliente` puede usar plantillas de ventana emergente de la tabla de datos `Cliente`. Este enfoque es adecuado para compartir la misma configuración de ventana emergente entre múltiples campos de asociación (como una ventana unificada de detalles del cliente).

### Convertir referencia en copia

Cuando una ventana emergente está haciendo referencia a una plantilla, usted puede usar la opción `Convertir referencia en copia` en el menú de configuración para que la ventana emergente actual sea una configuración independiente (desconectando la referencia); las modificaciones posteriores no se afectarán entre sí.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Gestión de plantillas

En Configuración del sistema → `Plantillas de UI`, puede ver y gestionar todas las plantillas:

- **Plantillas de bloque (v2)**: Gestionar plantillas de bloques.
- **Plantillas de ventana emergente (v2)**: Gestionar plantillas de ventanas emergentes.

> Las plantillas de campo se originan a partir de las plantillas de bloque y se gestionan dentro de ellas.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Operaciones admitidas: Ver, Filtrar, Editar, Eliminar.

> **Nota**: Si una plantilla está siendo referenciada actualmente, no se puede eliminar directamente. Primero utilice `Convertir referencia en copia` en las posiciones que referencian esa plantilla para desconectar la referencia y luego elimine la plantilla.