:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Guía de Seguridad de NocoBase

NocoBase se enfoca en la seguridad de los datos y las aplicaciones desde el diseño funcional hasta la implementación del sistema. La plataforma incorpora múltiples funciones de seguridad, como autenticación de usuarios, control de acceso y cifrado de datos. Además, permite configurar políticas de seguridad de forma flexible según sus necesidades. Ya sea para proteger datos de usuarios, gestionar permisos de acceso o aislar entornos de desarrollo y producción, NocoBase ofrece herramientas y soluciones prácticas. Esta guía tiene como objetivo proporcionarle orientación para usar NocoBase de forma segura, ayudándole a proteger sus datos, aplicaciones y entorno. Así, garantizará un uso eficiente de las funciones del sistema bajo un marco de seguridad.

## Autenticación de Usuarios

La autenticación de usuarios se utiliza para identificar su identidad, evitar el acceso no autorizado al sistema y asegurar que su identidad no sea utilizada indebidamente.

### Clave del Token

Por defecto, NocoBase utiliza JWT (JSON Web Token) para la autenticación de las API del lado del servidor. Usted puede establecer la clave del Token a través de la variable de entorno del sistema `APP_KEY`. Por favor, gestione adecuadamente la clave del Token de su aplicación para evitar filtraciones externas. Es importante tener en cuenta que si se modifica `APP_KEY`, los Tokens antiguos dejarán de ser válidos.

### Política de Tokens

NocoBase permite configurar las siguientes políticas de seguridad para los Tokens de usuario:

| Configuración | Descripción |
|---|---|
| Validez de la sesión | El tiempo máximo de validez para cada inicio de sesión del usuario. Durante la validez de la sesión, el Token se actualizará automáticamente. Una vez superado este tiempo, se le pedirá al usuario que inicie sesión nuevamente. |
| Validez del Token | El período de validez de cada Token de API emitido. Después de que el Token caduque, si aún está dentro del período de validez de la sesión y no ha excedido el límite de tiempo de actualización, el servidor emitirá automáticamente un nuevo Token para mantener la sesión del usuario. De lo contrario, se le pedirá al usuario que inicie sesión nuevamente. (Cada Token solo puede ser actualizado una vez) |
| Límite de tiempo para la actualización de Tokens caducados | El tiempo máximo permitido para actualizar un Token después de su caducidad. |

Normalmente, recomendamos a los administradores:

- Establecer un período de validez del Token más corto para limitar su tiempo de exposición.
- Configurar un período de validez de la sesión razonable, más largo que el del Token pero no excesivamente extenso, para equilibrar la experiencia del usuario y la seguridad. Aproveche el mecanismo de actualización automática del Token para asegurar que las sesiones de los usuarios activos no se interrumpan, reduciendo al mismo tiempo el riesgo de abuso de sesiones a largo plazo.
- Definir un límite de tiempo razonable para la actualización de Tokens caducados, de modo que el Token expire naturalmente si el usuario permanece inactivo durante mucho tiempo sin que se emita un nuevo Token, disminuyendo así el riesgo de abuso de sesiones de usuario inactivas.

### Almacenamiento del Token en el Cliente

Por defecto, los Tokens de usuario se almacenan en el LocalStorage del navegador. Si cierra la página del navegador y la vuelve a abrir, y el Token sigue siendo válido, no necesitará iniciar sesión de nuevo.

Si desea que los usuarios inicien sesión cada vez que acceden a una página, puede configurar la variable de entorno `API_CLIENT_STORAGE_TYPE=sessionStorage`. Esto guardará el Token de usuario en el SessionStorage del navegador, logrando que los usuarios deban iniciar sesión cada vez que abran la página.

### Política de Contraseñas

> Edición Profesional y superiores

NocoBase permite establecer reglas de contraseña y políticas de bloqueo por intentos de inicio de sesión para todos los usuarios, mejorando así la seguridad de las aplicaciones NocoBase que tienen habilitado el inicio de sesión con contraseña. Puede consultar la [Política de Contraseñas](./password-policy/index.md) para comprender cada elemento de configuración.

#### Reglas de Contraseña

| Configuración | Descripción |
|---|---|
| **Longitud de la contraseña** | Requisito de longitud mínima de la contraseña. La longitud máxima es de 64 caracteres. |
| **Complejidad de la contraseña** | Establece los requisitos de complejidad de la contraseña, especificando los tipos de caracteres que debe incluir. |
| **No incluir el nombre de usuario en la contraseña** | Define si la contraseña puede contener el nombre de usuario actual. |
| **Recordar historial de contraseñas** | Recuerda el número de contraseñas utilizadas recientemente por el usuario. El usuario no podrá reutilizarlas al cambiar su contraseña. |

#### Configuración de Caducidad de Contraseña

| Configuración | Descripción |
|---|---|
| **Período de validez de la contraseña** | El período de validez de las contraseñas de usuario. Los usuarios deben cambiar su contraseña antes de que caduque para que se recalcule el período de validez. Si no la cambian antes de la fecha de caducidad, no podrán iniciar sesión con la contraseña antigua y necesitarán la asistencia de un administrador para restablecerla.<br>Si hay otras formas de inicio de sesión configuradas, el usuario podrá utilizarlas. |
| **Canal de notificación de caducidad de contraseña** | Dentro de los 10 días previos a la caducidad de la contraseña del usuario, se enviará un recordatorio cada vez que el usuario inicie sesión. |

#### Seguridad de Inicio de Sesión con Contraseña

| Configuración | Descripción |
|---|---|
| **Número máximo de intentos de inicio de sesión con contraseña inválida** | Establece el número máximo de intentos de inicio de sesión que un usuario puede realizar dentro de un intervalo de tiempo especificado. |
| **Intervalo de tiempo máximo para intentos de inicio de sesión inválidos (segundos)** | Establece el intervalo de tiempo, en segundos, para calcular el número máximo de intentos de inicio de sesión inválidos de un usuario. |
| **Tiempo de bloqueo (segundos)** | Establece el tiempo durante el cual se bloqueará al usuario una vez que exceda el límite de intentos de inicio de sesión con contraseña inválida (0 significa sin límite).<br>Durante el período de bloqueo, se le prohibirá al usuario acceder al sistema por cualquier método de autenticación, incluyendo las API keys. |

Normalmente, le recomendamos:

- Establecer reglas de contraseña robustas para reducir el riesgo de que las contraseñas sean adivinadas por asociación o mediante ataques de fuerza bruta.
- Configurar un período de validez de la contraseña razonable para obligar a los usuarios a cambiar sus contraseñas regularmente.
- Combinar la configuración del número de intentos de inicio de sesión inválidos y el tiempo para limitar los intentos de inicio de sesión de alta frecuencia en un corto período, previniendo así los ataques de fuerza bruta.
- Si los requisitos de seguridad son estrictos, puede establecer un tiempo de bloqueo razonable para el usuario después de exceder el límite de inicio de sesión. Sin embargo, tenga en cuenta que la configuración del tiempo de bloqueo podría ser utilizada maliciosamente; los atacantes podrían introducir intencionadamente contraseñas incorrectas varias veces para una cuenta objetivo, forzando su bloqueo e impidiendo su uso normal. En la práctica, puede combinar restricciones de IP, límites de frecuencia de API y otras medidas para prevenir este tipo de ataques.
- Cambiar el nombre de usuario, correo electrónico y contraseña predeterminados del usuario `root` de NocoBase para evitar su explotación maliciosa.
- Dado que tanto la caducidad de la contraseña como el bloqueo de la cuenta impedirán el acceso al sistema, incluidas las cuentas de administrador, se recomienda configurar múltiples cuentas en el sistema con permisos para restablecer contraseñas y desbloquear usuarios.

![](https://static-docs.nocobase.com/202501031618900.png)

### Bloqueo de Usuarios

> Edición Profesional y superiores, incluido en el **plugin** de política de contraseñas

Gestione a los usuarios que han sido bloqueados por exceder el límite de intentos de inicio de sesión con contraseña inválida. Puede desbloquearlos activamente o añadir usuarios anómalos a la lista de bloqueo. Una vez que un usuario está bloqueado, se le prohibirá el acceso al sistema por cualquier método de autenticación, incluyendo las API keys.

![](https://static-docs.nocobase.com/202501031618399.png)

### API Keys

NocoBase permite llamar a las API del sistema mediante API keys. Usted puede añadir API keys en la configuración del **plugin** de API keys.

- Por favor, asigne el rol correcto a la API key y asegúrese de que los permisos asociados a dicho rol estén configurados adecuadamente.
- Evite que las API keys se filtren durante su uso.
- En general, le recomendamos que establezca un período de validez para las API keys y evite usar la opción "Nunca caduca".
- Si detecta un uso anómalo de una API key, lo que podría indicar un riesgo de filtración, puede eliminar la API key correspondiente para invalidarla.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Inicio de Sesión Único (Single Sign-On - SSO)

> **Plugin** Comercial

NocoBase ofrece una amplia gama de **plugins** de autenticación SSO, compatibles con múltiples protocolos principales como OIDC, SAML 2.0, LDAP y CAS. Asimismo, NocoBase cuenta con un conjunto completo de interfaces de extensión para métodos de autenticación, lo que permite un desarrollo e integración rápidos de otros tipos de autenticación. Puede conectar fácilmente su IdP existente con NocoBase para gestionar de forma centralizada las identidades de usuario en el IdP y mejorar la seguridad.
![](https://static-docs.nocobase.com/202501031619427.png)

### Autenticación de Doble Factor (Two-factor authentication)

> Edición Empresarial

La autenticación de doble factor requiere que los usuarios, al iniciar sesión con contraseña, proporcionen una segunda pieza de información válida para verificar su identidad. Por ejemplo, se puede enviar un código de verificación dinámico de un solo uso a un dispositivo de confianza del usuario para confirmar su identidad, asegurando que esta no sea utilizada indebidamente y reduciendo el riesgo de filtración de contraseñas.

### Control de Acceso por IP

> Edición Empresarial

NocoBase permite configurar listas negras o listas blancas para las IP de acceso de los usuarios.

- En entornos con requisitos de seguridad estrictos, puede configurar una lista blanca de IP para permitir el acceso al sistema únicamente a IP o rangos de IP específicos, restringiendo así las conexiones de red externas no autorizadas y reduciendo los riesgos de seguridad desde el origen.
- En condiciones de acceso a la red pública, si el administrador detecta un acceso anómalo, puede establecer una lista negra de IP para bloquear direcciones IP maliciosas conocidas o accesos de fuentes sospechosas, disminuyendo amenazas de seguridad como escaneos maliciosos o ataques de fuerza bruta.
- Se mantienen registros de las solicitudes de acceso rechazadas.

## Control de Permisos

Al establecer diferentes roles en el sistema y asignarles los permisos correspondientes, se puede controlar de forma granular el acceso de los usuarios a los recursos. Los administradores deben configurar estos permisos de manera razonable, según las necesidades del escenario real, para reducir el riesgo de filtración de recursos del sistema.

### Usuario Root

Cuando NocoBase se instala por primera vez, la aplicación inicializa un usuario `root`. Se recomienda que los usuarios modifiquen la información relacionada con el usuario `root` mediante la configuración de variables de entorno del sistema para evitar su explotación maliciosa.

- `INIT_ROOT_USERNAME` - Nombre de usuario root
- `INIT_ROOT_EMAIL` - Correo electrónico del usuario root
- `INIT_ROOT_PASSWORD` - Contraseña del usuario root; por favor, establezca una contraseña de alta seguridad.

Durante el uso posterior del sistema, se recomienda que los usuarios configuren y utilicen otras cuentas de administrador, y que eviten en la medida de lo posible operar la aplicación directamente con el usuario `root`.

### Roles y Permisos

NocoBase controla los permisos de los usuarios para acceder a los recursos mediante la configuración de roles en el sistema, la asignación de autorizaciones a diferentes roles y la vinculación de usuarios a los roles correspondientes. Cada usuario puede tener múltiples roles y puede cambiar entre ellos para operar los recursos desde diferentes perspectivas. Si se instala el **plugin** de departamentos, también se pueden vincular roles y departamentos, de modo que los usuarios hereden los roles asignados a su departamento.

![](https://static-docs.nocobase.com/202501031620965.png)

### Permisos de Configuración del Sistema

Los permisos de configuración del sistema incluyen los siguientes ajustes:

- Si se permite la interfaz de configuración
- Si se permite instalar, habilitar y deshabilitar **plugins**
- Si se permite configurar **plugins**
- Si se permite borrar la caché y reiniciar la aplicación
- Permisos de configuración para cada **plugin**

### Permisos de Menú

Los permisos de menú se utilizan para controlar el acceso de los usuarios a las diferentes páginas del menú, tanto en la versión de escritorio como en la móvil.
![](https://static-docs.nocobase.com/202501031620717.png)

### Permisos de Datos

NocoBase ofrece un control granular sobre los permisos de acceso de los usuarios a los datos del sistema, asegurando que cada usuario solo pueda acceder a la información relevante para sus responsabilidades, previniendo así el acceso no autorizado y la filtración de datos.

#### Control Global

![](https://static-docs.nocobase.com/202501031620866.png)

#### Control a Nivel de Tabla y Campo

![](https://static-docs.nocobase.com/202501031621047.png)

#### Control de Alcance de Datos

Establezca el alcance de los datos que los usuarios pueden operar. Tenga en cuenta que el alcance de los datos aquí es diferente del configurado en el bloque; el alcance de datos configurado en el bloque se utiliza generalmente solo para el filtrado de datos en el frontend. Si necesita controlar estrictamente los permisos de acceso de los usuarios a los recursos de datos, deberá configurarlos aquí, ya que serán controlados por el servidor.

![](https://static-docs.nocobase.com/202501031621712.png)

## Seguridad de los Datos

Durante el proceso de almacenamiento y copia de seguridad de los datos, NocoBase proporciona mecanismos eficaces para garantizar su seguridad.

### Almacenamiento de Contraseñas

Las contraseñas de los usuarios de NocoBase se almacenan cifradas utilizando el algoritmo scrypt, lo que permite resistir eficazmente los ataques de hardware a gran escala.

### Variables de Entorno y Claves

Al utilizar servicios de terceros en NocoBase, le recomendamos que configure la información de las claves de terceros en variables de entorno y las almacene cifradas. Esto facilita su configuración y uso en diferentes lugares, a la vez que mejora la seguridad. Puede consultar la documentación para conocer los métodos de uso detallados.

:::warning
Por defecto, la clave se cifra utilizando el algoritmo AES-256-CBC. NocoBase generará automáticamente una clave de cifrado de 32 bits y la guardará en `storage/.data/environment/aes_key.dat`. Los usuarios deben custodiar adecuadamente el archivo de la clave para evitar que sea robado. Si necesita migrar datos, el archivo de la clave debe migrarse junto con ellos.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Almacenamiento de Archivos

Si necesita almacenar archivos sensibles, se recomienda utilizar un servicio de almacenamiento en la nube compatible con el protocolo S3 y, en combinación con el **plugin** comercial 'File storage: S3 (Pro)', implementar la lectura y escritura privada de archivos. Si necesita usarlo en un entorno de red interna, se sugiere emplear aplicaciones de almacenamiento que soporten despliegue privado y sean compatibles con el protocolo S3, como MinIO.

![](https://static-docs.nocobase.com/202501031623549.png)

### Copia de Seguridad de la Aplicación

Para garantizar la seguridad de los datos de la aplicación y evitar su pérdida, le recomendamos que realice copias de seguridad de la base de datos regularmente.

Los usuarios de la edición de código abierto pueden consultar https://www.nocobase.com/en/blog/nocobase-backup-restore para realizar copias de seguridad utilizando herramientas de base de datos. Asimismo, le recomendamos que custodie adecuadamente los archivos de copia de seguridad para evitar filtraciones de datos.

Los usuarios de la Edición Profesional y superiores pueden utilizar el gestor de copias de seguridad para realizarlas. El gestor de copias de seguridad ofrece las siguientes características:

- Copias de seguridad automáticas programadas: Realiza copias de seguridad automáticas periódicas, lo que ahorra tiempo y operaciones manuales, y garantiza una mayor seguridad de los datos.
- Sincronización de archivos de copia de seguridad con almacenamiento en la nube: Aísla los archivos de copia de seguridad del propio servicio de la aplicación, evitando la pérdida de estos archivos si el servicio deja de estar disponible debido a un fallo del servidor.
- Cifrado de archivos de copia de seguridad: Permite establecer una contraseña para los archivos de copia de seguridad, reduciendo el riesgo de filtración de datos en caso de que los archivos de copia de seguridad sean comprometidos.

![](https://static-docs.nocobase.com/202501031623107.png)

## Seguridad del Entorno de Ejecución

Desplegar NocoBase correctamente y garantizar la seguridad del entorno de ejecución es una de las claves para asegurar la seguridad de las aplicaciones NocoBase.

### Despliegue HTTPS

Para prevenir ataques de intermediario (man-in-the-middle), le recomendamos que añada un certificado SSL/TLS a su sitio de aplicación NocoBase para garantizar la seguridad de los datos durante la transmisión en red.

### Cifrado de Transporte de API

> Edición Empresarial

En entornos con requisitos de seguridad de datos más estrictos, NocoBase permite habilitar el cifrado de transporte de API para encriptar el contenido de las solicitudes y respuestas de la API, evitando la transmisión en texto claro y elevando el umbral para la descifrado de datos.

### Despliegue Privado

Por defecto, NocoBase no necesita comunicarse con servicios de terceros, y el equipo de NocoBase no recopila ninguna información del usuario. Solo es necesario conectarse al servidor de NocoBase al realizar las siguientes dos operaciones:

1. Descargar automáticamente **plugins** comerciales a través de la plataforma NocoBase Service.
2. Verificación de identidad y activación en línea de aplicaciones de la edición comercial.

Si está dispuesto a sacrificar cierto grado de comodidad, estas dos operaciones también pueden completarse sin conexión, sin necesidad de conectarse directamente al servidor de NocoBase.

NocoBase soporta un despliegue completo en la intranet. Consulte:

- https://www.nocobase.com/en/blog/load-docker-image
- [Subir **plugins** al directorio de **plugins** para instalar y actualizar](/get-started/install-upgrade-plugins#plugins-de-terceros)

### Aislamiento de Múltiples Entornos

> Edición Profesional y superiores

En la práctica, recomendamos a los usuarios empresariales aislar los entornos de prueba y producción para garantizar la seguridad de los datos de la aplicación y del entorno de ejecución en producción. Utilizando el **plugin** de gestión de migraciones, es posible trasladar datos de la aplicación entre diferentes entornos.

![](https://static-docs.nocobase.com/202501031627729.png)

## Auditoría y Monitoreo

### Registros de Auditoría

> Edición Empresarial

La función de registros de auditoría de NocoBase documenta las actividades de los usuarios dentro del sistema. Al registrar las operaciones clave y los comportamientos de acceso de los usuarios, los administradores pueden:

- Revisar la información de acceso de los usuarios, como IP, dispositivo y hora de operación, para detectar comportamientos anómalos a tiempo.
- Rastrear el historial de operaciones de los recursos de datos dentro del sistema.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Registros de la Aplicación

NocoBase ofrece varios tipos de registros para ayudar a los usuarios a comprender el estado de funcionamiento del sistema y los registros de comportamiento, permitiendo identificar y localizar problemas del sistema de manera oportuna, y garantizando la seguridad y controlabilidad del sistema desde diferentes dimensiones. Los principales tipos de registros incluyen:

- Registro de solicitudes: Registros de solicitudes de API, que incluyen la URL accedida, el método HTTP, los parámetros de la solicitud, los tiempos de respuesta y los códigos de estado, entre otra información.
- Registro del sistema: Registra eventos de ejecución de la aplicación, como el inicio del servicio, cambios de configuración, mensajes de error y operaciones clave.
- Registro SQL: Registra las sentencias de operación de la base de datos y sus tiempos de ejecución, cubriendo acciones como consultas, actualizaciones, inserciones y eliminaciones.
- Registro de **flujo de trabajo**: Registros de ejecución del **flujo de trabajo**, que incluyen el tiempo de ejecución, información de funcionamiento y mensajes de error.