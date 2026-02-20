:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Auth

## Översikt

`Auth`-klassen används främst på klientsidan för att komma åt användarinformation och för att göra anrop till API:er relaterade till användarautentisering.

## Instansegenskaper

### `locale`

Språket som används av den aktuella användaren.

### `role`

Rollen som används av den aktuella användaren.

### `token`

API-`token`.

### `authenticator`

Autentiseraren som används för den aktuella användarens autentisering. Se [Användarautentisering](/auth-verification/auth/).

## Klassmetoder

### `signIn()`

Logga in användare.

#### Signatur

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detaljer

| Parameternamn   | Typ      | Beskrivning                                  |
| --------------- | -------- | -------------------------------------------- |
| `values`        | `any`    | Begärandeparametrar för inloggnings-API:et   |
| `authenticator` | `string` | Identifieraren för autentiseraren som används vid inloggning |

### `signUp()`

Registrera användare.

#### Signatur

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detaljer

| Parameternamn   | Typ      | Beskrivning                                  |
| --------------- | -------- | -------------------------------------------- |
| `values`        | `any`    | Begärandeparametrar för registrerings-API:et |
| `authenticator` | `string` | Identifieraren för autentiseraren som används vid registrering |

### `signOut()`

Logga ut.

#### Signatur

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detaljer

| Parameternamn   | Typ      | Beskrivning                                  |
| --------------- | -------- | -------------------------------------------- |
| `values`        | `any`    | Begärandeparametrar för utloggnings-API:et   |
| `authenticator` | `string` | Identifieraren för autentiseraren som används vid utloggning |