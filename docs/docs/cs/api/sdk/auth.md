:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Auth

## Přehled

Třída `Auth` se primárně používá na straně klienta pro přístup k uživatelským informacím a pro volání API rozhraní souvisejících s autentizací uživatelů.

## Vlastnosti instance

### `locale`

Jazyk, který používá aktuální uživatel.

### `role`

Role, kterou používá aktuální uživatel.

### `token`

API `token`.

### `authenticator`

Autentikátor, který se používá pro autentizaci aktuálního uživatele. Viz [Autentizace uživatelů](/auth-verification/auth/).

## Metody třídy

### `signIn()`

Přihlášení uživatele.

#### Podpis

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Podrobnosti

| Název parametru | Typ      | Popis                                      |
| --------------- | -------- | ------------------------------------------ |
| `values`        | `any`    | Parametry požadavku pro API přihlášení.    |
| `authenticator` | `string` | Identifikátor autentikátoru použitého pro přihlášení. |

### `signUp()`

Registrace uživatele.

#### Podpis

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Podrobnosti

| Název parametru | Typ      | Popis                                      |
| --------------- | -------- | ------------------------------------------ |
| `values`        | `any`    | Parametry požadavku pro API registrace.    |
| `authenticator` | `string` | Identifikátor autentikátoru použitého pro registraci. |

### `signOut()`

Odhlášení.

#### Podpis

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Podrobnosti

| Název parametru | Typ      | Popis                                      |
| --------------- | -------- | ------------------------------------------ |
| `values`        | `any`    | Parametry požadavku pro API odhlášení.     |
| `authenticator` | `string` | Identifikátor autentikátoru použitého pro odhlášení. |