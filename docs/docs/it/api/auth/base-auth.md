:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# BaseAuth

## Panoramica

`BaseAuth` eredita dalla classe astratta [Auth](./auth) ed è l'implementazione di base per i tipi di autenticazione utente, utilizzando JWT come metodo di autenticazione. Nella maggior parte dei casi, può estendere i tipi di autenticazione utente ereditando da `BaseAuth`, e non è necessario ereditare direttamente dalla classe astratta `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Imposta la collezione utente
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logica di autenticazione utente, richiamata da `auth.signIn`
  // Restituisce i dati utente
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Metodi di Classe

### `constructor()`

Costruttore, crea un'istanza di `BaseAuth`.

#### Firma

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Dettagli

| Parametro        | Tipo         | Descrizione                                                                                                |
| ---------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Si veda [Auth - AuthConfig](./auth#authconfig)                                                             |
| `userCollection` | `Collection` | Collezione utente, ad esempio `db.getCollection('users')`. Si veda [DataBase - Collezione](../database/collection) |

### `user()`

Accessor, imposta e recupera le informazioni utente. Per impostazione predefinita, utilizza l'oggetto `ctx.state.currentUser` per l'accesso.

#### Firma

- `set user()`
- `get user()`

### `check()`

Autentica tramite il token della richiesta e restituisce le informazioni utente.

### `signIn()`

Accesso utente, genera un token.

### `signUp()`

Registrazione utente.

### `signOut()`

Disconnessione utente, fa scadere il token.

### `validate()` \*

Logica di autenticazione principale, richiamata dall'interfaccia `signIn`, per determinare se l'utente può accedere con successo.