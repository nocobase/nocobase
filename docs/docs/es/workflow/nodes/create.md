:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Crear Registro

Se utiliza para añadir un nuevo registro a una colección.

Los valores de los campos para el nuevo registro pueden utilizar variables del contexto del flujo de trabajo. Para asignar valores a los campos de relación, puede referenciar directamente las variables de datos correspondientes en el contexto, que pueden ser un objeto o el valor de una clave foránea. Si no utiliza variables, deberá introducir manualmente los valores de las claves foráneas. Para múltiples valores de claves foráneas en relaciones de tipo "muchos", estos deben separarse por comas.

## Crear Nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de signo más ("+") dentro del flujo para añadir el nodo "Crear Registro":

![Add 'Create Record' node](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Configuración del Nodo

![Create Record Node_Example_Node Configuration](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Colección

Seleccione la colección a la que desea añadir un nuevo registro.

### Valores de los Campos

Asigne valores a los campos de la colección. Puede utilizar variables del contexto del flujo de trabajo o introducir manualmente valores estáticos.

:::info{title="Nota"}
Los datos creados por el nodo "Crear Registro" en un flujo de trabajo no gestionan automáticamente los datos de usuario como "Creado por" y "Última modificación por". Debe configurar los valores de estos campos manualmente según sea necesario.
:::

### Precargar datos de relación

Si los campos del nuevo registro incluyen campos de relación y desea utilizar los datos de relación correspondientes en pasos posteriores del flujo de trabajo, puede marcar los campos de relación pertinentes en la configuración de precarga. De esta manera, una vez creado el nuevo registro, los datos de relación correspondientes se cargarán automáticamente y se almacenarán junto con los datos de resultado del nodo.

## Ejemplo

Por ejemplo, cuando se crea o actualiza un registro en la colección "Artículos", es necesario crear automáticamente un registro de "Versiones de Artículo" para registrar el historial de cambios del artículo. Puede utilizar el nodo "Crear Registro" para lograr esto:

![Create Record Node_Example_Workflow Configuration](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Create Record Node_Example_Node Configuration](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Después de habilitar el flujo de trabajo con esta configuración, cuando se modifique un registro en la colección "Artículos", se creará automáticamente un registro de "Versiones de Artículo" para registrar el historial de cambios del artículo.