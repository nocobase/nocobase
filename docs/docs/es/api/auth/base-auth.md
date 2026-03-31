:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# BaseAuth

## Descripción general

`BaseAuth` hereda de la clase abstracta [Auth](./auth) y es la implementación base para los tipos de autenticación de usuario, utilizando JWT como método de autenticación. En la mayoría de los casos, usted puede extender los tipos de autenticación de usuario heredando de `BaseAuth`, y no es necesario heredar directamente de la clase abstracta `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Establezca la colección de usuarios
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Lógica de autenticación de usuario, invocada por `auth.signIn`
  // Devuelve los datos del usuario
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Métodos de clase

### `constructor()`

Constructor, crea una instancia de `BaseAuth`.

#### Firma

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Detalles

| Parámetro        | Tipo         | Descripción                                                                                                |
| :--------------- | :----------- | :--------------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Consulte [Auth - AuthConfig](./auth#authconfig)                                                            |
| `userCollection` | `Collection` | Colección de usuarios, por ejemplo: `db.getCollection('users')`. Consulte [DataBase - Collection](../database/collection) |

### `user()`

Accesor, establece y obtiene la información del usuario. Por defecto, utiliza el objeto `ctx.state.currentUser` para el acceso.

#### Firma

- `set user()`
- `get user()`

### `check()`

Autentica a través del token de la solicitud y devuelve la información del usuario.

### `signIn()`

Inicia sesión de usuario, genera un token.

### `signUp()`

Registra un nuevo usuario.

### `signOut()`

Cierra la sesión del usuario, el token expira.

### `validate()` \*

Lógica de autenticación central, invocada por la interfaz `signIn`, para determinar si el usuario puede iniciar sesión con éxito.