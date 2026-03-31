:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Référence de l'API

## Côté Serveur

### Auth

API interne, référence : [Auth](/api/auth/auth)

### BaseAuth

API interne, référence : [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Aperçu

`AuthModel` est le modèle de données de l'authentificateur (`Authenticator`, référence : [AuthManager - setStorer](/api/auth/auth-manager#setstorer) et [Auth - constructor](/api/auth/auth#constructor)) utilisé dans les applications NocoBase. Il offre des méthodes pour interagir avec la collection de données utilisateur. De plus, vous pouvez également utiliser les méthodes fournies par le modèle Sequelize.

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

#### Méthodes de classe

- `findUser(uuid: string): UserModel` - Interroge un utilisateur par son `uuid`.
  - `uuid` - Identifiant unique de l'utilisateur pour le type d'authentification actuel.

- `newUser(uuid: string, userValues?: any): UserModel` - Crée un nouvel utilisateur et le lie à l'authentificateur actuel via son `uuid`.
  - `uuid` - Identifiant unique de l'utilisateur pour le type d'authentification actuel.
  - `userValues` - Optionnel. Autres informations utilisateur. Si non fourni, le `uuid` sera utilisé comme pseudonyme de l'utilisateur.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Trouve ou crée un nouvel utilisateur, les règles de création sont les mêmes que ci-dessus.
  - `uuid` - Identifiant unique de l'utilisateur pour le type d'authentification actuel.
  - `userValues` - Optionnel. Autres informations utilisateur.

## Côté Client

### `plugin.registerType()`

Enregistre le client du type d'authentification.

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

#### Signature

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

#### Détails

- `SignInForm` - Formulaire de connexion
- `SignInButton` - Bouton de connexion (tiers), peut être utilisé comme alternative au formulaire de connexion.
- `SignUpForm` - Formulaire d'inscription
- `AdminSettingsForm` - Formulaire de configuration administrateur

### Route

Le plugin `auth` enregistre les routes frontend suivantes :

- Mise en page d'authentification
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Page de connexion
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Page d'inscription
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`