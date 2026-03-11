:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/solution/crm/design).
:::

# Diseño detallado del sistema CRM 2.0

## 1. Descripción general del sistema y filosofía de diseño

### 1.1 Posicionamiento del sistema

Este sistema es una **Plataforma de gestión de ventas CRM 2.0** construida sobre la plataforma sin código NocoBase. El objetivo central es:

```
Permitir que el equipo de ventas se concentre en construir relaciones con los clientes, en lugar de en la entrada de datos y el análisis repetitivo.
```

El sistema automatiza las tareas rutinarias a través de flujos de trabajo y utiliza la IA para asistir en la calificación de clientes potenciales, el análisis de oportunidades y otras tareas, ayudando a los equipos de ventas a mejorar su eficiencia.

### 1.2 Filosofía de diseño

#### Filosofía 1: Embudo de ventas completo

**Proceso de ventas de extremo a extremo:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**¿Por qué diseñarlo de esta manera?**

| Método tradicional | CRM integrado |
|---------|-----------|
| Uso de múltiples sistemas para diferentes etapas | Un solo sistema que cubre todo el ciclo de vida |
| Transferencia manual de datos entre sistemas | Flujo y conversión de datos automatizados |
| Vistas de cliente inconsistentes | Vista unificada de 360 grados del cliente |
| Análisis de datos fragmentado | Análisis del pipeline de ventas de extremo a extremo |

#### Filosofía 2: Pipeline de ventas configurable
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Diferentes industrias pueden personalizar las etapas del pipeline de ventas sin modificar el código.

#### Filosofía 3: Diseño modular

- Los módulos principales (Clientes + Oportunidades) son obligatorios; otros módulos pueden activarse según sea necesario.
- La desactivación de módulos no requiere cambios de código; se realiza a través de la configuración de la interfaz de NocoBase.
- Cada módulo se diseña de forma independiente para reducir el acoplamiento.

---

## 2. Arquitectura de módulos y personalización

### 2.1 Descripción general de los módulos

El sistema CRM adopta un diseño de **arquitectura modular**: cada módulo puede activarse o desactivarse de forma independiente según los requisitos del negocio.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Dependencias de los módulos

| Módulo | ¿Es obligatorio? | Dependencias | Condición de desactivación |
|-----|---------|--------|---------|
| **Gestión de clientes** | ✅ Sí | - | No se puede desactivar (Núcleo) |
| **Gestión de oportunidades** | ✅ Sí | Gestión de clientes | No se puede desactivar (Núcleo) |
| **Gestión de clientes potenciales** | Opcional | - | Cuando no se requiere la captación de prospectos |
| **Gestión de cotizaciones** | Opcional | Oportunidades, Productos | Transacciones simples que no requieren cotizaciones formales |
| **Gestión de pedidos** | Opcional | Oportunidades (o Cotizaciones) | Cuando no se requiere el seguimiento de pedidos/pagos |
| **Gestión de productos** | Opcional | - | Cuando no se requiere un catálogo de productos |
| **Integración de correo** | Opcional | Clientes, Contactos | Cuando se utiliza un sistema de correo externo |

### 2.3 Versiones preconfiguradas

| Versión | Módulos incluidos | Escenario de uso | Número de colecciones |
|-----|---------|---------|-----------|
| **Versión ligera** | Clientes + Oportunidades | Seguimiento de transacciones simples | 6 |
| **Versión estándar** | Ligera + Prospectos + Cotizaciones + Pedidos + Productos | Ciclo de ventas completo | 15 |
| **Versión empresarial** | Estándar + Integración de correo | Funcionalidad completa incluyendo correo | 17 |

### 2.4 Mapeo de módulo a colección

#### Colecciones de módulos principales (Siempre obligatorias)

| Colección | Módulo | Descripción |
|-------|------|------|
| nb_crm_customers | Gestión de clientes | Registros de clientes/empresas |
| nb_crm_contacts | Gestión de clientes | Contactos |
| nb_crm_customer_shares | Gestión de clientes | Permisos de uso compartido de clientes |
| nb_crm_opportunities | Gestión de oportunidades | Oportunidades de venta |
| nb_crm_opportunity_stages | Gestión de oportunidades | Configuraciones de etapas |
| nb_crm_opportunity_users | Gestión de oportunidades | Colaboradores de la oportunidad |
| nb_crm_activities | Gestión de actividades | Registros de actividad |
| nb_crm_comments | Gestión de actividades | Comentarios/Notas |
| nb_crm_tags | Núcleo | Etiquetas compartidas |
| nb_cbo_currencies | Datos base | Diccionario de monedas |
| nb_cbo_regions | Datos base | Diccionario de países/regiones |

### 2.5 Cómo desactivar módulos

Simplemente oculte la entrada del menú para el módulo en la interfaz de administración de NocoBase; no es necesario modificar el código ni eliminar colecciones.

---

## 3. Entidades principales y modelo de datos

### 3.1 Descripción general de las relaciones entre entidades
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Detalles de las colecciones principales

#### 3.2.1 Clientes potenciales (nb_crm_leads)

Gestión de prospectos utilizando un flujo de trabajo simplificado de 4 etapas.

**Proceso de etapas:**
```
Nuevo → En proceso → Calificado → Convertido en Cliente/Oportunidad
          ↓            ↓
    No calificado  No calificado
```

**Campos clave:**

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| lead_no | VARCHAR | Número de prospecto (Autogenerado) |
| name | VARCHAR | Nombre del contacto |
| company | VARCHAR | Nombre de la empresa |
| title | VARCHAR | Cargo |
| email | VARCHAR | Correo electrónico |
| phone | VARCHAR | Teléfono |
| mobile_phone | VARCHAR | Móvil |
| website | TEXT | Sitio web |
| address | TEXT | Dirección |
| source | VARCHAR | Fuente: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Industria |
| annual_revenue | VARCHAR | Escala de ingresos anuales |
| number_of_employees | VARCHAR | Escala de número de empleados |
| status | VARCHAR | Estado: new/working/qualified/unqualified |
| rating | VARCHAR | Calificación: hot/warm/cold |
| owner_id | BIGINT | Propietario (FK → users) |
| ai_score | INTEGER | Puntuación de calidad IA 0-100 |
| ai_convert_prob | DECIMAL | Probabilidad de conversión IA |
| ai_best_contact_time | VARCHAR | Hora de contacto recomendada por IA |
| ai_tags | JSONB | Etiquetas generadas por IA |
| ai_scored_at | TIMESTAMP | Hora de puntuación de IA |
| ai_next_best_action | TEXT | Sugerencia de mejor acción siguiente de IA |
| ai_nba_generated_at | TIMESTAMP | Hora de generación de sugerencia de IA |
| is_converted | BOOLEAN | Indicador de convertido |
| converted_at | TIMESTAMP | Hora de conversión |
| converted_customer_id | BIGINT | ID del cliente convertido |
| converted_contact_id | BIGINT | ID del contacto convertido |
| converted_opportunity_id | BIGINT | ID de la oportunidad convertida |
| lost_reason | TEXT | Motivo de pérdida |
| disqualification_reason | TEXT | Motivo de descalificación |
| description | TEXT | Descripción |

#### 3.2.2 Clientes (nb_crm_customers)

Gestión de clientes/empresas con soporte para negocios internacionales.

**Campos clave:**

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| name | VARCHAR | Nombre del cliente (Obligatorio) |
| account_number | VARCHAR | Número de cuenta (Autogenerado, único) |
| phone | VARCHAR | Teléfono |
| website | TEXT | Sitio web |
| address | TEXT | Dirección |
| industry | VARCHAR | Industria |
| type | VARCHAR | Tipo: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Escala de número de empleados |
| annual_revenue | VARCHAR | Escala de ingresos anuales |
| level | VARCHAR | Nivel: normal/important/vip |
| status | VARCHAR | Estado: potential/active/dormant/churned |
| country | VARCHAR | País |
| region_id | BIGINT | Región (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Moneda preferida: CNY/USD/EUR |
| owner_id | BIGINT | Propietario (FK → users) |
| parent_id | BIGINT | Empresa matriz (FK → self) |
| source_lead_id | BIGINT | ID del prospecto de origen |
| ai_health_score | INTEGER | Puntuación de salud IA 0-100 |
| ai_health_grade | VARCHAR | Grado de salud IA: A/B/C/D |
| ai_churn_risk | DECIMAL | Riesgo de abandono IA 0-100% |
| ai_churn_risk_level | VARCHAR | Nivel de riesgo de abandono IA: low/medium/high |
| ai_health_dimensions | JSONB | Puntuaciones de dimensiones de salud IA |
| ai_recommendations | JSONB | Lista de recomendaciones de IA |
| ai_health_assessed_at | TIMESTAMP | Hora de evaluación de salud IA |
| ai_tags | JSONB | Etiquetas generadas por IA |
| ai_best_contact_time | VARCHAR | Hora de contacto recomendada por IA |
| ai_next_best_action | TEXT | Sugerencia de mejor acción siguiente de IA |
| ai_nba_generated_at | TIMESTAMP | Hora de generación de sugerencia de IA |
| description | TEXT | Descripción |
| is_deleted | BOOLEAN | Indicador de eliminación lógica |

#### 3.2.3 Oportunidades (nb_crm_opportunities)

Gestión de oportunidades de venta con etapas de pipeline configurables.

**Campos clave:**

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| opportunity_no | VARCHAR | Número de oportunidad (Autogenerado, único) |
| name | VARCHAR | Nombre de la oportunidad (Obligatorio) |
| amount | DECIMAL | Monto esperado |
| currency | VARCHAR | Moneda |
| exchange_rate | DECIMAL | Tipo de cambio |
| amount_usd | DECIMAL | Monto equivalente en USD |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contacto principal (FK) |
| stage | VARCHAR | Código de etapa (FK → stages.code) |
| stage_sort | INTEGER | Orden de etapa (Redundante para facilitar el orden) |
| stage_entered_at | TIMESTAMP | Hora de entrada a la etapa actual |
| days_in_stage | INTEGER | Días en la etapa actual |
| win_probability | DECIMAL | Probabilidad de éxito manual |
| ai_win_probability | DECIMAL | Probabilidad de éxito predicha por IA |
| ai_analyzed_at | TIMESTAMP | Hora de análisis de IA |
| ai_confidence | DECIMAL | Confianza de la predicción de IA |
| ai_trend | VARCHAR | Tendencia de predicción IA: up/stable/down |
| ai_risk_factors | JSONB | Factores de riesgo identificados por IA |
| ai_recommendations | JSONB | Lista de recomendaciones de IA |
| ai_predicted_close | DATE | Fecha de cierre predicha por IA |
| ai_next_best_action | TEXT | Sugerencia de mejor acción siguiente de IA |
| ai_nba_generated_at | TIMESTAMP | Hora de generación de sugerencia de IA |
| expected_close_date | DATE | Fecha de cierre esperada |
| actual_close_date | DATE | Fecha de cierre real |
| owner_id | BIGINT | Propietario (FK → users) |
| last_activity_at | TIMESTAMP | Hora de última actividad |
| stagnant_days | INTEGER | Días sin actividad |
| loss_reason | TEXT | Motivo de pérdida |
| competitor_id | BIGINT | Competidor (FK) |
| lead_source | VARCHAR | Fuente del prospecto |
| campaign_id | BIGINT | ID de campaña de marketing |
| expected_revenue | DECIMAL | Ingresos esperados = monto × probabilidad |
| description | TEXT | Descripción |

#### 3.2.4 Cotizaciones (nb_crm_quotations)

Gestión de cotizaciones con soporte multimoneda y flujos de aprobación.

**Flujo de estados:**
```
Borrador → Pendiente de aprobación → Aprobada → Enviada → Aceptada/Rechazada/Expirada
                    ↓
                Rechazada → Editar → Borrador
```

**Campos clave:**

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| quotation_no | VARCHAR | N.º de cotización (Autogenerado, único) |
| name | VARCHAR | Nombre de la cotización |
| version | INTEGER | Número de versión |
| opportunity_id | BIGINT | Oportunidad (FK, obligatorio) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contacto (FK) |
| owner_id | BIGINT | Propietario (FK → users) |
| currency_id | BIGINT | Moneda (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Tipo de cambio |
| subtotal | DECIMAL | Subtotal |
| discount_rate | DECIMAL | Tasa de descuento |
| discount_amount | DECIMAL | Monto del descuento |
| shipping_handling | DECIMAL | Envío/Manipulación |
| tax_rate | DECIMAL | Tasa de impuestos |
| tax_amount | DECIMAL | Monto de impuestos |
| total_amount | DECIMAL | Monto total |
| total_amount_usd | DECIMAL | Monto equivalente en USD |
| status | VARCHAR | Estado: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Hora de envío |
| approved_by | BIGINT | Aprobador (FK → users) |
| approved_at | TIMESTAMP | Hora de aprobación |
| rejected_at | TIMESTAMP | Hora de rechazo |
| sent_at | TIMESTAMP | Hora de envío al cliente |
| customer_response_at | TIMESTAMP | Hora de respuesta del cliente |
| expired_at | TIMESTAMP | Hora de expiración |
| valid_until | DATE | Válido hasta |
| payment_terms | TEXT | Condiciones de pago |
| terms_condition | TEXT | Términos y condiciones |
| address | TEXT | Dirección de envío |
| description | TEXT | Descripción |

#### 3.2.5 Pedidos (nb_crm_orders)

Gestión de pedidos incluyendo el seguimiento de pagos.

**Campos clave:**

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| order_no | VARCHAR | Número de pedido (Autogenerado, único) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contacto (FK) |
| opportunity_id | BIGINT | Oportunidad (FK) |
| quotation_id | BIGINT | Cotización (FK) |
| owner_id | BIGINT | Propietario (FK → users) |
| currency | VARCHAR | Moneda |
| exchange_rate | DECIMAL | Tipo de cambio |
| order_amount | DECIMAL | Monto del pedido |
| paid_amount | DECIMAL | Monto pagado |
| unpaid_amount | DECIMAL | Monto pendiente |
| status | VARCHAR | Estado: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Estado de pago: unpaid/partial/paid |
| order_date | DATE | Fecha del pedido |
| delivery_date | DATE | Fecha de entrega esperada |
| actual_delivery_date | DATE | Fecha de entrega real |
| shipping_address | TEXT | Dirección de envío |
| logistics_company | VARCHAR | Empresa de logística |
| tracking_no | VARCHAR | Número de seguimiento |
| terms_condition | TEXT | Términos y condiciones |
| description | TEXT | Descripción |

### 3.3 Resumen de colecciones

#### Colecciones de negocio CRM

| N.º | Nombre de la colección | Descripción | Tipo |
|-----|------|------|------|
| 1 | nb_crm_leads | Gestión de prospectos | Negocio |
| 2 | nb_crm_customers | Clientes/Empresas | Negocio |
| 3 | nb_crm_contacts | Contactos | Negocio |
| 4 | nb_crm_opportunities | Oportunidades de venta | Negocio |
| 5 | nb_crm_opportunity_stages | Configuración de etapas | Configuración |
| 6 | nb_crm_opportunity_users | Colaboradores de oportunidad (Equipo de ventas) | Asociación |
| 7 | nb_crm_quotations | Cotizaciones | Negocio |
| 8 | nb_crm_quotation_items | Artículos de cotización | Negocio |
| 9 | nb_crm_quotation_approvals | Registros de aprobación | Negocio |
| 10 | nb_crm_orders | Pedidos | Negocio |
| 11 | nb_crm_order_items | Artículos del pedido | Negocio |
| 12 | nb_crm_payments | Registros de pago | Negocio |
| 13 | nb_crm_products | Catálogo de productos | Negocio |
| 14 | nb_crm_product_categories | Categorías de productos | Configuración |
| 15 | nb_crm_price_tiers | Precios por niveles | Configuración |
| 16 | nb_crm_activities | Registros de actividad | Negocio |
| 17 | nb_crm_comments | Comentarios/Notas | Negocio |
| 18 | nb_crm_competitors | Competidores | Negocio |
| 19 | nb_crm_tags | Etiquetas | Configuración |
| 20 | nb_crm_lead_tags | Asociación Prospecto-Etiqueta | Asociación |
| 21 | nb_crm_contact_tags | Asociación Contacto-Etiqueta | Asociación |
| 22 | nb_crm_customer_shares | Permisos de uso compartido de clientes | Asociación |
| 23 | nb_crm_exchange_rates | Historial de tipos de cambio | Configuración |

#### Colecciones de datos base (Módulos comunes)

| N.º | Nombre de la colección | Descripción | Tipo |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Diccionario de monedas | Configuración |
| 2 | nb_cbo_regions | Diccionario de países/regiones | Configuración |

### 3.4 Colecciones auxiliares

#### 3.4.1 Comentarios (nb_crm_comments)

Colección genérica de comentarios/notas que puede asociarse con varios objetos de negocio.

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| content | TEXT | Contenido del comentario |
| lead_id | BIGINT | Prospecto asociado (FK) |
| customer_id | BIGINT | Cliente asociado (FK) |
| opportunity_id | BIGINT | Oportunidad asociada (FK) |
| order_id | BIGINT | Pedido asociado (FK) |

#### 3.4.2 Uso compartido de clientes (nb_crm_customer_shares)

Permite la colaboración de varias personas y el uso compartido de permisos para los clientes.

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| customer_id | BIGINT | Cliente (FK, obligatorio) |
| shared_with_user_id | BIGINT | Usuario con quien se comparte (FK, obligatorio) |
| shared_by_user_id | BIGINT | Usuario que comparte (FK) |
| permission_level | VARCHAR | Nivel de permiso: read/write/full |
| shared_at | TIMESTAMP | Hora de compartido |

#### 3.4.3 Colaboradores de oportunidad (nb_crm_opportunity_users)

Soporta la colaboración del equipo de ventas en las oportunidades.

| Campo | Tipo | Descripción |
|-----|------|------|
| opportunity_id | BIGINT | Oportunidad (FK, PK compuesta) |
| user_id | BIGINT | Usuario (FK, PK compuesta) |
| role | VARCHAR | Rol: owner/collaborator/viewer |

#### 3.4.4 Regiones (nb_cbo_regions)

Diccionario de datos base de países/regiones.

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| code_alpha2 | VARCHAR | Código ISO 3166-1 Alpha-2 (Único) |
| code_alpha3 | VARCHAR | Código ISO 3166-1 Alpha-3 (Único) |
| code_numeric | VARCHAR | Código numérico ISO 3166-1 |
| name | VARCHAR | Nombre del país/región |
| is_active | BOOLEAN | ¿Está activo? |
| sort_order | INTEGER | Orden de clasificación |

---

## 4. Ciclo de vida del cliente potencial

La gestión de prospectos utiliza un flujo de trabajo simplificado de 4 etapas. Cuando se crea un nuevo prospecto, un flujo de trabajo puede activar automáticamente la puntuación por IA para ayudar a las ventas a identificar rápidamente prospectos de alta calidad.

### 4.1 Definiciones de estado

| Estado | Nombre | Descripción |
|-----|------|------|
| new | Nuevo | Recién creado, esperando contacto |
| working | En proceso | Seguimiento activo |
| qualified | Calificado | Listo para la conversión |
| unqualified | No calificado | No encaja |

### 4.2 Diagrama de flujo de estados

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Proceso de conversión de prospectos

La interfaz de conversión ofrece tres opciones simultáneamente; el usuario puede elegir crear o asociar:

- **Cliente**: Crear un nuevo cliente O asociar con uno existente.
- **Contacto**: Crear un nuevo contacto (asociado al cliente).
- **Oportunidad**: Se debe crear una oportunidad.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Registros post-conversión:**
- `converted_customer_id`: ID del cliente asociado.
- `converted_contact_id`: ID del contacto asociado.
- `converted_opportunity_id`: ID de la oportunidad creada.

---

## 5. Ciclo de vida de la oportunidad

La gestión de oportunidades utiliza etapas de pipeline de ventas configurables. Cuando cambia la etapa de una oportunidad, se puede activar automáticamente la predicción de probabilidad de éxito por IA para ayudar a identificar riesgos y oportunidades.

### 5.1 Etapas configurables

Las etapas se almacenan en la colección `nb_crm_opportunity_stages` y pueden personalizarse:

| Código | Nombre | Orden | Probabilidad de éxito por defecto |
|-----|------|------|---------|
| prospecting | Prospección | 1 | 10% |
| analysis | Análisis de necesidades | 2 | 30% |
| proposal | Propuesta/Cotización | 3 | 60% |
| negotiation | Negociación/Revisión | 4 | 80% |
| won | Ganada | 5 | 100% |
| lost | Perdida | 6 | 0% |

### 5.2 Flujo del pipeline
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Detección de estancamiento

Las oportunidades sin actividad serán marcadas:

| Días sin actividad | Acción |
|-----------|------|
| 7 días | Advertencia amarilla |
| 14 días | Recordatorio naranja al propietario |
| 30 días | Recordatorio rojo al gerente |

```sql
-- Calcular días de estancamiento
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Manejo de Ganadas/Perdidas

**Cuando se gana:**
1. Actualizar etapa a 'won'.
2. Registrar la fecha de cierre real.
3. Actualizar el estado del cliente a 'active'.
4. Activar la creación del pedido (si se aceptó una cotización).

**Cuando se pierde:**
1. Actualizar etapa a 'lost'.
2. Registrar el motivo de la pérdida.
3. Registrar el ID del competidor (si se perdió ante uno).
4. Notificar al gerente.

---

## 6. Ciclo de vida de la cotización

### 6.1 Definiciones de estado

| Estado | Nombre | Descripción |
|-----|------|------|
| draft | Borrador | En preparación |
| pending_approval | Pendiente de aprobación | Esperando aprobación |
| approved | Aprobada | Lista para enviar |
| sent | Enviada | Enviada al cliente |
| accepted | Aceptada | Aceptada por el cliente |
| rejected | Rechazada | Rechazada por el cliente |
| expired | Expirada | Pasada la fecha de validez |

### 6.2 Reglas de aprobación (Por finalizar)

Los flujos de trabajo de aprobación se activan según las siguientes condiciones:

| Condición | Nivel de aprobación |
|------|---------|
| Descuento > 10% | Gerente de ventas |
| Descuento > 20% | Director de ventas |
| Monto > $100K | Finanzas + Gerente General |

### 6.3 Soporte multimoneda

#### Filosofía de diseño

Utilice el **USD como moneda base unificada** para todos los informes y análisis. Cada registro de monto almacena:
- Moneda y monto originales (lo que ve el cliente).
- Tipo de cambio en el momento de la transacción.
- Monto equivalente en USD (para comparación interna).

#### Diccionario de monedas (nb_cbo_currencies)

La configuración de monedas utiliza una colección de datos base común, permitiendo una gestión dinámica. El campo `current_rate` almacena el tipo de cambio actual, actualizado por una tarea programada desde el registro más reciente en `nb_crm_exchange_rates`.

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| code | VARCHAR | Código de moneda (Único): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Nombre de la moneda |
| symbol | VARCHAR | Símbolo de la moneda |
| decimal_places | INTEGER | Posiciones decimales |
| current_rate | DECIMAL | Tipo de cambio actual a USD (Sincronizado desde el historial) |
| is_active | BOOLEAN | ¿Está activo? |
| sort_order | INTEGER | Orden de clasificación |

#### Historial de tipos de cambio (nb_crm_exchange_rates)

Registra datos históricos de tipos de cambio. Una tarea programada sincroniza las tasas más recientes con `nb_cbo_currencies.current_rate`.

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| currency_code | VARCHAR | Código de moneda (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Tasa respecto al USD |
| effective_date | DATE | Fecha de vigencia |
| source | VARCHAR | Fuente: manual/api |
| createdAt | TIMESTAMP | Hora de creación |

> **Nota**: Las cotizaciones se asocian con la colección `nb_cbo_currencies` a través de la clave foránea `currency_id`, y el tipo de cambio se obtiene directamente del campo `current_rate`. Las oportunidades y pedidos utilizan un campo VARCHAR `currency` para almacenar el código de la moneda.

#### Patrón de campos de monto

Las colecciones que contienen montos siguen este patrón:

| Campo | Tipo | Descripción |
|-----|------|------|
| currency | VARCHAR | Moneda de la transacción |
| amount | DECIMAL | Monto original |
| exchange_rate | DECIMAL | Tipo de cambio a USD en la transacción |
| amount_usd | DECIMAL | Equivalente en USD (Calculado) |

**Aplicado a:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Integración de flujo de trabajo
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Lógica de obtención del tipo de cambio:**
1. Obtener el tipo de cambio directamente de `nb_cbo_currencies.current_rate` durante las operaciones de negocio.
2. Transacciones en USD: Tasa = 1.0, no se requiere búsqueda.
3. `current_rate` es sincronizado por una tarea programada desde el último registro de `nb_crm_exchange_rates`.

### 6.4 Gestión de versiones

Cuando una cotización es rechazada o expira, puede duplicarse como una nueva versión:

```
QT-20260119-001 v1 → Rechazada
QT-20260119-001 v2 → Enviada
QT-20260119-001 v3 → Aceptada
```

---

## 7. Ciclo de vida del pedido

### 7.1 Descripción general del pedido

Los pedidos se crean cuando se acepta una cotización, representando un compromiso de negocio confirmado.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Definiciones de estado del pedido

| Estado | Código | Descripción | Acciones permitidas |
|-----|------|------|---------|
| Borrador | `draft` | Pedido creado, aún no confirmado | Editar, Confirmar, Cancelar |
| Confirmado | `confirmed` | Pedido confirmado, esperando cumplimiento | Iniciar cumplimiento, Cancelar |
| En proceso | `in_progress` | Pedido siendo procesado/producido | Actualizar progreso, Enviar, Cancelar (requiere aprobación) |
| Enviado | `shipped` | Productos enviados al cliente | Marcar como entregado |
| Entregado | `delivered` | El cliente recibió los bienes | Completar pedido |
| Completado | `completed` | Pedido totalmente finalizado | Ninguna |
| Cancelado | `cancelled` | Pedido cancelado | Ninguna |

### 7.3 Modelo de datos del pedido

#### nb_crm_orders

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| order_no | VARCHAR | Número de pedido (Autogenerado, único) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contacto (FK) |
| opportunity_id | BIGINT | Oportunidad (FK) |
| quotation_id | BIGINT | Cotización (FK) |
| owner_id | BIGINT | Propietario (FK → users) |
| status | VARCHAR | Estado del pedido |
| payment_status | VARCHAR | Estado de pago: unpaid/partial/paid |
| order_date | DATE | Fecha del pedido |
| delivery_date | DATE | Fecha de entrega esperada |
| actual_delivery_date | DATE | Fecha de entrega real |
| currency | VARCHAR | Moneda del pedido |
| exchange_rate | DECIMAL | Tasa respecto al USD |
| order_amount | DECIMAL | Monto total del pedido |
| paid_amount | DECIMAL | Monto pagado |
| unpaid_amount | DECIMAL | Monto pendiente |
| shipping_address | TEXT | Dirección de envío |
| logistics_company | VARCHAR | Empresa de logística |
| tracking_no | VARCHAR | Número de seguimiento |
| terms_condition | TEXT | Términos y condiciones |
| description | TEXT | Descripción |

#### nb_crm_order_items

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| order_id | FK | Pedido padre |
| product_id | FK | Referencia del producto |
| product_name | VARCHAR | Instantánea del nombre del producto |
| quantity | INT | Cantidad pedida |
| unit_price | DECIMAL | Precio unitario |
| discount_percent | DECIMAL | Porcentaje de descuento |
| line_total | DECIMAL | Total de la línea |
| notes | TEXT | Notas de la línea |

### 7.4 Seguimiento de pagos

#### nb_crm_payments

| Campo | Tipo | Descripción |
|-----|------|------|
| id | BIGINT | Clave primaria |
| order_id | BIGINT | Pedido asociado (FK, obligatorio) |
| customer_id | BIGINT | Cliente (FK) |
| payment_no | VARCHAR | N.º de pago (Autogenerado, único) |
| amount | DECIMAL | Monto del pago (Obligatorio) |
| currency | VARCHAR | Moneda del pago |
| payment_method | VARCHAR | Método: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Fecha del pago |
| bank_account | VARCHAR | Número de cuenta bancaria |
| bank_name | VARCHAR | Nombre del banco |
| notes | TEXT | Notas del pago |

---

## 8. Ciclo de vida del cliente

### 8.1 Descripción general del cliente

Los clientes se crean durante la conversión de prospectos o cuando se gana una oportunidad. El sistema rastrea el ciclo de vida completo, desde la adquisición hasta la promoción.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Definiciones de estado del cliente

| Estado | Código | Salud | Descripción |
|-----|------|--------|------|
| Prospecto | `prospect` | N/A | Prospecto convertido, aún sin pedidos |
| Activo | `active` | ≥70 | Cliente que paga, buena interacción |
| En crecimiento | `growing` | ≥80 | Cliente con oportunidades de expansión |
| En riesgo | `at_risk` | <50 | Cliente que muestra signos de abandono |
| Perdido | `churned` | N/A | Ya no está activo |
| Recuperación | `win_back` | N/A | Antiguo cliente en proceso de reactivación |
| Promotor | `advocate` | ≥90 | Alta satisfacción, proporciona referencias |

### 8.3 Puntuación de salud del cliente

La salud del cliente se calcula en función de múltiples factores:

| Factor | Peso | Métrica |
|-----|------|---------|
| Recencia de compra | 25% | Días desde el último pedido |
| Frecuencia de compra | 20% | Número de pedidos por período |
| Valor monetario | 20% | Valor total y promedio de pedidos |
| Compromiso | 15% | Tasas de apertura de correos, participación en reuniones |
| Salud de soporte | 10% | Volumen de tickets y tasa de resolución |
| Uso del producto | 10% | Métricas de uso activo (si aplica) |

**Umbrales de salud:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Segmentación de clientes

#### Segmentación automatizada

| Segmento | Condición | Acción sugerida |
|-----|------|---------|
| VIP | LTV > $100K | Servicio personalizado, patrocinio ejecutivo |
| Corporativo | Tamaño de empresa > 500 | Gerente de cuenta dedicado |
| Mercado medio | Tamaño de empresa 50-500 | Revisiones periódicas, soporte escalado |
| Startup | Tamaño de empresa < 50 | Recursos de autoservicio, comunidad |
| Inactivo | 90+ días sin actividad | Marketing de reactivación |

---

## 9. Integración de correo electrónico

### 9.1 Descripción general

NocoBase proporciona un plugin de integración de correo electrónico integrado que soporta Gmail y Outlook. Una vez sincronizados los correos, los flujos de trabajo pueden activar automáticamente el análisis de IA sobre el sentimiento y la intención del correo, ayudando a las ventas a comprender rápidamente la actitud del cliente.

### 9.2 Sincronización de correo

**Proveedores soportados:**
- Gmail (vía OAuth 2.0)
- Outlook/Microsoft 365 (vía OAuth 2.0)

**Comportamiento de sincronización:**
- Sincronización bidireccional de correos enviados y recibidos.
- Asociación automática de correos con registros de CRM (Prospectos, Contactos, Oportunidades).
- Archivos adjuntos almacenados en el sistema de archivos de NocoBase.

### 9.3 Asociación Correo-CRM (Por finalizar)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Plantillas de correo

El equipo de ventas puede utilizar plantillas preestablecidas:

| Categoría de plantilla | Ejemplos |
|---------|------|
| Contacto inicial | Correo en frío, Introducción cálida, Seguimiento de evento |
| Seguimiento | Seguimiento de reunión, Seguimiento de propuesta, Recordatorio por falta de respuesta |
| Cotización | Cotización adjunta, Revisión de cotización, Cotización por expirar |
| Pedido | Confirmación de pedido, Notificación de envío, Confirmación de entrega |
| Éxito del cliente | Bienvenida, Revisión de estado, Solicitud de reseña |

---

## 10. Capacidades asistidas por IA

### 10.1 Equipo de empleados de IA

El sistema CRM integra el plugin de IA de NocoBase, utilizando los siguientes empleados de IA integrados configurados con tareas específicas de CRM:

| ID | Nombre | Rol integrado | Capacidades de extensión de CRM |
|----|------|---------|-------------|
| viz | Viz | Analista de datos | Análisis de datos de ventas, pronóstico de pipeline |
| dara | Dara | Experta en gráficos | Visualización de datos, desarrollo de informes, diseño de tableros |
| ellis | Ellis | Editor | Redacción de respuestas de correo, resúmenes de comunicación, redacción de correos comerciales |
| lexi | Lexi | Traductora | Comunicación multilingüe con clientes, traducción de contenido |
| orin | Orin | Organizador | Prioridades diarias, sugerencias de pasos siguientes, planificación de seguimiento |

### 10.2 Lista de tareas de IA

Las capacidades de IA se dividen en dos categorías independientes:

#### I. Empleados de IA (Activados por bloques en el frontend)

Los usuarios interactúan directamente con la IA a través de bloques de Empleados de IA en el frontend para obtener análisis y sugerencias.

| Empleado | Tarea | Descripción |
|------|------|------|
| Viz | Análisis de datos de ventas | Analizar tendencias del pipeline y tasas de conversión |
| Viz | Pronóstico de pipeline | Predecir ingresos basados en el pipeline ponderado |
| Dara | Generación de gráficos | Generar gráficos para informes de ventas |
| Dara | Diseño de tableros | Diseñar diseños de tableros de datos |
| Ellis | Redacción de respuestas | Generar respuestas de correo profesionales |
| Ellis | Resumen de comunicación | Resumir hilos de correo electrónico |
| Ellis | Redacción de correos comerciales | Invitaciones a reuniones, seguimientos, correos de agradecimiento, etc. |
| Orin | Prioridades diarias | Generar una lista de tareas priorizadas para el día |
| Orin | Mejor acción siguiente | Recomendar pasos siguientes para cada oportunidad |
| Lexi | Traducción de contenido | Traducir materiales de marketing, propuestas y correos |

#### II. Nodos LLM de flujo de trabajo (Ejecución automatizada en el backend)

Nodos LLM anidados dentro de flujos de trabajo, activados automáticamente por eventos de colección, eventos de acción o tareas programadas, independientemente de los Empleados de IA.

| Tarea | Método de activación | Descripción | Campo destino |
|------|---------|------|---------|
| Puntuación de prospectos | Evento de colección (Crear/Actualizar) | Evaluar la calidad del prospecto | ai_score, ai_convert_prob |
| Predicción de probabilidad de éxito | Evento de colección (Cambio de etapa) | Predecir la probabilidad de éxito de la oportunidad | ai_win_probability, ai_risk_factors |

> **Nota**: Los nodos LLM de flujo de trabajo utilizan prompts y salida de Schema para JSON estructurado, que se analiza y escribe en los campos de datos de negocio sin intervención del usuario.

### 10.3 Campos de IA en la base de datos

| Tabla | Campo de IA | Descripción |
|----|--------|------|
| nb_crm_leads | ai_score | Puntuación IA 0-100 |
| | ai_convert_prob | Probabilidad de conversión |
| | ai_best_contact_time | Mejor hora de contacto |
| | ai_tags | Etiquetas generadas por IA (JSONB) |
| | ai_scored_at | Hora de puntuación |
| | ai_next_best_action | Sugerencia de mejor acción siguiente |
| | ai_nba_generated_at | Hora de generación de sugerencia |
| nb_crm_opportunities | ai_win_probability | Probabilidad de éxito predicha por IA |
| | ai_analyzed_at | Hora de análisis |
| | ai_confidence | Confianza de la predicción |
| | ai_trend | Tendencia: up/stable/down |
| | ai_risk_factors | Factores de riesgo (JSONB) |
| | ai_recommendations | Lista de recomendaciones (JSONB) |
| | ai_predicted_close | Fecha de cierre predicha |
| | ai_next_best_action | Sugerencia de mejor acción siguiente |
| | ai_nba_generated_at | Hora de generación de sugerencia |
| nb_crm_customers | ai_health_score | Puntuación de salud 0-100 |
| | ai_health_grade | Grado de salud: A/B/C/D |
| | ai_churn_risk | Riesgo de abandono 0-100% |
| | ai_churn_risk_level | Nivel de riesgo de abandono: low/medium/high |
| | ai_health_dimensions | Puntuaciones de dimensiones (JSONB) |
| | ai_recommendations | Lista de recomendaciones (JSONB) |
| | ai_health_assessed_at | Hora de evaluación de salud |
| | ai_tags | Etiquetas generadas por IA (JSONB) |
| | ai_best_contact_time | Mejor hora de contacto |
| | ai_next_best_action | Sugerencia de mejor acción siguiente |
| | ai_nba_generated_at | Hora de generación de sugerencia |

---

## 11. Motor de flujo de trabajo

### 11.1 Flujos de trabajo implementados

| Nombre del flujo de trabajo | Tipo de activador | Estado | Descripción |
|-----------|---------|------|------|
| Leads Created | Evento de colección | Activado | Se activa cuando se crea un prospecto |
| CRM Overall Analytics | Evento de empleado de IA | Activado | Análisis de datos generales del CRM |
| Lead Conversion | Evento post-acción | Activado | Proceso de conversión de prospectos |
| Lead Assignment | Evento de colección | Activado | Asignación automatizada de prospectos |
| Lead Scoring | Evento de colección | Desactivado | Puntuación de prospectos (Por finalizar) |
| Follow-up Reminder | Tarea programada | Desactivado | Recordatorios de seguimiento (Por finalizar) |

### 11.2 Flujos de trabajo por implementar

| Flujo de trabajo | Tipo de activador | Descripción |
|-------|---------|------|
| Avance de etapa de oportunidad | Evento de colección | Actualizar probabilidad de éxito y registrar tiempo al cambiar de etapa |
| Detección de estancamiento de oportunidad | Tarea programada | Detectar oportunidades inactivas y enviar recordatorios |
| Aprobación de cotización | Evento post-acción | Proceso de aprobación multinivel |
| Generación de pedido | Evento post-acción | Generar pedido automáticamente tras la aceptación de la cotización |

---

## 12. Diseño de menús e interfaz

### 12.1 Estructura de administración

| Menú | Tipo | Descripción |
|------|------|------|
| **Paneles de control** | Grupo | Tableros de control |
| - Panel de control | Página | Tablero por defecto |
| - Gerente de ventas | Página | Vista del gerente de ventas |
| - Representante de ventas | Página | Vista del representante de ventas |
| - Ejecutivo | Página | Vista ejecutiva |
| **Prospectos** | Página | Gestión de clientes potenciales |
| **Clientes** | Página | Gestión de clientes |
| **Oportunidades** | Página | Gestión de oportunidades |
| - Tabla | Pestaña | Lista de oportunidades |
| **Productos** | Página | Gestión de productos |
| - Categorías | Pestaña | Categorías de productos |
| **Pedidos** | Página | Gestión de pedidos |
| **Configuración** | Grupo | Ajustes |
| - Ajustes de etapas | Página | Configuración de etapas de oportunidad |
| - Tipo de cambio | Página | Ajustes de tipos de cambio |
| - Actividad | Página | Registros de actividad |
| - Correos | Página | Gestión de correo electrónico |
| - Contactos | Página | Gestión de contactos |
| - Análisis de datos | Página | Análisis de datos |

### 12.2 Vistas de los paneles de control

#### Vista del gerente de ventas

| Componente | Tipo | Datos |
|-----|------|------|
| Valor del pipeline | Tarjeta KPI | Monto total del pipeline por etapa |
| Tabla de líderes del equipo | Tabla | Clasificación del rendimiento de los representantes |
| Alertas de riesgo | Lista de alertas | Oportunidades de alto riesgo |
| Tendencia de tasa de éxito | Gráfico de líneas | Tasa de éxito mensual |
| Tratos estancados | Lista | Tratos que requieren atención |

#### Vista del representante de ventas

| Componente | Tipo | Datos |
|-----|------|------|
| Progreso de mi cuota | Barra de progreso | Real mensual vs. Cuota |
| Oportunidades pendientes | Tarjeta KPI | Conteo de mis oportunidades pendientes |
| Cierres de esta semana | Lista | Tratos que se espera cerrar pronto |
| Actividades vencidas | Alerta | Tareas expiradas |
| Acciones rápidas | Botones | Registrar actividad, Crear oportunidad |

#### Vista ejecutiva

| Componente | Tipo | Datos |
|-----|------|------|
| Ingresos anuales | Tarjeta KPI | Ingresos acumulados en el año |
| Valor del pipeline | Tarjeta KPI | Monto total del pipeline |
| Tasa de éxito | Tarjeta KPI | Tasa de éxito general |
| Salud del cliente | Distribución | Distribución de puntuaciones de salud |
| Pronóstico | Gráfico | Pronóstico de ingresos mensuales |


---

*Versión del documento: v2.0 | Actualizado: 06-02-2026*