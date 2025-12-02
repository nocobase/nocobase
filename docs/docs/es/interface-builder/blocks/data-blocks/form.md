:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Bloque de Formulario

## Introducción

El bloque de Formulario es un componente fundamental para construir interfaces de entrada y edición de datos. Es altamente personalizable y utiliza los componentes correspondientes para mostrar los campos necesarios según su modelo de datos. A través de flujos de eventos, como las reglas de vinculación, el bloque de Formulario puede mostrar campos de forma dinámica. Además, puede combinarse con flujos de trabajo para activar procesos automatizados y procesar datos, lo que mejora aún más la eficiencia del trabajo o permite la orquestación lógica.

## Añadir Bloque de Formulario

-   **Editar formulario**: Se utiliza para modificar datos existentes.
-   **Añadir formulario**: Se utiliza para crear nuevas entradas de datos.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Configuración del Bloque

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Reglas de Vinculación del Bloque

Controle el comportamiento del bloque (como si se muestra o si ejecuta JavaScript) a través de las reglas de vinculación.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

Para más detalles, consulte [Reglas de Vinculación del Bloque](/interface-builder/blocks/block-settings/block-linkage-rule)

### Reglas de Vinculación de Campos

Controle el comportamiento de los campos del formulario a través de las reglas de vinculación.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

Para más detalles, consulte [Reglas de Vinculación de Campos](/interface-builder/blocks/block-settings/field-linkage-rule)

### Diseño

El bloque de Formulario admite dos modos de diseño, que se pueden configurar mediante el atributo `layout`:

-   **horizontal** (diseño horizontal): Este diseño muestra la etiqueta y el contenido en una sola línea, lo que ahorra espacio vertical. Es ideal para formularios sencillos o situaciones con poca información.
-   **vertical** (diseño vertical) (predeterminado): La etiqueta se coloca encima del campo. Este diseño hace que el formulario sea más fácil de leer y completar, especialmente para formularios con múltiples campos o elementos de entrada complejos.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Configurar Campos

### Campos de esta Colección

> **Nota**: Los campos de las colecciones heredadas (es decir, los campos de la colección padre) se fusionan y muestran automáticamente en la lista de campos actual.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Otros Campos

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

-   Escriba JavaScript para personalizar el contenido de la visualización y mostrar información compleja.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Configurar Acciones

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

-   [Enviar](/interface-builder/actions/types/submit)
-   [Activar flujo de trabajo](/interface-builder/actions/types/trigger-workflow)
-   [Acción JS](/interface-builder/actions/types/js-action)
-   [Empleado IA](/interface-builder/actions/types/ai-employee)