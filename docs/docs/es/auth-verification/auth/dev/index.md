:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Extender Tipos de Autenticación

## Resumen

NocoBase le permite extender los tipos de autenticación de usuario según sus necesidades. Generalmente, la autenticación de usuario se divide en dos categorías: una donde la identidad del usuario se verifica dentro de la propia aplicación NocoBase (por ejemplo, inicio de sesión con contraseña o SMS); y otra donde un servicio de terceros verifica la identidad y notifica el resultado a la aplicación NocoBase a través de una devolución de llamada (como OIDC, SAML, entre otros). A continuación, se describe el proceso de autenticación para estos dos tipos en NocoBase:

### Sin devoluciones de llamada de terceros

1. El cliente utiliza el SDK de NocoBase para llamar a la interfaz de inicio de sesión `api.auth.signIn()`, solicitando la interfaz `auth:signIn`. Al mismo tiempo, el identificador del autenticador actual se envía al backend a través del encabezado de la solicitud `X-Authenticator`.
2. La interfaz `auth:signIn` reenvía la solicitud al tipo de autenticación correspondiente, basándose en el identificador del autenticador en el encabezado. El método `validate` de la clase de autenticación registrada para ese tipo se encarga de procesar la lógica.
3. El cliente obtiene la información del usuario y el `token` de autenticación de la respuesta de la interfaz `auth:signIn`, guarda el `token` en el almacenamiento local (Local Storage) y completa el inicio de sesión. Este paso es gestionado automáticamente por el SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Con devoluciones de llamada de terceros

1. El cliente obtiene la URL de inicio de sesión de terceros a través de una interfaz registrada (por ejemplo, `auth:getAuthUrl`), y envía información como el nombre de la aplicación y el identificador del autenticador según el protocolo.
2. Se redirige a la URL de terceros para completar el inicio de sesión. El servicio de terceros llama a la interfaz de devolución de llamada de la aplicación NocoBase (que usted debe registrar, por ejemplo, `auth:redirect`), devuelve el resultado de la autenticación y, al mismo tiempo, el nombre de la aplicación y el identificador del autenticador.
3. El método de la interfaz de devolución de llamada analiza los parámetros para obtener el identificador del autenticador, obtiene la clase de autenticación correspondiente a través de `AuthManager` y llama activamente al método `auth.signIn()`. El método `auth.signIn()` a su vez invocará el método `validate()` para gestionar la lógica de autenticación.
4. Una vez que el método de devolución de llamada obtiene el `token` de autenticación, redirige (con un código 302) a la página de frontend, incluyendo el `token` y el identificador del autenticador en los parámetros de la URL, por ejemplo, `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

A continuación, le mostraremos cómo registrar interfaces del lado del servidor y de la interfaz de usuario del cliente.

## Servidor

### Interfaz de Autenticación

El núcleo de NocoBase ofrece la capacidad de registrar y gestionar tipos de autenticación extendidos. Para implementar la lógica central de un **plugin** de inicio de sesión extendido, es necesario heredar de la clase abstracta `Auth` del núcleo e implementar sus interfaces estándar.
Para una referencia completa de la API, consulte [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

El núcleo también registra operaciones básicas de recursos relacionadas con la autenticación de usuarios.

| API            | Descripción                            |
| -------------- | -------------------------------------- |
| `auth:check`   | Verifica si el usuario ha iniciado sesión |
| `auth:signIn`  | Iniciar sesión                         |
| `auth:signUp`  | Registrarse                            |
| `auth:signOut` | Cerrar sesión                          |

En la mayoría de los casos, los tipos de autenticación de usuario extendidos pueden aprovechar la lógica de autenticación JWT existente para generar credenciales de acceso a la API. La clase `BaseAuth` del núcleo proporciona una implementación básica de la clase abstracta `Auth`. Consulte [BaseAuth](../../../api/auth/base-auth.md). Los **plugins** pueden heredar directamente de la clase `BaseAuth` para reutilizar parte del código lógico y reducir los costos de desarrollo.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Establecer la colección de usuarios
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implementar la lógica de autenticación de usuario
  async validate() {}
}
```

### Datos de Usuario

Al implementar la lógica de autenticación de usuario, generalmente se requiere el manejo de datos de usuario. En una aplicación NocoBase, las **colecciones** relacionadas se definen por defecto de la siguiente manera:

| Colección             | Descripción                                                                                                          | Plugin                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `users`               | Almacena información del usuario, como correo electrónico, nombre de usuario y contraseña                             | [Plugin de usuario (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Almacena información del autenticador (entidad de tipo de autenticación), correspondiente al tipo de autenticación y su configuración | Plugin de autenticación de usuario (`@nocobase/plugin-auth`)              |
| `usersAuthenticators` | Asocia usuarios y autenticadores, guarda la información del usuario bajo el autenticador correspondiente                    | Plugin de autenticación de usuario (`@nocobase/plugin-auth`)              |

En general, los métodos de inicio de sesión extendidos pueden utilizar las **colecciones** `users` y `usersAuthenticators` para almacenar los datos de usuario correspondientes. Solo en casos especiales necesitará añadir una nueva **colección**.

Los campos principales de `usersAuthenticators` son:

| Campo           | Descripción                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `uuid`          | Identificador único del usuario para este tipo de autenticación, como un número de teléfono o un ID de usuario de un servicio de terceros (por ejemplo, WeChat openid) |
| `meta`          | Campo JSON, otra información a guardar                                                                             |
| `userId`        | ID de usuario                                                                                                      |
| `authenticator` | Nombre del autenticador (identificador único)                                                                      |

Para las operaciones de consulta y creación de usuarios, el modelo de datos `AuthModel` de `authenticators` también encapsula varios métodos que pueden utilizarse en la clase `CustomAuth` a través de `this.authenticator[nombreDelMetodo]`. Para la API completa, consulte [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Consultar usuario
    this.authenticator.newUser(); // Crear nuevo usuario
    this.authenticator.findOrCreateUser(); // Consultar o crear nuevo usuario
    // ...
  }
}
```

### Registro de Tipos de Autenticación

El método de autenticación extendido debe registrarse en el módulo de gestión de autenticación.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Cliente

La interfaz de usuario del cliente se registra a través de la interfaz `registerType` proporcionada por el cliente del **plugin** de autenticación de usuario:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Formulario de inicio de sesión
        SignInButton, // Botón de inicio de sesión (terceros), puede ser una alternativa al formulario de inicio de sesión
        SignUpForm, // Formulario de registro
        AdminSettingsForm, // Formulario de configuración de administración
      },
    });
  }
}
```

### Formulario de Inicio de Sesión

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Si varios autenticadores correspondientes a diferentes tipos de autenticación han registrado formularios de inicio de sesión, estos se mostrarán en forma de pestañas (Tabs). El título de cada pestaña será el título del autenticador configurado en el backend.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Botón de Inicio de Sesión

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Generalmente se utiliza para botones de inicio de sesión de terceros, pero en realidad puede ser cualquier componente.

### Formulario de Registro

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Si necesita saltar de la página de inicio de sesión a la página de registro, deberá gestionarlo usted mismo dentro del componente de inicio de sesión.

### Formulario de Configuración de Administración

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

La parte superior muestra la configuración genérica del autenticador, y la inferior es la sección del formulario donde puede registrar configuraciones personalizadas.

### Solicitudes a la API

Para iniciar solicitudes relacionadas con la autenticación de usuarios desde el lado del cliente, puede utilizar el SDK proporcionado por NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// Usar en un componente
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Para referencias detalladas de la API, consulte [@nocobase/sdk - Auth](/api/sdk/auth).