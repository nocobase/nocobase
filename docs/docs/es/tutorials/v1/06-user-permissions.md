# Capítulo 6: Usuarios y permisos

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113595157318206&bvid=BV1EwiUYYE4f&cid=27181319746&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

En la colaboración en equipo, cada persona debe tener clara su responsabilidad y sus permisos para que el trabajo avance sin obstáculos. Hoy aprenderemos a crear roles y a gestionar permisos para una colaboración fluida y ordenada.

No se preocupe, no es complicado: le acompañaremos paso a paso y le guiaremos en cada momento clave. Si tiene cualquier duda, no dude en pedir ayuda en nuestro foro oficial.

### Planteamiento de necesidades:

Necesitamos un rol "Compañero (Partner)" que tenga permisos suficientes para participar en la gestión de tareas, pero que no pueda modificar las tareas ajenas. Así podremos asignar y colaborar en tareas con flexibilidad.

![](https://static-docs.nocobase.com/241219-5-er.svg)

> **Introducción a roles y permisos:** Los roles y permisos son un mecanismo importante para gestionar el acceso y las operaciones de los usuarios; garantizan la seguridad del sistema y la integridad de los datos. Los roles se asocian a usuarios y un usuario puede tener varios roles. Configurando los permisos del rol se puede controlar el comportamiento del usuario en el sistema, sus operaciones, e incluso restringir las funcionalidades visibles. Tienen un papel fundamental en el control de acceso.
> Combinar roles y permisos con la gestión de usuarios le permitirá controlar mejor su sistema en este caso de estudio. Como administrador, podrá decidir libremente quién dispone de qué permisos.

### 6.1 **Crear y asignar roles**

#### 6.1.1 **Crear el rol "Compañero (Partner)"**

- En la esquina superior derecha, haga clic en [**Usuarios y permisos**](https://docs-cn.nocobase.com/handbook/users) y seleccione [**Roles y permisos**](https://docs-cn.nocobase.com/handbook/acl). Aquí es donde se configuran los roles y permisos.
- Haga clic en **Crear rol**: aparecerá un cuadro de diálogo. Asigne el nombre **Compañero (Partner)** al rol y guárdelo.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172222974.gif)

¡Ya ha creado un nuevo rol! A continuación hay que asignarle permisos para que pueda participar en la gestión de tareas.

#### 6.1.2 **Asignarse el nuevo rol a uno mismo**

Para asegurarnos de que los permisos configurados surten efecto, podemos asignar el rol a nuestra propia cuenta para hacer pruebas:

- En la gestión de usuarios, busque su cuenta, haga clic para entrar, seleccione **Asignar rol** y elija **Compañero**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223483.gif)

Así podrá simular la experiencia del rol "Compañero" desde su cuenta. Ahora veamos cómo cambiar de rol.

#### 6.1.3 **Cambiar al rol "Compañero"**

Ya tiene asignado el rol "Compañero". Veamos cómo cambiar de rol:

- Haga clic en el **centro personal** de la esquina superior derecha y seleccione **Cambiar de rol**.
- Es posible que aún no aparezca el rol "Compañero" en la lista. Tranquilo: solo tiene que **refrescar la página o limpiar la caché** y aparecerá.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223922.gif)

### 6.2 Asignar permisos de página al rol

Tras cambiar al rol "Compañero" verá que el sistema no muestra ninguna página ni menú. Esto se debe a que aún no hemos asignado permisos de acceso a páginas concretas. Vamos a configurarlos.

#### 6.2.1 **Asignar permisos de página al rol "Compañero"**

- Vuelva al rol **Root** (administrador) y entre en **Roles y permisos**.
- Haga clic en el rol "Compañero" para entrar en su configuración. Verá una pestaña **Menú** que representa todas las páginas del sistema.
- Marque el permiso de la página **Gestión de tareas**: así "Compañero" podrá acceder a esa página.

Vuelva al **centro personal** y cambie de nuevo al rol "Compañero": ahora ya debería ver el menú de Gestión de tareas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223592.gif)

#### 6.2.2 Configurar permisos de tabla y de operaciones

Aunque "Compañero" ya puede acceder a la página, hay que limitar más sus permisos de operación. Queremos que pueda:

- **Ver y editar** las tareas asignadas a él.
- **Actualizar el progreso de las tareas**.
- Pero **no crear ni eliminar** tareas.

Para ello hay que configurar los permisos de la "tabla de tareas". ¡Vamos!

##### 6.2.2.1 **Configurar permisos de tabla para el rol "Compañero"**

- Entre en **Roles y permisos**, haga clic en el rol "Compañero" y vaya a la pestaña **Fuente de datos**.
- Verá el ajuste **Permisos de operación de las tablas**. Localice la **tabla de tareas** y asigne a "Compañero" los permisos de "Ver" y "Editar".
- ¿Por qué se asigna "Editar" a "todos los datos"? Aunque de momento damos a "Compañero" todos los permisos de edición, más adelante limitaremos los campos según el "Responsable" de la tarea. Mantener inicialmente el permiso máximo permitirá un control posterior más flexible.
- "Crear" y "Eliminar" no deben estar abiertos para otros roles, así que no los asignamos desde el principio.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224941.gif)

Hasta aquí, el rol "Compañero" ya puede ver y editar todas las tareas. A continuación restringiremos para que solo pueda editar las tareas asignadas a él.

### 6.3 Añadir el campo "Responsable" a la tabla de tareas

Vamos a asignar un responsable a cada tarea. Solo el responsable podrá modificar la tarea, mientras que el resto solo podrá verla. Para ello necesitamos un **campo de relación** que enlace la tabla de tareas con la tabla de usuarios.

#### 6.3.1 **Crear el campo "Responsable"**

1. Vaya a la **tabla de tareas**, haga clic en **Añadir campo** y seleccione **Campo de relación**.
2. Elija la relación **muchos a uno** (porque cada tarea solo tiene un responsable, pero un usuario puede ser responsable de varias).
3. Asigne al campo el nombre **Responsable (Assignee)**. No es necesario marcar la relación inversa por ahora.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224751.gif)

#### 6.3.2 **Mostrar el campo "Responsable"**

Asegúrese de que el campo "Responsable" se muestra en la tabla y los formularios de la página de gestión de tareas para asignar fácilmente un responsable a cada tarea. (Si por defecto se muestra el ID, no se preocupe: cambie el campo de título de "ID" a "Apodo" del usuario).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224547.png)

### 6.4 Controlar permisos con la **gestión de permisos**

¡Llega lo bueno! Ahora aprovecharemos la [**gestión de permisos**](https://docs-cn.nocobase.com/handbook/acl) de NocoBase para implementar una funcionalidad muy potente: **solo el responsable y el creador de la tarea pueden editarla**, los demás solo podrán verla. La flexibilidad de NocoBase entra en escena.

#### 6.4.1 **Primer intento: solo el responsable puede editar el formulario**

Queremos que solo el responsable pueda editar la tarea, así que configuramos lo siguiente:

- Vuelva a los permisos de tabla del rol "Compañero", abra la "Configuración" de la tabla de tareas y, junto a "Permiso de edición", haga clic en "Rango de datos".
- Cree una regla personalizada llamada "Editable por el responsable":
  Cuando **"Responsable/ID" sea igual a "Usuario actual/ID"**, se podrá editar.
  Es decir, solo el responsable de la tarea podrá editarla; los demás solo podrán verla.
- Como el campo Responsable es de la tabla de usuarios y el usuario que ha iniciado sesión también está en esa tabla, esta regla cumple perfectamente nuestro primer requisito.

Haga clic en añadir y confirme.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172226879.gif)

Volvamos a la página a comprobarlo:

Perfecto: cambie al rol "Compañero" y verá que solo cuando el responsable es usted aparece la acción de editar.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227581.gif)

#### 6.4.2 **Condición adicional: el creador puede ver el formulario**

Quizá note un nuevo problema:

Como en la mayoría de las tareas no somos el responsable, no podemos editar el formulario y, además, los compañeros tampoco pueden ver los detalles.

Tranquilo: ¿recuerda que asignamos a "Compañero" el permiso de **ver** todos los datos?

- Volvemos a la página y, en la configuración, marcamos "Ver" para añadir una acción de visualización.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227426.png)

- Con un diseño de cuadro emergente similar al de la edición, hacemos un cuadro de visualización; recuerde elegir el bloque de tipo "Detalle".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227807.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227352.gif)

¡Listo!

### 6.5 **Validar el control de permisos**

Si prueba a iniciar sesión con distintos usuarios y consulta los formularios, verá que los bloques de formulario muestran automáticamente las operaciones según los permisos del usuario correspondiente. Para todas las tareas de las que somos responsables se permite editar; para el resto, solo se podrá visualizar.

Cuando volvemos al rol Root recuperamos todos los permisos. ¡Esa es la potencia del control de permisos de NocoBase!

A continuación puede asignar responsables y colaborar libremente con su equipo. Vamos a añadir un nuevo miembro al equipo y a comprobar si los permisos están bien configurados.

#### 6.5.1 **Crear un usuario nuevo y asignarle un rol**

- Cree un usuario nuevo, por ejemplo **Tom**, y asígnele el rol **Compañero**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228278.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228648.gif)

- En la página de gestión de tareas, asigne varias tareas a **Tom**.

#### 6.5.2 **Probar el inicio de sesión**

Que Tom inicie sesión y compruebe si puede ver y editar las tareas asignadas. Con las reglas configuradas, Tom solo debería poder editar las tareas de las que es responsable; el resto serán de solo lectura para él.

¡Los permisos de los formularios de edición se han sincronizado con éxito en todas las páginas!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172229408.gif)

### Resumen

¡Enhorabuena! Ya sabe cómo crear roles, asignar permisos y configurar permisos personalizados en NocoBase para que cada miembro del equipo solo pueda editar sus propias tareas. Con estos pasos ha establecido un sistema de gestión de permisos claro y ordenado.

### Reto

Tom ya puede ver y editar las tareas de las que es responsable, pero quizá haya notado que **aún no puede publicar comentarios** y, por tanto, no puede interactuar dentro de las tareas. ¿Cómo asignarle permisos para que pueda comentar libremente? Es un reto interesante.

**Pista:**

Pruebe a volver a la configuración de permisos del rol "Compañero" y ajuste los permisos de tabla, por ejemplo, para que Tom tenga permiso de comentarios sin afectar a sus restricciones en otras tareas.

¡Inténtelo! Daremos la respuesta en el siguiente contenido.

En el próximo capítulo también implementaremos la función "Actividad de los miembros" e introduciremos otro módulo potente: el [**workflow**](https://docs-cn.nocobase.com/handbook/workflow). Con los workflows podrá hacer fluir los datos dinámicamente y disparar acciones para que el sistema automatice procesos tediosos. ¿Listo para seguir? ¡Nos vemos en el [Capítulo 7: Workflow](https://www.nocobase.com/cn/blog/task-tutorial-workflow)!

---

Siga explorando y dé rienda suelta a su creatividad. Si tiene dudas, no olvide consultar la [documentación oficial de NocoBase](https://docs-cn.nocobase.com/) o unirse al [foro de la comunidad NocoBase](https://forum.nocobase.com/).
