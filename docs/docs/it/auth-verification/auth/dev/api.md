:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Riferimento API

## Lato Server

### Auth

API del kernel, riferimento: [Auth](/api/auth/auth)

### BaseAuth

API del kernel, riferimento: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Panoramica

`AuthModel` è il modello di dati dell'autenticatore (`Authenticator`, riferimento: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) e [Auth - constructor](/api/auth/auth#constructor)) utilizzato nelle applicazioni NocoBase, che fornisce alcuni metodi per interagire con la collezione di dati utente. Inoltre, è possibile utilizzare anche i metodi forniti dal Sequelize Model.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### Metodi di Classe

- `findUser(uuid: string): UserModel` - Consente di interrogare un utente tramite `uuid`.
  - `uuid` - Identificatore unico dell'utente per il tipo di autenticazione corrente.

- `newUser(uuid: string, userValues?: any): UserModel` - Consente di creare un nuovo utente e di associarlo all'autenticatore corrente tramite `uuid`.
  - `uuid` - Identificatore unico dell'utente per il tipo di autenticazione corrente.
  - `userValues` - Opzionale. Altre informazioni sull'utente. Se non specificato, `uuid` verrà utilizzato come nickname dell'utente.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Consente di trovare o creare un nuovo utente. Le regole di creazione sono le stesse descritte sopra.
  - `uuid` - Identificatore unico dell'utente per il tipo di autenticazione corrente.
  - `userValues` - Opzionale. Altre informazioni sull'utente.

## Lato Client

### `plugin.registerType()`

Registra il client del tipo di autenticazione.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### Firma

- `registerType(authType: string, options: AuthOptions)`

#### Tipo

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### Dettagli

- `SignInForm` - Modulo di accesso
- `SignInButton` - Pulsante di accesso (di terze parti), utilizzabile in alternativa al modulo di accesso.
- `SignUpForm` - Modulo di registrazione
- `AdminSettingsForm` - Modulo di configurazione amministrativa

### Route

Le route frontend per la registrazione del plugin di autenticazione sono le seguenti:

- Layout di autenticazione
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Pagina di accesso
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Pagina di registrazione
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`