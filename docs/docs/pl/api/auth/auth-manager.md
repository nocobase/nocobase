:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# AuthManager

## Przegląd

`AuthManager` to moduł zarządzania uwierzytelnianiem użytkowników w NocoBase, służący do rejestrowania różnych typów uwierzytelniania.

### Podstawowe użycie

```ts
const authManager = new AuthManager({
  // Służy do pobierania identyfikatora bieżącego uwierzytelniacza z nagłówka żądania
  authKey: 'X-Authenticator',
});

// Ustawia metody dla AuthManagera do przechowywania i pobierania uwierzytelniaczy
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Rejestruje typ uwierzytelniania
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Używa oprogramowania pośredniczącego do uwierzytelniania
app.resourceManager.use(authManager.middleware());
```

### Koncepcje

- **Typ uwierzytelniania (`AuthType`)**: Różne metody uwierzytelniania użytkowników, takie jak: hasło, SMS, OIDC, SAML itp.
- **Uwierzytelniacz (`Authenticator`)**: Encja metody uwierzytelniania, faktycznie przechowywana w kolekcji, odpowiadająca rekordowi konfiguracji określonego typu uwierzytelniania (`AuthType`). Jedna metoda uwierzytelniania może mieć wiele uwierzytelniaczy, odpowiadających wielu konfiguracjom, zapewniających różne metody uwierzytelniania użytkowników.
- **Identyfikator uwierzytelniacza (`Authenticator name`)**: Unikalny identyfikator uwierzytelniacza, używany do określenia metody uwierzytelniania dla bieżącego żądania.

## Metody klasy

### `constructor()`

Konstruktor, tworzy instancję `AuthManager`.

#### Sygnatura

- `constructor(options: AuthManagerOptions)`

#### Typy

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

#### Szczegóły

##### AuthManagerOptions

| Właściwość | Typ | Opis | Domyślna wartość |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string` | Opcjonalnie, klucz w nagłówku żądania przechowujący identyfikator bieżącego uwierzytelniacza. | `X-Authenticator` |
| `default` | `string` | Opcjonalnie, domyślny identyfikator uwierzytelniacza. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Opcjonalnie, można skonfigurować, jeśli do uwierzytelniania używany jest JWT. | - |

##### JwtOptions

| Właściwość | Typ | Opis | Domyślna wartość |
| ----------- | -------- | ------------------ | ----------------- |
| `secret` | `string` | Sekret tokena | `X-Authenticator` |
| `expiresIn` | `string` | Opcjonalnie, czas ważności tokena. | `7d` |

### `setStorer()`

Ustawia metody przechowywania i pobierania danych uwierzytelniacza.

#### Sygnatura

- `setStorer(storer: Storer)`

#### Typy

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

#### Szczegóły

##### Authenticator

| Właściwość | Typ | Opis |
| ---------- | --------------------- | -------------- |
| `authType` | `string` | Typ uwierzytelniania |
| `options` | `Record<string, any>` | Konfiguracja związana z uwierzytelniaczem |

##### Storer

`Storer` to interfejs do przechowywania uwierzytelniaczy, zawierający jedną metodę.

- `get(name: string): Promise<Authenticator>` - Pobiera uwierzytelniacz na podstawie jego identyfikatora. W NocoBase rzeczywisty zwracany typ to [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Rejestruje typ uwierzytelniania.

#### Sygnatura

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Typy

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### Szczegóły

| Właściwość | Typ | Opis |
| ------- | ------------------ | --------------------------------- |
| `auth` | `AuthExtend<Auth>` | Implementacja typu uwierzytelniania, zobacz [Auth](./auth) |
| `title` | `string` | Opcjonalnie. Tytuł tego typu uwierzytelniania wyświetlany w interfejsie użytkownika. |

### `listTypes()`

Pobiera listę zarejestrowanych typów uwierzytelniania.

#### Sygnatura

- `listTypes(): { name: string; title: string }[]`

#### Szczegóły

| Właściwość | Typ | Opis |
| ------- | -------- | ------------ |
| `name` | `string` | Identyfikator typu uwierzytelniania |
| `title` | `string` | Tytuł typu uwierzytelniania |

### `get()`

Pobiera uwierzytelniacz.

#### Sygnatura

- `get(name: string, ctx: Context)`

#### Szczegóły

| Właściwość | Typ | Opis |
| ------ | --------- | ---------- |
| `name` | `string` | Identyfikator uwierzytelniacza |
| `ctx` | `Context` | Kontekst żądania |

### `middleware()`

Oprogramowanie pośredniczące do uwierzytelniania. Pobiera bieżący uwierzytelniacz i wykonuje uwierzytelnianie użytkownika.