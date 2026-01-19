:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Referencje API

## Strona serwera

### Auth

Podstawowe API, zobacz: [Auth](/api/auth/auth)

### BaseAuth

Podstawowe API, zobacz: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Omówienie

`AuthModel` to model danych autentykatora (`Authenticator`, zobacz: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) oraz [Auth - constructor](/api/auth/auth#constructor)) używany w aplikacjach NocoBase. Dostarcza on metody do interakcji z kolekcją danych użytkowników. Ponadto, mogą Państwo również korzystać z metod udostępnianych przez Sequelize Model.

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

#### Metody klasy

- `findUser(uuid: string): UserModel` - Wyszukuje użytkownika za pomocą `uuid`.
  - `uuid` - Unikalny identyfikator użytkownika dla bieżącego typu uwierzytelniania.

- `newUser(uuid: string, userValues?: any): UserModel` - Tworzy nowego użytkownika i wiąże go z bieżącym autentykatorem za pomocą `uuid`.
  - `uuid` - Unikalny identyfikator użytkownika dla bieżącego typu uwierzytelniania.
  - `userValues` - Opcjonalne. Dodatkowe informacje o użytkowniku. Jeśli nie zostaną przekazane, `uuid` zostanie użyte jako nazwa użytkownika.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Wyszukuje lub tworzy nowego użytkownika. Zasady tworzenia są takie same jak powyżej.
  - `uuid` - Unikalny identyfikator użytkownika dla bieżącego typu uwierzytelniania.
  - `userValues` - Opcjonalne. Dodatkowe informacje o użytkowniku.

## Strona klienta

### `plugin.registerType()`

Rejestruje klienta dla danego typu uwierzytelniania.

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

#### Sygnatura

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

#### Szczegóły

- `SignInForm` - Formularz logowania
- `SignInButton` - Przycisk logowania (strony trzeciej), może być użyty zamiennie z formularzem logowania.
- `SignUpForm` - Formularz rejestracji
- `AdminSettingsForm` - Formularz ustawień administracyjnych

### Trasy

Wtyczka auth rejestruje następujące trasy front-endowe:

- Układ Auth
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Strona logowania
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Strona rejestracji
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`