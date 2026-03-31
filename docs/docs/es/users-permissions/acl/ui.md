---
pkg: '@nocobase/plugin-acl'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Aplicación en la interfaz de usuario (UI)

## Permisos de los bloques de datos

La visibilidad de los bloques de datos de una colección se controla mediante los permisos de la operación de visualización. Las configuraciones individuales tienen prioridad sobre los ajustes globales.

Como se muestra a continuación: bajo los permisos globales, el rol "admin" tiene acceso total, pero la colección de Pedidos puede tener permisos individuales configurados (haciéndola invisible).

La configuración de permisos globales es la siguiente:

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

La configuración de permisos individuales para la colección de Pedidos es la siguiente:

![](https://static-docs.nocobase.com/a88caba1cad47001c1610bf402a4a2c1.png)

En la interfaz de usuario, todos los bloques de la colección de Pedidos no se muestran.

El proceso de configuración completo es el siguiente:

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Permisos de campo

**Visualizar**: Controla si los campos específicos son visibles a nivel de campo, por ejemplo, para determinar qué campos de la colección de Pedidos son visibles para un rol determinado.

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

En la interfaz de usuario, solo se muestran los campos con permisos configurados dentro del bloque de la colección de Pedidos. Los campos del sistema (Id, CreatedAt, LastUpdatedAt) conservan los permisos de visualización incluso sin una configuración específica.

![](https://static-docs.nocobase.com/40cc51a717efe701147fd2e799e79dcc.png)

- **Editar**: Controla si los campos pueden ser editados y guardados (actualizados).

  Como se muestra, configure los permisos de edición para los campos de la colección de Pedidos (la cantidad y los productos asociados tienen permisos de edición):

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  En la interfaz de usuario, el bloque del formulario de la operación de edición del bloque de la colección de Pedidos solo muestra los campos con permisos de edición.

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  El proceso de configuración completo es el siguiente:

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Añadir**: Controla si los campos pueden ser añadidos (creados).

  Como se muestra, configure los permisos de añadir para los campos de la colección de Pedidos (el número de pedido, la cantidad, los productos y el envío tienen permisos de añadir).

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  En la interfaz de usuario, el bloque del formulario de la operación de añadir del bloque de la colección de Pedidos solo muestra los campos con permisos de añadir.

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Exportar**: Controla si los campos pueden ser exportados.
- **Importar**: Controla si los campos admiten la importación.

## Permisos de operación

Los permisos configurados individualmente tienen la máxima prioridad. Si se configuran permisos específicos, estos anulan la configuración global; de lo contrario, se aplican los ajustes globales.

- **Añadir**: Controla si el botón de la operación de añadir es visible dentro de un bloque.

  Como se muestra, configure los permisos de operación individuales para la colección de Pedidos para permitir añadir.

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  En la interfaz de usuario, el botón de añadir se muestra en el área de operaciones del bloque de la colección de Pedidos.

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Visualizar**: Controla si el bloque de datos es visible.

  Como se muestra, la configuración de permisos globales es la siguiente (sin permiso de visualización):

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  La configuración de permisos individuales para la colección de Pedidos es la siguiente:

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  En la interfaz de usuario, los bloques de datos de todas las demás colecciones permanecen ocultos, pero el bloque de la colección de Pedidos se muestra.

  El proceso de configuración del ejemplo completo es el siguiente:

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Editar**: Controla si el botón de la operación de edición se muestra dentro de un bloque.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Los permisos de operación se pueden refinar aún más configurando el alcance de los datos.

  Como se muestra, configure la colección de datos de Pedidos para que los usuarios solo puedan editar sus propios datos.

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Eliminar**: Controla la visualización del botón de la operación de eliminar en el bloque.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Exportar**: Controla si el botón de la operación de exportar es visible dentro de un bloque.

- **Importar**: Controla si el botón de la operación de importar es visible dentro de un bloque.

## Permisos de relación

### Como campo

- Los permisos de un campo de relación se controlan mediante los permisos de campo de la colección de origen. Esto controla si se muestra todo el componente del campo de relación.

Por ejemplo, en la colección de Pedidos, el campo de relación "Cliente" solo tiene permisos de visualización, importación y exportación.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

En la interfaz de usuario, esto significa que el campo de relación "Cliente" no se mostrará en los bloques de operaciones de añadir y editar de la colección de Pedidos.

El proceso de configuración del ejemplo completo es el siguiente:

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Los permisos para los campos dentro del componente del campo de relación (como una subtabla o un subformulario) se determinan mediante los permisos de la colección de destino.

Cuando el componente del campo de relación es un subformulario:

Como se muestra a continuación, el campo de relación "Cliente" en la colección de Pedidos tiene todos los permisos, mientras que la colección de Clientes está configurada con permisos individuales de solo lectura.

La configuración de permisos individuales para la colección de Pedidos es la siguiente: el campo de relación "Cliente" tiene todos los permisos de campo.

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

La configuración de permisos individuales para la colección de Clientes es la siguiente: los campos de la colección de Clientes solo tienen permisos de visualización.

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

En la interfaz de usuario, el campo de relación "Cliente" es visible en el bloque de la colección de Pedidos. Sin embargo, al cambiar a un subformulario, los campos dentro del subformulario son visibles en la vista de detalles, pero no se muestran en las operaciones de añadir y editar.

El proceso de configuración del ejemplo completo es el siguiente:

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Para controlar aún más los permisos de los campos dentro del subformulario: los campos individuales tienen permisos.

Como se muestra, la colección de Clientes está configurada con permisos de campo individuales (el nombre del cliente no es visible ni editable).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

El proceso de configuración del ejemplo completo es el siguiente:

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Cuando el componente del campo de relación es una subtabla, la situación es consistente con la de un subformulario:

Como se muestra, la colección de Pedidos tiene un campo de relación "Envío" que posee todos los permisos, mientras que la colección de Envíos está configurada con permisos individuales de solo lectura.

En la interfaz de usuario, este campo de relación es visible. Sin embargo, al cambiar a una subtabla, los campos dentro de la subtabla son visibles en la operación de visualización, pero no en las operaciones de añadir y editar.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Para controlar aún más los permisos de los campos dentro de la subtabla: los campos individuales tienen permisos.

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### Como bloque

- La visibilidad de un bloque de relación se controla mediante los permisos de la colección de destino del campo de relación correspondiente, y es independiente de los permisos del campo de relación.

Como se muestra, si el bloque de relación "Cliente" se muestra o no, está controlado por los permisos de la colección de Clientes.

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Los campos dentro de un bloque de relación se controlan mediante los permisos de campo en la colección de destino.

Como se muestra, puede establecer permisos de visualización para campos individuales en la colección de Clientes.

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)