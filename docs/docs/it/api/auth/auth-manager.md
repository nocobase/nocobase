:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# AuthManager

## Panoramica

`AuthManager` è il modulo di gestione dell'autenticazione utente in NocoBase, utilizzato per registrare diversi tipi di autenticazione utente.

### Utilizzo di base

```ts
const authManager = new AuthManager({
  // Utilizzato per ottenere l'identificatore dell'autenticatore corrente dall'header della richiesta
  authKey: 'X-Authenticator',
});

// Imposta i metodi per AuthManager per archiviare e recuperare gli autenticatori
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Registra un tipo di autenticazione
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Utilizza il middleware di autenticazione
app.resourceManager.use(authManager.middleware());
```

### Spiegazione dei concetti

- **Tipo di autenticazione (`AuthType`)**: Diversi metodi di autenticazione utente, come password, SMS, OIDC, SAML, ecc.
- **Autenticatore (`Authenticator`)**: L'entità per un metodo di autenticazione, effettivamente memorizzata in una **collezione**, corrispondente a un record di configurazione di un certo tipo di autenticazione (`AuthType`). Un metodo di autenticazione può avere più autenticatori, corrispondenti a più configurazioni, fornendo diversi metodi di autenticazione utente.
- **Identificatore dell'autenticatore (`Authenticator name`)**: L'identificatore univoco per un autenticatore, utilizzato per determinare il metodo di autenticazione per la richiesta corrente.

## Metodi di classe

### `constructor()`

Costruttore, crea un'istanza di `AuthManager`.

#### Firma

- `constructor(options: AuthManagerOptions)`

#### Tipi

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

#### Dettagli

##### AuthManagerOptions

| Proprietà | Tipo | Descrizione | Valore predefinito |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string` | Opzionale, la chiave nell'header della richiesta che contiene l'identificatore dell'autenticatore corrente. | `X-Authenticator` |
| `default` | `string` | Opzionale, l'identificatore dell'autenticatore predefinito. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Opzionale, può essere configurato se si utilizza JWT per l'autenticazione. | - |

##### JwtOptions

| Proprietà | Tipo | Descrizione | Valore predefinito |
| ----------- | -------- | ------------------ | ----------------- |
| `secret` | `string` | Segreto del token | `X-Authenticator` |
| `expiresIn` | `string` | Opzionale, tempo di scadenza del token. | `7d` |

### `setStorer()`

Imposta i metodi per l'archiviazione e il recupero dei dati dell'autenticatore.

#### Firma

- `setStorer(storer: Storer)`

#### Tipi

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

#### Dettagli

##### Authenticator

| Proprietà | Tipo | Descrizione |
| ---------- | --------------------- | -------------- |
| `authType` | `string` | Tipo di autenticazione |
| `options` | `Record<string, any>` | Configurazione relativa all'autenticatore |

##### Storer

`Storer` è l'interfaccia per l'archiviazione degli autenticatori, contenente un metodo.

- `get(name: string): Promise<Authenticator>` - Recupera un autenticatore tramite il suo identificatore. In NocoBase, il tipo restituito effettivo è [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Registra un tipo di autenticazione.

#### Firma

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Tipi

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### Dettagli

| Proprietà | Tipo | Descrizione |
| ------- | ------------------ | --------------------------------- |
| `auth` | `AuthExtend<Auth>` | L'implementazione del tipo di autenticazione, vedere [Auth](./auth) |
| `title` | `string` | Opzionale. Il titolo di questo tipo di autenticazione visualizzato sul frontend. |

### `listTypes()`

Recupera l'elenco dei tipi di autenticazione registrati.

#### Firma

- `listTypes(): { name: string; title: string }[]`

#### Dettagli

| Proprietà | Tipo | Descrizione |
| ------- | -------- | ------------ |
| `name` | `string` | Identificatore del tipo di autenticazione |
| `title` | `string` | Titolo del tipo di autenticazione |

### `get()`

Recupera un autenticatore.

#### Firma

- `get(name: string, ctx: Context)`

#### Dettagli

| Proprietà | Tipo | Descrizione |
| ------ | --------- | ---------- |
| `name` | `string` | Identificatore dell'autenticatore |
| `ctx` | `Context` | Contesto della richiesta |

### `middleware()`

Middleware di autenticazione. Recupera l'autenticatore corrente ed esegue l'autenticazione dell'utente.