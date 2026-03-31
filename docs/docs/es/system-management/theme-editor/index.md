:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Editor de Temas

> La funcionalidad de temas actual está implementada basándose en Ant Design 5.x. Le recomendamos que se familiarice con los conceptos de [personalización de temas](https://ant.design/docs/react/customize-theme) antes de leer este documento.

## Introducción

El plugin Editor de Temas se utiliza para modificar los estilos de toda la página de frontend. Actualmente, permite editar los [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken) y [AliasToken](https://ant.design/docs/react/customize-theme#aliastoken) globales, y también permite [cambiar](https://ant.design/docs/react/customize-theme#use-preset-algorithms) al `Modo Oscuro` y al `Modo Compacto`. En el futuro, es posible que se añada soporte para la personalización de temas a [nivel de componente](https://ant.design/docs/react/customize-theme#component-level-customization).

## Instrucciones de Uso

### Habilitar el plugin Editor de Temas

Primero, actualice NocoBase a la última versión (v0.11.1 o superior). Luego, en la página de gestión de plugins, busque la tarjeta `Editor de Temas`. Haga clic en el botón `Habilitar` en la esquina inferior derecha de la tarjeta y espere a que la página se actualice.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Acceder a la página de configuración de temas

Después de habilitar el plugin, haga clic en el botón de configuración en la esquina inferior izquierda de la tarjeta para ir a la página de edición de temas. Por defecto, se ofrecen cuatro opciones de tema: `Tema por defecto`, `Tema oscuro`, `Tema compacto` y `Tema oscuro compacto`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Añadir un nuevo tema

Haga clic en el botón `Añadir nuevo tema` y seleccione `Crear un tema completamente nuevo`. Se abrirá un editor de temas en el lado derecho de la página, que le permitirá editar opciones como `Colores`, `Tamaños` y `Estilos`. Una vez que haya terminado de editar, introduzca un nombre para el tema y haga clic en guardar para completar la creación del tema.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Aplicar un nuevo tema

Mueva el cursor a la esquina superior derecha de la página para ver el selector de temas. Haga clic en él para cambiar a otros temas, como el tema que acaba de añadir.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Editar un tema existente

Haga clic en el botón `Editar` en la esquina inferior izquierda de la tarjeta. Se abrirá un editor de temas en el lado derecho de la página (similar al de añadir un nuevo tema). Una vez que haya terminado de editar, haga clic en guardar para completar la modificación del tema.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Configurar temas seleccionables por el usuario

Los temas recién añadidos están disponibles para que los usuarios los cambien por defecto. Si no desea que los usuarios cambien a un tema determinado, desactive el interruptor `Seleccionable por el usuario` en la esquina inferior derecha de la tarjeta del tema, lo que impedirá que los usuarios cambien a ese tema.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Establecer como tema por defecto

Inicialmente, el tema por defecto es `Tema por defecto`. Si necesita establecer un tema específico como predeterminado, active el interruptor `Tema por defecto` en la esquina inferior derecha de la tarjeta del tema. Esto asegura que cuando los usuarios abran la página por primera vez, verán este tema. Nota: El tema por defecto no se puede eliminar.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Eliminar un tema

Haga clic en el botón `Eliminar` debajo de la tarjeta y luego confirme en el cuadro de diálogo emergente para eliminar el tema.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)