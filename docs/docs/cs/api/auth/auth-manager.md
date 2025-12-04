:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# AuthManager

## Přehled

`AuthManager` je modul pro správu uživatelské autentizace v NocoBase, který slouží k registraci různých typů uživatelské autentizace.

### Základní použití

```ts
const authManager = new AuthManager({
  // Slouží k získání identifikátoru aktuálního autentizátoru z hlavičky požadavku
  authKey: 'X-Authenticator',
});

// Nastaví metody pro ukládání a načítání autentizátorů pro AuthManager
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Registruje typ autentizace
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Použije autentizační middleware
app.resourceManager.use(authManager.middleware());
```

### Vysvětlení pojmů

- **Typ autentizace (`AuthType`)**: Různé metody uživatelské autentizace, například heslo, SMS, OIDC, SAML atd.
- **Autentizátor (`Authenticator`)**: Entita pro autentizační metodu, která je skutečně uložena v **kolekci**, odpovídající konfiguračnímu záznamu určitého `AuthType`. Jedna autentizační metoda může mít více autentizátorů, odpovídajících více konfiguracím, poskytujících různé metody uživatelské autentizace.
- **Identifikátor autentizátoru (`Authenticator name`)**: Jedinečný identifikátor autentizátoru, který se používá k určení autentizační metody pro aktuální požadavek.

## Metody třídy

### `constructor()`

Konstruktor, který vytváří instanci `AuthManager`.

#### Podpis

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

#### Podrobnosti

##### AuthManagerOptions

| Vlastnost   | Typ                         | Popis                                                              | Výchozí hodnota   |
| ----------- | --------------------------- | ------------------------------------------------------------------ | ----------------- |
| `authKey`   | `string`                    | Volitelné, klíč v hlavičce požadavku, který obsahuje identifikátor aktuálního autentizátoru. | `X-Authenticator` |
| `default`   | `string`                    | Volitelné, výchozí identifikátor autentizátoru.                    | `basic`           |
| `jwt`       | [`JwtOptions`](#jwtoptions) | Volitelné, lze konfigurovat, pokud se pro autentizaci používá JWT. | -                 |

##### JwtOptions

| Vlastnost   | Typ      | Popis                  | Výchozí hodnota   |
| ----------- | -------- | ---------------------- | ----------------- |
| `secret`    | `string` | Tajný klíč tokenu      | `X-Authenticator` |
| `expiresIn` | `string` | Volitelné, doba platnosti tokenu. | `7d`              |

### `setStorer()`

Nastaví metody pro ukládání a načítání dat autentizátoru.

#### Podpis

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

#### Podrobnosti

##### Authenticator

| Vlastnost  | Typ                   | Popis                              |
| ---------- | --------------------- | ---------------------------------- |
| `authType` | `string`              | Typ autentizace                    |
| `options`  | `Record<string, any>` | Konfigurace související s autentizátorem |

##### Storer

`Storer` je rozhraní pro ukládání autentizátorů, které obsahuje jednu metodu.

- `get(name: string): Promise<Authenticator>` - Získá autentizátor podle jeho identifikátoru. V NocoBase je skutečný vrácený typ [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Registruje typ autentizace.

#### Podpis

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Typy

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // Třída autentizace.
  title?: string; // Zobrazovaný název typu autentizace.
};
```

#### Podrobnosti

| Vlastnost | Typ                | Popis                                          |
| --------- | ------------------ | ---------------------------------------------- |
| `auth`    | `AuthExtend<Auth>` | Implementace typu autentizace, viz [Auth](./auth) |
| `title`   | `string`           | Volitelné. Název tohoto typu autentizace zobrazený na frontendu. |

### `listTypes()`

Získá seznam registrovaných typů autentizace.

#### Podpis

- `listTypes(): { name: string; title: string }[]`

#### Podrobnosti

| Vlastnost | Typ      | Popis                        |
| --------- | -------- | ---------------------------- |
| `name`    | `string` | Identifikátor typu autentizace |
| `title`   | `string` | Název typu autentizace       |

### `get()`

Získá autentizátor.

#### Podpis

- `get(name: string, ctx: Context)`

#### Podrobnosti

| Vlastnost | Typ       | Popis                  |
| --------- | --------- | ---------------------- |
| `name`    | `string`  | Identifikátor autentizátoru |
| `ctx`     | `Context` | Kontext požadavku      |

### `middleware()`

Autentizační middleware. Získá aktuální autentizátor a provede uživatelskou autentizaci.