---
title: "Clientes, contactos y correos"
description: "Vista 360 de Clientes en CRM, puntuación de salud con IA, fusión de Clientes, gestión de roles de contactos, envío y recepción de correos con asistencia de IA, y registro de actividades."
keywords: "gestión de Clientes,contactos,correos,puntuación de salud,fusión de Clientes,NocoBase CRM"
---

# Clientes, contactos y correos

> Clientes, contactos y correos son tres módulos estrechamente relacionados: el Cliente es la entidad principal, el contacto es el interlocutor y el correo es el registro de la comunicación. Este capítulo los presenta de forma unificada.

![cn_04-customers-emails](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_04-customers-emails.png)

## Gestión de Clientes

Acceda a la página **Clientes** desde el menú superior; contiene dos pestañas: la lista de Clientes y la herramienta de fusión de Clientes.

### Lista de Clientes

Encima de la lista hay botones de filtrado:

| Filtro | Descripción |
|---------|------|
| **All** | Todos los Clientes |
| **Active** | Clientes activos |
| **Potential** | Clientes potenciales, aún sin cierre |
| **Dormant** | Clientes inactivos, sin interacción durante mucho tiempo |
| **Key Accounts** | Grandes Clientes / Clientes clave |
| **New This Month** | Nuevos del mes |


![04-customers-emails-2026-04-07-01-32-03](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-32-03.png)


**Columnas clave**:

- **Puntuación de salud con IA**: barra de progreso circular de 0 a 100 puntos (🟢 70–100 saludable / 🟡 40–69 advertencia / 🔴 0–39 peligro)
- **Última actividad**: tiempo relativo + código de colores; cuanto más tiempo sin contacto, más oscuro es el color

### Detalles del Cliente

Haga clic en el nombre del Cliente para abrir la ventana de detalles, que contiene **3 pestañas**:

| Pestaña | Contenido |
|-------|------|
| **Detalles** | Perfil del Cliente, tarjetas de estadísticas, contactos, Oportunidades, comentarios |
| **Correos** | Correos intercambiados con todos los contactos de este Cliente, 5 botones de IA |
| **Historial de cambios** | Registro de auditoría a nivel de campo |

La **pestaña Detalles** utiliza un diseño de dos columnas: 2/3 a la izquierda y 1/3 a la derecha:

- **Columna izquierda**: avatar del Cliente (coloreado por nivel: Normal=gris, Important=ámbar, VIP=dorado), resumen de 4 columnas (nivel/tamaño/región/tipo), tarjetas de estadísticas (importe acumulado de transacciones / número de Oportunidades activas / número de interacciones del mes, consultadas en tiempo real vía API), lista de contactos, lista de Oportunidades, área de comentarios
- **Columna derecha**: Perfil inteligente con IA (etiquetas de IA, gráfico circular de puntuación de salud, riesgo de pérdida, mejor momento para contactar, estrategia de comunicación)

![04-customers-emails-2026-04-07-01-33-47](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-33-47.png)

### Puntuación de salud con IA

La puntuación de salud se calcula automáticamente a partir de las siguientes dimensiones: frecuencia de interacción, actividad de Oportunidades, situación de Pedidos y cobertura de contactos.

Recomendaciones de uso:

1. Abra la lista de Clientes cada día y ordénela por puntuación de salud
2. Preste atención prioritaria a los Clientes en rojo (Critical), pueden estar perdiéndose
3. Clientes en amarillo (Warning): programe un seguimiento ligero
4. Clientes en verde (Healthy): mantenimiento con un ritmo normal

### Fusión de Clientes

Cuando aparezcan registros duplicados de Clientes, utilice la herramienta de fusión para limpiarlos:

1. **Iniciar la fusión**: en la lista de Clientes, seleccione varios Clientes → haga clic en el botón «Customer Merge»
2. **Acceder a la herramienta de fusión**: cambie a la segunda pestaña y consulte la lista de solicitudes de fusión (Pending / Merged / Cancelled)
3. **Ejecutar la fusión**: seleccione el registro principal (Master) → compare las diferencias campo por campo → previsualice → confirme. Un workflow en segundo plano migra automáticamente todos los datos asociados (Oportunidades, contactos, actividades, comentarios, Pedidos, cotizaciones, compartidos) y desactiva los Clientes fusionados

![04-customers-emails-2026-04-07-01-35-37](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-35-37.png)

![04-customers-emails-2026-04-07-01-38-07](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-07.png)

:::tip[Verifique cuidadosamente antes de fusionar]
La fusión de Clientes es una operación irreversible. Antes de ejecutarla, confirme cuidadosamente la elección del registro principal y la selección de los valores de los campos.
:::


![04-customers-emails-2026-04-07-01-37-44](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-37-44.gif)

---

## Gestión de contactos

Acceda a la página **Configuración → Contactos** desde el menú superior.

### Información de contacto

| Campo | Descripción |
|------|------|
| Name | Nombre del contacto |
| Company | Empresa a la que pertenece (asociada al registro del Cliente) |
| Email | Dirección de correo electrónico (utilizada para la asociación automática de correos) |
| Phone | Número de teléfono |
| Role | Etiqueta de rol |
| Level | Nivel del contacto |
| Primary Contact | Si es el contacto principal del Cliente |

### Etiquetas de rol

| Rol | Significado |
|------|------|
| Decision Maker | Responsable de la decisión |
| Influencer | Influenciador |
| Technical | Responsable técnico |
| Procurement | Responsable de compras |

![04-customers-emails-2026-04-07-01-38-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-26.png)

### Enviar correo desde el contacto

Abra la página de detalles del contacto; al igual que otros tipos de gestión de datos, contiene pestañas de detalles, correos, registros de campos, etc.

![04-customers-emails-2026-04-07-01-38-52](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-52.png)

---

### Asociación entre correos y CRM

Los correos se asocian automáticamente con Clientes, contactos y Oportunidades:

- Pestaña «Correos» en los detalles del Cliente → correos intercambiados con todos los contactos de ese Cliente
- Detalles del contacto → historial completo de correos de ese contacto
- Detalles de la Oportunidad → registros de comunicación relacionados

La asociación se realiza mediante una vista, basándose en la coincidencia automática con la dirección de correo del contacto.

![04-customers-emails-2026-04-07-01-40-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-40-26.png)

![04-customers-emails-2026-04-07-01-41-13](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-13.png)

### Asistencia con IA en correos

La página de correos ofrece 6 escenarios de asistencia con IA:

| Escenario | Función |
|------|------|
| **Redacción de propuestas** | La IA genera correos de propuesta a partir del contexto del Cliente y la Oportunidad |
| **Correo de seguimiento** | La IA genera correos de seguimiento con un tono adecuado |
| **Análisis de correos** | La IA analiza la inclinación emocional y los puntos clave del correo |
| **Resumen de correos** | La IA genera un resumen del hilo de correos |
| **Contexto del Cliente** | La IA reúne la información de fondo del Cliente |
| **Informe ejecutivo** | La IA extrae información clave del hilo de correos para generar un informe |

![04-customers-emails-2026-04-07-01-41-46](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-46.png)

---

## Registro de actividades

Acceda a la página **Configuración → Actividades** desde el menú superior. Es el registro central de todas las interacciones con los Clientes.

| Tipo de actividad | Descripción |
|---------|------|
| Meeting | Reunión |
| Call | Llamada |
| Email | Correo |
| Visit | Visita |
| Note | Nota |
| Task | Tarea |

![04-customers-emails-2026-04-07-01-42-20](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-42-20.png)

Las actividades también aparecen en la vista de calendario del panel Overview.

---

## Páginas relacionadas

- [Guía de uso del CRM](./index.md)
- [Gestión de Leads](./guide-leads) — los Clientes y contactos se crean automáticamente tras la conversión del Lead
- [Gestión de Oportunidades](./guide-opportunities) — Oportunidades asociadas al Cliente
- [Empleados de IA](./guide-ai)
