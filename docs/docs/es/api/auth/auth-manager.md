:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# AuthManager

## Descripción general

`AuthManager` es el módulo de gestión de autenticación de usuarios en NocoBase. Su función principal es registrar diferentes tipos de autenticación de usuarios.

### Uso básico

```ts
const authManager = new AuthManager({
  // Se utiliza para obtener el identificador del autenticador actual del encabezado de la solicitud.
  authKey: 'X-Authenticator',
});

// Establece los métodos para que AuthManager almacene y recupere autenticadores.
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Registra un tipo de autenticación.
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Utiliza el middleware de autenticación.
app.resourceManager.use(authManager.middleware());
```

### Conceptos clave

- **Tipo de autenticación (`AuthType`)**: Se refiere a los diferentes métodos de autenticación de usuarios, como contraseña, SMS, OIDC, SAML, etc.
- **Autenticador (`Authenticator`)**: Es la entidad que representa un método de autenticación. Se almacena en una **colección** y corresponde a un registro de configuración de un `AuthType` específico. Un método de autenticación puede tener múltiples autenticadores, cada uno con su propia configuración, para ofrecer diferentes formas de autenticar a los usuarios.
- **Identificador del autenticador (`Authenticator name`)**: Es el identificador único de un autenticador, utilizado para determinar el método de autenticación que se aplica a la solicitud actual.

## Métodos de la clase

### `constructor()`

Este constructor crea una instancia de `AuthManager`.

#### Firma

- `constructor(options: AuthManagerOptions)`

#### Tipos

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### Detalles

##### AuthManagerOptions

| Propiedad | Tipo | Descripción | Valor predeterminado |
| --------- | --------------------------- | --------------------------------------------------------------------------------- | ----------------- |
| `authKey` | `string` | Opcional. La clave en el encabezado de la solicitud que contiene el identificador del autenticador actual. | `X-Authenticator` |
| `default` | `string` | Opcional. El identificador del autenticador predeterminado. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Opcional. Se puede configurar si se utiliza JWT para la autenticación. | - |

##### JwtOptions

| Propiedad | Tipo | Descripción | Valor predeterminado |
| ----------- | -------- | ---------------------------------- | ----------------- |
| `secret` | `string` | Secreto del token | `X-Authenticator` |
| `expiresIn` | `string` | Opcional. Tiempo de expiración del token. | `7d` |

### `setStorer()`

Establece los métodos para almacenar y recuperar los datos del autenticador.

#### Firma

- `setStorer(storer: Storer)`

#### Tipos

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### Detalles

##### Authenticator

| Propiedad | Tipo | Descripción |
| ---------- | --------------------- | ------------------------------------------ |
| `authType` | `string` | Tipo de autenticación |
| `options` | `Record<string, any>` | Configuración relacionada con el autenticador |

##### Storer

`Storer` es la interfaz para el almacenamiento de autenticadores y contiene un método.

- `get(name: string): Promise<Authenticator>` - Obtiene un autenticador mediante su identificador. En NocoBase, el tipo de retorno real es [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Registra un tipo de autenticación.

#### Firma

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Tipos

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // La clase de autenticación.
  title?: string; // El nombre de visualización del tipo de autenticación.
};
```

#### Detalles

| Propiedad | Tipo | Descripción |
| ------- | ------------------ | --------------------------------------------------------------------------------- |
| `auth` | `AuthExtend<Auth>` | Implementación del tipo de autenticación. Consulte [Auth](./auth) |
| `title` | `string` | Opcional. El título de este tipo de autenticación que se muestra en el frontend. |

### `listTypes()`

Obtiene la lista de tipos de autenticación registrados.

#### Firma

- `listTypes(): { name: string; title: string }[]`

#### Detalles

| Propiedad | Tipo | Descripción |
| ------- | -------- | ----------------------------------- |
| `name` | `string` | Identificador del tipo de autenticación |
| `title` | `string` | Título del tipo de autenticación |

### `get()`

Obtiene un autenticador.

#### Firma

- `get(name: string, ctx: Context)`

#### Detalles

| Propiedad | Tipo | Descripción |
| ------ | --------- | ----------------------------- |
| `name` | `string` | Identificador del autenticador |
| `ctx` | `Context` | Contexto de la solicitud |

### `middleware()`

Middleware de autenticación. Obtiene el autenticador actual y realiza la autenticación del usuario.