---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Base de Datos Principal

## Introducción

La base de datos principal de NocoBase se puede utilizar tanto para almacenar datos de negocio como los metadatos de la aplicación, incluyendo datos de tablas del sistema y datos de tablas personalizadas. La base de datos principal es compatible con bases de datos relacionales como MySQL, PostgreSQL, entre otras. Al instalar la aplicación NocoBase, la base de datos principal se instala de forma síncrona y no se puede eliminar.

## Instalación

Es un plugin integrado, no requiere instalación adicional.

## Gestión de Colecciones

La fuente de datos principal ofrece una funcionalidad completa de gestión de colecciones, permitiéndole crear nuevas tablas a través de NocoBase y sincronizar estructuras de tablas ya existentes desde la base de datos.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Sincronización de tablas existentes desde la base de datos

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Una característica importante de la fuente de datos principal es la capacidad de sincronizar tablas ya existentes en la base de datos con NocoBase para su gestión. Esto significa:

- **Proteger la inversión existente**: Si ya tiene numerosas tablas de negocio en su base de datos, no es necesario recrearlas; puede sincronizarlas y utilizarlas directamente.
- **Integración flexible**: Las tablas creadas con otras herramientas (como scripts SQL, herramientas de gestión de bases de datos, etc.) pueden integrarse en la gestión de NocoBase.
- **Migración progresiva**: Permite migrar sistemas existentes a NocoBase de forma gradual, en lugar de una refactorización completa de una sola vez.

A través de la función "Cargar desde la base de datos", usted puede:
1. Explorar todas las tablas en la base de datos
2. Seleccionar las tablas que necesita sincronizar
3. Identificar automáticamente las estructuras de las tablas y los tipos de campos
4. Importarlas a NocoBase para su gestión con un solo clic

### Soporte para múltiples tipos de colecciones

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase permite crear y gestionar varios tipos de colecciones:
- **Colección general**: incluye campos de sistema de uso común;
- **Colección de herencia**: permite la creación de una tabla padre de la que se pueden derivar tablas hijas. Las tablas hijas heredan la estructura de la tabla padre y pueden definir sus propias columnas.
- **Colección de árbol**: tabla con estructura de árbol, actualmente solo soporta el diseño de lista de adyacencia;
- **Colección de calendario**: para crear tablas de eventos relacionadas con calendarios;
- **Colección de archivos**: para la gestión del almacenamiento de archivos;
- **Colección de expresiones**: para escenarios de expresiones dinámicas en flujos de trabajo;
- **Colección SQL**: no es una tabla de base de datos real, sino que presenta rápidamente consultas SQL de forma estructurada;
- **Colección de vista de base de datos**: se conecta a vistas de base de datos existentes;
- **Colección FDW**: permite al sistema de base de datos acceder y consultar directamente datos en fuentes de datos externas, basada en la tecnología FDW;

### Soporte para la gestión de clasificación de colecciones

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Tipos de campos enriquecidos

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Conversión flexible de tipos de campo

NocoBase permite una conversión flexible de tipos de campo basada en el mismo tipo de base de datos.

**Ejemplo: Opciones de conversión para campos de tipo String**

Cuando un campo de la base de datos es de tipo String, se puede convertir a cualquiera de las siguientes formas en NocoBase:

- **Básicos**: Texto de una línea, Texto largo, Teléfono, Correo electrónico, URL, Contraseña, Color, Icono
- **Opciones**: Menú desplegable (selección única), Grupo de radio
- **Multimedia**: Markdown, Markdown (Vditor), Texto enriquecido, Adjunto (URL)
- **Fecha y hora**: Fecha y hora (con zona horaria), Fecha y hora (sin zona horaria)
- **Avanzados**: Secuencia, Selector de colección, Cifrado

Este mecanismo de conversión flexible significa:
- **No se requiere modificar la estructura de la base de datos**: El tipo de almacenamiento subyacente del campo permanece inalterado; solo cambia su representación en NocoBase.
- **Adaptación a los cambios del negocio**: A medida que evolucionan las necesidades del negocio, usted puede ajustar rápidamente la visualización y los métodos de interacción de los campos.
- **Seguridad de los datos**: El proceso de conversión no afecta la integridad de los datos existentes.

### Sincronización flexible a nivel de campo

NocoBase no solo sincroniza tablas completas, sino que también soporta una gestión de sincronización granular a nivel de campo:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Características de la sincronización de campos:

1. **Sincronización en tiempo real**: Cuando la estructura de la tabla de la base de datos cambia, los campos recién añadidos se pueden sincronizar en cualquier momento.
2. **Sincronización selectiva**: Usted puede sincronizar selectivamente los campos que necesita, en lugar de todos los campos.
3. **Reconocimiento automático de tipos**: Identifica automáticamente los tipos de campo de la base de datos y los mapea a los tipos de campo de NocoBase.
4. **Mantenimiento de la integridad de los datos**: El proceso de sincronización no afecta los datos existentes.

#### Casos de uso:

- **Evolución del esquema de la base de datos**: Cuando las necesidades del negocio cambian y se necesitan añadir nuevos campos a la base de datos, estos se pueden sincronizar rápidamente con NocoBase.
- **Colaboración en equipo**: Cuando otros miembros del equipo o DBAs añaden campos a la base de datos, se pueden sincronizar de inmediato.
- **Modo de gestión híbrido**: Algunos campos se gestionan a través de NocoBase, otros a través de métodos tradicionales, permitiendo combinaciones flexibles.

Este mecanismo de sincronización flexible permite que NocoBase se integre perfectamente en las arquitecturas técnicas existentes, sin requerir cambios en las prácticas de gestión de bases de datos existentes, mientras se disfruta de la comodidad del desarrollo de bajo código que NocoBase ofrece.

Consulte más en la sección 「[Campos de colección / Resumen](/data-sources/data-modeling/collection-fields)」