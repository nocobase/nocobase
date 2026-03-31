:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Reglas de vinculación de acciones

## Introducción

Las reglas de vinculación de acciones permiten a los usuarios controlar dinámicamente el estado de una acción (como mostrar, habilitar, ocultar, deshabilitar, etc.) según condiciones específicas. Al configurar estas reglas, usted puede vincular el comportamiento de los botones de acción con el registro actual, el rol del usuario o los datos contextuales.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Cómo usar

Cuando se cumple la condición (si no se establece ninguna condición, se aprueba por defecto), se activa la ejecución de la configuración de propiedades o de JavaScript. Se admite el uso de constantes y variables en la evaluación de condiciones.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

La regla permite modificar las propiedades de los botones.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Constantes

Ejemplo: Los pedidos pagados no se pueden editar.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variables

### Variables del sistema

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Ejemplo 1: Controle la visibilidad de un botón según el tipo de dispositivo actual.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Ejemplo 2: El botón de actualización masiva en el encabezado de la tabla del bloque de pedidos solo está disponible para el rol de Administrador; otros roles no pueden realizar esta acción.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Variables contextuales

Ejemplo: El botón "Agregar" en las oportunidades de pedido (bloque de relación) solo se habilita cuando el estado del pedido es "Pendiente de pago" o "Borrador". En otros estados, el botón se deshabilitará.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Para obtener más información sobre las variables, consulte [Variables](/interface-builder/variables).