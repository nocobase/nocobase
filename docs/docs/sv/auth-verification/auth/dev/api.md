:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# API-referens

## Serversidan

### Auth

Kärn-API, referens: [Auth](/api/auth/auth)

### BaseAuth

Kärn-API, referens: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Översikt

`AuthModel` är datamodellen för autentiseraren (`Authenticator`, se: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) och [Auth - constructor](/api/auth/auth#constructor)) som används i NocoBase-applikationer. Den tillhandahåller metoder för att interagera med användardatasamlingen. Dessutom kan ni även använda metoder som tillhandahålls av Sequelize Model.

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

#### Klassmetoder

- `findUser(uuid: string): UserModel` - Söker efter en användare med hjälp av `uuid`.
  - `uuid` - Användarens unika identifierare från den aktuella autentiseringstypen.

- `newUser(uuid: string, userValues?: any): UserModel` - Skapar en ny användare och kopplar användaren till den aktuella autentiseraren via `uuid`.
  - `uuid` - Användarens unika identifierare från den aktuella autentiseringstypen.
  - `userValues` - Valfritt. Annan användarinformation. Om det inte anges används `uuid` som användarens smeknamn.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Hittar eller skapar en ny användare, med samma skapanderegler som ovan.
  - `uuid` - Användarens unika identifierare från den aktuella autentiseringstypen.
  - `userValues` - Valfritt. Annan användarinformation.

## Klientsidan

### `plugin.registerType()`

Registrerar klienten för autentiseringstypen.

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

#### Signatur

- `registerType(authType: string, options: AuthOptions)`

#### Typ

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

#### Detaljer

- `SignInForm` - Inloggningsformulär
- `SignInButton` - Inloggningsknapp (tredjepart), kan användas som ett alternativ till inloggningsformuläret.
- `SignUpForm` - Registreringsformulär
- `AdminSettingsForm` - Administrationsinställningsformulär

### Route

Auth-pluginet registrerar följande frontend-rutter:

- Auth-layout
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Inloggningssida
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Registreringssida
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`