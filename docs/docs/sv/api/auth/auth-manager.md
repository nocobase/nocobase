:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# AuthManager

## Översikt

`AuthManager` är NocoBase's modul för användarautentisering, som används för att registrera olika typer av användarautentisering.

### Grundläggande användning

```ts
const authManager = new AuthManager({
  // Används för att hämta den aktuella autentiseringsidentifieraren från begäranshuvudet
  authKey: 'X-Authenticator',
});

// Ställer in metoder för AuthManager att lagra och hämta autentiserare
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Registrerar en autentiseringstyp
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Använder autentiserings-middleware
app.resourceManager.use(authManager.middleware());
```

### Begrepp

- **Autentiseringstyp (`AuthType`)**: Olika metoder för användarautentisering, såsom lösenord, SMS, OIDC, SAML, med mera.
- **Autentiserare (`Authenticator`)**: Entiteten för en autentiseringsmetod, som faktiskt lagras i en samling, och motsvarar en konfigurationspost för en viss autentiseringstyp (`AuthType`). En autentiseringsmetod kan ha flera autentiserare, som motsvarar flera konfigurationer och tillhandahåller olika metoder för användarautentisering.
- **Autentiseringsidentifierare (`Authenticator name`)**: Den unika identifieraren för en autentiserare, som används för att bestämma vilken autentiseringsmetod som används för den aktuella begäran.

## Klassmetoder

### `constructor()`

Konstruktor, skapar en instans av `AuthManager`.

#### Signatur

- `constructor(options: AuthManagerOptions)`

#### Typer

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

#### Detaljer

##### AuthManagerOptions

| Egenskap  | Typ                         | Beskrivning                                                    | Standardvärde     |
| --------- | --------------------------- | -------------------------------------------------------------- | ----------------- |
| `authKey` | `string`                    | Valfritt, nyckeln i begäranshuvudet som innehåller den aktuella autentiseringsidentifieraren. | `X-Authenticator` |
| `default` | `string`                    | Valfritt, standardautentiseringsidentifieraren.                | `basic`           |
| `jwt`     | [`JwtOptions`](#jwtoptions) | Valfritt, kan konfigureras om JWT används för autentisering.   | -                 |

##### JwtOptions

| Egenskap    | Typ      | Beskrivning               | Standardvärde     |
| ----------- | -------- | ------------------------- | ----------------- |
| `secret`    | `string` | Tokenhemlighet            | `X-Authenticator` |
| `expiresIn` | `string` | Valfritt, tokenens giltighetstid. | `7d`              |

### `setStorer()`

Ställer in metoder för att lagra och hämta autentiseringsdata.

#### Signatur

- `setStorer(storer: Storer)`

#### Typer

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

#### Detaljer

##### Authenticator

| Egenskap   | Typ                   | Beskrivning                   |
| ---------- | --------------------- | ----------------------------- |
| `authType` | `string`              | Autentiseringstyp             |
| `options`  | `Record<string, any>` | Autentiserarrelaterad konfiguration |

##### Storer

`Storer` är gränssnittet för autentiseringslagring och innehåller en metod.

- `get(name: string): Promise<Authenticator>` - Hämtar en autentiserare via dess identifierare. I NocoBase är den faktiska returtypen [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Registrerar en autentiseringstyp.

#### Signatur

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Typer

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // Autentiseringsklassen.
  title?: string; // Visningsnamnet för autentiseringstypen.
};
```

#### Detaljer

| Egenskap | Typ                | Beskrivning                                     |
| -------- | ------------------ | ----------------------------------------------- |
| `auth`   | `AuthExtend<Auth>` | Implementering av autentiseringstypen, se [Auth](./auth) |
| `title`  | `string`           | Valfritt. Titeln för denna autentiseringstyp som visas i frontend. |

### `listTypes()`

Hämtar listan över registrerade autentiseringstyper.

#### Signatur

- `listTypes(): { name: string; title: string }[]`

#### Detaljer

| Egenskap | Typ      | Beskrivning                      |
| -------- | -------- | -------------------------------- |
| `name`   | `string` | Autentiseringstypens identifierare |
| `title`  | `string` | Autentiseringstypens titel       |

### `get()`

Hämtar en autentiserare.

#### Signatur

- `get(name: string, ctx: Context)`

#### Detaljer

| Egenskap | Typ       | Beskrivning                 |
| -------- | --------- | --------------------------- |
| `name`   | `string`  | Autentiseringsidentifierare |
| `ctx`    | `Context` | Begärans kontext            |

### `middleware()`

Autentiserings-middleware. Hämtar den aktuella autentiseraren och utför användarautentisering.