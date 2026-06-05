:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Bloque Markdown

## Introducción

El bloque Markdown no necesita vincularse a una fuente de datos. Permite definir contenido de texto utilizando la sintaxis Markdown para mostrar texto formateado.

## Añadir un bloque

Puede añadir un bloque Markdown a una página o a una ventana emergente.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

También puede añadir un bloque Markdown en línea (inline-block) dentro de los bloques de Formulario y Detalles.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Motor de plantillas

Utiliza el **[motor de plantillas Liquid](https://liquidjs.com/tags/overview.html)** para ofrecer capacidades de renderizado de plantillas potentes y flexibles, permitiendo que el contenido se genere y se muestre de forma dinámica y personalizada. Con este motor de plantillas, usted puede:

-   **Interpolación dinámica**: Utilice marcadores de posición en la plantilla para referenciar variables. Por ejemplo, `{{ ctx.user.userName }}` se reemplaza automáticamente por el nombre de usuario correspondiente.
-   **Renderizado condicional**: Admite sentencias condicionales (`{% if %}...{% else %}`), mostrando contenido diferente según los distintos estados de los datos.
-   **Iteración**: Utilice `{% for item in list %}...{% endfor %}` para iterar sobre arrays o colecciones y generar listas, tablas o módulos repetitivos.
-   **Filtros incorporados**: Ofrece un amplio conjunto de filtros (como `upcase`, `downcase`, `date`, `truncate`, etc.) para formatear y procesar datos.
-   **Extensibilidad**: Permite variables y funciones personalizadas, haciendo que la lógica de la plantilla sea reutilizable y mantenible.
-   **Seguridad y aislamiento**: El renderizado de plantillas se ejecuta en un entorno aislado (sandbox), evitando la ejecución directa de código peligroso y mejorando la seguridad.

Gracias al motor de plantillas Liquid, los desarrolladores y creadores de contenido pueden **lograr fácilmente la visualización dinámica de contenido, la generación personalizada de documentos y el renderizado de plantillas para estructuras de datos complejas**, mejorando significativamente la eficiencia y la flexibilidad.

## Uso de variables

El Markdown en una página admite variables de sistema comunes (como el usuario actual, el rol actual, etc.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Mientras que el Markdown en una ventana emergente de acción de fila de bloque (o subpágina) admite más variables de contexto de datos (como el registro actual, el registro de la ventana emergente actual, etc.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## Código QR

Se pueden configurar códigos QR en Markdown.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```