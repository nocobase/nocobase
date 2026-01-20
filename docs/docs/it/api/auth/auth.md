:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Auth

## Panoramica

`Auth` è una classe astratta per i tipi di autenticazione utente. Definisce le interfacce necessarie per completare l'autenticazione utente. Per estendere un nuovo tipo di autenticazione utente, deve ereditare la classe `Auth` e implementarne i metodi. Per un'implementazione di base, faccia riferimento a: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
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
  // check: authentication
  async check() {
    // ...
  }
}
```

## Proprietà dell'istanza

### `user`

Informazioni sull'utente autenticato.

#### Firma

- `abstract user: Model`

## Metodi di classe

### `constructor()`

Costruttore, crea un'istanza di `Auth`.

#### Firma

- `constructor(config: AuthConfig)`

#### Tipo

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Dettagli

##### AuthConfig

| Proprietà       | Tipo                                            | Descrizione                                                                                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Modello di dati dell'autenticatore. Il tipo effettivo in un'applicazione NocoBase è [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Configurazione relativa all'autenticatore.                                                                          |
| `ctx`           | `Context`                                       | Contesto della richiesta.                                                                                              |

### `check()`

Autenticazione utente. Restituisce le informazioni sull'utente. Questo è un metodo astratto che tutti i tipi di autenticazione devono implementare.

#### Firma

- `abstract check(): Promise<Model>`

### `signIn()`

Accesso utente.

#### Firma

- `signIn(): Promise<any>`

### `signUp()`

Registrazione utente.

#### Firma

- `signUp(): Promise<any>`

### `signOut()`

Disconnessione utente.

#### Firma

- `signOut(): Promise<any>`