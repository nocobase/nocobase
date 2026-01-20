:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# BaseAuth

## Übersicht

`BaseAuth` erbt von der abstrakten Klasse [Auth](./auth) und ist die grundlegende Implementierung für Benutzerauthentifizierungstypen, die JWT als Authentifizierungsmethode verwendet. In den meisten Fällen erweitern Sie Benutzerauthentifizierungstypen, indem Sie von `BaseAuth` erben, und es ist nicht notwendig, direkt von der abstrakten Klasse `Auth` zu erben.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Legen Sie die Benutzer-Sammlung fest
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Benutzerauthentifizierungslogik, aufgerufen von `auth.signIn`
  // Gibt Benutzerdaten zurück
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Klassenmethoden

### `constructor()`

Konstruktor, der eine `BaseAuth`-Instanz erstellt.

#### Signatur

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Details

| Parameter        | Typ          | Beschreibung                                                                                                |
| :--------------- | :----------- | :---------------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Siehe [Auth - AuthConfig](./auth#authconfig)                                                                |
| `userCollection` | `Collection` | Benutzer-Sammlung, z.B.: `db.getCollection('users')`. Siehe [DataBase - Collection](../database/collection) |

### `user()`

Zugriffsmethode, die Benutzerinformationen festlegt und abruft. Standardmäßig verwendet sie das `ctx.state.currentUser`-Objekt für den Zugriff.

#### Signatur

- `set user()`
- `get user()`

### `check()`

Authentifiziert über das Anfrage-Token und gibt Benutzerinformationen zurück.

### `signIn()`

Benutzeranmeldung, generiert ein Token.

### `signUp()`

Benutzerregistrierung.

### `signOut()`

Benutzerabmeldung, lässt das Token ablaufen.

### `validate()` \*

Die Kernlogik der Authentifizierung, aufgerufen von der `signIn`-Schnittstelle, um zu prüfen, ob sich der Benutzer erfolgreich anmelden kann.