:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Auth

## Übersicht

Die `Auth`-Klasse dient hauptsächlich dazu, auf Client-Seite Benutzerinformationen abzurufen und API-Anfragen für die Benutzerauthentifizierung zu stellen.

## Instanzeigenschaften

### `locale`

Die Sprache, die der aktuelle Benutzer verwendet.

### `role`

Die Rolle, die der aktuelle Benutzer verwendet.

### `token`

Der API-`Token`.

### `authenticator`

Der Authentifikator, der für die Authentifizierung des aktuellen Benutzers verwendet wird. Siehe [Benutzerauthentifizierung](/auth-verification/auth/).

## Klassenmethoden

### `signIn()`

Benutzeranmeldung.

#### Signatur

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parametername   | Typ      | Beschreibung                                             |
| --------------- | -------- | -------------------------------------------------------- |
| `values`        | `any`    | Anfrageparameter für die Anmelde-API                     |
| `authenticator` | `string` | Der Bezeichner des Authentifikators, der für die Anmeldung verwendet wird |

### `signUp()`

Benutzerregistrierung.

#### Signatur

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parametername   | Typ      | Beschreibung                                             |
| --------------- | -------- | -------------------------------------------------------- |
| `values`        | `any`    | Anfrageparameter für die Registrierungs-API              |
| `authenticator` | `string` | Der Bezeichner des Authentifikators, der für die Registrierung verwendet wird |

### `signOut()`

Abmelden.

#### Signatur

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Details

| Parametername   | Typ      | Beschreibung                                             |
| --------------- | -------- | -------------------------------------------------------- |
| `values`        | `any`    | Anfrageparameter für die Abmelde-API                     |
| `authenticator` | `string` | Der Bezeichner des Authentifikators, der für die Abmeldung verwendet wird |