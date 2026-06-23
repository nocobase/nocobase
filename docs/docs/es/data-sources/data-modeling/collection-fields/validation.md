# Validación de Campos
Para asegurar la precisión, seguridad y consistencia de los datos en sus colecciones, NocoBase ofrece la funcionalidad de validación de campos. Esta característica se divide principalmente en dos partes: la configuración de reglas y la aplicación de reglas.

## Configuración de Reglas
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)
Los campos del sistema de NocoBase integran las reglas de [Joi](https://joi.dev/api/), con el siguiente soporte:

### Tipo Cadena de Texto (String)
Los tipos de cadena de texto de Joi corresponden a los siguientes tipos de campo de NocoBase: Texto de una línea, Texto largo, Número de teléfono, Correo electrónico, URL, Contraseña y UUID.
#### Reglas Comunes
- Longitud mínima
- Longitud máxima
- Longitud
- Patrón (Expresión regular)
- Requerido

#### Correo Electrónico
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Ver más opciones](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Ver más opciones](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Ver más opciones](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Tipo Numérico
Los tipos numéricos de Joi corresponden a los siguientes tipos de campo de NocoBase: Entero, Número y Porcentaje.
#### Reglas Comunes
- Mayor que
- Menor que
- Valor máximo
- Valor mínimo
- Múltiplo

#### Entero
Además de las reglas comunes, los campos de tipo entero también admiten la [validación de enteros](https://joi.dev/api/?v=17.13.3#numberinteger) y la [validación de enteros no seguros](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Número y Porcentaje
Además de las reglas comunes, los campos de tipo número y porcentaje también admiten la [validación de precisión](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Tipo Fecha
Los tipos de fecha de Joi corresponden a los siguientes tipos de campo de NocoBase: Fecha (con zona horaria), Fecha (sin zona horaria), Solo fecha y Marca de tiempo Unix.

Reglas de validación admitidas:
- Mayor que
- Menor que
- Valor máximo
- Valor mínimo
- Validación de formato de marca de tiempo
- Requerido

### Campos de Relación
Los campos de relación solo admiten la validación de campo requerido. Tenga en cuenta que la validación de campo requerido para los campos de relación actualmente no es compatible en escenarios de subformularios o subtablas.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Aplicación de Reglas de Validación
Una vez que haya configurado las reglas para los campos, estas reglas de validación correspondientes se activarán al añadir o modificar datos.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Cuando el campo se usa en un formulario, las reglas de validación del campo también se muestran en la configuración de validación del campo. Estas reglas aparecen en **Reglas de validación de campos del lado del servidor** y son de solo lectura en ese lugar. Si necesita cambiarlas, edite el campo en Fuente de datos → Configuración de la colección.

Puede seguir agregando reglas adicionales para el campo de formulario actual en **Reglas de validación del lado del cliente**. Estas reglas solo se aplican al componente de campo actual. El resultado final de validación combina **Reglas de validación de campos del lado del servidor** y **Reglas de validación del lado del cliente**.

Las reglas de validación también se aplican a los componentes de subtablas y subformularios:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Tenga en cuenta que, en escenarios de subformularios o subtablas, la validación de campo requerido para los campos de relación no surte efecto.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Diferencias entre las Reglas de Validación de Campos del Lado del Servidor y del Lado del Cliente
Las reglas de validación de campos del lado del servidor y del lado del cliente se configuran en lugares distintos y tienen alcances diferentes.

### Diferencias en el Método de Configuración
- **Reglas de validación de campos del lado del servidor**: Establezca las reglas de campo en Fuente de datos → Configuración de la colección. Estas reglas son las reglas base del campo.
- **Reglas de validación del lado del cliente**: Configure reglas adicionales en los ajustes de un campo de formulario. Estas reglas solo afectan al componente de campo actual.
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Diferencias en el Momento de Activación de la Validación
- **Reglas de validación de campos del lado del servidor**: Activan la validación frontend cuando el campo se usa en un formulario y también validan antes de escribir los datos. También se aplican a escenarios que crean o actualizan datos, como flujos de trabajo e importaciones de datos.
- **Reglas de validación del lado del cliente**: Solo activan la validación frontend en el campo de formulario actual.
- **Visualización de reglas**: Las reglas de validación de campos del lado del servidor se muestran como reglas heredadas de solo lectura. Las reglas de validación del lado del cliente se muestran por separado y pueden editarse allí.
- **Mensajes de error**: Las reglas de validación del lado del cliente admiten mensajes de error personalizados, mientras que las reglas de validación de campos del lado del servidor actualmente no los admiten.
