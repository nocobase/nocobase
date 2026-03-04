:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/solution/ticket-system/index).
:::

# Introducción a la solución de tickets

> **Nota**: Esta es una versión preliminar. Las funciones aún se están perfeccionando y estamos trabajando continuamente en mejoras. ¡Sus comentarios son bienvenidos!

## 1. Contexto (Por qué)

### Problemas de industria / rol / gestión que resuelve

Las empresas enfrentan diversos tipos de solicitudes de servicio en sus operaciones diarias: reparaciones de equipos, soporte de TI, quejas de clientes, consultas, etc. Estas solicitudes provienen de fuentes dispersas (sistemas CRM, ingenieros de campo, correos electrónicos, formularios públicos, etc.), tienen diferentes flujos de trabajo de procesamiento y carecen de mecanismos unificados de seguimiento y gestión.

**Ejemplos de escenarios de negocio típicos:**

- **Reparación de equipos**: El equipo de posventa gestiona las solicitudes de reparación de equipos y necesita registrar información específica del dispositivo, como números de serie, códigos de falla y piezas de repuesto.
- **Soporte de TI**: El departamento de TI gestiona las solicitudes de los empleados internos para el restablecimiento de contraseñas, instalaciones de software y problemas de red.
- **Quejas de clientes**: El equipo de atención al cliente gestiona quejas de múltiples canales; algunos clientes con un alto nivel de urgencia o frustración requieren una gestión prioritaria.
- **Autoservicio del cliente**: Los clientes finales desean enviar solicitudes de servicio de manera conveniente y realizar un seguimiento del progreso del procesamiento.

### Perfil del usuario objetivo

| Dimensión | Descripción |
|-----------|-------------|
| Tamaño de la empresa | De PYMES a grandes empresas con necesidades sustanciales de servicio al cliente |
| Estructura de roles | Equipos de atención al cliente, soporte de TI, equipos de posventa, personal de gestión de operaciones |
| Madurez digital | Inicial a intermedia, que buscan actualizar la gestión basada en Excel/correo electrónico a una gestión sistemática |

### Puntos críticos de las soluciones actuales

- **Alto costo / Personalización lenta**: Los sistemas de tickets SaaS son costosos y los ciclos de desarrollo a medida son largos.
- **Fragmentación del sistema, silos de datos**: Los datos de negocio están dispersos en diferentes sistemas, lo que dificulta el análisis y la toma de decisiones unificadas.
- **Cambios rápidos en el negocio, dificultad para evolucionar**: Cuando los requisitos del negocio cambian, los sistemas son difíciles de ajustar rápidamente.
- **Respuesta de servicio lenta**: Las solicitudes que fluyen entre diferentes sistemas no se pueden asignar con prontitud.
- **Proceso opaco**: Los clientes no pueden rastrear el progreso del ticket; las consultas frecuentes aumentan la presión sobre el servicio al cliente.
- **Calidad difícil de garantizar**: La falta de monitoreo de SLA (Acuerdos de Nivel de Servicio) impide que los tiempos de espera y los comentarios negativos generen alertas a tiempo.

---

## 2. Referencia y comparativa (Benchmark)

### Productos principales en el mercado

- **SaaS**: Salesforce, Zendesk, Odoo, etc.
- **Sistemas a medida / Sistemas internos**

### Dimensiones de comparativa

- Cobertura de funciones
- Flexibilidad
- Escalabilidad
- Enfoque de uso de IA

### Diferenciadores de la solución NocoBase

**Ventajas a nivel de plataforma:**

- **Prioridad a la configuración**: Desde las tablas de datos subyacentes hasta los tipos de negocio, SLA y enrutamiento por habilidades, todo se gestiona mediante configuración.
- **Desarrollo rápido sin código (Low-code)**: Más rápido que el desarrollo a medida y más flexible que las soluciones SaaS.

**Lo que los sistemas tradicionales no pueden hacer o tiene un costo muy alto:**

- **Integración nativa de IA**: Aprovechando los plugins de IA de NocoBase para la clasificación inteligente, asistencia en formularios y recomendaciones de conocimiento.
- **Todos los diseños pueden ser replicados por los usuarios**: Los usuarios pueden ampliar la solución basándose en plantillas.
- **Arquitectura de datos en forma de T**: Tabla principal + tablas de extensión de negocio; agregar nuevos tipos de negocio solo requiere añadir tablas de extensión.

---

## 3. Principios de diseño (Principles)

- **Bajo costo cognitivo**
- **El negocio antes que la tecnología**
- **Evolutivo, no una entrega única**
- **Configuración primero, código como respaldo**
- **Colaboración humano-IA, no sustitución del humano por la IA**
- **Todos los diseños deben ser replicables por los usuarios**

---

## 4. Descripción general de la solución (Solution Overview)

### Introducción resumida

Una plataforma de tickets universal construida sobre la plataforma low-code NocoBase, que logra:

- **Entrada unificada**: Integración de múltiples fuentes y procesamiento estandarizado.
- **Distribución inteligente**: Clasificación asistida por IA y asignación con equilibrio de carga.
- **Negocio polimórfico**: Tabla principal central + tablas de extensión de negocio, con extensión flexible.
- **Retroalimentación de ciclo cerrado**: Monitoreo de SLA, calificaciones de clientes y seguimiento de comentarios negativos.

### Flujo de procesamiento de tickets

```
Entrada multifuente → Preprocesamiento/Análisis IA → Asignación inteligente → Ejecución manual → Ciclo de retroalimentación
        ↓                       ↓                          ↓                    ↓                    ↓
 Verificación duplicados   Reconocimiento intención   Coincidencia habilidades  Flujo de estado     Calificación satisfacción
                           Análisis de sentimiento    Equilibrio de carga       Monitoreo SLA       Seguimiento comentarios neg.
                           Respuesta automática       Gestión de colas          Comunicación/Coment. Archivado de datos
```

### Lista de módulos principales

| Módulo | Descripción |
|--------|-------------|
| Entrada de tickets | Formularios públicos, portal del cliente, creación por agente, API/Webhook, análisis de correo electrónico |
| Gestión de tickets | CRUD de tickets, flujo de estados, asignación/transferencia, comunicación por comentarios, registros de operación |
| Extensión de negocio | Tablas de extensión para reparación de equipos, soporte de TI, quejas de clientes y otros negocios |
| Gestión de SLA | Configuración de SLA, alertas por tiempo agotado, escalamiento por tiempo agotado |
| Gestión de clientes | Tabla principal de clientes, gestión de contactos, portal del cliente |
| Sistema de calificación | Puntuación multidimensional, etiquetas rápidas, NPS, alertas de comentarios negativos |
| Asistencia de IA | Clasificación de intención, análisis de sentimiento, recomendación de conocimiento, asistencia en respuestas, pulido de tono |

### Visualización de la interfaz principal

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. Empleado de IA (AI Employee)

### Tipos de empleado de IA y escenarios

- **Asistente de servicio al cliente**, **Asistente de ventas**, **Analista de datos**, **Auditor**
- Asisten a los humanos, no los reemplazan.

### Cuantificación del valor del empleado de IA

En esta solución, los empleados de IA pueden:

| Dimensión de valor | Efectos específicos |
|--------------------|---------------------|
| Mejorar la eficiencia | La clasificación automática reduce el tiempo de triaje manual en más del 50%; las recomendaciones de conocimiento aceleran la resolución de problemas |
| Reducir costos | Respuestas automáticas a preguntas simples, reduciendo la carga de trabajo del servicio al cliente manual |
| Empoderar a los empleados | Las alertas de sentimiento ayudan al servicio al cliente a prepararse con antelación; el pulido de respuestas mejora la calidad de la comunicación |
| Mejorar la satisfacción | Respuesta más rápida, asignación más precisa y respuestas más profesionales |

---

## 6. Puntos destacados (Highlights)

### 1. Arquitectura de datos en forma de T

- Todos los tickets comparten la tabla principal con una lógica de flujo unificada.
- Las tablas de extensión de negocio contienen campos específicos de cada tipo, permitiendo una extensión flexible.
- Agregar nuevos tipos de negocio solo requiere añadir tablas de extensión, sin afectar el flujo principal.

### 2. Ciclo de vida completo del ticket

- Nuevo → Asignado → En proceso → Pendiente → Resuelto → Cerrado.
- Soporta escenarios complejos como transferencia, devolución y reapertura.
- El cronometraje de SLA es preciso, incluyendo las pausas en estado pendiente.

### 3. Integración unificada multicanal

- Formularios públicos, portal del cliente, API, correo electrónico y creación por agente.
- La verificación de idempotencia evita la creación de duplicados.

### 4. Integración nativa de IA

- No se trata de "añadir un botón de IA", sino de integrarla en cada paso.
- Reconocimiento de intención, análisis de sentimiento, recomendación de conocimiento y pulido de respuestas.

---

## 7. Instalación y despliegue

### Cómo instalar y usar

Utilice la gestión de migraciones para migrar e integrar diversas aplicaciones parciales en otras aplicaciones.

---

## 8. Hoja de ruta (Roadmap - Actualización continua)

- **Incrustación en sistemas**: Soporte para incrustar el módulo de tickets en diferentes sistemas de negocio como ERP, CRM, etc.
- **Interconexión de tickets**: Integración de tickets de sistemas ascendentes/descendentes y devoluciones de estado para la colaboración de tickets entre sistemas.
- **Automatización por IA**: Empleados de IA integrados en los flujos de trabajo, permitiendo la ejecución automática en segundo plano para un procesamiento desatendido.
- **Soporte multi-inquilino (Multi-tenancy)**: Escalado horizontal mediante arquitectura de múltiples espacios/aplicaciones, permitiendo la distribución a diferentes equipos de servicio para una operación independiente.
- **Base de conocimientos RAG**: Vectorización automática de todos los datos (tickets, clientes, productos, etc.) para búsqueda inteligente y recomendaciones de conocimiento.
- **Soporte multi-idioma**: La interfaz y el contenido admiten el cambio entre varios idiomas para satisfacer las necesidades de colaboración de equipos multinacionales o regionales.