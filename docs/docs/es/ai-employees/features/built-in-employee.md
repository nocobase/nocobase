:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/ai-employees/features/built-in-employee).
:::

# Empleados de IA integrados

NocoBase incluye varios empleados de IA integrados diseñados para escenarios específicos.

Usted solo necesita configurar el servicio de LLM y habilitar al empleado correspondiente para comenzar a trabajar; los modelos pueden cambiarse según sea necesario dentro de la conversación.


## Introducción

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Nombre del empleado | Posicionamiento del rol | Capacidades principales |
| :--- | :--- | :--- |
| **Cole** | Asistente de NocoBase | Preguntas y respuestas sobre el producto, recuperación de documentos |
| **Ellis** | Experto en correo electrónico | Redacción de correos, generación de resúmenes, sugerencias de respuesta |
| **Dex** | Organizador de datos | Traducción de campos, formateo, extracción de información |
| **Viz** | Analista de información | Información de datos (insights), análisis de tendencias, interpretación de métricas clave |
| **Lexi** | Asistente de traducción | Traducción multilingüe, asistencia en la comunicación |
| **Vera** | Analista de investigación | Búsqueda en la web, agregación de información, investigación profunda |
| **Dara** | Experto en visualización de datos | Configuración de gráficos, generación de informes visuales |
| **Orin** | Experto en modelado de datos | Asistencia en el diseño de estructuras de colecciones, sugerencias de campos |
| **Nathan** | Ingeniero de frontend | Asistencia en la escritura de fragmentos de código frontend, ajustes de estilo |


Usted puede hacer clic en la **esfera flotante de IA** en la esquina inferior derecha de la interfaz de la aplicación y seleccionar al empleado que necesite para comenzar a colaborar.


## Empleados de IA para escenarios exclusivos

Algunos empleados de IA integrados (de tipo constructor) no aparecen en la lista de empleados de IA de la esquina inferior derecha; tienen escenarios de trabajo exclusivos, por ejemplo:

* **Orin** solo aparece en la página de configuración de la fuente de datos;
* **Dara** solo aparece en la página de configuración de gráficos;
* **Nathan** solo aparece en el editor de JS.



---

A continuación, se enumeran algunos escenarios de aplicación típicos de los empleados de IA para proporcionarle inspiración. Más potencial le espera en su exploración posterior en escenarios de negocio reales.


## Viz: Analista de información

### Introducción

> Genere gráficos e información con un solo clic, deje que los datos hablen por sí mismos.

**Viz** es el **Analista de información de IA** integrado.
Él sabe cómo leer los datos de su página actual (como Leads, Oportunidades, Cuentas) y generar automáticamente gráficos de tendencias, gráficos comparativos, tarjetas de KPI y conclusiones concisas, haciendo que el análisis de negocio sea fácil e intuitivo.

> ¿Quiere saber "¿Por qué han bajado las ventas recientemente?"?
> Solo dígale una palabra a Viz y él podrá decirle en qué punto ocurrió la caída, cuáles son las posibles razones y cuáles podrían ser los siguientes pasos.

### Escenarios de uso

Ya sea para revisiones comerciales mensuales, ROI de canales o embudos de ventas, puede dejar que Viz analice, genere gráficos e interprete los resultados.

| Escenario | Lo que desea saber | Resultado de Viz |
| -------- | ------------ | ------------------- |
| **Revisión mensual** | ¿En qué es mejor este mes que el anterior? | Tarjeta de KPI + Gráfico de tendencia + Tres sugerencias de mejora |
| **Desglose de crecimiento** | ¿El crecimiento de los ingresos se debe al volumen o al precio? | Gráfico de descomposición de factores + Tabla comparativa |
| **Análisis de canales** | ¿En qué canal vale más la pena seguir invirtiendo? | Gráfico de ROI + Curva de retención + Sugerencias |
| **Análisis de embudo** | ¿En qué paso se queda atascado el tráfico? | Gráfico de embudo + Explicación de cuellos de botella |
| **Retención de clientes** | ¿Qué clientes son los más valiosos? | Gráfico de segmentación RFM + Curva de retención |
| **Evaluación de promociones** | ¿Qué tan efectiva fue la gran promoción? | Gráfico comparativo + Análisis de elasticidad de precios |

### Modo de uso

**Puntos de entrada en la página**

* **Botón superior derecho (Recomendado)**
  
  En páginas como Leads, Oportunidades y Cuentas, haga clic en el **icono de Viz** en la esquina superior derecha para seleccionar tareas preestablecidas, tales como:

  * Conversión de etapas y tendencias
  * Comparación de canales de origen
  * Análisis de revisión mensual

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Panel global inferior derecho**
  
  En cualquier página, puede invocar el panel global de IA y hablar directamente con Viz:

  ```
  Analiza los cambios en las ventas de los últimos 90 días
  ```

  Viz incorporará automáticamente el contexto de datos de su página actual.

**Interacción**

Viz admite preguntas en lenguaje natural y comprende el seguimiento de varias rondas.
Ejemplo:

```
Hola Viz, genera las tendencias de leads para este mes.
```

```
Muestra solo el rendimiento de los canales de terceros.
```

```
¿Qué región está creciendo más rápido?
```

Cada pregunta de seguimiento continuará profundizando basándose en los resultados del análisis anterior, sin necesidad de volver a introducir las condiciones de los datos.

### Consejos para conversar con Viz

| Práctica | Efecto |
| ---------- | ------------------- |
| Especificar el rango de tiempo | "Últimos 30 días" o "Mes pasado vs. este mes" es más preciso |
| Especificar dimensiones | "Ver por región/canal/producto" ayuda a alinear las perspectivas |
| Enfocarse en tendencias más que en detalles | Viz es bueno identificando la dirección del cambio y las razones clave |
| Usar lenguaje natural | No necesita sintaxis imperativa, solo haga preguntas como si estuviera charlando |


---



## Dex: Organizador de datos

### Introducción

> Extraiga y complete formularios rápidamente, convirtiendo información desordenada en datos estructurados.

`Dex` es un experto en organización de datos que extrae la información requerida de datos o archivos no estructurados y la organiza en información estructurada. Además, puede invocar herramientas para completar la información en formularios.

### Modo de uso

Invoque a `Dex` en la página del formulario para abrir la ventana de conversación.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Haga clic en `Add work context` (Añadir contexto de trabajo) en el cuadro de entrada y seleccione `Pick block` (Seleccionar bloque); la página entrará en el estado de selección de bloques.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Seleccione el bloque de formulario en la página.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Introduzca en el cuadro de diálogo los datos que desea que `Dex` organice.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Después de enviarlos, `Dex` estructurará los datos y utilizará sus habilidades para actualizar la información en el formulario seleccionado.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Modelador de datos

### Introducción

> Diseñe colecciones de forma inteligente y optimice las estructuras de las bases de datos.

`Orin` es un experto en modelado de datos. En la página de configuración de la fuente de datos principal, puede dejar que `Orin` le ayude a crear o modificar colecciones.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Modo de uso

Acceda al plugin de gestión de fuentes de datos y seleccione configurar la fuente de datos principal.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Haga clic en el avatar de `Orin` en la esquina superior derecha para abrir el cuadro de diálogo del empleado de IA.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Describa sus requisitos de modelado a `Orin`, envíelos y espere una respuesta. 

Una vez que `Orin` confirme sus requisitos, utilizará sus habilidades y le responderá con una vista previa del modelado de datos.

Después de revisar la vista previa, haga clic en el botón `Finish review and apply` (Finalizar revisión y aplicar) para crear las colecciones de acuerdo con el modelado de `Orin`.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Ingeniero de frontend

### Introducción

> Le ayuda a escribir y optimizar código frontend para implementar lógicas de interacción complejas.

`Nathan` es el experto en desarrollo frontend en NocoBase. En escenarios donde se requiere JavaScript, como `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow` y `Linkage`, aparecerá el avatar de `Nathan` en la esquina superior derecha del editor de código, permitiéndole pedirle que le ayude a escribir o modificar el código en el editor.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Modo de uso

En el editor de código, haga clic en `Nathan` para abrir el cuadro de diálogo del empleado de IA; el código del editor se adjuntará automáticamente al cuadro de entrada y se enviará a `Nathan` como contexto de la aplicación.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Introduzca sus requisitos de programación, envíelos a `Nathan` y espere su respuesta.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Haga clic en el botón `Apply to editor` (Aplicar al editor) en el bloque de código respondido por `Nathan` para sobrescribir el código en el editor con su propuesta.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Haga clic en el botón `Run` (Ejecutar) del editor de código para ver los efectos en tiempo real.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Historial de código

Haga clic en el icono de "línea de comandos" en la esquina superior derecha del cuadro de diálogo de `Nathan` para ver los fragmentos de código que ha enviado y los fragmentos de código con los que `Nathan` ha respondido en la sesión actual.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)