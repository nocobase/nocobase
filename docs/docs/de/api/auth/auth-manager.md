:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# AuthManager

## Überblick

`AuthManager` ist das Modul zur Benutzerauthentifizierungsverwaltung in NocoBase. Es dient dazu, verschiedene Benutzerauthentifizierungstypen zu registrieren.

### Grundlegende Verwendung

```ts
const authManager = new AuthManager({
  // Wird verwendet, um den Bezeichner des aktuellen Authentifikators aus dem Anfrage-Header abzurufen.
  authKey: 'X-Authenticator',
});

// Legt die Methoden für den AuthManager fest, um Authentifikatoren zu speichern und abzurufen.
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Registriert einen Authentifizierungstyp.
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Verwendet die Authentifizierungs-Middleware.
app.resourceManager.use(authManager.middleware());
```

### Konzepte

- **Authentifizierungstyp (`AuthType`)**: Verschiedene Methoden zur Benutzerauthentifizierung, wie zum Beispiel: Passwort, SMS, OIDC, SAML usw.
- **Authentifikator (`Authenticator`)**: Die Entität einer Authentifizierungsmethode, die tatsächlich in einer Sammlung gespeichert wird und einem Konfigurationseintrag eines bestimmten Authentifizierungstyps (`AuthType`) entspricht. Eine Authentifizierungsmethode kann mehrere Authentifikatoren haben, die jeweils unterschiedlichen Konfigurationen entsprechen und verschiedene Benutzerauthentifizierungsmethoden bereitstellen.
- **Authentifikator-Bezeichner (`Authenticator name`)**: Der eindeutige Bezeichner für einen Authentifikator, der verwendet wird, um die Authentifizierungsmethode für die aktuelle Anfrage zu bestimmen.

## Klassenmethoden

### `constructor()`

Konstruktor, der eine `AuthManager`-Instanz erstellt.

#### Signatur

- `constructor(options: AuthManagerOptions)`

#### Typen

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

#### Details

##### AuthManagerOptions

| Eigenschaft | Typ                         | Beschreibung                                                              | Standardwert      |
| ----------- | --------------------------- | ------------------------------------------------------------------------- | ----------------- |
| `authKey`   | `string`                    | Optional, der Schlüssel im Anfrage-Header, der den Bezeichner des aktuellen Authentifikators enthält. | `X-Authenticator` |
| `default`   | `string`                    | Optional, der Standard-Authentifikator-Bezeichner.                        | `basic`           |
| `jwt`       | [`JwtOptions`](#jwtoptions) | Optional, kann konfiguriert werden, wenn JWT für die Authentifizierung verwendet wird. | -                 |

##### JwtOptions

| Eigenschaft | Typ      | Beschreibung                       | Standardwert      |
| ----------- | -------- | ---------------------------------- | ----------------- |
| `secret`    | `string` | Token-Schlüssel                    | `X-Authenticator` |
| `expiresIn` | `string` | Optional, die Gültigkeitsdauer des Tokens. | `7d`              |

### `setStorer()`

Legt die Methoden zum Speichern und Abrufen von Authentifikator-Daten fest.

#### Signatur

- `setStorer(storer: Storer)`

#### Typen

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

#### Details

##### Authenticator

| Eigenschaft  | Typ                   | Beschreibung                 |
| ------------ | --------------------- | ---------------------------- |
| `authType`   | `string`              | Authentifizierungstyp        |
| `options`    | `Record<string, any>` | Authentifikator-bezogene Konfiguration |

##### Storer

`Storer` ist die Schnittstelle für die Authentifikator-Speicherung und enthält eine Methode.

- `get(name: string): Promise<Authenticator>` - Ruft einen Authentifikator über seinen Bezeichner ab. In NocoBase ist der tatsächlich zurückgegebene Typ [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Registriert einen Authentifizierungstyp.

#### Signatur

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Typen

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // Die Authentifizierungsklasse.
  title?: string; // Der Anzeigename des Authentifizierungstyps.
};
```

#### Details

| Eigenschaft | Typ                | Beschreibung                                                    |
| ----------- | ------------------ | --------------------------------------------------------------- |
| `auth`      | `AuthExtend<Auth>` | Die Implementierung des Authentifizierungstyps, siehe [Auth](./auth). |
| `title`     | `string`           | Optional. Der Titel dieses Authentifizierungstyps, der im Frontend angezeigt wird. |

### `listTypes()`

Ruft die Liste der registrierten Authentifizierungstypen ab.

#### Signatur

- `listTypes(): { name: string; title: string }[]`

#### Details

| Eigenschaft | Typ      | Beschreibung                       |
| ----------- | -------- | ---------------------------------- |
| `name`      | `string` | Bezeichner des Authentifizierungstyps |
| `title`     | `string` | Titel des Authentifizierungstyps   |

### `get()`

Ruft einen Authentifikator ab.

#### Signatur

- `get(name: string, ctx: Context)`

#### Details

| Eigenschaft | Typ       | Beschreibung            |
| ----------- | --------- | ----------------------- |
| `name`      | `string`  | Authentifikator-Bezeichner |
| `ctx`       | `Context` | Anfrage-Kontext         |

### `middleware()`

Authentifizierungs-Middleware. Ruft den aktuellen Authentifikator ab und führt die Benutzerauthentifizierung durch.