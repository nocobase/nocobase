:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Bloque de Detalles

## Introducción

El Bloque de Detalles se utiliza para mostrar los valores de los campos de cada registro de datos. Admite diseños de campo flexibles e incorpora funciones de acción de datos, lo que facilita a los usuarios la visualización y gestión de la información.

## Configuración del Bloque

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Reglas de Vinculación del Bloque

Controle el comportamiento del bloque (por ejemplo, si se muestra o si ejecuta JavaScript) mediante reglas de vinculación.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Para más detalles, consulte [Reglas de Vinculación](/interface-builder/linkage-rule)

### Establecer Alcance de Datos

Ejemplo: Mostrar solo los pedidos pagados.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Para más detalles, consulte [Establecer Alcance de Datos](/interface-builder/blocks/block-settings/data-scope)

### Reglas de Vinculación de Campos

Las reglas de vinculación en el Bloque de Detalles permiten configurar dinámicamente la visibilidad de los campos (mostrar/ocultar).

Ejemplo: No mostrar el importe cuando el estado del pedido sea "Cancelado".

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Para más detalles, consulte [Reglas de Vinculación](/interface-builder/linkage-rule)

## Configurar Campos

### Campos de esta colección

> **Nota**: Los campos de las colecciones heredadas (es decir, los campos de la colección principal) se fusionan y se muestran automáticamente en la lista de campos actual.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Campos de colecciones relacionadas

> **Nota**: Se admite la visualización de campos de colecciones relacionadas (actualmente solo para relaciones uno a uno).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Otros Campos
- JS Field
- JS Item
- Separador
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Consejo**: Puede escribir JavaScript para implementar contenido de visualización personalizado, lo que le permite mostrar información más compleja.  
> Por ejemplo, puede renderizar diferentes efectos de visualización según distintos tipos de datos, condiciones o lógicas.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Configurar Acciones

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Editar](/interface-builder/actions/types/edit)
- [Eliminar](/interface-builder/actions/types/delete)
- [Enlace](/interface-builder/actions/types/link)
- [Ventana Emergente](/interface-builder/actions/types/pop-up)
- [Actualizar Registro](/interface-builder/actions/types/update-record)
- [Activar flujo de trabajo](/interface-builder/actions/types/trigger-workflow)
- [Acción JS](/interface-builder/actions/types/js-action)
- [Empleado IA](/interface-builder/actions/types/ai-employee)