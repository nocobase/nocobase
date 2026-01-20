:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Variables

## Introducción

Las variables son un conjunto de marcadores (o tokens) que se utilizan para identificar un valor en el contexto actual. Puede utilizarlas en escenarios como la configuración de ámbitos de datos de bloques, valores predeterminados de campos, reglas de vinculación y flujos de trabajo.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Variables actualmente compatibles

### Usuario actual

Representa los datos del usuario con sesión iniciada actualmente.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Rol actual

Representa el identificador del rol (role name) del usuario con sesión iniciada actualmente.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Formulario actual

Los valores del formulario actual, utilizados únicamente en bloques de formulario. Los casos de uso incluyen:

- Reglas de vinculación para el formulario actual
- Valores predeterminados para los campos del formulario (solo efectivos al añadir nuevos datos)
- Configuración del ámbito de datos para campos de relación
- Configuración de asignación de valores de campo para acciones de envío

#### Reglas de vinculación para el formulario actual

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Valores predeterminados para los campos del formulario (solo para formularios de creación)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### Configuración del ámbito de datos para campos de relación

Se utiliza para filtrar dinámicamente las opciones de un campo dependiente (downstream) basándose en un campo precedente (upstream), asegurando una entrada de datos precisa.

**Ejemplo:**

1. El usuario selecciona un valor para el campo **Owner**.
2. El sistema filtra automáticamente las opciones para el campo **Account** basándose en el **userName** del Owner seleccionado.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Registro actual

Un registro se refiere a una fila en una **colección**, donde cada fila representa un único registro. La variable "Registro actual" está disponible en las **reglas de vinculación para acciones de fila** de los bloques de tipo visualización.

Ejemplo: Deshabilitar el botón de eliminar para los documentos que están "Pagados".

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Registro de ventana emergente actual

Las acciones de ventana emergente (popup) desempeñan un papel muy importante en la configuración de la interfaz de NocoBase.

- Ventana emergente para acciones de fila: Cada ventana emergente tiene una variable "Registro de ventana emergente actual", que representa el registro de la fila actual.
- Ventana emergente para campos de relación: Cada ventana emergente tiene una variable "Registro de ventana emergente actual", que representa el registro de relación en el que se ha hecho clic.

Los bloques dentro de una ventana emergente pueden utilizar la variable "Registro de ventana emergente actual". Los casos de uso relacionados incluyen:

- Configurar el ámbito de datos de un bloque
- Configurar el ámbito de datos de un campo de relación
- Configurar valores predeterminados para los campos (en un formulario para añadir nuevos datos)
- Configurar reglas de vinculación para acciones

### Parámetros de consulta de URL

Esta variable representa los parámetros de consulta en la URL de la página actual. Solo está disponible cuando existe una cadena de consulta en la URL de la página. Es más conveniente utilizarla junto con la [acción de enlace](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### Token de API

El valor de esta variable es una cadena de texto que sirve como credencial para acceder a la API de NocoBase. Se puede utilizar para verificar la identidad del usuario.

### Tipo de dispositivo actual

Ejemplo: No mostrar la acción "Imprimir plantilla" en dispositivos que no sean de escritorio.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)