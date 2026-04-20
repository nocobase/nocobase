:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/blocks/data-blocks/form).
:::

# Bloque de formulario

## Introducción

El bloque de formulario es un bloque importante para construir interfaces de entrada y edición de datos. Es altamente personalizable y utiliza los componentes correspondientes para mostrar los campos requeridos basándose en el modelo de datos. A través de flujos de eventos como las reglas de vinculación, el bloque de formulario puede mostrar campos de forma dinámica. Además, puede combinarse con flujos de trabajo para lograr la activación de procesos automatizados y el procesamiento de datos, mejorando aún más la eficiencia del trabajo o logrando la orquestación lógica.

## Añadir bloque de formulario

- **Editar formulario**: se utiliza para modificar datos existentes.
- **Añadir formulario**: se utiliza para crear nuevas entradas de datos.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Opciones de configuración del bloque

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Reglas de vinculación del bloque

Controle el comportamiento del bloque (como si se muestra o si ejecuta JavaScript) a través de las reglas de vinculación.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Para más detalles, consulte [Reglas de vinculación del bloque](/interface-builder/blocks/block-settings/block-linkage-rule)

### Reglas de vinculación de campos

Controle el comportamiento de los campos del formulario a través de las reglas de vinculación.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Para más detalles, consulte [Reglas de vinculación de campos](/interface-builder/blocks/block-settings/field-linkage-rule)

### Diseño

El bloque de formulario admite dos modos de diseño, que se configuran mediante el atributo `layout`:

- **horizontal** (diseño horizontal): este diseño hace que las etiquetas y el contenido se muestren en una sola línea, ahorrando espacio vertical, adecuado para formularios simples o situaciones con poca información.
- **vertical** (diseño vertical) (predeterminado): la etiqueta se ubica sobre el campo; este diseño hace que el formulario sea más fácil de leer y completar, especialmente para formularios que contienen múltiples campos o elementos de entrada complejos.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Configurar campos

### Campos de esta colección

> **Nota**: los campos de las colecciones heredadas (es decir, los campos de la colección padre) se fusionarán y mostrarán automáticamente en la lista de campos actual.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Campos de colecciones relacionadas

> Los campos de colecciones relacionadas son de solo lectura en el formulario y generalmente se usan junto con campos de relación para mostrar múltiples valores de campo de los datos relacionados.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- Actualmente solo admite relaciones de uno a uno (como belongsTo / hasOne, etc.).
- Generalmente se usa con campos de relación (utilizados para seleccionar registros relacionados): el componente de campo de relación es responsable de seleccionar/cambiar el registro relacionado, mientras que el campo de la colección relacionada es responsable de mostrar más información de ese registro (solo lectura).

**Ejemplo**: después de seleccionar un «Responsable», se muestran el número de teléfono, el correo electrónico y otra información de dicho responsable en el formulario.

> En el formulario de edición, incluso si no se ha configurado el campo de relación «Responsable», la información relacionada correspondiente se puede mostrar. Cuando se configura el campo de relación «Responsable», al cambiar el responsable, la información relacionada correspondiente se actualizará al registro correspondiente.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Otros campos

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Escribir JavaScript permite personalizar el contenido de la visualización para mostrar información compleja.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Plantilla de campos

Las plantillas de campos se utilizan para reutilizar la configuración del área de campos en los bloques de formulario. Para más detalles, consulte [Plantilla de campos](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Configurar acciones

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Enviar](/interface-builder/actions/types/submit)
- [Activar flujo de trabajo](/interface-builder/actions/types/trigger-workflow)
- [Acción JS](/interface-builder/actions/types/js-action)
- [Empleado IA](/interface-builder/actions/types/ai-employee)