---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Colección SQL

## Introducción

La colección SQL le ofrece un método potente para recuperar datos mediante consultas SQL. Al extraer campos de datos a través de consultas SQL y configurar los metadatos de campo asociados, usted puede utilizar estos campos como si estuviera trabajando con una tabla estándar. Esta funcionalidad es especialmente útil para escenarios que involucran consultas de unión complejas, análisis estadísticos y más.

## Manual de Usuario

### Crear una nueva colección SQL

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Ingrese su consulta SQL en el cuadro de entrada y haga clic en **Ejecutar**. El sistema analizará la consulta para determinar las tablas y campos involucrados, extrayendo automáticamente los metadatos de campo relevantes de las tablas de origen.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Si el análisis del sistema sobre las tablas y campos de origen es incorrecto, usted puede seleccionar manualmente las tablas y campos apropiados para asegurar que se utilicen los metadatos correctos. Primero, seleccione la tabla de origen y luego elija los campos correspondientes en la sección de origen de campos que se encuentra debajo.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. Para los campos que no tienen un origen directo, el sistema inferirá el tipo de campo basándose en el tipo de datos. Si esta inferencia es incorrecta, usted puede seleccionar manualmente el tipo de campo adecuado.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. A medida que configure cada campo, podrá previsualizar su visualización en el área de vista previa, lo que le permitirá ver el impacto inmediato de sus ajustes.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Una vez que haya completado la configuración y confirmado que todo es correcto, haga clic en el botón **Confirmar** debajo del cuadro de entrada SQL para finalizar el envío.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Edición

1. Si necesita modificar la consulta SQL, haga clic en el botón **Editar** para alterar directamente la declaración SQL y reconfigurar los campos según sea necesario.

2. Para ajustar los metadatos de campo, utilice la opción **Configurar campos**, que le permite actualizar la configuración de los campos como lo haría con una tabla normal.

### Sincronización

Si la consulta SQL permanece sin cambios, pero la estructura de la tabla de la base de datos subyacente ha sido modificada, usted puede sincronizar y reconfigurar los campos seleccionando **Configurar campos** - **Sincronizar desde la base de datos**.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### Colección SQL vs. Vistas de Base de Datos Vinculadas

| Tipo de Plantilla | Mejor para | Método de Implementación | Soporte para Operaciones CRUD |
| :--- | :--- | :--- | :--- |
| SQL | Modelos simples, casos de uso ligeros<br />Interacción limitada con la base de datos<br />Evitar el mantenimiento de vistas<br />Preferir operaciones impulsadas por la interfaz de usuario | Subconsulta SQL | No compatible |
| Conectar a vista de base de datos | Modelos complejos<br />Requiere interacción con la base de datos<br />Necesidad de modificación de datos<br />Requiere un soporte de base de datos más robusto y estable | Vista de base de datos | Parcialmente compatible |

:::warning
Cuando utilice una colección SQL, asegúrese de seleccionar tablas que sean gestionables dentro de NocoBase. El uso de tablas de la misma base de datos que no estén conectadas a NocoBase puede resultar en un análisis impreciso de la consulta SQL. Si esto le preocupa, considere crear y vincular a una vista.
:::