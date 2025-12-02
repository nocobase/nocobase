:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Reglas de Vinculación

## Introducción

En NocoBase, las Reglas de Vinculación son un mecanismo utilizado para controlar el comportamiento interactivo de los elementos de la interfaz de usuario (frontend). Le permiten a usted ajustar la visualización y la lógica de comportamiento de los bloques, campos y acciones en la interfaz según diferentes condiciones, logrando una experiencia interactiva flexible y de bajo código. Esta funcionalidad está en constante iteración y optimización.

Al configurar reglas de vinculación, usted puede lograr, por ejemplo:

- Ocultar/mostrar ciertos bloques según el rol del usuario actual. Diferentes roles pueden ver bloques con distintos alcances de datos; por ejemplo, los administradores ven bloques con información completa, mientras que los usuarios regulares solo pueden ver bloques con información básica.
- Cuando se selecciona una opción en un formulario, rellenar o restablecer automáticamente los valores de otros campos.
- Cuando se selecciona una opción en un formulario, deshabilitar ciertos elementos de entrada.
- Cuando se selecciona una opción en un formulario, establecer ciertos elementos de entrada como obligatorios.
- Controlar si los botones de acción son visibles o clicables bajo ciertas condiciones.

## Configuración de Condiciones

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Variable del Lado Izquierdo

La variable del lado izquierdo en una condición se utiliza para definir el "objeto de juicio" en la regla de vinculación. La condición se evalúa basándose en el valor de esta variable para determinar si se debe activar la acción de vinculación.

Las variables seleccionables incluyen:

- Campos en el contexto, como `「Formulario Actual/xxx」`, `「Registro Actual/xxx」`, `「Registro de Ventana Emergente Actual/xxx」`, etc.
- Variables globales del sistema, como `Usuario Actual`, `Rol Actual`, etc., adecuadas para el control dinámico basado en la identidad del usuario, permisos y otra información.
  > ✅ Las opciones disponibles para la variable del lado izquierdo están determinadas por el contexto del bloque. Utilice la variable del lado izquierdo de manera razonable según las necesidades de su negocio:
  >
  > - `「Usuario Actual」` representa la información del usuario que ha iniciado sesión actualmente.
  > - `「Formulario Actual」` representa los valores de entrada en tiempo real en el formulario.
  > - `「Registro Actual」` representa el valor del registro guardado, como un registro de fila en una tabla.

### Operador

El operador se utiliza para establecer la lógica del juicio de la condición, es decir, cómo comparar la variable del lado izquierdo con el valor del lado derecho. Diferentes tipos de variables del lado izquierdo admiten diferentes operadores. Los tipos de operadores comunes son los siguientes:

- **Tipo de texto**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, etc.
- **Tipo numérico**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, etc.
- **Tipo booleano**: `$isTruly`, `$isFalsy`
- **Tipo de array**: `$match`, `$anyOf`, `$empty`, `$notEmpty`, etc.

> ✅ El sistema recomendará automáticamente una lista de operadores disponibles basándose en el tipo de la variable del lado izquierdo para asegurar que la lógica de configuración sea razonable.

### Valor del Lado Derecho

Se utiliza para comparar con la variable del lado izquierdo y es el valor de referencia para determinar si la condición se cumple.

El contenido admitido incluye:

- Valores constantes: Introduzca números, texto, fechas fijos, etc.
- Variables de contexto: como otros campos en el formulario actual, el registro actual, etc.
- Variables del sistema: como el usuario actual, la hora actual, el rol actual, etc.

> ✅ El sistema adaptará automáticamente el método de entrada para el valor del lado derecho basándose en el tipo de la variable del lado izquierdo, por ejemplo:
>
> - Cuando el lado izquierdo es un "campo de selección", se mostrará el selector de opciones correspondiente.
> - Cuando el lado izquierdo es un "campo de fecha", se mostrará un selector de fechas.
> - Cuando el lado izquierdo es un "campo de texto", se mostrará un cuadro de entrada de texto.

> 💡 El uso flexible de los valores del lado derecho (especialmente las variables dinámicas) le permite construir una lógica de vinculación basada en el usuario actual, el estado actual de los datos y el entorno de contexto, logrando así una experiencia interactiva más potente.

## Lógica de Ejecución de Reglas

### Activación de la Condición

Cuando la condición en una regla se cumple (opcional), la acción de modificación de propiedades que se encuentra debajo se ejecutará automáticamente. Si no se establece ninguna condición, se considera por defecto que la regla siempre se cumple y la acción de modificación de propiedades se ejecutará automáticamente.

### Múltiples Reglas

Usted puede configurar múltiples reglas de vinculación para un formulario. Cuando las condiciones de varias reglas se cumplen simultáneamente, el sistema ejecutará los resultados en orden, de la primera a la última, lo que significa que el último resultado será el estándar de ejecución final.
Ejemplo: La Regla 1 establece un campo como "Deshabilitado", y la Regla 2 establece el campo como "Editable". Si las condiciones de ambas reglas se cumplen, el campo pasará a estar en estado "Editable".

> El orden de ejecución de múltiples reglas es crucial. Al diseñar reglas, asegúrese de clarificar sus prioridades e interrelaciones para evitar conflictos.

## Gestión de Reglas

Usted puede realizar las siguientes operaciones en cada regla:

- Nomenclatura personalizada: Establezca un nombre fácil de entender para la regla, lo que facilitará su gestión e identificación.
- Ordenación: Ajuste el orden basándose en la prioridad de ejecución de las reglas para asegurar que el sistema las procese en la secuencia correcta.
- Eliminar: Elimine las reglas que ya no sean necesarias.
- Habilitar/Deshabilitar: Deshabilite temporalmente una regla sin necesidad de eliminarla, lo cual es útil en escenarios donde se requiere desactivar una regla de forma provisional.
- Duplicar Regla: Cree una nueva regla copiando una existente para evitar configuraciones repetitivas.

## Acerca de las Variables

En la asignación de valores de campo y la configuración de condiciones, se admite el uso tanto de constantes como de variables. La lista de variables variará según la ubicación del bloque. Seleccionar y utilizar variables de manera razonable puede satisfacer las necesidades de su negocio con mayor flexibilidad. Para obtener más información sobre las variables, consulte [Variables](/interface-builder/variables).

## Reglas de Vinculación de Bloques

Las reglas de vinculación de bloques permiten controlar dinámicamente la visualización de un bloque basándose en variables del sistema (como el usuario actual, el rol) o variables de contexto (como el registro de la ventana emergente actual). Por ejemplo, un administrador puede ver la información completa de un pedido, mientras que un rol de servicio al cliente solo puede ver datos específicos del pedido. Mediante las reglas de vinculación de bloques, usted puede configurar los bloques correspondientes según los roles y establecer diferentes campos, botones de acción y alcances de datos dentro de esos bloques. Cuando el rol con el que se ha iniciado sesión es el rol objetivo, el sistema mostrará el bloque correspondiente. Es importante tener en cuenta que los bloques se muestran por defecto, por lo que generalmente usted necesitará definir la lógica para ocultar el bloque.

👉 Para más detalles, consulte: [Bloque/Reglas de Vinculación de Bloques](/interface-builder/blocks/block-settings/block-linkage-rule)

## Reglas de Vinculación de Campos

Las reglas de vinculación de campos se utilizan para ajustar dinámicamente el estado de los campos en un formulario o bloque de detalles basándose en las acciones del usuario, e incluyen principalmente:

- Controlar el estado de **Mostrar/Ocultar** de un campo
- Establecer si un campo es **Obligatorio**
- **Asignar un valor**
- Ejecutar JavaScript para manejar lógica de negocio personalizada

👉 Para más detalles, consulte: [Bloque/Reglas de Vinculación de Campos](/interface-builder/blocks/block-settings/field-linkage-rule)

## Reglas de Vinculación de Acciones

Las reglas de vinculación de acciones actualmente admiten el control de comportamientos de acción, como ocultar/deshabilitar, basándose en variables de contexto como el valor del registro actual y el formulario actual, así como variables globales.

👉 Para más detalles, consulte: [Acción/Reglas de Vinculación](/interface-builder/actions/action-settings/linkage-rule)