:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/blocks/block-settings/block-height).
:::

# Altura del bloque

## Introducción

La altura del bloque admite tres modos: **Altura predeterminada**, **Altura especificada** y **Altura completa**. La mayoría de los bloques admiten ajustes de altura.

![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Modos de altura

### Altura predeterminada

La estrategia de altura predeterminada varía según el tipo de bloque. Por ejemplo, los bloques de tabla y formulario adaptan su altura automáticamente según el contenido, y no aparecerán barras de desplazamiento dentro del bloque.

### Altura especificada

Puede especificar manualmente la altura total del marco exterior del bloque. El bloque calculará y asignará automáticamente la altura disponible internamente.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Altura completa

El modo de altura completa es similar a la altura especificada, pero la altura del bloque se calcula en función del **área visible** (viewport) del navegador actual para alcanzar la altura máxima de pantalla completa. No aparecerán barras de desplazamiento en la página del navegador; las barras de desplazamiento solo aparecerán dentro del bloque.

El manejo del desplazamiento interno en el modo de altura completa varía ligeramente entre los diferentes bloques:

- **Tabla**: Desplazamiento interno dentro de `tbody`;
- **Formulario / Detalles**: Desplazamiento interno dentro de la cuadrícula (desplazamiento del contenido excluyendo el área de acciones);
- **Lista / Tarjeta de cuadrícula**: Desplazamiento interno dentro de la cuadrícula (desplazamiento del contenido excluyendo el área de acciones y la barra de paginación);
- **Mapa / Calendario**: Altura adaptativa global, sin barras de desplazamiento;
- **Iframe / Markdown**: Limita la altura total del marco del bloque, apareciendo las barras de desplazamiento dentro del bloque.

#### Tabla de altura completa

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Formulario de altura completa

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)