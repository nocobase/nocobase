:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Auth

## Übersicht

`Auth` ist eine abstrakte Klasse für Benutzerauthentifizierungstypen. Sie definiert die Schnittstellen, die für eine vollständige Benutzerauthentifizierung erforderlich sind. Um einen neuen Benutzerauthentifizierungstyp zu erweitern, müssen Sie die `Auth`-Klasse erben und deren Methoden implementieren. Eine grundlegende Implementierung finden Sie unter: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Überprüft den Authentifizierungsstatus und gibt den aktuellen Benutzer zurück.
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
  // check: Authentifizierung
  async check() {
    // ...
  }
}
```

## Instanzeigenschaften

### `user`

Authentifizierte Benutzerinformationen.

#### Signatur

- `abstract user: Model`

## Klassenmethoden

### `constructor()`

Konstruktor, erstellt eine `Auth`-Instanz.

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

#### Details

##### AuthConfig

| Eigenschaft     | Typ                                             | Beschreibung                                                                                                  |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Das Authentifikator-Datenmodell. Der tatsächliche Typ in einer NocoBase-Anwendung ist [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Authentifikator-bezogene Konfiguration.                                                                       |
| `ctx`           | `Context`                                       | Anfragekontext.                                                                                               |

### `check()`

Benutzerauthentifizierung. Gibt Benutzerinformationen zurück. Dies ist eine abstrakte Methode, die alle Authentifizierungstypen implementieren müssen.

#### Signatur

- `abstract check(): Promise<Model>`

### `signIn()`

Benutzeranmeldung.

#### Signatur

- `signIn(): Promise<any>`

### `signUp()`

Benutzerregistrierung.

#### Signatur

- `signUp(): Promise<any>`

### `signOut()`

Benutzerabmeldung.

#### Signatur

- `signOut(): Promise<any>`