:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Auth

## Panoramica

La classe `Auth` è utilizzata principalmente lato client per accedere alle informazioni utente e per effettuare richieste alle API relative all'autenticazione utente.

## Proprietà dell'istanza

### `locale`

La lingua utilizzata dall'utente corrente.

### `role`

Il ruolo utilizzato dall'utente corrente.

### `token`

Il `token` API.

### `authenticator`

L'autenticatore utilizzato per l'autenticazione dell'utente corrente. Veda [Autenticazione Utente](/auth-verification/auth/).

## Metodi di classe

### `signIn()`

Accesso utente.

#### Firma

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Dettagli

| Nome parametro  | Tipo     | Descrizione                                          |
| --------------- | -------- | ---------------------------------------------------- |
| `values`        | `any`    | Parametri di richiesta per l'API di accesso.         |
| `authenticator` | `string` | L'identificatore dell'autenticatore utilizzato per l'accesso. |

### `signUp()`

Registrazione utente.

#### Firma

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Dettagli

| Nome parametro  | Tipo     | Descrizione                                          |
| --------------- | -------- | ---------------------------------------------------- |
| `values`        | `any`    | Parametri di richiesta per l'API di registrazione.   |
| `authenticator` | `string` | L'identificatore dell'autenticatore utilizzato per la registrazione. |

### `signOut()`

Disconnessione.

#### Firma

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Dettagli

| Nome parametro  | Tipo     | Descrizione                                          |
| --------------- | -------- | ---------------------------------------------------- |
| `values`        | `any`    | Parametri di richiesta per l'API di disconnessione.  |
| `authenticator` | `string` | L'identificatore dell'autenticatore utilizzato per la disconnessione. |