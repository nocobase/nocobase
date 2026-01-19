:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# BaseAuth

## Översikt

`BaseAuth` ärver från den abstrakta klassen [Auth](./auth) och är den grundläggande implementeringen för användarautentiseringstyper, som använder JWT som autentiseringsmetod. I de flesta fall kan ni utöka användarautentiseringstyper genom att ärva från `BaseAuth`, och det är inte nödvändigt att ärva direkt från den abstrakta klassen `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Ange användarsamlingen
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logik för användarautentisering, anropas av `auth.signIn`
  // Returnerar användardata
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Klassmetoder

### `constructor()`

Konstruktor, skapar en instans av `BaseAuth`.

#### Signatur

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Detaljer

| Parameter        | Typ          | Beskrivning                                                                                              |
| ---------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Se [Auth - AuthConfig](./auth#authconfig)                                                                |
| `userCollection` | `Collection` | Användarsamling, t.ex. `db.getCollection('users')`. Se [DataBase - Collection](../database/collection) |

### `user()`

Accessor, ställer in och hämtar användarinformation. Som standard använder den `ctx.state.currentUser`-objektet för åtkomst.

#### Signatur

- `set user()`
- `get user()`

### `check()`

Autentiserar via begärans token och returnerar användarinformation.

### `signIn()`

Användarinloggning, genererar en token.

### `signUp()`

Användarregistrering.

### `signOut()`

Användarutloggning, ogiltigförklarar token.

### `validate()` \*

Kärnlogiken för autentisering, anropas av `signIn`-gränssnittet, för att avgöra om användaren kan logga in framgångsrikt.