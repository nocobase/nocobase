:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# API Referenz

## Serverseitig

### Auth

Dies ist eine Kern-API. Weitere Informationen finden Sie unter: [Auth](/api/auth/auth)

### BaseAuth

Dies ist eine Kern-API. Weitere Informationen finden Sie unter: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Überblick

`AuthModel` ist das Datenmodell für den Authentifikator (`Authenticator`), der in NocoBase-Anwendungen verwendet wird (Referenz: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) und [Auth - constructor](/api/auth/auth#constructor)). Es bietet Methoden zur Interaktion mit der Benutzerdaten-Sammlung. Darüber hinaus können Sie auch die vom Sequelize Model bereitgestellten Methoden verwenden.

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

#### Klassenmethoden

- `findUser(uuid: string): UserModel` - Sucht einen Benutzer anhand der `uuid`.
  - `uuid` - Die eindeutige Benutzerkennung des aktuellen Authentifizierungstyps.

- `newUser(uuid: string, userValues?: any): UserModel` - Erstellt einen neuen Benutzer und bindet ihn über die `uuid` an den aktuellen Authentifikator.
  - `uuid` - Die eindeutige Benutzerkennung des aktuellen Authentifizierungstyps.
  - `userValues` - Optional. Weitere Benutzerinformationen. Wenn nicht angegeben, wird die `uuid` als Benutzername verwendet.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Sucht einen Benutzer oder erstellt einen neuen. Die Erstellungsregeln sind die gleichen wie oben beschrieben.
  - `uuid` - Die eindeutige Benutzerkennung des aktuellen Authentifizierungstyps.
  - `userValues` - Optional. Weitere Benutzerinformationen.

## Clientseitig

### `plugin.registerType()`

Registriert den Client für einen Authentifizierungstyp.

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

#### Details

- `SignInForm` - Anmeldeformular
- `SignInButton` - Anmelde-Button (Drittanbieter). Kann alternativ zum Anmeldeformular verwendet werden.
- `SignUpForm` - Registrierungsformular
- `AdminSettingsForm` - Administrations-Konfigurationsformular

### Route

Das Auth-Plugin registriert die folgenden Frontend-Routen:

- Auth-Layout
  - Name: `auth`
  - Pfad: `-`
  - Komponente: `AuthLayout`

- Anmeldeseite
  - Name: `auth.signin`
  - Pfad: `/signin`
  - Komponente: `SignInPage`

- Registrierungsseite
  - Name: `auth.signup`
  - Pfad: `/signup`
  - Komponente: `SignUpPage`