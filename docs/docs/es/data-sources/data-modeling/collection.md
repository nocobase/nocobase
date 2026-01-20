:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Visión General de Colecciones

NocoBase ofrece un DSL único para describir la estructura de los datos, conocido como **colección**. Este DSL unifica la estructura de datos de diversas fuentes, sentando una base sólida para la gestión, el análisis y la aplicación de los datos.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Para utilizar cómodamente diversos modelos de datos, NocoBase permite crear varios tipos de **colecciones**:

- [Colección general](/data-sources/data-source-main/general-collection): Incluye campos de sistema comunes.
- [Colección de herencia](/data-sources/data-source-main/inheritance-collection): Permite crear una colección padre y derivar colecciones hijas de ella. Las colecciones hijas heredarán la estructura de la padre y podrán definir sus propias columnas.
- [Colección de árbol](/data-sources/collection-tree): Colección con estructura de árbol; actualmente solo admite el diseño de lista de adyacencia.
- [Colección de calendario](/data-sources/calendar/calendar-collection): Se utiliza para crear colecciones de eventos relacionadas con calendarios.
- [Colección de archivos](/data-sources/file-manager/file-collection): Se utiliza para la gestión del almacenamiento de archivos.
- : Se utiliza para escenarios de expresiones dinámicas en **flujos de trabajo**.
- [Colección SQL](/data-sources/collection-sql): No es una colección de base de datos real, sino que presenta rápidamente consultas SQL de forma estructurada.
- [Colección de vista](/data-sources/collection-view): Se conecta a vistas de base de datos existentes.
- [Colección externa](/data-sources/collection-fdw): Permite que el sistema de base de datos acceda y consulte directamente datos en **fuentes de datos** externas, basándose en la tecnología FDW.