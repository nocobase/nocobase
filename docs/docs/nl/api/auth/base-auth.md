:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# BaseAuth

## Overzicht

`BaseAuth` erft van de abstracte klasse [Auth](./auth) en is de basisimplementatie voor gebruikersauthenticatietypen, waarbij JWT als authenticatiemethode wordt gebruikt. In de meeste gevallen kunt u gebruikersauthenticatietypen uitbreiden door van `BaseAuth` te erven; het is niet nodig om direct van de abstracte klasse `Auth` te erven.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Stel de gebruikerscollectie in
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Gebruikersauthenticologial, aangeroepen door `auth.signIn`
  // Retourneert gebruikersgegevens
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Klassemethoden

### `constructor()`

Constructor, maakt een `BaseAuth`-instantie aan.

#### Handtekening

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Details

| Parameter | Type | Beschrijving |
| :--- | :--- | :--- |
| `config` | `AuthConfig` | Zie [Auth - AuthConfig](./auth#authconfig) |
| `userCollection` | `Collection` | Gebruikerscollectie, bijvoorbeeld: `db.getCollection('users')`. Zie [DataBase - Collection](../database/collection) |

### `user()`

Accessor, stelt gebruikersinformatie in en haalt deze op. Standaard gebruikt het `ctx.state.currentUser`-object voor toegang.

#### Handtekening

- `set user()`
- `get user()`

### `check()`

Authenticeert via de request token en retourneert gebruikersinformatie.

### `signIn()`

Gebruiker aanmelden, genereert een token.

### `signUp()`

Gebruiker registreren.

### `signOut()`

Gebruiker afmelden, token verloopt.

### `validate()` *

De kernauthenticologial, aangeroepen door de `signIn`-interface, om te bepalen of de gebruiker succesvol kan inloggen.