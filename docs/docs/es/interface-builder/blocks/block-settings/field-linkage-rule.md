:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Reglas de Vinculación de Campos

## Introducción

Las reglas de vinculación de campos permiten ajustar dinámicamente el estado de los campos en los bloques de formulario y detalles, basándose en las acciones del usuario. Actualmente, los bloques que admiten estas reglas son:

- [Bloque de Formulario](/interface-builder/blocks/data-blocks/form)
- [Bloque de Detalles](/interface-builder/blocks/data-blocks/details)
- [Subformulario](/interface-builder/fields/specific/sub-form)

## Instrucciones de Uso

### **Bloque de Formulario**

En un bloque de formulario, las reglas de vinculación pueden ajustar dinámicamente el comportamiento de los campos según condiciones específicas:

- **Controlar la visibilidad del campo (mostrar/ocultar)**: Decida si el campo actual se muestra u oculta basándose en los valores de otros campos.
- **Establecer un campo como obligatorio**: Configure dinámicamente un campo como obligatorio o no obligatorio bajo condiciones específicas.
- **Asignar valor**: Asigne automáticamente un valor a un campo basándose en ciertas condiciones.
- **Ejecutar JavaScript específico**: Escriba código JavaScript según sus requisitos de negocio.

### **Bloque de Detalles**

En un bloque de detalles, las reglas de vinculación se utilizan principalmente para controlar dinámicamente la visibilidad (mostrar/ocultar) de los campos en el bloque.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Vinculación de Propiedades

### Asignar Valor

Ejemplo: Cuando una orden se marca como orden complementaria, el estado de la orden se asigna automáticamente a 'Pendiente de Revisión'.

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Obligatorio

Ejemplo: Cuando el estado de la orden es 'Pagado', el campo de monto de la orden es obligatorio.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Mostrar/Ocultar

Ejemplo: La cuenta de pago y el monto total solo se muestran cuando el estado de la orden es 'Pendiente de Pago'.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)