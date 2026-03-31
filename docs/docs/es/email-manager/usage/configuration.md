---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Configuración de Bloques

## Bloque de Mensajes de Correo Electrónico

### Añadir Bloque

Para añadir un bloque de mensajes de correo electrónico, diríjase a la página de configuración, haga clic en el botón **Crear bloque** y seleccione la opción **Mensajes de correo electrónico (Todos)** o **Mensajes de correo electrónico (Personal)**.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Configuración de Campos

Para seleccionar los campos que desea mostrar, haga clic en el botón **Campos** del bloque. Para una explicación más detallada, puede consultar el método de configuración de campos para tablas.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Configuración de Filtros de Datos

Para establecer el rango de datos con el que desea filtrar los correos electrónicos, haga clic en el icono de configuración situado a la derecha de la tabla y seleccione **Alcance de datos**.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

Es posible filtrar correos electrónicos con el mismo sufijo utilizando variables:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## Bloque de Detalles del Correo Electrónico

Para empezar, active la función **Habilitar clic para abrir** en un campo dentro del bloque de mensajes de correo electrónico:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

Añada el bloque **Detalles del correo electrónico** en la ventana emergente:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Así podrá ver el contenido detallado del correo electrónico:

![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

En la parte inferior, usted puede configurar los botones que necesite.

## Bloque de Envío de Correo Electrónico

Existen dos formas de crear un formulario de envío de correo electrónico:

1.  Añada un botón de **Enviar correo electrónico** en la parte superior de la tabla:
    ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2.  Añada un bloque de **Envío de correo electrónico**:
    ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Ambos métodos le permitirán crear un formulario completo de envío de correo electrónico:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Cada campo del formulario de correo electrónico funciona de manera similar a los campos de un formulario normal. Usted puede configurarlos con un **Valor predeterminado** o **Reglas de vinculación**, entre otras opciones.

> Los formularios de respuesta y reenvío que se encuentran en la parte inferior de los detalles del correo electrónico ya vienen con un procesamiento de datos predeterminado. Usted puede modificarlo a través del **FlowEngine**.