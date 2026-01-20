:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Reference API

## Na straně serveru

### Auth

Jádrové API, viz: [Auth](/api/auth/auth)

### BaseAuth

Jádrové API, viz: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Přehled

`AuthModel` je datový model autentikátoru (`Authenticator`, viz: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) a [Auth - constructor](/api/auth/auth#constructor)), který se používá v aplikacích NocoBase. Poskytuje metody pro interakci s kolekcí uživatelských dat. Kromě toho můžete využít i metody poskytované modelem Sequelize.

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

#### Metody třídy

- `findUser(uuid: string): UserModel` - Vyhledá uživatele podle `uuid`.
  - `uuid` - Unikátní identifikátor uživatele pro aktuální typ autentizace.

- `newUser(uuid: string, userValues?: any): UserModel` - Vytvoří nového uživatele a pomocí `uuid` ho propojí s aktuálním autentikátorem.
  - `uuid` - Unikátní identifikátor uživatele pro aktuální typ autentizace.
  - `userValues` - Volitelné. Další informace o uživateli. Pokud není předáno, `uuid` se použije jako uživatelské jméno.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Najde nebo vytvoří nového uživatele. Pravidla pro vytvoření jsou stejná jako výše.
  - `uuid` - Unikátní identifikátor uživatele pro aktuální typ autentizace.
  - `userValues` - Volitelné. Další informace o uživateli.

## Na straně klienta

### `plugin.registerType()`

Registruje klienta pro daný typ autentizace.

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

#### Podpis

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

#### Podrobnosti

- `SignInForm` - Přihlašovací formulář
- `SignInButton` - Tlačítko pro přihlášení (třetí strany), které lze použít jako alternativu k přihlašovacímu formuláři.
- `SignUpForm` - Registrační formulář
- `AdminSettingsForm` - Formulář pro konfiguraci administrace.

### Trasa

Plugin auth registruje následující frontendové trasy:

- Rozložení Auth
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Stránka pro přihlášení
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Stránka pro registraci
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`