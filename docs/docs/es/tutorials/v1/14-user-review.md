# Implementación de la revisión de registro de usuarios

Este documento ofrece dos soluciones para implementar la revisión del registro de usuarios, diseñadas para diferentes escenarios de negocio:

- **Solución 1**: adecuada para escenarios donde se necesita implementar de forma simple y rápida un flujo de revisión de registros. Esta solución utiliza la función de registro de nuevos usuarios predeterminada del sistema, asignando a todos los nuevos usuarios un rol "Invitado" sin permisos. Posteriormente, un administrador realiza manualmente la revisión y actualiza los roles desde el panel.
- **Solución 2**: adecuada para escenarios que requieren un flujo de revisión más flexible y personalizado. Mediante el diseño de una tabla de información de solicitudes específica, la configuración de un workflow de revisión y la activación del [plugin de formularios públicos](https://docs-cn.nocobase.com/handbook/public-forms), se logra una gestión integral del flujo, desde el envío de la solicitud de registro hasta la creación automática del nuevo usuario.

  ![](https://static-docs.nocobase.com/20250219144832.png)

---

## 1. Solución 1: utilizar un rol "Invitado" sin permisos

### 1.0 Escenario aplicable

Adecuado para escenarios donde los requisitos de revisión de registro son simples y se desea utilizar la función de registro nativa del sistema, con revisión manual de usuarios desde el backend.

### 1.1 Activar autenticación por contraseña y permitir el registro de usuarios

#### 1.1.1 Acceder a la página de autenticación de usuarios

Primero debemos confirmar si la función de registro de usuarios está activada. En la configuración del sistema, vaya a la página de [autenticación de usuarios](https://docs-cn.nocobase.com/handbook/auth/user); esta página gestiona todos los canales de autenticación, como "Inicio de sesión con cuenta y contraseña", [Inicio de sesión con Google](https://docs-cn.nocobase.com/handbook/auth-oidc/example/google), etc. (puede ampliarse mediante plugins).

![](https://static-docs.nocobase.com/20250208164554.png)

El interruptor de la función de registro está aquí:
![](https://static-docs.nocobase.com/20250219084856.png)

### 1.2 Configurar el rol predeterminado (clave)

#### 1.2.1 Crear el rol "Invitado"

El sistema activa la función de registro de forma predeterminada, pero el rol predeterminado puede no cumplir con los requisitos.

Por lo tanto, primero debemos crear un rol "Invitado" en la [Lista de roles] como rol predeterminado, sin ningún permiso. A todos los nuevos usuarios registrados se les asignará automáticamente este rol.

![](https://static-docs.nocobase.com/20250208163521.png)

### 1.3 Configurar la interfaz de revisión de usuarios registrados (clave)

Cambie al modo de edición y configure en el backend un bloque de tabla simple, seleccionando la tabla de usuarios para mostrarla y gestionarla.

![](https://static-docs.nocobase.com/20250208165406.png)

### 1.4 Probar el flujo de revisión y actualizar roles manualmente

- Después de registrarse, la página de los nuevos usuarios se muestra vacía de forma predeterminada.
  ![](https://static-docs.nocobase.com/20250219084449.png)
- En la interfaz de gestión, para los usuarios cuya información de solicitud sea correcta, modifique manualmente su rol al rol designado para completar la revisión.
  ![](https://static-docs.nocobase.com/20250219084702.png)

### 1.5 Configurar la página de mensaje informativo (opcional)

#### 1.5.1 Crear una página, por ejemplo "Registro exitoso", con el mensaje informativo

> **Paso opcional**: podemos añadir un mensaje amistoso en esta página en blanco, como "Su cuenta está siendo revisada, por favor espere pacientemente a que se complete la revisión", para informar al usuario de su estado actual.
> ![](https://static-docs.nocobase.com/Pasted%20image%2020250208231631.png)

#### 1.5.2 Asignar permisos de la página informativa

A continuación, vamos a la configuración de gestión de permisos de usuarios y asignamos esta página al rol "Invitado". Después del registro exitoso, el sistema redirigirá automáticamente.
![](https://static-docs.nocobase.com/20250211223123.png)

### 1.6 Ampliar campos de la tabla de usuarios (opcional)

> **Paso opcional**: si desea recopilar información adicional durante el registro para apoyar la revisión, puede añadir campos relevantes en la tabla de usuarios (por ejemplo, "Motivo de la solicitud" o "Código de invitación"). Si solo necesita una revisión básica, puede omitir este paso.

#### 1.6.1 Añadir un campo de solicitud

Acceda a la [Tabla de usuarios] y añada un campo nuevo para registrar el motivo de la solicitud o el código de invitación que el usuario rellena al registrarse.
![](https://static-docs.nocobase.com/20250208164321.png)

#### 1.6.2 Activar el campo en "Autenticación de usuarios"

![](https://static-docs.nocobase.com/Pasted%20image%2020250219090248.png)

Una vez configurado, vaya a la página de inicio de sesión, haga clic en [Registrar cuenta] y verá los campos correspondientes en el formulario de registro (si están configurados como opciones, se mostrarán; en caso contrario se mostrará el formulario básico).
![](https://static-docs.nocobase.com/20250219090447.png)

#### 1.6.3 Añadir los campos correspondientes a la página de revisión

Añadiremos también estos dos campos en la página de revisión, para poder revisar y modificar los roles de usuario en tiempo real.

![](https://static-docs.nocobase.com/20250208165622.png)

---

## 2. Solución 2: no abrir el canal de registro y añadir una tabla intermedia de revisión

### 2.0 Escenario aplicable

Adecuado para escenarios que requieren un flujo de revisión de registro más flexible y personalizado.

Esta solución, mediante una tabla de información de solicitudes independiente, la configuración de workflow y el [plugin de formularios públicos](https://docs-cn.nocobase.com/handbook/public-forms), implementa el flujo completo, desde el envío de la solicitud de registro hasta la creación automática del usuario. Los pasos principales aseguran la funcionalidad básica, y posteriormente se pueden añadir más funciones según las necesidades.

### 2.1 Preparativos previos (clave)

#### 2.1.1 Diseñar la tabla de información de solicitudes

##### 2.1.1.1 Crear una tabla "Información de solicitud"

- **Crear la tabla**
  Cree una nueva tabla en el backend de NocoBase para almacenar la información de las solicitudes de registro de usuarios.
- **Configurar los campos**
  Añada los siguientes campos a la tabla y asegúrese de que los tipos y descripciones de los campos sean correctos:


  | Field display name     | Field name         | Field interface  | Description                                                                            |
  | ---------------------- | ------------------ | ---------------- | -------------------------------------------------------------------------------------- |
  | **ID**                 | id                 | Integer          | Generado automáticamente por el sistema, identifica unívocamente el registro            |
  | **Username**           | username           | Single line text | Nombre de usuario del solicitante                                                       |
  | **Email**              | email              | Email            | Dirección de correo electrónico del solicitante                                         |
  | **Phone**              | phone              | Phone            | Teléfono de contacto del solicitante                                                    |
  | **Full Name**          | full_name          | Single line text | Nombre completo del solicitante                                                         |
  | **Application Reason** | application_reason | Long text        | Motivo o explicación de la solicitud                                                    |
  | **User Type**          | user_type          | Single select    | Tipo de usuario futuro (por ejemplo, registro por correo, registro abierto)             |
  | **Status**             | status             | Single select    | Estado actual de la solicitud (por ejemplo: Pendiente, Aprobada, Rechazada)             |
  | **Initial Password**   | initial_password   | Single line text | Contraseña inicial del nuevo usuario (por defecto nocobase)                             |
  | **Created at**         | createdAt          | Created at       | Fecha de creación registrada por el sistema                                             |
  | **Created by**         | createdBy          | Created by       | Creador registrado por el sistema                                                       |
  | **Last updated at**    | updatedAt          | Last updated at  | Última fecha de actualización registrada por el sistema                                 |
  | **Last updated by**    | updatedBy          | Last updated by  | Última persona que actualizó el registro                                                |
- **Vista previa de la estructura de la tabla**
  Confirme la configuración correcta de la tabla con la siguiente imagen:
  ![](https://static-docs.nocobase.com/20250208145543.png)

##### 2.1.1.2 Introducción de datos y visualización

- **Configurar la interfaz de revisión**
  Configure en la interfaz principal una pantalla de gestión "Revisión de información de registro" para mostrar las solicitudes enviadas por los usuarios.
- **Introducir datos de prueba**
  Acceda a la interfaz de gestión e introduzca datos de prueba, asegurándose de que se muestran correctamente.
  ![](https://static-docs.nocobase.com/20250208151429.png)

### 2.2 Configuración del workflow

Esta sección explica cómo configurar el workflow para crear automáticamente nuevos usuarios tras la aprobación.

#### 2.2.1 Crear el workflow de revisión

##### 2.2.1.1 Crear un nuevo workflow

- **Acceder a la pantalla de workflow**
  En el backend de NocoBase, vaya a la página de configuración de workflow y elija "Crear workflow".
- **Seleccionar el evento disparador**
  Puede elegir [«Evento posterior a la operación»](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action) o [«Evento previo a la operación»](https://docs-cn.nocobase.com/handbook/workflow/triggers/pre-action); aquí utilizaremos el evento previo a la operación como ejemplo.
- **Configurar los nodos del workflow**
  Cree un nodo "Crear usuario" que convierta los datos del formulario actual en datos de un nuevo usuario y configure el mapeo de campos y la lógica de procesamiento.
  Imagen de referencia:
  ![](https://static-docs.nocobase.com/20250208153202.png)

#### 2.2.2 Configurar los botones de revisión del formulario

##### 2.2.2.1 Añadir los botones "Aprobar" y "Rechazar"

Añada respectivamente dos botones, "Aprobar revisión" y "Rechazar revisión", en el formulario de información de solicitud.
![](https://static-docs.nocobase.com/20250208153302.png)

##### 2.2.2.2 Configurar las funciones de los botones

- **Configurar el botón "Aprobar revisión"**
  - Vincúlelo al workflow recién creado.
  - Al enviar, establezca el valor del campo [Estado] como "Aprobada".
    Imagen de referencia:
    ![](https://static-docs.nocobase.com/20250208153429.png)
    ![](https://static-docs.nocobase.com/20250208153409.png)
- **Configurar el botón "Rechazar revisión"**
  - Al enviar, establezca el valor del campo [Estado] como "Rechazada".

##### 2.2.2.3 Configurar las reglas de enlace de los botones

Para evitar operaciones repetidas, configure una regla de enlace: cuando [Estado] no sea [Pendiente], oculte los botones.
Imagen de referencia:
![](https://static-docs.nocobase.com/20250208153749.png)

### 2.3 Activar y configurar el plugin de formularios públicos

Mediante el [plugin de formularios públicos](https://docs-cn.nocobase.com/handbook/public-forms) los usuarios podrán enviar solicitudes de registro a través de una página.

#### 2.3.1 Activar el plugin de formularios públicos

##### 2.3.1.1 Operaciones de activación

- **Acceder a la gestión de plugins**
  En la pantalla de gestión del backend, busque y active el plugin "Formularios públicos".
  Imagen de referencia:
  ![](https://static-docs.nocobase.com/20250208154258.png)

#### 2.3.2 Crear y configurar un formulario público

##### 2.3.2.1 Crear el formulario público

- **Crear un formulario nuevo**
  En la gestión del backend, cree un formulario público para el envío de solicitudes de registro.
- **Configurar los elementos del formulario**
  Añada los elementos necesarios (nombre de usuario, correo electrónico, teléfono de contacto, etc.) y configure las reglas de validación correspondientes.
  Imagen de referencia:
  ![](https://static-docs.nocobase.com/20250208155044.png)

#### 2.3.3 Activar y configurar el plugin de formularios públicos (clave)

##### 2.3.3.1 Probar el formulario público

- **Abrir la página**
  Acceda a la página del formulario público, rellene y envíe los datos de la solicitud.
- **Verificar la funcionalidad**
  Compruebe si los datos llegan correctamente a la tabla de información de solicitudes y, tras la aprobación del workflow, se crea automáticamente el nuevo usuario.
  Resultado de la prueba como referencia:
  ![](https://static-docs.nocobase.com/202502191351-register2.gif)

### 2.4 Ampliaciones posteriores (pasos opcionales)

Tras completar el flujo básico de registro y revisión, podemos ampliar otras funciones según las necesidades:

#### 2.4.1 Registro mediante código de invitación

- **Descripción**: limitar el alcance y la cantidad de usuarios registrados mediante un código de invitación.
- **Idea de configuración**: añadir un campo de código de invitación a la tabla de solicitudes y, mediante un "Evento previo a la operación", validar e interceptar este campo antes del envío.

#### 2.4.2 Notificaciones automáticas por correo

- **Descripción**: enviar automáticamente notificaciones por correo sobre el resultado de la revisión, registro exitoso, etc.
- **Idea de configuración**: combinar el nodo de correo de NocoBase y añadir una operación de envío de correo dentro del workflow.

---

Si encuentra algún problema durante el proceso, le invitamos a participar en la [Comunidad de NocoBase](https://forum.nocobase.com) o consultar la [documentación oficial](https://docs-cn.nocobase.com). Esperamos que esta guía le ayude a implementar con éxito la revisión de registro de usuarios según sus necesidades reales y a ampliarla con flexibilidad. ¡Le deseamos éxito en su uso y en su proyecto!
