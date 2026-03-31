:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Referencia de la API

## Lado del Servidor

### Auth

API del núcleo, referencia: [Auth](/api/auth/auth)

### BaseAuth

API del núcleo, referencia: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Resumen

`AuthModel` es el modelo de datos del autenticador (`Authenticator`, consulte: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) y [Auth - constructor](/api/auth/auth#constructor)) que se utiliza en las aplicaciones de NocoBase. Proporciona métodos para interactuar con la **colección** de datos de usuario. Además, también puede utilizar los métodos que ofrece Sequelize Model.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### Métodos de Clase

- `findUser(uuid: string): UserModel` - Permite consultar un usuario a través de su `uuid`.
  - `uuid` - El identificador único del usuario para el tipo de autenticación actual.

- `newUser(uuid: string, userValues?: any): UserModel` - Crea un nuevo usuario y lo vincula al autenticador actual mediante su `uuid`.
  - `uuid` - El identificador único del usuario para el tipo de autenticación actual.
  - `userValues` - Opcional. Contiene otra información del usuario. Si no se proporciona, el `uuid` se utilizará como el apodo del usuario.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Busca o crea un nuevo usuario, siguiendo las mismas reglas de creación mencionadas anteriormente.
  - `uuid` - El identificador único del usuario para el tipo de autenticación actual.
  - `userValues` - Opcional. Otra información del usuario.

## Lado del Cliente

### `plugin.registerType()`

Permite registrar el cliente para un tipo de autenticación.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### Firma

- `registerType(authType: string, options: AuthOptions)`

#### Tipo

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### Detalles

- `SignInForm` - Formulario de inicio de sesión
- `SignInButton` - Botón de inicio de sesión (de terceros), que puede utilizarse como alternativa al formulario de inicio de sesión.
- `SignUpForm` - Formulario de registro
- `AdminSettingsForm` - Formulario de configuración de administración

### Ruta

Las rutas de frontend que registra el **plugin** de autenticación son las siguientes:

- Diseño de autenticación
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Página de inicio de sesión
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Página de registro
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`