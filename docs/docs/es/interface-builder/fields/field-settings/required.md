:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Obligatorio

## Introducción

La regla de campo obligatorio es una validación común en formularios. Puede habilitarla directamente en la configuración del campo o establecer un campo como obligatorio de forma dinámica mediante las reglas de vinculación del formulario.

## ¿Dónde puede establecer un campo como obligatorio?

### Configuración de campos de la colección

Cuando un campo de la colección se establece como obligatorio, se activa la validación en el backend, y el frontend también lo muestra como obligatorio por defecto (no se puede modificar).

![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Configuración del campo

Establezca un campo directamente como obligatorio. Esto es adecuado para campos que el usuario siempre debe rellenar, como el nombre de usuario, la contraseña, etc.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Reglas de vinculación

Establezca un campo como obligatorio según ciertas condiciones, utilizando las reglas de vinculación de campos del bloque de formulario.

Ejemplo: El número de pedido es obligatorio cuando la fecha del pedido no está vacía.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Flujo de trabajo