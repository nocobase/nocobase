# Gestión de Localización

## Introducción

El plugin de Gestión de Localización le permite gestionar e implementar los recursos de localización de NocoBase. Con él, podrá traducir los menús del sistema, las colecciones, los campos y todos los plugins para adaptarse al idioma y la cultura de regiones específicas.

Si desea contribuir traducciones predeterminadas del sistema y de los plugins oficiales a NocoBase, consulte [Contribución de traducciones](/get-started/translations).

## Instalación

Este plugin está integrado, por lo que no necesita ninguna instalación adicional.

## Instrucciones de Uso

### Activación del plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Acceder a la página de Gestión de Localización

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Sincronización de las entradas de traducción

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Actualmente, puede sincronizar el siguiente contenido:

- Paquetes de idiomas locales para el sistema y los plugins
- Títulos de colección, títulos de campo y etiquetas de opciones de campo
- Títulos de menú

Una vez completada la sincronización, el sistema le mostrará todas las entradas de traducción disponibles para el idioma actual.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Nota}
Es posible que diferentes módulos contengan los mismos términos originales, los cuales deberán traducirse de forma individual.
:::

Si las traducciones de entradas integradas del sistema o de plugins se modifican manualmente o se sobrescriben con traducción de IA, seleccione `Restablecer traducciones de entradas integradas del sistema` durante la sincronización. Después de sincronizar, el sistema sobrescribirá las traducciones integradas existentes del idioma actual con las del paquete de idioma integrado para restaurar la traducción predeterminada.

### Creación automática de entradas

Al editar una página, el texto personalizado en cada bloque creará automáticamente la entrada correspondiente y generará de forma sincrónica el contenido traducido para el idioma actual.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Nota}
Al definir texto en el código, es necesario especificar manualmente el ns (namespace), por ejemplo: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::

### Edición del contenido de la traducción

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

La columna de traducción admite edición rápida. Puede hacer clic directamente en una celda de traducción de la tabla para modificarla, pulsar Enter o quitar el foco del campo para guardar, y pulsar `Esc` para cancelar el cambio. Para ver el texto original, el módulo o traducciones largas, también puede usar el botón de edición en las acciones de fila para abrir el editor lateral.

### Usar traducción con IA

La Gestión de Localización admite traducir entradas mediante la empleada de IA Lina. Después de habilitar los empleados de IA y configurar un servicio de modelo, puede usar la traducción con IA en la página de Gestión de Localización para generar traducciones por lotes para el idioma actual.

![](https://static-docs.nocobase.com/202605121152196.png)

Ámbitos de traducción disponibles:

- **Traducción completa**: traduce todas las entradas del idioma actual y sobrescribe las traducciones existentes.
- **Traducción incremental**: traduce solo las entradas que aún no tienen traducción en el idioma actual. Para entradas integradas, si ya existe una traducción en el paquete de idioma del sistema o del plugin para el idioma de destino, también se considera ya traducida.
- **Traducción de elementos seleccionados**: seleccione entradas en la tabla y traduzca solo el contenido seleccionado.

![](https://static-docs.nocobase.com/202605191341968.png)

Al crear una tarea de traducción completa o incremental, puede elegir el alcance de traducción en el diálogo de confirmación:

- **Todo**: procesa todas las entradas que cumplen las condiciones de la tarea actual.
- **Entradas integradas**: entradas del sistema y plugins.
- **Entradas personalizadas**: nombres de rutas, nombres de colecciones y campos, y contenido de UI.

El diálogo de confirmación también permite configurar los idiomas de traducción de referencia. La traducción completa e incremental configuran por separado el idioma predeterminado y alternativo para entradas integradas y personalizadas. La traducción de elementos seleccionados solo muestra una configuración general de idiomas de referencia.

La traducción con IA crea una tarea en segundo plano. Puede ver el progreso mientras se ejecuta. Al finalizar, las traducciones se escriben en el idioma correspondiente y todavía deben revisarse y corregirse según el contexto real.

Consulte la guía completa en [Empleado de IA - Lina](/ai-employees/built-in/lina).

:::warning{title=Nota}
Las traducciones generadas por IA pueden tener desviaciones semánticas, terminología inconsistente o comprensión insuficiente del contexto. Antes de publicar, revise manualmente las páginas importantes, los términos de negocio y los textos visibles para los usuarios.
:::

### Publicación de las traducciones

Una vez que haya terminado de traducir, deberá hacer clic en el botón "Publicar" para que las modificaciones se hagan efectivas.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Traducción a otros idiomas

Habilite otros idiomas en "Configuración del sistema", por ejemplo, chino simplificado.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Cambie al entorno de ese idioma.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Sincronice las entradas.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Traduzca y publique.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>
