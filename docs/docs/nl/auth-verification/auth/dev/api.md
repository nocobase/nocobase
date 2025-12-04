:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# API-referentie

## Serverzijde

### Auth

Kern-API, zie: [Auth](/api/auth/auth)

### BaseAuth

Kern-API, zie: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Overzicht

`AuthModel` is het gegevensmodel voor de authenticators (`Authenticator`, zie: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) en [Auth - constructor](/api/auth/auth#constructor)) die in NocoBase-applicaties worden gebruikt. Het biedt methoden voor interactie met de gebruikersgegevenscollectie. Daarnaast kunt u ook de methoden gebruiken die door het Sequelize Model worden aangeboden.

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

#### Klassemethoden

- `findUser(uuid: string): UserModel` - Zoekt een gebruiker op via de `uuid`.
  - `uuid` - De unieke identificatie van de gebruiker, afkomstig van het huidige authenticatietype.

- `newUser(uuid: string, userValues?: any): UserModel` - Maakt een nieuwe gebruiker aan en koppelt deze via de `uuid` aan de huidige authenticator.
  - `uuid` - De unieke identificatie van de gebruiker, afkomstig van het huidige authenticatietype.
  - `userValues` - Optioneel. Andere gebruikersinformatie. Indien niet opgegeven, wordt de `uuid` gebruikt als gebruikersnaam.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Zoekt een gebruiker of maakt een nieuwe aan, volgens dezelfde regels als hierboven beschreven.
  - `uuid` - De unieke identificatie van de gebruiker, afkomstig van het huidige authenticatietype.
  - `userValues` - Optioneel. Andere gebruikersinformatie.

## Clientzijde

### `plugin.registerType()`

Registreert de client voor het authenticatietype.

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

#### Handtekening

- `registerType(authType: string, options: AuthOptions)`

#### Type

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

#### Details

- `SignInForm` - Inlogformulier
- `SignInButton` - Inlogknop (voor derden), kan als alternatief voor het inlogformulier worden gebruikt.
- `SignUpForm` - Registratieformulier
- `AdminSettingsForm` - Beheerconfiguratieformulier

### Route

De frontend-routes voor het registreren van de auth-plugin zijn als volgt:

- Auth-lay-out
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Inlogpagina
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Registratiepagina
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`