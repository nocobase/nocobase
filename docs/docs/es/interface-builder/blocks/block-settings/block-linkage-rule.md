:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Reglas de Enlace de Bloques

## Introducción

Las reglas de enlace de bloques le permiten controlar dinámicamente la visualización de los bloques, gestionando la presentación de los elementos a nivel de bloque. Dado que los bloques sirven como contenedores para campos y botones de acción, estas reglas le permiten controlar de forma flexible la visualización de toda la vista desde la dimensión del bloque.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Nota**: Antes de que se ejecuten las reglas de enlace de bloques, la visualización del bloque debe pasar primero por una **verificación de permisos ACL**. Solo cuando un usuario tiene los permisos de acceso correspondientes se evaluará la lógica de las reglas de enlace de bloques. En otras palabras, las reglas de enlace de bloques solo entran en vigor una vez que se cumplen los requisitos de permiso de visualización de ACL. Si no hay reglas de enlace de bloques, el bloque se muestra por defecto.

### Control de Bloques con Variables Globales

Las **reglas de enlace de bloques** permiten usar variables globales para controlar dinámicamente el contenido que se muestra en los bloques, lo que permite a usuarios con diferentes roles y permisos ver e interactuar con vistas de datos personalizadas. Por ejemplo, en un sistema de gestión de pedidos, aunque diferentes roles (como administradores, personal de ventas y personal de finanzas) tienen permiso para ver los pedidos, los campos y botones de acción que cada rol necesita ver pueden variar. Al configurar variables globales, usted puede ajustar de forma flexible los campos mostrados, los botones de acción e incluso las reglas de ordenación y filtrado de datos, basándose en el rol, los permisos u otras condiciones del usuario.

#### Casos de Uso Específicos:

- **Control de Roles y Permisos**: Controle la visibilidad o editabilidad de ciertos campos basándose en los permisos de los diferentes roles. Por ejemplo, el personal de ventas solo puede ver la información básica de un pedido, mientras que el personal de finanzas puede ver los detalles de pago.
- **Vistas Personalizadas**: Personalice diferentes vistas de bloques para distintos departamentos o equipos, asegurándose de que cada usuario solo vea el contenido relevante para su trabajo, mejorando así la eficiencia.
- **Gestión de Permisos de Acción**: Controle la visualización de los botones de acción utilizando variables globales. Por ejemplo, algunos roles solo pueden ver datos, mientras que otros pueden realizar acciones como modificar o eliminar.

### Control de Bloques con Variables Contextuales

Los bloques también pueden controlarse mediante variables en el contexto. Por ejemplo, usted puede usar variables contextuales como "Registro actual", "Formulario actual" y "Registro de ventana emergente actual" para mostrar u ocultar bloques dinámicamente.

Ejemplo: El bloque "Información de Oportunidad de Pedido" se muestra solo cuando el estado del pedido es "Pagado".

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Para más información sobre las reglas de enlace, consulte [Reglas de Enlace](/interface-builder/linkage-rule).