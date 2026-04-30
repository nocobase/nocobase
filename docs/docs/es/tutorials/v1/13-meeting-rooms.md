# Capítulo 12: Reserva de salas de reuniones y Workflow

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114048192480747&bvid=BV1PKPuevEH5&cid=28526840811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

A estas alturas, estamos seguros de que usted ya está bastante familiarizado con **NocoBase**.

En este capítulo, implementaremos juntos un escenario especial: el módulo de gestión de reuniones.

Este módulo incluye funciones como la reserva de salas de reuniones y notificaciones. A lo largo del proceso, construiremos paso a paso, desde cero, un módulo de gestión de reuniones, comenzando por lo básico y avanzando gradualmente hacia funcionalidades más complejas. Empecemos por diseñar la estructura básica de las tablas de datos de este módulo.

---

### 12.1 Diseño de la estructura de las tablas de datos

La estructura de las tablas de datos puede entenderse como el marco básico del módulo de gestión de reuniones. Aquí nos centraremos en la **tabla de salas de reuniones** y la **tabla de reservas**, e introduciremos algunas relaciones nuevas, como la relación [muchos a muchos](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m) con los usuarios.

![](https://static-docs.nocobase.com/Solution/CRuKbVrnroSgGdxaVrBcvzSMnHd.png)

#### 12.1.1 Tabla de salas de reuniones

La tabla de salas de reuniones se utiliza para almacenar la información básica de todas las salas, incluyendo campos como nombre, ubicación, capacidad, configuración, etc.

##### Ejemplo de estructura de la tabla

```json
Salas de reuniones (Rooms)
    ID (clave principal)
    Nombre de la sala (name, texto de una línea)
    Ubicación específica (location, texto multilínea)
    Capacidad (capacity, entero)
    Configuración (equipment, texto multilínea)
```

#### 12.1.2 Tabla de reservas

La tabla de reservas se utiliza para registrar toda la información de reservas de reuniones, incluyendo campos como sala, usuarios participantes, intervalo de tiempo, título y descripción de la reunión.

##### Ejemplo de estructura de la tabla

```json
Reservas (Bookings)
    ID (entero, clave principal única)
    Sala (room, relación muchos a uno, clave foránea room_id asociada al ID de la sala)
    Usuarios (users, muchos a muchos, asociado al ID de usuario)
    Hora de inicio (start_time, fecha y hora)
    Hora de finalización (end_time, fecha y hora)
    Título de la reunión (title, texto de una línea)
    Descripción de la reunión (description, Markdown)
```

##### [Relación muchos a muchos](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)

En la tabla de reservas existe una relación "muchos a muchos": un usuario puede asistir a varias reuniones y una reunión puede tener varios usuarios. Esta relación muchos a muchos requiere configurar correctamente las claves foráneas. Para facilitar la gestión, podemos nombrar la tabla intermedia como **booking_users**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428726.png)

---

### 12.2 Construcción del módulo de gestión de reuniones

Una vez diseñada la estructura de las tablas, podemos crear ambas tablas según el diseño y construir el módulo de "Gestión de reuniones". A continuación se indican los pasos de creación y configuración:

#### 12.2.1 Creación de [bloques de tabla](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)

Primero, agregue el módulo de "Gestión de reuniones" en la página, creando respectivamente un **bloque de tabla de salas de reuniones** y un **[bloque de tabla](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) de reservas**. A continuación cree un [bloque de calendario](https://docs-cn.nocobase.com/handbook/calendar) para la tabla de reservas, con la vista predeterminada configurada como "Día".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428135.png)

##### Configuración de la asociación del bloque de tabla de salas

Asocie el bloque de tabla de salas de reuniones con los otros dos bloques, de modo que se filtren automáticamente los registros de reservas correspondientes a la sala. A continuación, puede probar las funciones de filtrado, creación, eliminación, consulta y modificación, para verificar la interacción básica del módulo.

> 💡 **Conexión de bloques de NocoBase (¡recomendado!)**:
>
> Además del bloque de filtros anterior, nuestros bloques de tabla también pueden conectarse con otros bloques, lo que permite obtener un efecto de filtrado al hacer clic.
>
> Como se muestra en la imagen siguiente, en la configuración de la tabla de salas, conectamos los otros dos bloques de la tabla de reservas (bloque de tabla de reservas y bloque de calendario de reservas).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428280.png)

> Una vez establecida la conexión, al hacer clic en la tabla de salas verá que las otras dos tablas se filtran al mismo tiempo. Vuelva a hacer clic en el elemento seleccionado para deseleccionarlo.
>
> ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429198.gif)

---

### 12.3 Detección de la disponibilidad de las salas

Una vez configurada la página, debemos añadir una función importante: la detección de la disponibilidad de las salas. Esta función comprueba, al crear o actualizar una reunión, si la sala objetivo está ocupada en el intervalo de tiempo especificado, evitando así conflictos de reserva.

![](https://static-docs.nocobase.com/project-management-cn-er.drawio.svg)

#### 12.3.1 Configuración del [Workflow](https://docs-cn.nocobase.com/handbook/workflow) de "Evento previo a la operación"

Para realizar la detección al hacer una reserva, utilizaremos un tipo especial de workflow, el [**Evento previo a la operación**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor):

- [**Evento previo a la operación**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor) (Plugin comercial): ejecuta una serie de operaciones antes de crear, eliminar o modificar datos, pudiendo pausarse e interceptarse en cualquier momento. ¡Este enfoque se asemeja mucho al flujo de desarrollo de código que usamos a diario!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429352.png)

#### 12.3.2 Configuración de los nodos

En el workflow de detección de disponibilidad necesitaremos los siguientes tipos de nodos:

- [**Nodo de cálculo**](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation) (lógica de transformación de datos, para procesar casos de modificación y creación)
- [**Operación SQL**](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql) (ejecutar consultas SQL)
- [**Análisis JSON**](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query) (Plugin comercial, para analizar datos JSON)
- [**Mensaje de respuesta**](https://docs-cn.nocobase.com/handbook/workflow/nodes/response-message) (Plugin comercial, para devolver mensajes informativos)

---

#### 12.3.3 Vinculación de la tabla de reservas y configuración del disparador

Ahora vincularemos la tabla de reservas, seleccionaremos el modo de disparador "Modo global", y elegiremos como tipos de operación la creación y la actualización de registros.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429296.png)

---

### 12.4 Configuración del [nodo de cálculo](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation)

#### 12.4.1 Creación del nodo de cálculo "Convertir ID vacío en -1"

Comenzaremos creando un nodo de cálculo que convierta el ID vacío en -1. El nodo de cálculo permite transformar variables del modo que necesitemos, ofreciendo las tres formas siguientes:

- **Math.js** (consulte [Math.js](https://mathjs.org/))
- **Formula.js** (consulte [Formula.js](https://formulajs.info/functions/))
- **Plantilla de cadena** (para la concatenación de datos)

Aquí utilizaremos **Formula.js** para evaluar el valor numérico:

```html
IF(NUMBERVALUE(【Variable del disparador/Parámetros/Objeto de valores enviados/ID】, '', '.'),【Variable del disparador/Parámetros/Objeto de valores enviados/ID】, -1)
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429134.png)

---

### 12.5. Creación del [nodo de operación SQL](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql)

A continuación, crearemos el nodo de operación SQL que ejecutará la consulta para verificar las salas disponibles:

#### 12.5.1 Sentencia SQL para consultar salas disponibles

```sql
-- Consultar todas las salas que pueden reservarse
SELECT r.id, r.name
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
  AND b.id <> {{$jobsMapByNodeKey.3a0lsms6tgg}}  -- Excluir la reserva actual
  AND b.start_time < '{{$context.params.values.end_time}}' -- Hora de inicio anterior a la hora de fin de la consulta
  AND b.end_time > '{{$context.params.values.start_time}}' -- Hora de fin posterior a la hora de inicio de la consulta
WHERE b.id IS NULL;
```

> Atención sobre SQL: las variables se sustituyen directamente en la sentencia SQL; revise cuidadosamente las variables para evitar inyecciones SQL. Añada comillas simples en los lugares apropiados.

Las variables corresponden a:

{{$jobsMapByNodeKey.3a0lsms6tgg}} representa el resultado del nodo anterior, [Datos del nodo / Convertir ID vacío en -1].

{{$context.params.values.end_time}} representa [Variable del disparador / Parámetros / Objeto de valores enviados / Hora de fin].

{{$context.params.values.start_time}} representa [Variable del disparador / Parámetros / Objeto de valores enviados / Hora de inicio].

#### 12.5.2 Prueba de la consulta SQL

Nuestro objetivo es consultar todas las salas que no tengan conflicto con el intervalo de tiempo objetivo.

Durante el proceso, puede hacer clic en "Test run" abajo, modificar los valores de las variables y depurar la consulta SQL.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211437958.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438641.png)

---

### 12.6 [Análisis JSON](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

#### 12.6.1 Configuración del [nodo de análisis JSON](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

Tras la prueba del paso anterior, podemos observar que el resultado tiene la siguiente forma; en este punto necesitamos activar el [**Plugin JSON query node**](https://docs-cn.nocobase.com/handbook/workflow-json-query):

```json
[
  {
    "id": 2,
    "name": "Sala de reuniones 2"
  },
  {
    "id": 1,
    "name": "Sala de reuniones 1"
  }
]
```

> Existen tres formas de analizar JSON:
> [JMESPath](https://jmespath.org/)
> [JSON Path Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
> [JSONata](https://jsonata.org/)

Aquí elegiremos una, por ejemplo el formato [JMESPath](https://jmespath.org/). Como necesitamos filtrar la lista de nombres de todas las salas disponibles, la expresión sería:

```sql
[].name
```

La configuración de mapeo de propiedades es para listas de objetos y, por el momento, no es necesaria, así que se puede dejar en blanco.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438250.png)

### 12.7 [Evaluación condicional](https://docs-cn.nocobase.com/handbook/workflow/nodes/condition)

Configuraremos el nodo de evaluación condicional, que comprueba si la sala actual se encuentra en la lista de salas disponibles. Según el resultado **Sí** o **No**, configuraremos los mensajes de respuesta correspondientes:

Para la condición, basta con elegir el modo "Básico":

```json
【Datos del nodo / Lista de salas analizada】 contiene 【Variable del disparador / Parámetros / Objeto de valores enviados / Sala / Nombre】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439432.png)

#### 12.7.1 Sí: configuración del mensaje de éxito

En este punto debemos activar el [**Plugin Workflow: Response message**](https://docs-cn.nocobase.com/handbook/workflow-response-message):

```json
【Variable del disparador / Parámetros / Objeto de valores enviados / Sala / Nombre】 está disponible. ¡Reserva exitosa!
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439159.png)

#### 12.7.2 No: configuración del mensaje de error

```json
La sala objetivo no está disponible. Lista de salas disponibles: 【Datos del nodo / Lista de salas analizada】
```

Atención: cuando la evaluación falle, debemos configurar siempre un nodo de "Fin del flujo" para terminar manualmente el proceso.

![202411170606321731794792.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440377.png)

---

### 12.8 Pruebas y depuración detallada

Ahora pasaremos a la fase de pruebas finales del sistema de gestión de reuniones. El objetivo de esta etapa es confirmar que nuestro workflow detecta y bloquea correctamente las reservas de salas en conflicto.

#### 12.8.1 Añadir una reserva con intervalo de tiempo en conflicto

Primero intentaremos añadir una reunión con un intervalo que entre en conflicto con una reserva existente, para comprobar si el sistema bloquea la operación y muestra un mensaje de error.

- Configurar un intervalo de tiempo en conflicto

Intentaremos añadir una nueva reserva en la "Sala de reuniones 1", con el intervalo

`2024-11-14 00:00:00 - 2024-11-14 23:00:00`

Este intervalo abarca todo el día, por lo que se ha provocado deliberadamente un conflicto con las reservas existentes.

- Confirmar las reservas existentes

En la "Sala de reuniones 1" ya existen dos intervalos reservados:

1. `2024-11-14 09:00:00 a 2024-11-14 12:00:00`
2. `2024-11-14 14:00:00 a 2024-11-14 16:30:00`

Ambos intervalos se solapan con el que vamos a añadir

(`2024-11-14 00:00:00 - 2024-11-14 23:00:00`).

Por lo tanto, según la lógica, el sistema debería detectar el conflicto de tiempo y bloquear esta reserva.

- Enviar la reserva y verificar la respuesta

Hacemos clic en el botón **Enviar** y el sistema ejecutará la lógica de detección del workflow:

**Respuesta exitosa:** tras el envío, el sistema muestra una alerta de conflicto, indicando que la lógica de detección funciona correctamente. La página nos informa correctamente de que no es posible completar esta reserva.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440141.png)

---

#### 12.8.2 Añadir una reserva sin conflicto de tiempo

A continuación, probemos una reserva sin conflicto.

¡Aseguremos que cuando los horarios de la reunión no se solapan podemos reservar la sala con éxito!

- Configurar un intervalo sin conflictos

Elegiremos un intervalo sin conflictos, por ejemplo

`2024-11-10 16:00:00 - 2024-11-10 17:00:00`.

Este intervalo no se solapa con las reservas existentes, por lo que cumple con los requisitos para reservar la sala.

- Enviar la reserva sin conflictos

Hacemos clic en el botón **Enviar** y el sistema vuelve a ejecutar la lógica de detección del workflow:

**Verifiquemos juntos:** ¡Envío exitoso! El sistema muestra el mensaje "Reserva exitosa", lo que demuestra que la función también funciona correctamente cuando no hay conflictos.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440542.png)

#### 12.8.3 Modificar el horario de una reserva existente

Además de crear nuevas reservas, también puede probar modificar la hora de una reserva existente.

Por ejemplo, cambiar la hora de una reunión existente a otro intervalo sin conflictos y volver a hacer clic en Enviar.

¡Esta parte la dejamos para usted!

---

### 12.9 Optimización del dashboard y panel personal de agenda

Una vez superadas todas las pruebas funcionales, podemos seguir mejorando y optimizando el dashboard para mejorar la experiencia del usuario.

#### 12.9.1 Ajuste del diseño del dashboard

En el dashboard podemos reorganizar el contenido de la página según los hábitos de uso, para que los usuarios puedan ver los datos del sistema con mayor facilidad.

Para mejorar aún más la experiencia, podemos crear un panel personal de agenda exclusivo para cada usuario. Los pasos son:

1. **Crear un nuevo bloque "Agenda personal"**: agregue un nuevo bloque de calendario o lista en el dashboard que muestre la agenda personal del usuario.
2. **Configurar el valor predeterminado del miembro**: establezca el valor predeterminado del miembro como el usuario actual, de modo que al abrir el dashboard se muestren por defecto las reuniones relacionadas con cada uno.

De este modo, optimizamos aún más la experiencia del usuario en el módulo de gestión de reuniones.

Tras estas configuraciones, la funcionalidad y el diseño del dashboard serán más intuitivos y fáciles de usar, ¡y se enriquecerá considerablemente!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507712.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507197.png)

¡Mediante los pasos anteriores hemos implementado y optimizado con éxito las funciones principales del módulo de gestión de reuniones! Esperamos que, en este proceso, haya podido ir dominando las funciones esenciales de NocoBase y haya disfrutado de la experiencia de construir un sistema modular.

---

¡Continúe explorando y dé rienda suelta a su creatividad! Si encuentra algún problema, no olvide que siempre puede consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse a la [comunidad de NocoBase](https://forum.nocobase.com/) para discutirlo.
