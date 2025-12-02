:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Valor predeterminado

## Introducción

Un valor predeterminado es el valor inicial de un campo cuando se crea un nuevo registro. Usted puede establecer un valor predeterminado para un campo al configurarlo en una colección, o especificar un valor predeterminado para un campo en un bloque de formulario de adición. Puede configurarse como una constante o una variable.

## Dónde establecer valores predeterminados

### Campos de la colección

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Campos en un formulario de adición

La mayoría de los campos en un formulario de adición permiten establecer un valor predeterminado.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Adición en un subformulario

Los subdatos añadidos a través de un campo de subformulario, ya sea en un formulario de adición o edición, tendrán un valor predeterminado.

Añadir nuevo en un subformulario
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Al editar datos existentes, un campo vacío no se rellenará con el valor predeterminado. Solo los datos recién añadidos se completarán con el valor predeterminado.

### Valores predeterminados para campos de relación

Solo las relaciones de tipo **Muchos a Uno** y **Muchos a Muchos** tienen valores predeterminados cuando se utilizan componentes selectores (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Variables de valor predeterminado

### Qué variables están disponibles

-   Usuario actual;
-   Registro actual; esto solo aplica a registros existentes;
-   Formulario actual; idealmente, solo lista los campos en el formulario;
-   Objeto actual; un concepto dentro de los subformularios (el objeto de datos para cada fila en el subformulario);
-   Parámetros de URL
    Para más información sobre las variables, consulte [Variables](/interface-builder/variables)

### Variables de valor predeterminado de campo

Se dividen en dos categorías: campos sin relación y campos de relación.

#### Variables de valor predeterminado para campos de relación

-   El objeto variable debe ser un registro de colección;
-   Debe ser una colección en la cadena de herencia, que puede ser la colección actual o una colección padre/hija;
-   La variable "Registros seleccionados de la tabla" solo está disponible para campos de relación "Muchos a Muchos" y "Uno a Muchos/Muchos a Uno";
-   **Para escenarios multinivel, debe aplanarse y eliminar duplicados**

```typescript
// Registros seleccionados de la tabla:
[{id:1},{id:2},{id:3},{id:4}]

// Registros seleccionados de la tabla/a-uno:
[{toOne: {id:2}}, {toOne: {id:3}}, {toOne: {id:3}}]
// Aplanar y eliminar duplicados
[{id: 2}, {id: 3}]

// Registros seleccionados de la tabla/a-muchos:
[{toMany: [{id: 1}, {id:2}]}, {toMany: {[id:3}, {id:4}]}]
// Aplanar
[{id:1},{id:2},{id:3},{id:4}]
```

#### Variables de valor predeterminado para campos sin relación

-   Los tipos deben ser consistentes o compatibles, por ejemplo, las cadenas son compatibles con los números, y todos los objetos que proporcionan un método toString;
-   El campo JSON es especial y puede almacenar cualquier tipo de datos;

### Nivel de campo (campos opcionales)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

-   Variables de valor predeterminado para campos sin relación
    -   Al seleccionar campos multinivel, se limita a relaciones de uno a uno y no admite relaciones de uno a muchos;
    -   El campo JSON es especial y puede ser ilimitado;

-   Variables de valor predeterminado para campos de relación
    -   `hasOne`, solo admite relaciones de uno a uno;
    -   `hasMany`, admite tanto relaciones de uno a uno (conversión interna) como de uno a muchos;
    -   `belongsToMany`, admite tanto relaciones de uno a uno (conversión interna) como de uno a muchos;
    -   `belongsTo`, generalmente para relaciones de uno a uno, pero cuando la relación padre es `hasMany`, también admite relaciones de uno a muchos (porque `hasMany`/`belongsTo` es esencialmente una relación de muchos a muchos);

## Notas sobre casos especiales

### "Muchos a Muchos" es equivalente a una combinación de "Uno a Muchos/Muchos a Uno"

Modelo

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### ¿Por qué las relaciones Uno a Uno y Uno a Muchos no tienen valores predeterminados?

Por ejemplo, en una relación A.B, si b1 está asociado con a1, no puede asociarse con a2. Si b1 se asocia con a2, su asociación con a1 se eliminará. En este caso, los datos no se comparten, mientras que el valor predeterminado es un mecanismo compartido (todos pueden asociarse). Por lo tanto, las relaciones Uno a Uno y Uno a Muchos no pueden tener valores predeterminados.

### ¿Por qué los subformularios o subtables de Muchos a Uno y Muchos a Muchos tampoco pueden tener valores predeterminados?

Porque el enfoque de los subformularios y subtables es editar directamente los datos de la relación (incluyendo añadir y eliminar), mientras que el valor predeterminado de la relación es un mecanismo compartido donde todos pueden asociarse, pero los datos de la relación no pueden modificarse. Por lo tanto, no es adecuado proporcionar valores predeterminados en este escenario.

Además, los subformularios o subtables tienen subcampos, y no quedaría claro si el valor predeterminado para un subformulario o subtabla es un valor predeterminado de fila o de columna.

Considerando todos los factores, es más apropiado que los subformularios o subtables no puedan tener valores predeterminados establecidos directamente, independientemente del tipo de relación.