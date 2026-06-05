:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Base de Datos Vectorial

## Introducción

En una base de conocimiento, la base de datos vectorial almacena los documentos vectorizados de la misma. Estos documentos vectorizados funcionan como un índice para los documentos.

Cuando la recuperación RAG está habilitada en una conversación con un agente de IA, el mensaje del usuario se vectoriza. Luego, se recuperan fragmentos de documentos de la base de conocimiento desde la base de datos vectorial para encontrar párrafos de documentos relevantes y el texto original.

Actualmente, el **plugin** de Base de Conocimiento para IA solo ofrece soporte integrado para PGVector, un **plugin** de base de datos PostgreSQL.

## Gestión de Bases de Datos Vectoriales

Vaya a la página de configuración del **plugin** de Agente de IA, haga clic en la pestaña `Vector store` y luego seleccione `Vector database` para acceder a la página de gestión de bases de datos vectoriales.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Haga clic en el botón `Add new` en la esquina superior derecha para añadir una nueva conexión a una base de datos vectorial `PGVector`:

- En el campo `Name`, introduzca el nombre de la conexión.
- En el campo `Host`, introduzca la dirección IP de la base de datos vectorial.
- En el campo `Port`, introduzca el número de puerto de la base de datos vectorial.
- En el campo `Username`, introduzca el nombre de usuario de la base de datos vectorial.
- En el campo `Password`, introduzca la contraseña de la base de datos vectorial.
- En el campo `Database`, introduzca el nombre de la base de datos.
- En el campo `Table name`, introduzca el nombre de la tabla que se usará al crear una nueva tabla para almacenar datos vectoriales.

Después de introducir toda la información necesaria, haga clic en el botón `Test` para comprobar si el servicio de la base de datos vectorial está disponible y, a continuación, haga clic en el botón `Submit` para guardar la información de conexión.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)