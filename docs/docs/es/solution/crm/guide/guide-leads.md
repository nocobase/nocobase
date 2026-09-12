---
title: "Gestión de Leads"
description: "Guía de uso de la gestión de Leads del CRM: creación de Leads, puntuación automática con IA, filtrado inteligente y conversión de Leads en Clientes y Oportunidades."
keywords: "gestión de Leads,Lead,puntuación con IA,conversión de Leads,embudo de ventas,NocoBase CRM"
---

# Gestión de Leads

> El Lead es el punto de partida del proceso de ventas: el primer contacto con cada Cliente potencial empieza aquí. Este capítulo le guía a través del ciclo de vida completo del Lead: creación, puntuación, filtrado, seguimiento y conversión.

![cn_01-leads](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_01-leads.png)

## Vista general de la página de Leads

En el menú superior, haga clic en **Ventas → Leads** para acceder a la página de gestión de Leads.

![01-leads-2026-04-02-00-04-18](https://static-docs.nocobase.com/01-leads-2026-04-02-00-04-18.png)

En la parte superior de la página hay una fila de **botones de filtrado inteligente** que le ayudan a cambiar rápidamente entre vistas:

Primer grupo:

| Botón | Descripción |
|------|------|
| All | Mostrar todos los Leads |
| New | Estado nuevo, aún sin iniciar el seguimiento |
| Working | En seguimiento |
| Qualified | Confirmado como Lead cualificado |
| Unqualified | Marcado como no cualificado |

Segundo grupo:

| Etiqueta | Significado |
|------|------|
| 🔥 Hot | Leads con puntuación de IA ≥ 75 |
| Hoy | Leads creados hoy |
| Esta semana | Leads creados esta semana |
| Este mes | Leads creados este mes |
| Sin asignar | Leads sin Owner asignado |
| Gran empresa | Leads procedentes de Clientes corporativos |


![01-leads-2026-04-02-00-06-19](https://static-docs.nocobase.com/01-leads-2026-04-02-00-06-19.gif)


La tabla permite obtener la información clave de un vistazo, e incluye columnas compuestas:

- **Indicador de puntuación con IA**: medidor circular de 0 a 100 puntos, rojo (bajo) → amarillo (medio) → verde (alto), refleja de forma intuitiva la calidad del Lead
- **Columna compuesta nombre+empresa**: el nombre y el nombre de la empresa se muestran combinados, ahorrando espacio
- **Columna compuesta correo+teléfono**: la información de contacto se ve a simple vista
- **Columna de tiempo relativo**: muestra «hace 3 horas», «hace 2 días», etc.; los Leads atrasados se resaltan en rojo para recordarle que haga el seguimiento a tiempo

![01-leads-2026-04-02-00-07-04](https://static-docs.nocobase.com/01-leads-2026-04-02-00-07-04.gif)

## Crear un Lead

Haga clic en el botón **Add new** sobre la tabla para abrir el formulario de creación de Leads.

![01-leads-2026-04-02-00-08-08](https://static-docs.nocobase.com/01-leads-2026-04-02-00-08-08.png)

Complete la siguiente información:

| Campo | Descripción | Obligatorio |
|------|------|---------|
| Name | Nombre del Lead | ✅ |
| Company | Empresa | Recomendado |
| Email | Correo electrónico | Recomendado |
| Phone | Número de teléfono | Recomendado |
| Source | Origen del Lead (formulario web, feria, recomendación, etc.) | Recomendado |
...

### Detección de duplicados en tiempo real

Mientras completa el formulario, el sistema realiza una detección de duplicados en tiempo real sobre los campos de nombre, empresa, correo, teléfono y móvil. Al introducir datos, si se encuentran registros coincidentes:

- **Aviso amarillo**: se han encontrado registros similares, le recomendamos verificarlo
- **Aviso rojo**: se han encontrado registros completamente duplicados, le recomendamos encarecidamente revisar primero el registro existente

![01-leads-2026-04-02-00-11-05](https://static-docs.nocobase.com/01-leads-2026-04-02-00-11-05.png)


Esto evita eficazmente que la misma persona se introduzca varias veces.

### Rellenado de formulario con IA

Si dispone de un texto de tarjeta de visita o un registro de conversación, no es necesario rellenar campo por campo a mano: haga clic en el botón de IA, seleccione «Rellenar formulario», pegue el contenido del texto y la IA extraerá automáticamente nombre, empresa, correo, teléfono y otra información, completando el formulario con un solo clic.

Tras completar el formulario, haga clic en **Submit** para guardar.

![01-leads-2026-04-02-00-15-14](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-14.png)

### Puntuación automática con IA

Tras guardar, el sistema activa automáticamente el **workflow de puntuación con IA**. La IA analiza de forma integral los distintos datos del Lead y genera los siguientes resultados:

| Salida de la IA | Descripción |
|---------|------|
| Score | Puntuación integral de 0 a 100 |
| Conversion Probability | Predicción de la probabilidad de conversión |
| NBA (siguiente acción recomendada) | Sugerencia de seguimiento que ofrece la IA, por ejemplo «Recomendamos contacto telefónico en 24 horas» |
| Tags | Etiquetas generadas automáticamente, como «Alta intención», «Decisor», etc. |

![01-leads-2026-04-02-00-15-53](https://static-docs.nocobase.com/01-leads-2026-04-02-00-15-53.png)

> 💡 **Sugerencia**: cuanto mayor sea la puntuación de IA, mejor será la calidad del Lead. Le recomendamos dar prioridad a los Leads Hot (≥ 75 puntos) y dedicar sus esfuerzos a los Clientes con mayor probabilidad de cerrar.

## Filtrado y búsqueda

Los botones de filtrado inteligente de la parte superior admiten **filtrado en tiempo real**: surten efecto al hacer clic, sin necesidad de actualizar la página.

Algunos escenarios habituales:

- **Inicio de la jornada**: haga clic en «Hoy» para ver los Leads que han entrado hoy y, a continuación, en «Hot» para ver si hay Leads con puntuación alta que requieran seguimiento inmediato
- **Asignar Leads**: haga clic en «Sin asignar» para encontrar los Leads que aún no tienen Owner y asignarlos uno a uno a los compañeros de ventas
- **Filtrado para revisión**: haga clic en «Unqualified» para revisar los Leads marcados como no cualificados y comprobar si hay errores de juicio

> 💡 **Sugerencia**: el sistema admite el filtrado directo mediante parámetros en la URL. Por ejemplo, al acceder a la página de Leads con `?status=new`, la página seleccionará automáticamente el botón de filtrado «New». Esto resulta muy práctico al saltar desde otras páginas.

## Detalles del Lead

Haga clic en cualquier Lead de la tabla para abrir la ventana de detalles. La ventana contiene **3 pestañas**:

### Pestaña Detalles

Es la pestaña con más información, y de arriba abajo contiene:

![01-leads-2026-04-02-00-17-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-36.png)

**Flujo de etapas y botones de operación**

La zona superior contiene la barra de flujo de etapas y los botones de operación (Edit / Convert / Lost / Assign). La barra de flujo de etapas:

```
New → Working → Converted / Lost
```

Puede **hacer clic directamente en la etapa correspondiente** para hacer avanzar el estado del Lead. Por ejemplo, al iniciar el seguimiento haga clic en «Working»; tras confirmar que el Lead es cualificado, haga clic en «Converted» para activar el flujo de conversión.

![01-leads-2026-04-02-00-23-03](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-03.png)

Si ya existen los objetos destino (Cliente, contacto, Oportunidad), búsquelos y selecciónelos directamente. Si no existen, haga clic en el botón de creación a la derecha del cuadro de entrada; se abrirá la ventana de creación con el contenido asociado al Lead rellenado automáticamente.
![01-leads-2026-04-07-00-14-21](https://static-docs.nocobase.com/01-leads-2026-04-07-00-14-21.gif)


Al hacer clic en «Lost» aparecerá un cuadro de diálogo donde podrá indicar el motivo de la pérdida, lo que facilitará el análisis posterior.

![01-leads-2026-04-02-00-23-25](https://static-docs.nocobase.com/01-leads-2026-04-02-00-23-25.png)


**Tarjeta de puntuación con IA**

Muestra el detalle de la puntuación de IA, incluyendo:
- Indicador AI Score (0–100)
- Conversion Probability (probabilidad de conversión)
- Pipeline Days (días en el pipeline)
- NBA (siguiente acción recomendada)

**Zona de etiquetas de insignia**

Muestra con insignias de colores los atributos clave: Rating (clasificación), Status (estado), Source (origen), etc.

**Información básica y botones rápidos de actividades**

Información de la empresa, datos de contacto y otros campos básicos. En esta zona también hay un grupo de botones rápidos de actividades: Log Call (registrar llamada), Send Email (enviar correo), Schedule (crear evento de agenda); tras la operación, se asocian automáticamente al Lead actual.

**AI Insights**

Análisis y sugerencias de seguimiento generados por la IA.

**Zona de comentarios**

Los miembros del equipo pueden dejar mensajes y discutir aquí; todos los comentarios se migrarán automáticamente al nuevo registro de Cliente cuando se convierta el Lead.

![01-leads-2026-04-02-00-24-10](https://static-docs.nocobase.com/01-leads-2026-04-02-00-24-10.png)

### Pestaña Correos

Muestra todos los correos asociados a este Lead, lo que facilita revisar el historial de comunicación. Permite enviar correos directamente desde aquí y dispone de botones de asistencia con IA.

![01-leads-2026-04-02-00-17-57](https://static-docs.nocobase.com/01-leads-2026-04-02-00-17-57.png)

### Pestaña Historial de cambios

Registra todos los cambios de campos de este Lead, con la precisión de «quién cambió qué campo de A a B y cuándo». Sirve para la trazabilidad y la revisión.

![01-leads-2026-04-02-00-22-07](https://static-docs.nocobase.com/01-leads-2026-04-02-00-22-07.png)


## Conversión de Lead

Esta es la operación **más importante** de la gestión de Leads: convertir con un clic un Lead cualificado en Cliente, contacto y Oportunidad.

### Cómo convertir

En la ventana de detalles del Lead, haga clic en la etapa **Converted** del componente de flujo de etapas.

![01-leads-2026-04-02-00-26-01](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-01.png)

### Flujo de conversión

El sistema activa automáticamente el **workflow de conversión de Leads**, que realiza las siguientes operaciones de una sola vez:

1. **Crear Cliente (Customer)** — crea un nuevo registro de Cliente con el nombre de la empresa del Lead; nombre/sector/tamaño/dirección se rellenan automáticamente desde el Lead, con detección de duplicados
2. **Crear contacto (Contact)** — crea un contacto con el nombre, correo, teléfono y cargo del Lead, asociado al Cliente
3. **Crear Oportunidad (Opportunity)** — crea un nuevo registro de Oportunidad; nombre/origen/importe/etapa se rellenan automáticamente desde el Lead, asociado al Cliente
4. **Migrar comentarios** — todos los comentarios del Lead se copian automáticamente a los registros recién creados
5. **Actualizar el estado del Lead** — el estado del Lead se marca como Qualified

### Efecto tras la conversión

Una vez completada la conversión, al volver a la lista de Leads verá que la **columna compuesta nombre+empresa** se ha convertido en un enlace en el que se puede hacer clic:

- Al hacer clic en el nombre → se accede a los detalles del contacto
- Al hacer clic en el nombre de la empresa → se accede a los detalles del Cliente

![01-leads-2026-04-02-00-26-36](https://static-docs.nocobase.com/01-leads-2026-04-02-00-26-36.png)

> 💡 **Sugerencia**: la conversión es una operación irreversible. Antes de convertir, confirme que la información del Lead es precisa y completa, en particular el nombre de la empresa y los datos de contacto, ya que se convertirán directamente en los datos iniciales del Cliente y del contacto.

## Asignación automática

Cuando un Lead no tiene Owner asignado, el sistema activa automáticamente el **workflow de asignación de Leads**.

La lógica de asignación es sencilla: **se asigna automáticamente al vendedor con menos Leads en ese momento**, garantizando una carga de trabajo equilibrada en el equipo.

Este workflow se comprueba tanto al crear como al actualizar el Lead: si el campo Owner está vacío, se asigna automáticamente.

> 💡 **Sugerencia**: si desea especificar manualmente el Owner, basta con editar el campo Owner en los detalles. La asignación manual sobrescribe el resultado de la asignación automática.

---

Tras completar la conversión del Lead, sus Clientes y Oportunidades estarán listos. A continuación, vaya a [Oportunidades y cotizaciones](./guide-opportunities) para ver cómo avanzar el embudo de ventas.

## Páginas relacionadas

- [Visión general de la guía de uso del CRM](./index.md)
- [Oportunidades y cotizaciones](./guide-opportunities)
- [Gestión de Clientes](./guide-customers-emails)
