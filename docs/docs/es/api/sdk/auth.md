:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Auth

## Resumen

La clase `Auth` se utiliza principalmente en el lado del cliente para acceder a la información del usuario y para solicitar APIs relacionadas con la autenticación de usuarios.

## Propiedades de Instancia

### `locale`

El idioma utilizado por el usuario actual.

### `role`

El rol utilizado por el usuario actual.

### `token`

El `token` de la API.

### `authenticator`

El autenticador utilizado para la autenticación del usuario actual. Consulte [Autenticación de Usuario](/auth-verification/auth/index.md).

## Métodos de Clase

### `signIn()`

Inicio de sesión de usuario.

#### Firma

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detalles

| Nombre del Parámetro | Tipo     | Descripción                                          |
| -------------------- | -------- | ---------------------------------------------------- |
| `values`             | `any`    | Parámetros de la solicitud para la API de inicio de sesión |
| `authenticator`      | `string` | El identificador del autenticador utilizado para el inicio de sesión |

### `signUp()`

Registro de usuario.

#### Firma

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detalles

| Nombre del Parámetro | Tipo     | Descripción                                          |
| -------------------- | -------- | ---------------------------------------------------- |
| `values`             | `any`    | Parámetros de la solicitud para la API de registro |
| `authenticator`      | `string` | El identificador del autenticador utilizado para el registro |

### `signOut()`

Cierre de sesión.

#### Firma

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detalles

| Nombre del Parámetro | Tipo     | Descripción                                           |
| -------------------- | -------- | ----------------------------------------------------- |
| `values`             | `any`    | Parámetros de la solicitud para la API de cierre de sesión |
| `authenticator`      | `string` | El identificador del autenticador utilizado para el cierre de sesión |
