:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Editar Ventana Modal

## Introducción

Cualquier acción o campo que abra una ventana modal al hacer clic permite configurar su modo de apertura, tamaño y otras propiedades.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Modo de Apertura

- Cajón

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Diálogo

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Subpágina

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Tamaño de la Ventana Modal

- Grande
- Mediano (predeterminado)
- Pequeño

## UID de la Ventana Modal

El “UID de la Ventana Modal” es el identificador único (UID) del componente que abre la ventana modal. También se corresponde con el segmento `viewUid` en la URL actual, como en `view/:viewUid`. Puede obtenerlo rápidamente desde el menú de configuración del campo o botón que activa la ventana modal, haciendo clic en “Copiar UID de la ventana modal”.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

Al configurar el UID de la ventana modal, puede lograr la reutilización de la misma.

### Ventana modal interna (predeterminada)
- El “UID de la ventana modal” es igual al UID del botón de acción actual (por defecto, utiliza el UID de este mismo botón).

### Ventana modal externa (reutilización de ventana modal)
- En el campo “UID de la ventana modal”, ingrese el UID de un botón disparador ubicado en otra parte (es decir, el UID de la ventana modal que desea reutilizar).
- Uso típico: Compartir la misma interfaz de usuario y lógica de la ventana modal entre varias páginas o bloques, evitando configuraciones duplicadas.
- Cuando se utiliza una ventana modal externa, algunas configuraciones no se pueden modificar (consulte a continuación).

## Otras Configuraciones Relacionadas

- `Data source / Collection`: Solo lectura. Indica la **fuente de datos** y la **colección** a la que está vinculada la ventana modal; por defecto, toma la **colección** del bloque actual. En el modo de ventana modal externa, hereda la configuración de la ventana modal de destino y no se puede modificar.
- `Association name`: Opcional. Se utiliza para abrir la ventana modal desde un campo de asociación; solo se muestra cuando existe un valor predeterminado. En el modo de ventana modal externa, hereda la configuración de la ventana modal de destino y no se puede modificar.
- `Source ID`: Solo aparece cuando se ha configurado `Association name`; por defecto, utiliza el `sourceId` del contexto actual. Puede cambiarlo a una variable o un valor fijo según sea necesario.
- `filterByTk`: Puede estar vacío, ser una variable opcional o un valor fijo, y se utiliza para limitar los registros de datos que carga la ventana modal.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)