:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Base de Conocimiento

## Introducción

La base de conocimiento es fundamental para la recuperación RAG. Organiza los documentos por categoría y construye un índice. Cuando un empleado de IA responde a una pregunta, buscará las respuestas prioritariamente en la base de conocimiento.

## Gestión de la Base de Conocimiento

Vaya a la página de configuración del **plugin** de empleados de IA y haga clic en la pestaña `Knowledge base` para acceder a la página de gestión de la base de conocimiento.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Haga clic en el botón `Add new` en la esquina superior derecha para añadir una base de conocimiento `Local`.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Introduzca la información necesaria para la nueva base de conocimiento:

- En el campo `Name`, introduzca el nombre de la base de conocimiento.
- En `File storage`, seleccione la ubicación de almacenamiento de archivos.
- En `Vector store`, seleccione el almacén de vectores. Para más detalles, consulte [Almacén de Vectores](/ai-employees/knowledge-base/vector-store).
- En el campo `Description`, introduzca la descripción de la base de conocimiento.

Haga clic en el botón `Submit` para crear la base de conocimiento.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Gestión de Documentos de la Base de Conocimiento

Después de crear la base de conocimiento, en la página de lista de bases de conocimiento, haga clic en la que acaba de crear para acceder a la página de gestión de documentos de la base de conocimiento.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/2025100527.png)

Haga clic en el botón `Upload` para subir documentos. Una vez que los documentos se hayan subido, la vectorización comenzará automáticamente. Espere a que el `Status` cambie de `Pending` a `Success`.

Actualmente, la base de conocimiento admite los siguientes tipos de documentos: txt, pdf, doc, docx, ppt, pptx. Tenga en cuenta que los archivos PDF solo admiten texto plano.

![20251023100901](https://static-docs.nocobase.com/2025100901.png)

## Tipos de Base de Conocimiento

### Base de Conocimiento Local

Una base de conocimiento Local es aquella que NocoBase almacena localmente. Tanto los documentos como sus datos vectoriales se guardan de forma local en NocoBase.

![20251023101620](https://static-docs.nocobase.com/2025101620.png)

### Base de Conocimiento de Solo Lectura

Una base de conocimiento de Solo Lectura es aquella en la que los documentos y los datos vectoriales se mantienen externamente. En NocoBase, solo se crea una conexión a la base de datos vectorial (actualmente, solo se admite PGVector).

![20251023101743](https://static-docs.nocobase.com/2025101743.png)

### Base de Conocimiento Externa

Una base de conocimiento Externa es aquella en la que los documentos y los datos vectoriales se mantienen fuera de NocoBase. Para la recuperación de la base de datos vectorial, los desarrolladores deben implementar extensiones, lo que permite utilizar bases de datos vectoriales que NocoBase no admite actualmente.

![20251023101949](https://static-docs.nocobase.com/2025101949.png)