:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Establecer el Alcance de los Datos

## Introducción

Establecer el alcance de los datos significa definir condiciones de filtro predeterminadas para un bloque de datos. Los usuarios pueden ajustar el alcance de los datos de forma flexible según sus necesidades de negocio, pero independientemente de las operaciones de filtrado que realicen, el sistema aplicará automáticamente esta condición de filtro predeterminada, asegurando que los datos siempre se mantengan dentro de los límites del alcance especificado.

## Guía de Usuario

![20251027110053](https://static-docs.nocobase.com/20251027110053.png)

El campo de filtro permite seleccionar campos de la colección actual y de colecciones relacionadas.

![20251027110140](https://static-docs.nocobase.com/20251027110140.png)

### Operadores

Diferentes tipos de campos admiten distintos operadores. Por ejemplo, los campos de texto admiten operadores como 'igual a', 'distinto de' y 'contiene'; los campos numéricos admiten operadores como 'mayor que' y 'menor que'; mientras que los campos de fecha admiten operadores como 'está dentro del rango' y 'es anterior a una fecha específica'.

![20251027111124](https://static-docs.nocobase.com/20251027111124.png)

### Valor Estático

Ejemplo: Filtre los datos por el "Estado" del pedido.

![20251027111229](https://static-docs.nocobase.com/20251027111229.png)

### Valor de Variable

Ejemplo: Filtre los datos de pedidos del usuario actual.

![20251027113349](https://static-docs.nocobase.com/20251027113349.png)

Para más información sobre variables, consulte [Variables](/interface-builder/variables)