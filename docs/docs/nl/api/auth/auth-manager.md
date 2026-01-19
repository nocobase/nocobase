:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# AuthManager

## Overzicht

`AuthManager` is de module voor gebruikersauthenticatiebeheer in NocoBase. U gebruikt deze om verschillende typen gebruikersauthenticatie te registreren.

### Basisgebruik

```ts
const authManager = new AuthManager({
  // Wordt gebruikt om de huidige authenticator-ID uit de request header te halen
  authKey: 'X-Authenticator',
});

// Stel de methoden in voor AuthManager om authenticators op te slaan en op te halen
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Registreer een authenticatietype
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Gebruik de authenticatie-middleware
app.resourceManager.use(authManager.middleware());
```

### Concepten

- **Authenticatietype (`AuthType`)**: Verschillende methoden voor gebruikersauthenticatie, zoals wachtwoord, sms, OIDC, SAML, enz.
- **Authenticator (`Authenticator`)**: De entiteit voor een authenticatiemethode, die daadwerkelijk wordt opgeslagen in een `collectie`. Deze komt overeen met een configuratierecord van een bepaald `AuthType`. Eén authenticatiemethode kan meerdere authenticators hebben, die overeenkomen met meerdere configuraties en verschillende methoden voor gebruikersauthenticatie bieden.
- **Authenticator-ID (`Authenticator name`)**: De unieke identificatie voor een authenticator, gebruikt om de authenticatiemethode voor het huidige verzoek te bepalen.

## Klasse-methoden

### `constructor()`

Constructor, creëert een `AuthManager`-instantie.

#### Handtekening

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

| Eigenschap | Type | Beschrijving | Standaardwaarde |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string` | Optioneel, de sleutel in de request header die de ID van de huidige authenticator bevat. | `X-Authenticator` |
| `default` | `string` | Optioneel, de standaard authenticator-ID. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Optioneel, kan worden geconfigureerd als u JWT gebruikt voor authenticatie. | - |

##### JwtOptions

| Eigenschap | Type | Beschrijving | Standaardwaarde |
| ----------- | -------- | ------------------ | ----------------- |
| `secret` | `string` | Token-geheim | `X-Authenticator` |
| `expiresIn` | `string` | Optioneel, de geldigheidsduur van het token. | `7d` |

### `setStorer()`

Stelt de methoden in voor het opslaan en ophalen van authenticator-gegevens.

#### Handtekening

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

| Eigenschap | Type | Beschrijving |
| ---------- | --------------------- | -------------- |
| `authType` | `string` | Authenticatietype |
| `options` | `Record<string, any>` | Authenticator-gerelateerde configuratie |

##### Storer

`Storer` is de interface voor authenticator-opslag, en bevat één methode.

- `get(name: string): Promise<Authenticator>` - Haalt een authenticator op via de ID. In NocoBase is het daadwerkelijk geretourneerde type [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Registreert een authenticatietype.

#### Handtekening

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Typen

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### Details

| Eigenschap | Type | Beschrijving |
| ------- | ------------------ | --------------------------------- |
| `auth` | `AuthExtend<Auth>` | De implementatie van het authenticatietype, zie [Auth](./auth) |
| `title` | `string` | Optioneel. De titel van dit authenticatietype zoals weergegeven in de frontend. |

### `listTypes()`

Haalt de lijst met geregistreerde authenticatietypen op.

#### Handtekening

- `listTypes(): { name: string; title: string }[]`

#### Details

| Eigenschap | Type | Beschrijving |
| ------- | -------- | ------------ |
| `name` | `string` | Authenticatietype-ID |
| `title` | `string` | Titel van het authenticatietype |

### `get()`

Haalt een authenticator op.

#### Handtekening

- `get(name: string, ctx: Context)`

#### Details

| Eigenschap | Type | Beschrijving |
| ------ | --------- | ---------- |
| `name` | `string` | Authenticator-ID |
| `ctx` | `Context` | Request context |

### `middleware()`

Authenticatie-middleware. Haalt de huidige authenticator op en voert gebruikersauthenticatie uit.