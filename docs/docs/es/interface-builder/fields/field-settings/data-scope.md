:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Configurar el Alcance de los Datos

## Introducción

La configuración del alcance de los datos para un campo de relación es similar a la configuración del alcance de los datos para un bloque. Permite establecer condiciones de filtro predeterminadas para los datos relacionados.

## Instrucciones de Uso

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Valor Estático

Ejemplo: Solo se pueden seleccionar productos no eliminados para la relación.

> La lista de campos contiene los campos de la **colección** de destino del campo de relación.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Valor de Variable

Ejemplo: Solo se pueden seleccionar productos cuya fecha de servicio sea posterior a la fecha del pedido para la relación.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Para más información sobre las variables, consulte [Variables](/interface-builder/variables).

### Vinculación de Campos de Relación

La vinculación entre campos de relación se logra configurando el alcance de los datos.

Ejemplo: La **colección** de Pedidos tiene un campo de relación de Uno a Muchos llamado "Producto de Oportunidad" y un campo de relación de Muchos a Uno llamado "Oportunidad". La **colección** de Producto de Oportunidad tiene un campo de relación de Muchos a Uno llamado "Oportunidad". En el bloque del formulario de pedidos, los datos seleccionables para "Producto de Oportunidad" se filtran para mostrar solo los productos de oportunidad asociados con la "Oportunidad" seleccionada actualmente en el formulario.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)