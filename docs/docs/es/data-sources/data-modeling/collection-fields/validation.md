---
title: "Validación de campos"
description: "Reglas de validación de campos: reglas de configuración y validación basadas en Joi, compatibles con longitudes mínimas/máximas, campos obligatorios y otras opciones para tipos como texto, números y fechas."
keywords: "validación de campos, verificación de campos,Joi,reglas de validación,reglas de configuración,NocoBase"
---

# Validación de campos
Para garantizar la precisión, seguridad y coherencia de los datos, NocoBase ofrece funciones de validación de campos. Estas funciones se dividen principalmente en dos partes: reglas de configuración y reglas de validación.

## Reglas de configuración
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Los campos del sistema de NocoBase integran reglas de [Joi](https://joi.dev/api/), con la siguiente compatibilidad:

### Tipo texto
Los tipos de campo de NocoBase correspondientes al tipo texto de Joi incluyen: texto de una sola línea, texto multilínea, número de teléfono, correo electrónico, URL, contraseña y UUID.
#### Reglas generales
- Longitud mínima
- Longitud máxima
- Longitud
- Expresión regular
- Obligatorio

#### Correo electrónico
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Ver más opciones](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Ver más opciones](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Ver más opciones](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Tipo numérico
Los tipos de campo de NocoBase correspondientes al tipo numérico de Joi incluyen: entero, número y porcentaje.
#### Reglas generales
- Mayor que
- Menor que
- Valor máximo
- Valor mínimo
- Múltiplo entero

#### Entero
Además de las reglas generales, los campos enteros admiten [validación de enteros](https://joi.dev/api/?v=17.13.3#numberinteger) y [validación de enteros no seguros](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Número y porcentaje
Además de las reglas generales, los campos numéricos y de porcentaje admiten [validación de precisión](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tipo fecha
Los tipos de campo de NocoBase correspondientes al tipo fecha de Joi incluyen: fecha (con zona horaria), fecha (sin zona horaria), solo fecha y marca de tiempo Unix.

Reglas de validación compatibles:
- Mayor que
- Menor que
- Valor máximo
- Valor mínimo
- Validación del formato de la marca de tiempo
- Obligatorio

### Campos de relación
Los campos de relación solo admiten la validación de obligatoriedad. Ten en cuenta que la validación de obligatoriedad de los campos de relación todavía no es compatible con los subformularios ni las subt tablas.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Aplicación de las reglas de validación
Después de configurar las reglas de los campos, las reglas de validación correspondientes se activarán al añadir o modificar datos.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Cuando un campo se utiliza en un formulario, sus reglas de validación también se muestran en la configuración de validación del campo. Estas reglas aparecen en «Reglas de validación de campos del servidor» y aquí se muestran en modo de solo lectura. Si necesitas modificar estas reglas, vuelve a «Configuración de la fuente de datos / tabla de datos» para editar el campo.

Aún puedes añadir reglas adicionales al campo del formulario actual en «Reglas de validación del cliente». Estas reglas solo afectan al componente del campo actual. Las reglas de validación que finalmente se aplican combinan las «Reglas de validación de campos del servidor» y las «Reglas de validación del cliente».

Las reglas de validación también se aplican a los componentes de subtabla y subformulario:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Ten en cuenta que, en los subformularios o subt tablas, la validación de obligatoriedad de los campos de relación todavía no se aplica.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Diferencias entre las reglas de validación de campos del servidor y las reglas de validación del cliente
Las reglas de validación de campos del servidor y las reglas de validación del cliente se configuran en ubicaciones diferentes y también tienen distintos ámbitos de aplicación.

### Diferencias en la configuración
- **Reglas de validación de campos del servidor**: se configuran en «Configuración de la fuente de datos / tabla de datos». Estas reglas son las reglas básicas del campo.
- **Reglas de validación del cliente**: se añaden en la configuración del campo del formulario. Estas reglas solo afectan al componente del campo actual.
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Diferencias en el momento de activación de la validación
- **Reglas de validación de campos del servidor**: cuando el campo se utiliza en un formulario, se activa la validación en el frontend y también se realiza una validación antes de escribir los datos. Estas reglas también se aplican al añadir o modificar datos mediante flujos de trabajo, importación de datos y otros escenarios.
- **Reglas de validación del cliente**: la validación en el frontend solo se activa en el campo del formulario actual.
- **Visualización de las reglas**: las reglas de validación de campos del servidor se muestran como reglas heredadas en modo de solo lectura. Las reglas de validación del cliente se muestran por separado y se pueden editar aquí.
- **Mensajes de error**: las reglas de validación del cliente permiten personalizar los mensajes de error, mientras que las reglas de validación de campos del servidor todavía no admiten mensajes de error personalizados.