# Capítulo 2: Modelado de datos — dos tablas para el sistema de tickets

En el capítulo anterior instalamos NocoBase y conocimos la interfaz. Ahora vamos a construir el esqueleto del sistema de tickets: definir el **modelo de datos**.

Este capítulo creará dos [tablas de datos](/data-sources/data-modeling/collection) (tickets y categorías), configurará los [tipos de Field](/data-sources/data-modeling/collection-fields) (texto en una línea, lista desplegable, [muchos a uno](/data-sources/data-modeling/collection-fields/associations/m2o), etc.) y establecerá las relaciones entre tablas. El modelo de datos es la base del sistema: pensar primero qué datos almacenar y qué relaciones tienen, hace que después construir la interfaz y configurar permisos resulte natural.


## 2.1 Qué son las tablas de datos y los Field

Si ha usado Excel, entender las tablas de datos resulta sencillo:

| Concepto en Excel | Concepto en NocoBase | Descripción |
|-------------------|----------------------|-------------|
| Hoja | Tabla de datos (Collection) | Un contenedor de un tipo de datos |
| Encabezado de columna | Field | Atributo que describe los datos |
| Cada fila | Registro (Record) | Un dato concreto |

![02-data-modeling-2026-03-11-08-32-41](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-32-41.png)

Por ejemplo, la "tabla de tickets" que vamos a hacer es como una hoja de Excel: cada columna es un Field (título, estado, prioridad...) y cada fila es un registro de ticket.

Pero NocoBase es mucho más potente que Excel. Admite varios **tipos de tabla de datos**, y cada tipo trae capacidades distintas:

| Tipo de tabla | Escenarios adecuados | Ejemplos |
|---------------|----------------------|----------|
| **Tabla normal** | La mayoría de datos de negocio | Tickets, pedidos, clientes |
| **Tabla en árbol** | Datos con jerarquía | Catálogos de categorías, organigramas departamentales |
| Tabla de calendario | Eventos por fecha | Reuniones, turnos |
| Tabla de archivos | Gestión de adjuntos | Documentos, imágenes |

Hoy usaremos **tablas normales** y **tablas en árbol**; los demás tipos se aprenden cuando se necesitan.

**Acceder a la gestión de fuentes de datos**: haga clic en el icono **«Gestión de fuentes de datos»** de la esquina inferior izquierda (icono de base de datos junto al engranaje). Verá la «[fuente de datos principal](/data-sources)» — todas nuestras tablas se crearán aquí.

![02-data-modeling-2026-03-11-08-35-08](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-35-08.png)


## 2.2 Crear la tabla principal: Tickets

Vamos al grano: primero creemos la tabla central del sistema, la tabla de tickets.

### Crear la tabla

1. En la página de gestión de fuentes de datos, haga clic en **Fuente de datos principal** para entrar

![02-data-modeling-2026-03-11-08-36-06](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-36-06.png)

2. Haga clic en **«Crear tabla de datos»** y seleccione **«Tabla normal»**

![02-data-modeling-2026-03-11-08-38-52](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-38-52.png)

3. Nombre de la tabla: `tickets`, Título de la tabla: `Tickets`

![02-data-modeling-2026-03-11-08-40-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-40-34.png)

Al crear la tabla, el sistema marcará por defecto un grupo de **Field del sistema** que registrarán automáticamente los metadatos de cada registro:

| Field | Descripción |
|-------|-------------|
| ID | Clave primaria, identificador único distribuido |
| Fecha de creación | Momento en que se creó el registro |
| Creado por | Quién creó este registro |
| Fecha de última modificación | Última vez que se actualizó |
| Modificado por última vez | Usuario que realizó la última actualización |

Estos Field del sistema pueden mantenerse por defecto, no necesita gestionarlos manualmente. Si en algún escenario no los necesita, también puede desmarcarlos.

### Añadir Field básicos

La tabla está creada, ahora añadamos los Field. Haga clic en **«Configurar campos (Configure fields)»** de la tabla de tickets, y verá los Field del sistema que se marcaron por defecto ya en la lista.

![02-data-modeling-2026-03-11-08-58-48](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-58-48.png)

![02-data-modeling-2026-03-11-08-59-47](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-08-59-47.png)

Haga clic en el botón **«Añadir campo (Add field)»** de la esquina superior derecha; se desplegará una lista de tipos de Field — seleccione el tipo que desea añadir.

![02-data-modeling-2026-03-11-09-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-00-22.png)

Primero añadiremos los Field propios del ticket; los Field de relación los añadiremos más adelante.

**1. Título (texto en una línea)**

Cada ticket necesita un título corto que resuma el problema. Haga clic en **«Añadir campo»** y seleccione **[«Texto en una línea»](/data-sources/data-modeling/collection-fields/basic/input)**:

![02-data-modeling-2026-03-11-09-01-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-01-00.png)

- Nombre del campo: `title`, Título del campo: `Título`
- Haga clic en **«Configurar reglas de validación»** y añada una regla **«Obligatorio»**

![02-data-modeling-2026-03-11-09-02-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-02-40.png)

**2. Descripción (Markdown(Vditor))**

Para describir el problema con detalle, con soporte de formato, imágenes y código. En «Añadir campo» → categoría «Media» hay tres opciones:

| Tipo de campo | Características |
|---------------|-----------------|
| Markdown | Markdown básico, estilos simples |
| Rich Text | Texto enriquecido, estilos simples + carga de adjuntos |
| **Markdown(Vditor)** | El más completo, con tres modos: WYSIWYG, renderizado en tiempo real y edición de código fuente |

Elegimos **Markdown(Vditor)**.

![02-data-modeling-2026-03-11-09-09-58](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-09-58.png)

- Nombre del campo: `description`, Título del campo: `Descripción`

![02-data-modeling-2026-03-11-09-10-50](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-10-50.png)

**3. Estado (lista desplegable - selección única)**

![02-data-modeling-2026-03-11-09-12-00](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-12-00.png)
Desde el envío hasta la finalización, el ticket necesita un estado para seguir su progreso.

- Nombre del campo: `status`, Título del campo: `Estado`
- Añada los valores de las opciones (cada opción requiere «valor de la opción» y «etiqueta de la opción», color opcional):

| Valor | Etiqueta | Color |
|-------|----------|-------|
| pending | Pendiente | Orange (Atardecer) |
| in_progress | En proceso | Blue (Azul amanecer) |
| completed | Completado | Green (Verde aurora) |

![02-data-modeling-2026-03-11-09-17-44](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-17-44.png)

Rellene primero las opciones y guarde. Luego haga clic de nuevo en **«Editar (Edit)»** del campo, y ya podrá seleccionar **«Pendiente»** en «Valor por defecto».

![02-data-modeling-2026-03-11-09-20-28](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-20-28.png)

![02-data-modeling-2026-03-11-09-22-34](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-22-34.png)

> En la primera creación aún no hay datos de opciones, por lo que no se puede elegir el valor por defecto — debe guardar primero y volver a configurarlo.

> ¿Por qué selección única en desplegable? Porque el estado es un conjunto fijo de valores; la [lista desplegable](/data-sources/data-modeling/collection-fields/choices/select) impide que los usuarios introduzcan datos arbitrarios y garantiza la coherencia.

**4. Prioridad (lista desplegable - selección única)**

Para distinguir la urgencia de los tickets y permitir al personal de procesamiento ordenarlos por prioridad.

- Nombre del campo: `priority`, Título del campo: `Prioridad`
- Añada los valores:

| Valor | Etiqueta | Color |
|-------|----------|-------|
| low | Baja | |
| medium | Media | |
| high | Alta | Orange (Atardecer) |
| urgent | Urgente | Red (Crepúsculo) |

Hasta aquí, la tabla de tickets tiene 4 Field básicos. Pero — un ticket debería tener una "categoría", ¿verdad? ¿Como "problemas de red" o "fallos de software"?

Si hacemos la categoría con una lista desplegable, también funciona. Pero pronto descubriremos: las categorías pueden tener subcategorías ("problemas de hardware" puede tener "monitor", "teclado", "impresora"), y la lista desplegable se queda corta.

Necesitamos **otra tabla** dedicada a gestionar categorías. Y para esta tabla, lo más adecuado es la **tabla en árbol** de NocoBase.


## 2.3 Crear la tabla en árbol de categorías: jerarquía en categorías

### ¿Qué es una tabla en árbol?

Una tabla en árbol es un tipo especial de tabla de datos que incluye **relación padre-hijo** — cada registro puede tener un "nodo padre". Es perfecta para datos con estructura jerárquica:

```
Problemas de hardware       ← categoría de nivel 1
├── Monitor                 ← categoría de nivel 2
├── Teclado y ratón
└── Impresora
Fallo de software
├── Software de oficina
└── Problemas del sistema
Problemas de red
Permisos de cuenta
```

Si usa una tabla normal, debe crear manualmente un campo "categoría padre" para implementar esta relación. La **tabla en árbol gestiona esto automáticamente**, además admite visualización en árbol, añadir registros hijos y otras operaciones, lo que ahorra mucho trabajo.

### Crear la tabla

1. Vuelva a la gestión de fuentes de datos y haga clic en **«Crear tabla de datos»**
2. Esta vez seleccione **«Tabla en árbol»** (¡no tabla normal!)
![02-data-modeling-2026-03-11-09-26-07](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-07.png)

3. Nombre de la tabla: `categories`, Título de la tabla: `Categorías de tickets`

![02-data-modeling-2026-03-11-09-26-55](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-26-55.png)

> Tras la creación, además de los Field del sistema aparecerán automáticamente dos Field de relación: **«Parent»** y **«Children»** — esta es la capacidad especial de la tabla en árbol. A través de Parent puede acceder al nodo padre, y a través de Children a todos los hijos, sin necesidad de añadirlos manualmente.

![02-data-modeling-2026-03-11-09-27-40](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-27-40.png)

### Añadir Field

Haga clic en **«Configurar campos»** para entrar a la lista de Field; verá los Field del sistema y los Field Parent y Children generados automáticamente.
Haga clic en **«Añadir campo»** en la esquina superior derecha:

**Field 1: Nombre de la categoría**

1. Seleccione **«Texto en una línea»**
2. Nombre del campo: `name`, Título del campo: `Nombre de la categoría`
3. Haga clic en **«Configurar reglas de validación»** y añada la regla **«Obligatorio»**

**Field 2: Color**

1. Seleccione **«Color»**
2. Nombre del campo: `color`, Título del campo: `Color`

![02-data-modeling-2026-03-11-09-28-59](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-28-59.png)

El campo de color permite que cada categoría tenga su color distintivo, lo que será más visual al mostrarlo en la interfaz.

![02-data-modeling-2026-03-11-09-29-23](https://static-docs.nocobase.com/02-data-modeling-2026-03-11-09-29-23.png)

Hasta aquí, los Field básicos de las dos tablas están configurados. Ahora vamos a relacionarlas.


## 2.4 Volver a la tabla de tickets: añadir Field de relación

> **Los Field de relación pueden resultar abstractos al principio.** Si le cuesta entenderlos, puede saltar al [Capítulo 3: Construcción de páginas](./03-building-pages), comprenderlo en la práctica viendo cómo se muestran los datos, y luego volver a añadir los Field de relación.

Los tickets necesitan relacionarse con la categoría, el remitente y el responsable. Este tipo de Field se llama **Field de relación**: a diferencia del "título", que almacena directamente texto, almacena el ID de un registro de otra tabla y mediante ese ID encuentra el registro correspondiente.

Veámoslo con un ticket concreto: a la izquierda están los atributos del ticket; entre ellos "categoría" y "remitente" no almacenan texto sino un ID. El sistema, a través de ese ID, localiza con precisión el registro correspondiente en la tabla de la derecha:


![02-data-modeling-2026-03-12-00-50-10](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-50-10.png)

Lo que ve en la interfaz es el nombre ("Problemas de red", "Zhang San"), pero por debajo se relaciona mediante un ID. **Múltiples tickets pueden apuntar a la misma categoría o al mismo usuario** — esta relación se denomina [**muchos a uno**](/data-sources/data-modeling/collection-fields/associations/m2o).

### Añadir Field de relación

Vuelva a «Configurar campos» de la tabla de tickets → «Añadir campo» y seleccione **«Muchos a uno»**.
![02-data-modeling-2026-03-12-00-52-39](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-52-39.png)

Al crear el Field verá estas opciones de configuración:

| Configuración | Descripción | Cómo rellenar |
|---------------|-------------|---------------|
| Tabla origen | Tabla actual (rellenada automáticamente) | No la modifique |
| **Tabla de destino** | A qué tabla se relaciona | Seleccione la tabla correspondiente |
| **Clave externa** | Nombre de la columna de relación en la tabla actual | Use un nombre con significado |
| Field identificador de la tabla destino | `id` por defecto | Mantenga el valor por defecto |
| ON DELETE | Comportamiento cuando se elimina el registro destino | Mantenga el valor por defecto |

![02-data-modeling-2026-03-12-00-58-38](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-00-58-38.png)

> La clave externa se generará automáticamente con un nombre aleatorio (como `f_xxxxx`); se recomienda cambiarlo a un nombre con significado para facilitar el mantenimiento. Use letras minúsculas con guiones bajos (como `category_id`), no mayúsculas mezcladas.

Añada los tres Field de la siguiente manera:

**5. Categoría → tabla de Categorías de tickets**

- Título del campo: `Categoría`
- Tabla de destino: seleccione **«Categorías de tickets»** (si no aparece en la lista, escriba el nombre directamente y se creará automáticamente)
- Clave externa: `category_id`

**6. Remitente → tabla de Usuarios**

Registra quién envió este ticket. NocoBase incluye una tabla de usuarios integrada, simplemente relaciónela.

- Título del campo: `Remitente`
- Tabla de destino: seleccione **«Usuarios»**
- Clave externa: `submitter_id`
![02-data-modeling-2026-03-12-01-00-09](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-09.png)

**7. Responsable → tabla de Usuarios**

Registra quién está a cargo de procesar este ticket.

- Título del campo: `Responsable`
- Tabla de destino: seleccione **«Usuarios»**
- Clave externa: `assignee_id`

![02-data-modeling-2026-03-12-01-00-22](https://static-docs.nocobase.com/02-data-modeling-2026-03-12-01-00-22.png)


## 2.5 Vista general del modelo de datos

Repasemos el modelo de datos completo que hemos construido:

![02-data-modeling-2026-03-16-00-30-35](https://static-docs.nocobase.com/02-data-modeling-2026-03-16-00-30-35.png)

`}o--||` representa una relación de muchos a uno: a la izquierda "muchos", a la derecha "uno".


## Resumen

En este capítulo hemos completado el modelado de datos — el esqueleto del sistema de tickets:

1. **Tabla de tickets** (tickets): 4 Field básicos + 3 Field de relación, creada con **tabla normal**
2. **Tabla de categorías de tickets** (categories): 2 Field personalizados + Field automáticos Parent/Children, creada con **tabla en árbol**, con jerarquía nativa

Hemos aprendido varios conceptos importantes:

- **Tabla de datos (Collection)** = un contenedor de un tipo de datos
- **Tipo de tabla** = elija el tipo según el escenario (tabla normal, tabla en árbol, etc.)
- **Field** = atributos de los datos, se crean mediante «Configurar campos» → «Añadir campo»
- **Field del sistema** = ID, fecha de creación, creado por, etc., marcados automáticamente al crear la tabla
- **Field de relación (muchos a uno)** = apunta a un registro de otra tabla, establece relaciones entre tablas

> Puede que note que en las capturas posteriores ya hay datos — son datos de prueba que cargamos previamente para mostrar el efecto, no se preocupe. En NocoBase, todas las operaciones CRUD se realizan a través de las páginas frontend. En el Capítulo 3 construiremos la tabla para mostrar los datos, en el Capítulo 4 el formulario para introducirlos, lo iremos viendo paso a paso.


## Avance del próximo capítulo

El esqueleto está montado, pero ahora solo tenemos tablas vacías. En el próximo capítulo vamos a construir páginas para que los datos puedan mostrarse de verdad.

¡Nos vemos en el próximo capítulo!

## Recursos relacionados

- [Resumen de fuentes de datos](/data-sources) — Conceptos clave del modelado de datos en NocoBase
- [Field de tabla](/data-sources/data-modeling/collection-fields) — Detalles de todos los tipos de Field
- [Relación muchos a uno](/data-sources/data-modeling/collection-fields/associations/m2o) — Configuración de relaciones
