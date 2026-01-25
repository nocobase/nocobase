:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# BaseAuth

## Přehled

`BaseAuth` dědí z abstraktní třídy [Auth](./auth) a je základní implementací pro typy uživatelského ověřování, používající JWT jako metodu ověřování. Ve většině případů můžete rozšířit typy uživatelského ověřování děděním z `BaseAuth` a není nutné dědit přímo z abstraktní třídy `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Nastaví kolekci uživatelů
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logika ověřování uživatele, volaná metodou `auth.signIn`
  // Vrátí uživatelská data
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Metody třídy

### `constructor()`

Konstruktor, který vytvoří instanci `BaseAuth`.

#### Podpis

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Podrobnosti

| Parametr         | Typ          | Popis                                                                                               |
| :--------------- | :----------- | :-------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Viz [Auth - AuthConfig](./auth#authconfig)                                                          |
| `userCollection` | `Collection` | Kolekce uživatelů, např. `db.getCollection('users')`. Viz [DataBase - Collection](../database/collection) |

### `user()`

Přistupový člen (accessor), který nastavuje a získává uživatelské informace. Ve výchozím nastavení používá pro přístup objekt `ctx.state.currentUser`.

#### Podpis

- `set user()`
- `get user()`

### `check()`

Ověřuje pomocí tokenu z požadavku a vrací uživatelské informace.

### `signIn()`

Přihlášení uživatele, generuje token.

### `signUp()`

Registrace uživatele.

### `signOut()`

Odhlášení uživatele, token vyprší.

### `validate()` *

Jádrová logika ověřování, volaná rozhraním `signIn`, která určuje, zda se uživatel může úspěšně přihlásit.