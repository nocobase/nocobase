

# Empleado de IA · Viz: Guía de configuración para escenarios de CRM

> Tomando como ejemplo un escenario de CRM, aprenda cómo hacer que su analista de IA Viz realmente comprenda su negocio y desarrolle todo su potencial.

## 1. Introducción: De "ver datos" a "entender el negocio" con Viz

En el sistema NocoBase, **Viz** es un analista de IA preconfigurado.
Puede reconocer el contexto de la página (como Leads, Oportunidades, Cuentas) y generar gráficos de tendencias, gráficos de embudo y tarjetas de KPI.
Sin embargo, por defecto, solo posee las capacidades de consulta más básicas:

| Herramienta                      | Descripción de la función | Seguridad  |
| ----------------------- | ------- | ---- |
| Get Collection Names    | Obtener lista de colecciones | ✅ Seguro |
| Get Collection Metadata | Obtener estructura de campos | ✅ Seguro |

Estas herramientas solo permiten a Viz "reconocer la estructura", pero aún no "comprender el contenido".
Para que genere insights, detecte anomalías y analice tendencias, necesita **ampliarlo con herramientas de análisis más adecuadas**.

En la demostración oficial de CRM, utilizamos dos enfoques:

*   **Overall Analytics (Motor de análisis general)**: Una solución reutilizable, segura y basada en plantillas;
*   **SQL Execution (Motor de análisis especializado)**: Ofrece mayor libertad, pero conlleva mayores riesgos.

Estas dos opciones no son las únicas; son más bien un **paradigma de diseño**:

> Puede seguir sus principios para crear una implementación que se adapte mejor a su propio negocio.

---

## 2. Estructura de Viz: Personalidad estable + Tareas flexibles

Para entender cómo extender Viz, primero debe comprender su diseño interno por capas:

| Capa       | Descripción                              | Ejemplo    |
| -------- | ---------------------------------------- | ----- |
| **Definición de rol** | La personalidad y el método de análisis de Viz: Comprender → Consultar → Analizar → Visualizar | Fija |
| **Definición de tarea** | Prompts personalizados y combinaciones de herramientas para un escenario de negocio específico | Modificable |
| **Configuración de herramientas** | El puente para que Viz invoque fuentes de datos o flujos de trabajo externos | Libremente reemplazable |

Este diseño por capas permite a Viz mantener una personalidad estable (lógica de análisis consistente)
y, al mismo tiempo, adaptarse rápidamente a diferentes escenarios de negocio (CRM, gestión hospitalaria, análisis de canales, operaciones de producción...).

## 3. Patrón uno: Motor de análisis basado en plantillas (Recomendado)

### 3.1 Resumen del principio

**Overall Analytics** es el motor de análisis central en la demostración de CRM.
Gestiona todas las consultas SQL a través de una **colección de plantillas de análisis de datos (data_analysis)**.
Viz no escribe SQL directamente, sino que **invoca plantillas predefinidas** para generar resultados.

El flujo de ejecución es el siguiente:

```mermaid
flowchart TD
    A[Viz recibe tarea] --> B[Invoca el flujo de trabajo Overall Analytics]
    B --> C[Coincide la plantilla según la página/tarea actual]
    C --> D[Ejecuta el SQL de la plantilla (solo lectura)]
    D --> E[Devuelve el resultado de los datos]
    E --> F[Viz genera el gráfico + breve interpretación]
```

De esta manera, Viz puede generar resultados de análisis seguros y estandarizados en segundos,
y los administradores pueden gestionar y revisar centralmente todas las plantillas SQL.

---

### 3.2 Estructura de la colección de plantillas (data_analysis)

| Nombre del campo                                             | Tipo       | Descripción            | Ejemplo                                                 |
| ------------------------------------------------- | -------- | ------------- | -------------------------------------------------- |
| **id**                                            | Integer  | Clave primaria            | 1                                                  |
| **name**                                          | Text     | Nombre de la plantilla de análisis        | Leads Data Analysis                                |
| **collection**                                    | Text     | Colección correspondiente         | Lead                                               |
| **sql**                                           | Code     | Sentencia SQL de análisis (solo lectura) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description**                                   | Markdown | Descripción o definición de la plantilla       | "Contar leads por etapa"                                        |
| **createdAt / createdBy / updatedAt / updatedBy** | Campo del sistema     | Información de auditoría          | Generado automáticamente                                               |

#### Ejemplos de plantillas en la demostración de CRM

| Nombre                             | Colección  | Descripción |
| -------------------------------- | ----------- | ----------- |
| Account Data Analysis            | Account     | Análisis de datos de cuentas      |
| Contact Data Analysis            | Contact     | Análisis de contactos       |
| Leads Data Analysis              | Lead        | Análisis de tendencias de leads      |
| Opportunity Data Analysis        | Opportunity | Embudo de etapas de oportunidades      |
| Task Data Analysis               | Todo Tasks  | Estadísticas de estado de tareas pendientes    |
| Users (Sales Reps) Data Analysis | Users       | Comparación de rendimiento de representantes de ventas    |

---

### 3.3 Ventajas de este patrón

| Dimensión       | Ventaja                     |
| -------- | ---------------------- |
| **Seguridad**  | Todo el SQL se almacena y revisa, evitando la generación directa de consultas |
| **Mantenibilidad** | Las plantillas se gestionan y actualizan de forma centralizada            |
| **Reusabilidad**  | La misma plantilla puede ser reutilizada por múltiples tareas           |
| **Portabilidad** | Se puede migrar fácilmente a otros sistemas, requiriendo solo la misma estructura de colección    |
| **Experiencia de usuario** | Los usuarios de negocio no necesitan preocuparse por el SQL; solo necesitan iniciar una solicitud de análisis  |

> 📘 Esta colección `data_analysis` no tiene que llamarse así.
> La clave es: **almacenar la lógica de análisis de forma templada**, para que un flujo de trabajo la invoque de manera uniforme.

---

### 3.4 Cómo hacer que Viz lo utilice

En la definición de la tarea, puede indicarle explícitamente a Viz:

```markdown
Hola Viz,

Por favor, analice los datos del módulo actual.

**Prioridad:** Utilice la herramienta Overall Analytics para obtener resultados de análisis de la colección de plantillas.
**Si no se encuentra una plantilla coincidente:** Indique que falta una plantilla y sugiera al administrador que añada una.

Requisitos de salida:
- Genere un gráfico separado para cada resultado;
- Incluya una breve descripción de 2 a 3 frases debajo del gráfico;
- No fabrique datos ni haga suposiciones.
```

De esta manera, Viz invocará automáticamente el flujo de trabajo, buscará el SQL más adecuado en la colección de plantillas y generará el gráfico.

---

## 4. Patrón dos: Ejecutor de SQL especializado (Usar con precaución)

### 4.1 Escenarios aplicables

Cuando necesite análisis exploratorios, consultas ad-hoc o agregaciones JOIN de múltiples colecciones, puede hacer que Viz invoque una herramienta de **SQL Execution**.

Las características de esta herramienta son:

*   Viz puede generar directamente consultas `SELECT`;
*   El sistema las ejecuta y devuelve el resultado;
*   Viz se encarga del análisis y la visualización.

Ejemplo de tarea:

> "Por favor, analice la tendencia de las tasas de conversión de leads por región durante los últimos 90 días."

En este caso, Viz podría generar:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Riesgos y recomendaciones de protección

| Punto de riesgo    | Estrategia de protección            |
| ------ | --------------- |
| Generación de operaciones de escritura  | Restringir forzosamente a `SELECT`  |
| Acceso a colecciones no relacionadas  | Validar si el nombre de la colección existe        |
| Riesgo de rendimiento con colecciones grandes | Limitar el rango de tiempo, usar LIMIT para el número de filas |
| Trazabilidad de operaciones  | Habilitar el registro de consultas y la auditoría       |
| Control de permisos de usuario | Solo los administradores pueden usar esta herramienta      |

> Recomendaciones generales:
>
> *   Los usuarios regulares solo deben tener habilitado el análisis basado en plantillas (Overall Analytics);
> *   Solo los administradores o analistas avanzados deben tener permitido usar SQL Execution.

---

## 5. Si desea construir su propio "Overall Analytics"

A continuación, se presenta un enfoque general y sencillo que puede replicar en cualquier sistema (sin depender de NocoBase):

### Paso 1: Diseñar la colección de plantillas

El nombre de la colección puede ser cualquiera (por ejemplo, `analysis_templates`).
Solo necesita incluir los campos: `name`, `sql`, `collection` y `description`.

### Paso 2: Escribir un servicio o flujo de trabajo de "Obtener plantilla → Ejecutar"

Lógica:

1.  Recibir la tarea o el contexto de la página (por ejemplo, la colección actual);
2.  Coincidir con una plantilla;
3.  Ejecutar el SQL de la plantilla (solo lectura);
4.  Devolver una estructura de datos estandarizada (filas + campos).

### Paso 3: Hacer que la IA invoque esta interfaz

El prompt de la tarea se puede escribir así:

```
Primero, intente invocar la herramienta de análisis de plantillas. Si no se encuentra un análisis coincidente en las plantillas, entonces use el ejecutor de SQL.
Por favor, asegúrese de que todas las consultas sean de solo lectura y genere gráficos para mostrar los resultados.
```

> De esta manera, su sistema de empleado de IA tendrá capacidades de análisis similares a las de la demostración de CRM, pero será completamente independiente y personalizable.

---

## 6. Mejores prácticas y recomendaciones de diseño

| Recomendación                     | Descripción                                     |
| ---------------------- | -------------------------------------- |
| **Priorizar el análisis basado en plantillas**            | Seguro, estable y reutilizable                              |
| **Usar SQL Execution solo como complemento** | Limitado a la depuración interna o consultas ad-hoc                            |
| **Un gráfico, un punto clave**              | Mantener la salida clara y evitar el desorden excesivo                            |
| **Nombres de plantilla claros**             | Nombrar según la página/dominio de negocio, por ejemplo, `Leads-Stage-Conversion` |
| **Explicaciones concisas y claras**             | Acompañar cada gráfico con un resumen de 2 a 3 frases                          |
| **Indicar cuando falta una plantilla**             | Informar al usuario "No se encontró una plantilla correspondiente" en lugar de una salida en blanco                    |

---

## 7. De la demostración de CRM a su escenario

Ya sea que trabaje con un CRM hospitalario, fabricación, logística de almacén o admisiones educativas,
siempre que pueda responder las siguientes tres preguntas, Viz puede aportar valor a su sistema:

| Pregunta             | Ejemplo                  |
| -------------- | ------------------- |
| **1. ¿Qué desea analizar?** | Tendencias de leads / Etapas de negociación / Tasa de utilización de equipos |
| **2. ¿Dónde están los datos?**   | Qué colección, qué campos            |
| **3. ¿Cómo desea presentarlos?**  | Gráfico de líneas, embudo, gráfico circular, tabla comparativa        |

Una vez que haya definido esto, solo necesita:

*   Escribir la lógica de análisis en la colección de plantillas;
*   Adjuntar el prompt de la tarea a la página;
*   Viz podrá entonces "hacerse cargo" del análisis de sus informes.

---

## 8. Conclusión: Lleve el paradigma consigo

"Overall Analytics" y "SQL Execution" son solo dos implementaciones de ejemplo.
Lo más importante es la idea detrás de ellas:

> **Hacer que el empleado de IA comprenda su lógica de negocio, no solo que ejecute prompts.**

Ya sea que utilice NocoBase, un sistema privado o su propio flujo de trabajo personalizado,
puede replicar esta estructura:

*   Plantillas centralizadas;
*   Invocaciones de flujo de trabajo;
*   Ejecución de solo lectura;
*   Presentación por IA.

De esta manera, Viz ya no es solo una "IA que puede generar gráficos",
sino un verdadero analista que comprende sus datos, sus definiciones y su negocio.