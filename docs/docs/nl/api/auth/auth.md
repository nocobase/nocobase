:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Auth

## Overzicht

`Auth` is een abstracte klasse voor gebruikersauthenticatietypen. Het definieert de interfaces die nodig zijn om gebruikersauthenticatie te voltooien. Om een nieuw gebruikersauthenticatietype uit te breiden, moet u de `Auth`-klasse overerven en de methoden ervan implementeren. Voor een basisimplementatie, zie: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Controleer de authenticatiestatus en retourneer de huidige gebruiker.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: authenticatie
  async check() {
    // ...
  }
}
```

## Instantie-eigenschappen

### `user`

Informatie over de geauthenticeerde gebruiker.

#### Signatuur

- `abstract user: Model`

## Klassemethoden

### `constructor()`

Constructor, creëert een `Auth`-instantie.

#### Signatuur

- `constructor(config: AuthConfig)`

#### Type

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Details

##### AuthConfig

| Eigenschap      | Type                                            | Beschrijving                                                                                                  |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Gegevensmodel van de authenticator. Het werkelijke type in een NocoBase-applicatie is [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Authenticatiegerelateerde configuratie.                                                                       |
| `ctx`           | `Context`                                       | Verzoekcontext.                                                                                               |

### `check()`

Gebruikersauthenticatie. Retourneert gebruikersinformatie. Dit is een abstracte methode die alle authenticatietypen moeten implementeren.

#### Signatuur

- `abstract check(): Promise<Model>`

### `signIn()`

Gebruiker aanmelden.

#### Signatuur

- `signIn(): Promise<any>`

### `signUp()`

Gebruiker registreren.

#### Signatuur

- `signUp(): Promise<any>`

### `signOut()`

Gebruiker afmelden.

#### Signatuur

- `signOut(): Promise<any>`