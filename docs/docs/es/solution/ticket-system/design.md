:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/solution/ticket-system/design).
:::

# Diseño detallado de la solución de tickets

> **Versión**: v2.0-beta

> **Fecha de actualización**: 2026-01-05

> **Estado**: Versión preliminar

## 1. Descripción general del sistema y filosofía de diseño

### 1.1 Posicionamiento del sistema

Este sistema es una **plataforma inteligente de gestión de tickets impulsada por IA**, construida sobre la plataforma de bajo código NocoBase. El objetivo principal es:

```
Permitir que el servicio de atención al cliente se centre en resolver problemas, no en tediosas operaciones de proceso
```

### 1.2 Filosofía de diseño

#### Filosofía uno: Arquitectura de datos en forma de T

**¿Qué es la arquitectura en forma de T?**

Inspirada en el concepto de "talento en forma de T": amplitud horizontal + profundidad vertical:

- **Horizontal (Tabla principal)**: Capacidades universales que cubren todos los tipos de negocio: número de ticket, estado, encargado, SLA y otros campos principales.
- **Vertical (Tablas de extensión)**: Campos especializados para tipos de negocio específicos: la reparación de equipos tiene números de serie, las reclamaciones tienen planes de compensación.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-50-45.png)

**¿Por qué este diseño?**

| Enfoque tradicional | Arquitectura en forma de T |
|----------|---------|
| Una tabla por tipo de negocio, campos duplicados | Campos comunes unificados, campos de negocio extendidos según sea necesario |
| Los informes estadísticos requieren fusionar múltiples tablas | Una tabla principal para todas las estadísticas de tickets |
| Los cambios en los procesos requieren modificaciones en múltiples lugares | Los cambios en el proceso principal se realizan en un solo lugar |
| Los nuevos tipos de negocio requieren nuevas tablas | Solo se añaden tablas de extensión, el flujo principal permanece inalterado |

#### Filosofía dos: Equipo de empleados de IA

No se trata de "funciones de IA", sino de "empleados de IA". Cada IA tiene un rol, personalidad y responsabilidades claras:

| Empleado de IA | Puesto | Responsabilidades principales | Escenario de activación |
|--------|------|----------|----------|
| **Sam** | Supervisor de mesa de servicio | Distribución de tickets, evaluación de prioridad, decisiones de escalada | Automático al crear el ticket |
| **Grace** | Experta en éxito del cliente | Generación de respuestas, ajuste de tono, gestión de reclamaciones | Cuando el agente hace clic en "Respuesta IA" |
| **Max** | Asistente de conocimiento | Casos similares, recomendaciones de conocimiento, síntesis de soluciones | Automático en la página de detalles del ticket |
| **Lexi** | Traductora | Traducción multilingüe, traducción de comentarios | Automático cuando se detecta un idioma extranjero |

**¿Por qué el modelo de "Empleado de IA"?**

- **Responsabilidades claras**: Sam gestiona la distribución, Grace gestiona las respuestas; sin confusiones.
- **Fácil de entender**: Decir "Deje que Sam analice esto" es más amigable que "Llamar a la API de clasificación".
- **Extensible**: Añadir nuevas capacidades de IA equivale a contratar nuevos empleados.

#### Filosofía tres: Autocirculación del conocimiento

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-09.png)

Esto forma un ciclo cerrado de **Acumulación de conocimiento - Aplicación de conocimiento**.

---

## 2. Entidades principales y modelo de datos

### 2.1 Resumen de la relación entre entidades

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-23.png)


### 2.2 Detalle de las tablas principales

#### 2.2.1 Tabla principal de tickets (nb_tts_tickets)

Este es el núcleo del sistema, utiliza un diseño de "tabla ancha" que incluye todos los campos de uso frecuente en la tabla principal.

**Información básica**

| Campo | Tipo | Descripción | Ejemplo |
|------|------|------|------|
| id | BIGINT | Clave primaria | 1001 |
| ticket_no | VARCHAR | Número de ticket | TKT-20251229-0001 |
| title | VARCHAR | Título | Conexión de red lenta |
| description | TEXT | Descripción del problema | Desde esta mañana, la red de la oficina... |
| biz_type | VARCHAR | Tipo de negocio | it_support |
| priority | VARCHAR | Prioridad | P1 |
| status | VARCHAR | Estado | processing |

**Rastreo de origen**

| Campo | Tipo | Descripción | Ejemplo |
|------|------|------|------|
| source_system | VARCHAR | Sistema de origen | crm / email / iot |
| source_channel | VARCHAR | Canal de origen | web / phone / wechat |
| external_ref_id | VARCHAR | ID de referencia externa | CRM-2024-0001 |

**Información de contacto**

| Campo | Tipo | Descripción |
|------|------|------|
| customer_id | BIGINT | ID del cliente |
| contact_name | VARCHAR | Nombre del contacto |
| contact_phone | VARCHAR | Teléfono de contacto |
| contact_email | VARCHAR | Correo electrónico de contacto |
| contact_company | VARCHAR | Nombre de la empresa |

**Información del encargado**

| Campo | Tipo | Descripción |
|------|------|------|
| assignee_id | BIGINT | ID del encargado |
| assignee_department_id | BIGINT | ID del departamento del encargado |
| transfer_count | INT | Conteo de transferencias |

**Nodos temporales**

| Campo | Tipo | Descripción | Momento de activación |
|------|------|------|----------|
| submitted_at | TIMESTAMP | Hora de envío | Al crear el ticket |
| assigned_at | TIMESTAMP | Hora de asignación | Al especificar el encargado |
| first_response_at | TIMESTAMP | Hora de primera respuesta | Al responder por primera vez al cliente |
| resolved_at | TIMESTAMP | Hora de resolución | Cuando el estado cambia a resuelto |
| closed_at | TIMESTAMP | Hora de cierre | Cuando el estado cambia a cerrado |

**Relacionado con SLA**

| Campo | Tipo | Descripción |
|------|------|------|
| sla_config_id | BIGINT | ID de configuración de SLA |
| sla_response_due | TIMESTAMP | Vencimiento de respuesta |
| sla_resolve_due | TIMESTAMP | Vencimiento de resolución |
| sla_paused_at | TIMESTAMP | Hora de inicio de pausa de SLA |
| sla_paused_duration | INT | Duración acumulada de pausa (minutos) |
| is_sla_response_breached | BOOLEAN | Respuesta incumplida |
| is_sla_resolve_breached | BOOLEAN | Resolución incumplida |

**Resultados del análisis de IA**

| Campo | Tipo | Descripción | Completado por |
|------|------|------|----------|
| ai_category_code | VARCHAR | Categoría identificada por IA | Sam |
| ai_sentiment | VARCHAR | Análisis de sentimiento | Sam |
| ai_urgency | VARCHAR | Nivel de urgencia | Sam |
| ai_keywords | JSONB | Palabras clave | Sam |
| ai_reasoning | TEXT | Proceso de razonamiento | Sam |
| ai_suggested_reply | TEXT | Respuesta sugerida | Sam/Grace |
| ai_confidence_score | NUMERIC | Puntuación de confianza | Sam |
| ai_analysis | JSONB | Resultado completo del análisis | Sam |

**Soporte multilingüe**

| Campo | Tipo | Descripción | Completado por |
|------|------|------|----------|
| source_language_code | VARCHAR | Idioma original | Sam/Lexi |
| target_language_code | VARCHAR | Idioma de destino | Predeterminado del sistema EN |
| is_translated | BOOLEAN | Si está traducido | Lexi |
| description_translated | TEXT | Descripción traducida | Lexi |

#### 2.2.2 Tablas de extensión de negocio

**Reparación de equipos (nb_tts_biz_repair)**

| Campo | Tipo | Descripción |
|------|------|------|
| ticket_id | BIGINT | ID de ticket asociado |
| equipment_model | VARCHAR | Modelo del equipo |
| serial_number | VARCHAR | Número de serie |
| fault_code | VARCHAR | Código de falla |
| spare_parts | JSONB | Lista de repuestos |
| maintenance_type | VARCHAR | Tipo de mantenimiento |

**Soporte de TI (nb_tts_biz_it_support)**

| Campo | Tipo | Descripción |
|------|------|------|
| ticket_id | BIGINT | ID de ticket asociado |
| asset_number | VARCHAR | Número de activo |
| os_version | VARCHAR | Versión del sistema operativo |
| software_name | VARCHAR | Software involucrado |
| remote_address | VARCHAR | Dirección remota |
| error_code | VARCHAR | Código de error |

**Reclamación del cliente (nb_tts_biz_complaint)**

| Campo | Tipo | Descripción |
|------|------|------|
| ticket_id | BIGINT | ID de ticket asociado |
| related_order_no | VARCHAR | Número de pedido relacionado |
| complaint_level | VARCHAR | Nivel de reclamación |
| compensation_amount | DECIMAL | Monto de compensación |
| compensation_type | VARCHAR | Método de compensación |
| root_cause | TEXT | Causa raíz |

#### 2.2.3 Tabla de comentarios (nb_tts_ticket_comments)

**Campos principales**

| Campo | Tipo | Descripción |
|------|------|------|
| id | BIGINT | Clave primaria |
| ticket_id | BIGINT | ID del ticket |
| parent_id | BIGINT | ID del comentario padre (soporta estructura de árbol) |
| content | TEXT | Contenido del comentario |
| direction | VARCHAR | Dirección: inbound (cliente) / outbound (agente) |
| is_internal | BOOLEAN | Si es una nota interna |
| is_first_response | BOOLEAN | Si es la primera respuesta |

**Campos de revisión de IA (para outbound)**

| Campo | Tipo | Descripción |
|------|------|------|
| source_language_code | VARCHAR | Idioma de origen |
| content_translated | TEXT | Contenido traducido |
| is_translated | BOOLEAN | Si está traducido |
| is_ai_blocked | BOOLEAN | Si fue bloqueado por IA |
| ai_block_reason | VARCHAR | Motivo del bloqueo |
| ai_block_detail | TEXT | Explicación detallada |
| ai_quality_score | NUMERIC | Puntuación de calidad |
| ai_suggestions | TEXT | Sugerencias de mejora |

#### 2.2.4 Tabla de valoraciones (nb_tts_ratings)

| Campo | Tipo | Descripción |
|------|------|------|
| ticket_id | BIGINT | ID del ticket (único) |
| overall_rating | INT | Satisfacción general (1-5) |
| response_rating | INT | Velocidad de respuesta (1-5) |
| professionalism_rating | INT | Profesionalismo (1-5) |
| resolution_rating | INT | Resolución de problemas (1-5) |
| nps_score | INT | Puntuación NPS (0-10) |
| tags | JSONB | Etiquetas rápidas |
| comment | TEXT | Comentario escrito |

#### 2.2.5 Tabla de artículos de conocimiento (nb_tts_qa_articles)

| Campo | Tipo | Descripción |
|------|------|------|
| article_no | VARCHAR | Número de artículo KB-T0001 |
| title | VARCHAR | Título |
| content | TEXT | Contenido (Markdown) |
| summary | TEXT | Resumen |
| category_code | VARCHAR | Código de categoría |
| keywords | JSONB | Palabras clave |
| source_type | VARCHAR | Origen: ticket/faq/manual |
| source_ticket_id | BIGINT | ID del ticket de origen |
| ai_generated | BOOLEAN | Si fue generado por IA |
| ai_quality_score | NUMERIC | Puntuación de calidad |
| status | VARCHAR | Estado: draft/published/archived |
| view_count | INT | Conteo de visualizaciones |
| helpful_count | INT | Conteo de "útil" |

### 2.3 Lista de tablas de datos

| N.º | Nombre de la tabla | Descripción | Tipo de registro |
|------|------|------|----------|
| 1 | nb_tts_tickets | Tabla principal de tickets | Datos de negocio |
| 2 | nb_tts_biz_repair | Extensión de reparación de equipos | Datos de negocio |
| 3 | nb_tts_biz_it_support | Extensión de soporte de TI | Datos de negocio |
| 4 | nb_tts_biz_complaint | Extensión de reclamación de cliente | Datos de negocio |
| 5 | nb_tts_customers | Tabla principal de clientes | Datos de negocio |
| 6 | nb_tts_customer_contacts | Contactos de clientes | Datos de negocio |
| 7 | nb_tts_ticket_comments | Comentarios de tickets | Datos de negocio |
| 8 | nb_tts_ratings | Valoraciones de satisfacción | Datos de negocio |
| 9 | nb_tts_qa_articles | Artículos de conocimiento | Datos de conocimiento |
| 10 | nb_tts_qa_article_relations | Relaciones de artículos | Datos de conocimiento |
| 11 | nb_tts_faqs | Preguntas frecuentes | Datos de conocimiento |
| 12 | nb_tts_tickets_categories | Categorías de tickets | Datos de configuración |
| 13 | nb_tts_sla_configs | Configuración de SLA | Datos de configuración |
| 14 | nb_tts_skill_configs | Configuración de habilidades | Datos de configuración |
| 15 | nb_tts_business_types | Tipos de negocio | Datos de configuración |

---

## 3. Ciclo de vida del ticket

### 3.1 Definición de estados

| Estado | Nombre | Descripción | Cronometraje de SLA | Color |
|--------|------|-------------|------------|-------|
| new | Nuevo | Recién creado, esperando asignación | Inicio | 🔵 Azul |
| assigned | Asignado | Encargado especificado, esperando aceptación | Continuar | 🔷 Cian |
| processing | En proceso | Siendo procesado | Continuar | 🟠 Naranja |
| pending | Pendiente | Esperando respuesta del cliente | **Pausado** | ⚫ Gris |
| transferred | Transferido | Transferido a otra persona | Continuar | 🟣 Púrpura |
| resolved | Resuelto | Esperando confirmación del cliente | Detener | 🟢 Verde |
| closed | Cerrado | Ticket finalizado | Detener | ⚫ Gris |
| cancelled | Cancelado | Ticket cancelado | Detener | ⚫ Gris |

### 3.2 Diagrama de flujo de estados

**Flujo principal (de izquierda a derecha)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-51-45.png)

**Flujos secundarios**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-42.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-52-53.png)


**Máquina de estados completa**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-54-23.png)

### 3.3 Reglas clave de transición de estados

| Desde | Hasta | Condición de activación | Acción del sistema |
|----|----|---------|---------|
| new | assigned | Asignar encargado | Registrar assigned_at |
| assigned | processing | El encargado hace clic en "Aceptar" | Ninguna |
| processing | pending | Clic en "Pausar" | Registrar sla_paused_at |
| pending | processing | Respuesta del cliente / Reanudación manual | Calcular duración de pausa, limpiar paused_at |
| processing | resolved | Clic en "Resolver" | Registrar resolved_at |
| resolved | closed | Confirmación del cliente / Tiempo de espera de 3 días | Registrar closed_at |
| * | cancelled | Cancelar ticket | Ninguna |


---

## 4. Gestión del nivel de servicio SLA

### 4.1 Configuración de prioridad y SLA

| Prioridad | Nombre | Tiempo de respuesta | Tiempo de resolución | Umbral de alerta | Escenario típico |
|--------|------|----------|----------|----------|----------|
| P0 | Crítica | 15 minutos | 2 horas | 80% | Caída del sistema, línea de producción detenida |
| P1 | Alta | 1 hora | 8 horas | 80% | Falla de función importante |
| P2 | Media | 4 horas | 24 horas | 80% | Problemas generales |
| P3 | Baja | 8 horas | 72 horas | 80% | Consultas, sugerencias |

### 4.2 Lógica de cálculo de SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-53-54.png)

#### Al crear el ticket

```
sla_response_due = submitted_at + tiempo_limite_respuesta (minutos)
sla_resolve_due = submitted_at + tiempo_limite_resolucion (minutos)
```

#### Al pausar (pending)

```
-- Registrar hora de inicio de pausa
sla_paused_at = AHORA()
```

#### Al reanudar (de pending a processing)

```
-- Calcular duración de esta pausa
duracion_pausa = AHORA() - sla_paused_at

-- Sumar a la duración total de pausa
sla_paused_duration = sla_paused_duration + duracion_pausa

-- Extender los plazos
sla_response_due = sla_response_due + duracion_pausa
sla_resolve_due = sla_resolve_due + duracion_pausa

-- Limpiar hora de pausa
sla_paused_at = NULL
```

#### Determinación de incumplimiento de SLA

```
-- Incumplimiento de respuesta
is_sla_response_breached = (first_response_at ES NULO Y AHORA() > sla_response_due)
                        O (first_response_at > sla_response_due)

-- Incumplimiento de resolución
is_sla_resolve_breached = (resolved_at ES NULO Y AHORA() > sla_resolve_due)
                       O (resolved_at > sla_resolve_due)
```

### 4.3 Mecanismo de alerta de SLA

| Nivel de alerta | Condición | Destinatario | Método |
|----------|------|----------|----------|
| Alerta amarilla | Tiempo restante < 20% | Encargado | Notificación interna |
| Alerta roja | Ya vencido | Encargado + Supervisor | Notificación interna + Correo |
| Alerta de escalada | Vencido por 1 hora | Gerente de departamento | Correo + SMS |

### 4.4 Métricas del tablero de SLA

| Métrica | Fórmula | Umbral de salud |
|------|----------|----------|
| Tasa de cumplimiento de respuesta | Tickets no incumplidos / Total de tickets | > 95% |
| Tasa de cumplimiento de resolución | Resueltos no incumplidos / Total de resueltos | > 90% |
| Tiempo promedio de respuesta | SUM(tiempo de respuesta) / Conteo de tickets | < 50% del SLA |
| Tiempo promedio de resolución | SUM(tiempo de resolución) / Conteo de tickets | < 80% del SLA |

---

## 5. Capacidades de IA y sistema de empleados

### 5.1 Equipo de empleados de IA

El sistema configura 8 empleados de IA, divididos en dos categorías:

**Nuevos empleados (específicos del sistema de tickets)**

| ID | Nombre | Puesto | Capacidades principales |
|----|------|------|----------|
| sam | Sam | Supervisor de mesa de servicio | Distribución de tickets, evaluación de prioridad, decisiones de escalada, identificación de riesgos de SLA |
| grace | Grace | Experta en éxito del cliente | Generación de respuestas profesionales, ajuste de tono, gestión de reclamaciones, recuperación de satisfacción |
| max | Max | Asistente de conocimiento | Búsqueda de casos similares, recomendación de conocimiento, síntesis de soluciones |

**Empleados reutilizados (capacidades generales)**

| ID | Nombre | Puesto | Capacidades principales |
|----|------|------|----------|
| dex | Dex | Organizador de datos | Correo a ticket, llamada a ticket, limpieza de datos por lotes |
| ellis | Ellis | Experto en correo | Análisis de sentimiento de correos, resumen de hilos, redacción de respuestas |
| lexi | Lexi | Traductora | Traducción de tickets, traducción de respuestas, traducción de conversaciones en tiempo real |
| cole | Cole | Experto en NocoBase | Guía de uso del sistema, ayuda en la configuración de flujos de trabajo |
| vera | Vera | Analista de investigación | Investigación de soluciones técnicas, verificación de información de productos |

### 5.2 Lista de tareas de IA

Cada empleado de IA tiene configuradas 4 tareas específicas:

#### Tareas de Sam

| ID de tarea | Nombre | Método de activación | Descripción |
|--------|------|----------|------|
| SAM-01 | Análisis y distribución de tickets | Flujo de trabajo automático | Análisis automático al crear un nuevo ticket |
| SAM-02 | Reevaluación de prioridad | Interacción en frontend | Ajustar prioridad basada en nueva información |
| SAM-03 | Decisión de escalada | Frontend/Flujo de trabajo | Determinar si se requiere escalada |
| SAM-04 | Evaluación de riesgo de SLA | Flujo de trabajo automático | Identificar riesgos de vencimiento |

#### Tareas de Grace

| ID de tarea | Nombre | Método de activación | Descripción |
|--------|------|----------|------|
| GRACE-01 | Generación de respuesta profesional | Interacción en frontend | Generar respuesta basada en el contexto |
| GRACE-02 | Ajuste de tono de respuesta | Interacción en frontend | Optimizar el tono de una respuesta existente |
| GRACE-03 | Desescalada de reclamaciones | Frontend/Flujo de trabajo | Mitigar reclamaciones de clientes |
| GRACE-04 | Recuperación de satisfacción | Frontend/Flujo de trabajo | Seguimiento tras una experiencia negativa |

#### Tareas de Max

| ID de tarea | Nombre | Método de activación | Descripción |
|--------|------|----------|------|
| MAX-01 | Búsqueda de casos similares | Frontend/Flujo de trabajo | Buscar tickets históricos similares |
| MAX-02 | Recomendación de artículos | Frontend/Flujo de trabajo | Recomendar artículos de conocimiento relevantes |
| MAX-03 | Síntesis de soluciones | Interacción en frontend | Sintetizar soluciones de múltiples fuentes |
| MAX-04 | Guía de resolución de problemas | Interacción en frontend | Crear un proceso sistemático de diagnóstico |

#### Tareas de Lexi

| ID de tarea | Nombre | Método de activación | Descripción |
|--------|------|----------|------|
| LEXI-01 | Traducción de tickets | Flujo de trabajo automático | Traducir el contenido del ticket |
| LEXI-02 | Traducción de respuestas | Interacción en frontend | Traducir respuestas del agente |
| LEXI-03 | Traducción por lotes | Flujo de trabajo automático | Procesamiento de traducción masiva |
| LEXI-04 | Traducción de diálogo en tiempo real | Interacción en frontend | Traducción de conversaciones en vivo |

### 5.3 Empleados de IA y ciclo de vida del ticket

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-04.png)

### 5.4 Ejemplos de respuesta de IA

#### SAM-01 Respuesta de análisis de ticket

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "fallo de inicio de sesión", "tiempo de espera", "cierre de mes"],
  "confidence": 0.92,
  "reasoning": "Este ticket describe un problema de inicio de sesión en el sistema ERP que afecta al cierre de mes del departamento financiero, urgencia alta",
  "suggested_reply": "Estimado cliente, gracias por informar sobre este problema...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Hola, nuestro sistema ERP no puede iniciar sesión..."
}
```

#### GRACE-01 Respuesta de generación de respuesta

```
Estimado Sr. Zhang,

Gracias por contactarnos sobre el problema de inicio de sesión en el ERP. Entiendo perfectamente que este problema está afectando el trabajo de cierre de mes de su empresa, y lo hemos priorizado con alta prioridad.

Estado actual:
- El equipo técnico está investigando problemas de conexión con el servidor.
- Se espera proporcionar una actualización en 30 minutos.

Mientras tanto, puede intentar:
1. Acceder a través de la dirección de respaldo: https://erp-backup.company.com
2. Si necesita informes urgentes, contáctenos para asistirle con la exportación.

No dude en contactarme si tiene alguna otra pregunta.

Atentamente,
Equipo de Soporte Técnico
```

### 5.5 Cortafuegos de inteligencia emocional de IA

La revisión de calidad de respuesta de Grace bloquea los siguientes problemas:

| Tipo de problema | Ejemplo original | Sugerencia de IA |
|----------|----------|--------|
| Tono negativo | "No, esto no está cubierto por la garantía" | "Esta falla no está cubierta actualmente por la garantía gratuita, podemos ofrecerle un plan de reparación pagado" |
| Culpar al cliente | "Usted mismo lo rompió" | "Tras la verificación, esta falla se debe a un daño accidental" |
| Evadir responsabilidad | "No es nuestro problema" | "Permítame ayudarle a investigar más a fondo la causa del problema" |
| Expresión fría | "No lo sé" | "Permítame consultar la información relevante para usted" |
| Información sensible | "Su contraseña es abc123" | [Bloqueado] Contiene información sensible, no se permite el envío |

---

## 6. Sistema de base de conocimiento

### 6.1 Fuentes de conocimiento

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-20.png)


### 6.2 Flujo de ticket a conocimiento

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-38.png)

**Dimensiones de evaluación**:
- **Generalidad**: ¿Es este un problema común?
- **Integridad**: ¿Es la solución clara y completa?
- **Repetibilidad**: ¿Son los pasos reutilizables?

### 6.3 Mecanismo de recomendación de conocimiento

Cuando un agente abre los detalles del ticket, Max recomienda automáticamente conocimiento relacionado:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Conocimiento recomendado                  [Expandir/Contraer] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Guía de diagnóstico de fallas del sistema servo CNC │
│ │ Coincidencia: 94%                                      │ │
│ │ Incluye: Interpretación de códigos de alarma, pasos de  │ │
│ │ verificación del servo drive                            │ │
│ │ [Ver] [Aplicar a respuesta] [Marcar como útil]          │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Manual de mantenimiento serie XYZ-CNC3000     │ │
│ │ Coincidencia: 87%                                      │ │
│ │ Incluye: Fallas comunes, plan de mantenimiento preventivo │ │
│ │ [Ver] [Aplicar a respuesta] [Marcar como útil]          │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Motor de flujo de trabajo

### 7.1 Clasificación de flujos de trabajo

| Código | Categoría | Descripción | Método de activación |
|------|------|------|----------|
| WF-T | Flujo de tickets | Gestión del ciclo de vida del ticket | Eventos de formulario |
| WF-S | Flujo de SLA | Cálculo y alertas de SLA | Eventos de formulario/Programado |
| WF-C | Flujo de comentarios | Procesamiento y traducción de comentarios | Eventos de formulario |
| WF-R | Flujo de valoraciones | Invitaciones y estadísticas de valoración | Eventos de formulario/Programado |
| WF-N | Flujo de notificaciones | Envío de notificaciones | Basado en eventos |
| WF-AI | Flujo de IA | Análisis y generación de IA | Eventos de formulario |

### 7.2 Flujos de trabajo principales

#### WF-T01: Flujo de creación de tickets

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-55-51.png)

#### WF-AI01: Análisis de IA del ticket

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-03.png)

#### WF-AI04: Traducción y revisión de comentarios

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-19.png)

#### WF-AI03: Generación de conocimiento

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-56-37.png)

### 7.3 Tareas programadas

| Tarea | Frecuencia | Descripción |
|------|----------|------|
| Verificación de alerta SLA | Cada 5 minutos | Revisar tickets próximos a vencer |
| Cierre automático de tickets | Diariamente | Cerrar automáticamente tras 3 días en estado resuelto |
| Envío de invitación de valoración | Diariamente | Enviar invitación 24 horas después del cierre |
| Actualización de estadísticas | Cada hora | Actualizar estadísticas de tickets de clientes |

---

## 8. Diseño de menús e interfaz

### 8.1 Administración del backend

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-10.png)

### 8.2 Portal del cliente

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-2025-12-31-22-59-32.png)

### 8.3 Diseño del tablero

#### Vista ejecutiva

| Componente | Tipo | Descripción de datos |
|------|------|----------|
| Tasa de cumplimiento SLA | Indicador | Cumplimiento de respuesta/resolución de este mes |
| Tendencia de satisfacción | Gráfico de líneas | Cambios en la satisfacción en los últimos 30 días |
| Tendencia de volumen de tickets | Gráfico de barras | Volumen de tickets en los últimos 30 días |
| Distribución por tipo de negocio | Gráfico de sectores | Proporción de cada tipo de negocio |

#### Vista de supervisor

| Componente | Tipo | Descripción de datos |
|------|------|----------|
| Alertas de vencimiento | Lista | Tickets próximos a vencer / ya vencidos |
| Carga de trabajo del equipo | Gráfico de barras | Conteo de tickets por miembro del equipo |
| Distribución de acumulados | Gráfico apilado | Cantidad de tickets por estado |
| Tiempo de procesamiento | Mapa de calor | Distribución del tiempo promedio de procesamiento |

#### Vista de agente

| Componente | Tipo | Descripción de datos |
|------|------|----------|
| Mis tareas pendientes | Tarjeta numérica | Conteo de tickets pendientes |
| Distribución de prioridad | Gráfico de sectores | Distribución P0/P1/P2/P3 |
| Estadísticas de hoy | Tarjeta de métricas | Conteo de procesados/resueltos hoy |
| Cuenta regresiva SLA | Lista | Los 5 tickets más urgentes |

---

## Apéndice

### A. Configuración de tipos de negocio

| Código de tipo | Nombre | Icono | Tabla de extensión asociada |
|----------|------|------|------------|
| repair | Reparación de equipos | 🔧 | nb_tts_biz_repair |
| it_support | Soporte de TI | 💻 | nb_tts_biz_it_support |
| complaint | Reclamación del cliente | 📢 | nb_tts_biz_complaint |
| consultation | Consulta/Sugerencia | ❓ | Ninguna |
| other | Otro | 📝 | Ninguna |

### B. Códigos de categoría

| Código | Nombre | Descripción |
|------|------|------|
| CONVEYOR | Sistema de transporte | Problemas del sistema de transporte |
| PACKAGING | Máquina de embalaje | Problemas de la máquina de embalaje |
| WELDING | Equipo de soldadura | Problemas del equipo de soldadura |
| COMPRESSOR | Compresor de aire | Problemas del compresor de aire |
| COLD_STORE | Almacén frigorífico | Problemas del almacén frigorífico |
| CENTRAL_AC | Aire acondicionado central | Problemas del aire acondicionado central |
| FORKLIFT | Montacargas | Problemas de montacargas |
| COMPUTER | Computadora | Problemas de hardware de computadora |
| PRINTER | Impresora | Problemas de impresora |
| PROJECTOR | Proyector | Problemas de proyector |
| INTERNET | Red | Problemas de conexión de red |
| EMAIL | Correo | Problemas del sistema de correo |
| ACCESS | Permisos | Problemas de permisos de cuenta |
| PROD_INQ | Consulta de producto | Consulta de producto |
| COMPLAINT | Reclamación general | Reclamación general |
| DELAY | Retraso logístico | Reclamación por retraso logístico |
| DAMAGE | Embalaje dañado | Reclamación por embalaje dañado |
| QUANTITY | Faltante de cantidad | Reclamación por faltante de cantidad |
| SVC_ATTITUDE | Actitud de servicio | Reclamación por actitud de servicio |
| PROD_QUALITY | Calidad del producto | Reclamación por calidad del producto |
| TRAINING | Capacitación | Solicitud de capacitación |
| RETURN | Devolución | Solicitud de devolución |

---

*Versión del documento: 2.0 | Última actualización: 2026-01-05*