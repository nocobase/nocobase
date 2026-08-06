---
title: "Selección de LLM"
description: "Consulte los resultados de las pruebas y las recomendaciones para elegir entre los principales modelos insignia al construir aplicaciones NocoBase, a partir de un sistema de evaluación estandarizado que abarca el modelado de datos, las páginas, los permisos y los flujos de trabajo."
keywords: "NocoBase AI Builder,selección de LLM,GPT,DeepSeek,Qwen,AI Agent,evaluación de modelos"
---

# Selección de LLM

:::tip Conclusión principal

**Los principales modelos insignia disponibles actualmente en el mercado pueden construir el núcleo de una aplicación NocoBase.**

Los modelos difieren en la integridad de su resultado inicial, el tiempo de construcción y la cantidad de problemas. Elija uno según los servicios de modelos que ya tenga disponibles, las condiciones de red de su región, el coste y las preferencias de su equipo.

:::

Esta evaluación utilizó un conjunto estandarizado de requisitos de CRM (un sistema de oportunidades de venta y seguimiento de clientes) para validar las aplicaciones construidas por distintos modelos:

| Dimensiones de evaluación | Elementos de evaluación estandarizados |
| :---: | :---: |
| 14 | 61 |

## Dimensiones de evaluación

La evaluación abarca las capacidades principales, las capacidades de configuración y los componentes fundamentales de NocoBase. También comprueba si cada modelo puede entender los requisitos y ejecutar las tareas de construcción correspondientes.

| Capacidad | Aspectos evaluados |
| --- | --- |
| Modelado de datos | Colecciones, tipos de campo, relaciones, restricciones de obligatoriedad y unicidad, y valores predeterminados |
| Páginas y funciones | Navegación, listados, formularios, detalles, búsqueda, filtros y paneles de control |
| Lógica de negocio | Transiciones de estado, validaciones de negocio, reglas de cálculo y coherencia de los datos relacionados |
| Permisos y seguridad | Roles, permisos de menús, permisos de acciones, ámbitos de datos y permisos de campos |
| Automatización de flujos de trabajo | Disparadores, nodos, ramas condicionales, notificaciones, efectos secundarios sobre los datos y reintentos tras fallos |
| Experiencia de usuario | Arquitectura de la información, experiencia con formularios, respuesta a las acciones y diseños adaptables |
| Robustez | Entradas no válidas, envíos duplicados, coherencia ante fallos, volumen de datos y recuperación de la red |
| Cobertura de requisitos | Si los requisitos explícitos y los recorridos de negocio principales están implementados por completo |
| Extensiones razonables | Si las funciones añadidas de forma proactiva por el modelo tienen una finalidad de negocio clara |
| Control del alcance | Si el resultado contiene módulos de negocio duplicados, sin usar o ajenos al alcance |

## Resultados de la evaluación

| Dimensión de evaluación | GPT-5.6 Sol | DeepSeek-V4-Flash | Qwen3.8-Max | GPT-5.6 Luna |
| --- | :---: | :---: | :---: | :---: |
| Modelado de datos | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> |
| Finalización de funciones | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#d97706;font-weight:600">◐ Aprobado parcialmente</span> |
| Lógica de negocio | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> |
| Permisos y seguridad | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> |
| Automatización de flujos de trabajo | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> |
| Experiencia de usuario | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#d97706;font-weight:600">◐ Aprobado parcialmente</span> |
| Robustez | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> |
| Cobertura de requisitos | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#d97706;font-weight:600">◐ Aprobado parcialmente</span> |
| Extensiones razonables | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> |
| Control del alcance | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> | <span style="color:#15803d;font-weight:600">✓ Aprobado</span> |
| **Velocidad de construcción** | <span style="color:#2563eb;font-weight:700">Relativamente rápida</span> | <span style="color:#2563eb;font-weight:700">Relativamente rápida</span> | <span style="color:#d97706;font-weight:700">Lenta</span> | <span style="color:#15803d;font-weight:700">La más rápida</span> |
| **Puntuación de calidad de una sola ejecución** | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">91</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#1d4ed8;background:#eff6ff;font-weight:800">90</span> | <span style="display:inline-block;min-width:42px;padding:2px 10px;border-radius:6px;color:#c2410c;background:#fff7ed;font-weight:800">77</span> |

:::tip Puntuación de calidad de una sola ejecución

La puntuación de calidad de una sola ejecución tiene un máximo de 100 puntos. Se descuenta un punto por cada error detectado durante la primera comprobación completa de aceptación, lo que permite observar la calidad de la construcción inicial del modelo. El modelo puede resolver estos problemas mediante comentarios y revisiones posteriores.

:::

:::info Nota sobre el tiempo de construcción

El tiempo de construcción depende de factores como el rendimiento del hardware del equipo, la instalación de dependencias y la compilación del Build, la velocidad de respuesta del servicio de modelos y las condiciones de red.

:::

## Detalles de los elementos de evaluación

Los 61 elementos de evaluación estandarizados se organizan en tres capas: 46 elementos para la calidad del resultado de la construcción, 7 para la comprensión de requisitos y las extensiones razonables, y 8 para la eficiencia del proceso de construcción. Todos los elementos emplean métodos de inspección y criterios de aprobación coherentes.

### Capa 1: Calidad del resultado de la construcción (46 elementos)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensión de evaluación</th><th>Elementos de evaluación estandarizados</th></tr></thead>
  <tbody>
    <tr><td>Modelado de datos (8 elementos)</td><td><code>DM-01</code> Si se han creado todas las colecciones requeridas<br /><code>DM-02</code> Si existen todos los campos requeridos<br /><code>DM-03</code> Si los tipos de campo son correctos<br /><code>DM-04</code> Si se pueden crear y utilizar relaciones uno a uno<br /><code>DM-05</code> Si se pueden crear y utilizar relaciones uno a muchos<br /><code>DM-06</code> Si se pueden crear y utilizar relaciones muchos a muchos<br /><code>DM-07</code> Si se aplican las reglas de obligatoriedad, unicidad y valor predeterminado<br /><code>DM-08</code> Si se pueden consultar y filtrar los datos relacionados</td></tr>
    <tr><td>Finalización de funciones (6 elementos)</td><td><code>FC-01</code> Si están presentes todas las páginas y entradas de navegación requeridas<br /><code>FC-02</code> Si se pueden crear, consultar, editar y eliminar registros<br /><code>FC-03</code> Si los recorridos principales del usuario se pueden completar de principio a fin<br /><code>FC-04</code> Si están disponibles las acciones de negocio clave<br /><code>FC-05</code> Si están disponibles la búsqueda, el filtrado y la ordenación<br /><code>FC-06</code> Si los paneles de control contienen el contenido requerido</td></tr>
    <tr><td>Lógica de negocio (6 elementos)</td><td><code>BL-01</code> Si las reglas de transición del estado de las oportunidades son correctas<br /><code>BL-02</code> Si se aplican las reglas de validación de negocio<br /><code>BL-03</code> Si los campos calculados y las definiciones estadísticas son correctos<br /><code>BL-04</code> Si los datos se asignan correctamente tras convertir un cliente potencial<br /><code>BL-05</code> Si las actualizaciones de registros relacionados mantienen la coherencia<br /><code>BL-06</code> Si las reglas de eliminación y archivado son correctas</td></tr>
    <tr><td>Permisos y seguridad (7 elementos)</td><td><code>ACL-01</code> Si se han creado todos los roles requeridos<br /><code>ACL-02</code> Si los usuarios de prueba y las asignaciones de roles son correctos<br /><code>ACL-03</code> Si los permisos de acceso a páginas y menús son correctos<br /><code>ACL-04</code> Si los permisos de operación sobre los datos son correctos<br /><code>ACL-05</code> Si los ámbitos de datos a nivel de registro son correctos<br /><code>ACL-06</code> Si los permisos de consulta y edición a nivel de campo son correctos<br /><code>ACL-07</code> Si los cambios de roles y las combinaciones de roles funcionan correctamente</td></tr>
    <tr><td>Automatización de flujos de trabajo (7 elementos)</td><td><code>WF-01</code> Si se han creado y habilitado todos los flujos de trabajo requeridos<br /><code>WF-02</code> Si los disparadores de los flujos de trabajo están diseñados correctamente<br /><code>WF-03</code> Si el orden de los nodos y la transferencia de datos son correctos<br /><code>WF-04</code> Si las condiciones y los resultados de las ramas son correctos<br /><code>WF-05</code> Si los efectos secundarios de lectura y escritura de registros son correctos<br /><code>WF-06</code> Si los destinatarios y el contenido de las notificaciones son correctos<br /><code>WF-07</code> Si se puede hacer un seguimiento de los registros de fallos y del comportamiento de reintento</td></tr>
    <tr><td>Experiencia de usuario (7 elementos)</td><td><code>UX-01</code> Si la navegación y la arquitectura de la información son claras<br /><code>UX-02</code> Si la información de los listados y las acciones habituales son fáciles de usar<br /><code>UX-03</code> Si la agrupación, el orden y las indicaciones de los formularios son claros<br /><code>UX-04</code> Si las páginas de detalles facilitan la comprensión y las acciones de seguimiento<br /><code>UX-05</code> Si la respuesta a las acciones y los cambios de estado son claros<br /><code>UX-06</code> Si la aplicación se puede utilizar con distintos anchos de pantalla<br /><code>UX-07</code> Si los estados vacío, de carga y de error están completos</td></tr>
    <tr><td>Robustez (5 elementos)</td><td><code>ROB-01</code> Si las entradas no válidas y los valores límite se gestionan de forma segura<br /><code>ROB-02</code> Si los envíos duplicados provocan efectos secundarios duplicados<br /><code>ROB-03</code> Si los datos mantienen su coherencia cuando falla la ejecución<br /><code>ROB-04</code> Si la aplicación sigue siendo utilizable con conjuntos de datos vacíos y grandes<br /><code>ROB-05</code> Si la aplicación puede recuperarse tras una interrupción de la sesión o de la red</td></tr>
  </tbody>
</table>

### Capa 2: Comprensión de requisitos y extensiones razonables (7 elementos)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensión de evaluación</th><th>Elementos de evaluación estandarizados</th></tr></thead>
  <tbody>
    <tr><td>Cobertura de requisitos (3 elementos)</td><td><code>COV-01</code> Si se han implementado todas las páginas y acciones solicitadas en el prompt<br /><code>COV-02</code> Si se han implementado todos los datos, permisos y flujos de trabajo solicitados en el prompt<br /><code>COV-03</code> Si están presentes las capacidades requeridas por el proceso principal que no se especificaron individualmente en el prompt</td></tr>
    <tr><td>Extensiones razonables (2 elementos)</td><td><code>EXT-01</code> Si los campos, las relaciones y las reglas añadidos de forma proactiva son necesarios<br /><code>EXT-02</code> Si las páginas, las acciones y las estadísticas añadidas de forma proactiva tienen una finalidad clara</td></tr>
    <tr><td>Control del alcance (2 elementos)</td><td><code>SCOPE-01</code> Si se generan funciones y configuraciones duplicadas o sin usar<br /><code>SCOPE-02</code> Si se añaden módulos de negocio ajenos al alcance de la tarea</td></tr>
  </tbody>
</table>

### Capa 3: Eficiencia del proceso de construcción (8 elementos)

<table style="table-layout: fixed; width: 100%;">
  <colgroup><col style="width: 32%;" /><col style="width: 68%;" /></colgroup>
  <thead><tr><th>Dimensión de evaluación</th><th>Elementos de evaluación estandarizados</th></tr></thead>
  <tbody>
    <tr><td>Tiempo hasta el primer resultado utilizable (1 elemento)</td><td><code>EFF-FIRST-01</code> Tiempo necesario para alcanzar el primer resultado utilizable</td></tr>
    <tr><td>Eficiencia de convergencia (3 elementos)</td><td><code>EFF-FINAL-01</code> Número de iteraciones necesarias para alcanzar la aceptación final<br /><code>EFF-FINAL-02</code> Tiempo total necesario para alcanzar el estado final<br /><code>EFF-FINAL-03</code> Tokens consumidos para alcanzar el estado final</td></tr>
    <tr><td>Intervención humana (1 elemento)</td><td><code>EFF-HUMAN-01</code> Número de intervenciones humanas durante la evaluación</td></tr>
    <tr><td>Repetibilidad (3 elementos)</td><td><code>EFF-STABLE-01</code> Si las ejecuciones repetidas de la misma tarea producen resultados de aceptación coherentes<br /><code>EFF-STABLE-02</code> Si las colecciones, las relaciones, los roles y los flujos de trabajo son coherentes en tres ejecuciones<br /><code>EFF-STABLE-03</code> Si la variación en las iteraciones y el tiempo se mantiene controlada</td></tr>
  </tbody>
</table>

## Siguientes pasos

- [Construya de forma colaborativa con un AI Agent](./agent-workflow.md) — describa páginas e interacciones en lenguaje natural e itere continuamente con un AI Agent
- [Inicio rápido del AI Portal](./index.md) — cree y ejecute su primer AI Portal
- [Modelado de datos](../data-modeling.md) — cree colecciones, campos y relaciones con lenguaje natural
- [Gestión de flujos de trabajo](../workflow.md) — cree, edite, habilite y diagnostique flujos de trabajo
- [Configuración de permisos](../acl.md) — gestione roles, políticas de permisos, asignaciones de usuarios y evaluaciones de riesgos
