:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Selección en Cascada

## Introducción

El selector en cascada está diseñado para campos de relación cuya `colección` de destino es una tabla de árbol. Permite a los usuarios seleccionar datos siguiendo la estructura jerárquica de la `colección` de árbol y admite la búsqueda difusa para un filtrado rápido.

## Instrucciones de Uso

- Para relaciones **uno a uno**, el selector en cascada es de **selección única**.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Para relaciones **uno a muchos**, el selector en cascada es de **selección múltiple**.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Opciones de Configuración del Campo

### Campo de Título

El campo de título determina la etiqueta que se muestra para cada opción.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Permite la búsqueda rápida basada en el campo de título.

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Para más detalles, consulte:
[Campo de Título](/interface-builder/fields/field-settings/title-field)

### Alcance de los Datos

Controla el alcance de los datos de la lista en árbol (si un registro hijo cumple las condiciones, su registro padre también se incluirá).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Para más detalles, consulte:
[Alcance de los Datos](/interface-builder/fields/field-settings/data-scope)

Más componentes de campo:
[Componentes de Campo](/interface-builder/fields/association-field)