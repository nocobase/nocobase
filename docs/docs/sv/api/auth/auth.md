:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Auth

## Översikt

`Auth` är en abstrakt klass för användarautentiseringstyper. Den definierar de gränssnitt som krävs för att slutföra användarautentisering. För att utöka med en ny användarautentiseringstyp behöver ni ärva `Auth`-klassen och implementera dess metoder. För en grundläggande implementering, se: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Kontrollerar autentiseringsstatusen och returnerar den aktuella användaren.
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
  // check: autentisering
  async check() {
    // ...
  }
}
```

## Instansegenskaper

### `user`

Autentiserad användarinformation.

#### Signatur

- `abstract user: Model`

## Klassmetoder

### `constructor()`

Konstruktor, skapar en `Auth`-instans.

#### Signatur

- `constructor(config: AuthConfig)`

#### Typ

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Detaljer

##### AuthConfig

| Egenskap        | Typ                                             | Beskrivning                                                                                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Autentiseringsdatamodell. Den faktiska typen i en NocoBase-applikation är [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Autentiseringsrelaterad konfiguration.                                                                          |
| `ctx`           | `Context`                                       | Begäranskontext.                                                                                              |

### `check()`

Användarautentisering. Returnerar användarinformation. Detta är en abstrakt metod som alla autentiseringstyper måste implementera.

#### Signatur

- `abstract check(): Promise<Model>`

### `signIn()`

Användarinloggning.

#### Signatur

- `signIn(): Promise<any>`

### `signUp()`

Användarregistrering.

#### Signatur

- `signUp(): Promise<any>`

### `signOut()`

Användarutloggning.

#### Signatur

- `signOut(): Promise<any>`