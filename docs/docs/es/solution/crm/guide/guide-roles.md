---
title: "Roles y permisos"
description: "Descripción del sistema de Roles del CRM: qué páginas puede ver y qué datos puede operar cada puesto."
keywords: "Roles y permisos,permisos de datos,permisos de menú,Roles de departamento,NocoBase CRM"
---

# Roles y permisos

> Las personas con distintos puestos, al iniciar sesión en el CRM, ven menús diferentes y pueden operar datos diferentes. Este capítulo le ayuda a responder a una pregunta: **«¿qué puedo ver y qué puedo hacer?»**

## ¿Qué Rol tengo?

Los Roles provienen de dos vías:
1. **Rol personal** — Rol que el administrador le asigna directamente y que va con usted
   ![08-roles-2026-04-07-01-45-14](https://static-docs.nocobase.com/08-roles-2026-04-07-01-45-14.png)

2. **Rol del departamento** — su departamento tiene un Rol vinculado y, al unirse al departamento, lo hereda automáticamente

![08-roles-2026-04-07-01-46-57](https://static-docs.nocobase.com/08-roles-2026-04-07-01-46-57.png)

Ambos se acumulan. Por ejemplo, si tiene personalmente el Rol «Representante de ventas» y se le añade al departamento de Marketing, dispondrá simultáneamente de los permisos de los Roles de ventas y de marketing.

![cn_08-roles](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles.png)

> \* **Sales Manager** y **Executive** no están vinculados a ningún departamento; el administrador los asigna directamente a las personas.

---

## Páginas que puede ver cada Rol

Tras iniciar sesión, la barra de menú solo muestra las páginas a las que tiene acceso:

![cn_08-roles_1](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_1.png)

> ¹ El representante de ventas solo ve el panel personal SalesRep, no las vistas SalesManager ni Executive.

![08-roles-2026-04-07-01-47-48](https://static-docs.nocobase.com/08-roles-2026-04-07-01-47-48.png)

---

## ¿Qué datos puedo operar?

### Lógica principal de los permisos sobre los datos

![cn_08-roles_2](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_2.png)

### Permisos de datos del representante de ventas

Es el Rol con más usuarios; lo explicamos con detalle:

![cn_08-roles_3](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_3.png)

**¿Por qué los Leads son visibles para todo el equipo?**
- Necesita ver los Leads «sin asignar» para tomarlos proactivamente
- Al hacer detección de duplicados es necesario consultar todos los datos para evitar registros repetidos
- Los Leads de los demás solo puede verlos, no puede modificarlos

![08-roles-2026-04-07-01-48-42](https://static-docs.nocobase.com/08-roles-2026-04-07-01-48-42.png)

**¿Por qué los Clientes solo son los propios?**
- Los Clientes son un activo principal y tienen una asignación clara
- Para evitar que vea los datos de contacto de los Clientes de otros
- Si necesita un traspaso, hable con su gerente para realizarlo

![08-roles-2026-04-07-01-50-37](https://static-docs.nocobase.com/08-roles-2026-04-07-01-50-37.png)

**² Los contactos siguen al Cliente**

Rango de contactos que puede ver:
1. Los contactos de los que es responsable directo
2. **Todos** los contactos asociados a los Clientes de los que es responsable (incluso los creados por otros)

> Por ejemplo: si es responsable del Cliente «Huawei», podrá ver todos los contactos asociados a Huawei, sin importar quién los haya introducido.

![08-roles-2026-04-07-01-51-26](https://static-docs.nocobase.com/08-roles-2026-04-07-01-51-26.png)

### Permisos de datos de los demás Roles

| Rol | Datos que gestiona por completo | Otros datos |
|------|-----------------|---------|
| Gerente de ventas | Todos los datos del CRM | — |
| Ejecutivo | — | Todos en solo lectura + exportación |
| Finanzas | Pedidos, pagos, tipos de cambio, cotizaciones | Otros en solo lectura |
| Marketing | Leads, etiquetas de Leads, plantillas de análisis de datos | Otros en solo lectura |
| Gerente de éxito del Cliente | Clientes, contactos, actividades, comentarios, fusión de Clientes | Otros en solo lectura |
| Soporte técnico | Actividades, comentarios (solo los creados por uno mismo) | Contactos: solo los propios |
| Producto | Productos, categorías, precios escalonados | Otros en solo lectura |

---

## Detección de duplicados: solución al problema de «no poder ver»

Como los datos de Clientes están aislados por asignación, no puede ver los Clientes de otros vendedores. Pero antes de introducir un nuevo Lead o Cliente, debe confirmar **si ya hay alguien gestionándolo**.

![cn_08-roles_4](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_4.png)

La página de detección de duplicados admite tres búsquedas:

- **Detección de duplicados de Leads**: introduzca nombre, empresa, correo o móvil
- **Detección de duplicados de Clientes**: introduzca el nombre de la empresa o el teléfono
- **Detección de duplicados de contactos**: introduzca nombre, correo o móvil

El resultado de la detección muestra **quién es el responsable**. Si ya existe, póngase directamente en contacto con el compañero correspondiente para coordinar y evitar conflictos.

![08-roles-2026-04-07-01-52-51](https://static-docs.nocobase.com/08-roles-2026-04-07-01-52-51.gif)

---

## Preguntas frecuentes

**P: ¿Qué hago si no puedo ver una página?**

Significa que su Rol no tiene permiso de acceso a esa página. Si lo necesita por motivos de negocio, póngase en contacto con el administrador para ajustarlo.

**P: ¿Puedo ver los datos pero no tengo botón de editar/eliminar?**

Solo dispone de permiso de visualización sobre esos datos. Normalmente es porque no es responsable de ellos (el owner no es usted). Los botones de operación sin permiso se ocultan directamente y no se muestran.

**P: Acabo de unirme a un departamento, ¿cuándo surten efecto los permisos?**

Surten efecto inmediatamente. Actualice la página para ver el nuevo menú.

**P: ¿Puede una persona tener varios Roles?**

Sí. El Rol personal y el Rol del departamento se acumulan. Por ejemplo, si se le ha asignado personalmente «Representante de ventas» y además se ha unido al departamento de Marketing, dispondrá simultáneamente de los permisos de los Roles de ventas y de marketing.

## Documentación relacionada

- [Introducción al sistema y paneles](./guide-overview) — uso de cada panel
- [Gestión de Leads](./guide-leads) — proceso completo de los Leads
- [Gestión de Clientes](./guide-customers-emails) — vista 360 del Cliente
