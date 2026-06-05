:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Auth

## Resumen

`Auth` es una clase abstracta para los tipos de autenticación de usuario. Define las interfaces necesarias para completar la autenticación de un usuario. Para extender un nuevo tipo de autenticación, debe heredar de la clase `Auth` e implementar sus métodos. Puede consultar una implementación básica en: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: authentication
  async check() {
    // ...
  }
}
```

## Propiedades de Instancia

### `user`

Información del usuario autenticado.

#### Firma

- `abstract user: Model`

## Métodos de Clase

### `constructor()`

Constructor, crea una instancia de `Auth`.

#### Firma

- `constructor(config: AuthConfig)`

#### Tipo

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Detalles

##### AuthConfig

| Propiedad       | Tipo                                            | Descripción                                                                                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Modelo de datos del autenticador. El tipo real en una aplicación NocoBase es [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Configuración relacionada con el autenticador.                                                               |
| `ctx`           | `Context`                                       | Contexto de la solicitud.                                                                                     |

### `check()`

Autenticación de usuario. Devuelve la información del usuario. Este es un método abstracto que todos los tipos de autenticación deben implementar.

#### Firma

- `abstract check(): Promise<Model>`

### `signIn()`

Inicio de sesión del usuario.

#### Firma

- `signIn(): Promise<any>`

### `signUp()`

Registro de usuario.

#### Firma

- `signUp(): Promise<any>`

### `signOut()`

Cierre de sesión del usuario.

#### Firma

- `signOut(): Promise<any>`