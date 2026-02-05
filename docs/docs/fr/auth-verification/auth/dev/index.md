:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Étendre les types d'authentification

## Vue d'ensemble

NocoBase vous permet d'étendre les types d'authentification utilisateur selon vos besoins. L'authentification utilisateur se divise généralement en deux catégories : la première consiste à vérifier l'identité de l'utilisateur directement au sein de l'application NocoBase (par exemple, connexion par mot de passe, connexion par SMS) ; la seconde implique des services tiers qui vérifient l'identité et notifient l'application NocoBase du résultat via des rappels (par exemple, OIDC, SAML). Le processus d'authentification pour ces deux types de méthodes dans NocoBase est le suivant :

### Sans rappel tiers

1.  Le client utilise le SDK NocoBase pour appeler l'interface de connexion `api.auth.signIn()`, en demandant l'interface `auth:signIn`. Il transmet également l'identifiant de l'authentificateur utilisé via l'en-tête de requête `X-Authenticator` au backend.
2.  L'interface `auth:signIn`, en se basant sur l'identifiant de l'authentificateur présent dans l'en-tête de la requête, redirige vers le type d'authentification correspondant. La méthode `validate` de la classe d'authentification enregistrée pour ce type gère ensuite le traitement logique.
3.  Le client récupère les informations utilisateur et le `token` d'authentification de la réponse de l'interface `auth:signIn`, enregistre le `token` dans le stockage local (Local Storage) et finalise la connexion. Cette étape est gérée automatiquement en interne par le SDK.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Avec rappel tiers

1.  Le client obtient l'URL de connexion tierce via une interface qu'il a lui-même enregistrée (par exemple, `auth:getAuthUrl`), et transmet, conformément au protocole, des informations telles que le nom de l'application et l'identifiant de l'authentificateur.
2.  L'utilisateur est redirigé vers l'URL tierce pour finaliser la connexion. Le service tiers appelle ensuite l'interface de rappel de l'application NocoBase (que vous devez enregistrer vous-même, par exemple `auth:redirect`), renvoie le résultat de l'authentification, ainsi que le nom de l'application et l'identifiant de l'authentificateur.
3.  Dans la méthode de l'interface de rappel, les paramètres sont analysés pour obtenir l'identifiant de l'authentificateur. Ensuite, la classe d'authentification correspondante est récupérée via `AuthManager`, et la méthode `auth.signIn()` est appelée de manière proactive. La méthode `auth.signIn()` appellera à son tour la méthode `validate()` pour gérer la logique d'authentification.
4.  Une fois que la méthode de rappel a obtenu le `token` d'authentification, elle effectue une redirection 302 vers la page frontend, en incluant le `token` et l'identifiant de l'authentificateur dans les paramètres de l'URL, par exemple `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Nous allons maintenant vous montrer comment enregistrer les interfaces côté serveur et les interfaces utilisateur côté client.

## Côté serveur

### Interface d'authentification

Le noyau de NocoBase offre la possibilité d'enregistrer et de gérer des types d'authentification étendus. Pour gérer la logique principale d'un plugin d'authentification étendu, vous devez hériter de la classe abstraite `Auth` du noyau et implémenter les interfaces standard correspondantes.  
Pour une référence API complète, consultez [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Le noyau enregistre également les opérations de ressources de base liées à l'authentification utilisateur.

| API            | Description                       |
| -------------- | --------------------------------- |
| `auth:check`   | Vérifie si l'utilisateur est connecté |
| `auth:signIn`  | Connexion                         |
| `auth:signUp`  | Inscription                       |
| `auth:signOut` | Déconnexion                       |

Dans la plupart des cas, les types d'authentification utilisateur étendus peuvent également s'appuyer sur la logique d'authentification JWT existante pour générer les identifiants d'accès API pour l'utilisateur. La classe `BaseAuth` du noyau fournit une implémentation de base de la classe abstraite `Auth`. Pour plus de détails, consultez [BaseAuth](../../../api/auth/base-auth.md). Les plugins peuvent hériter directement de la classe `BaseAuth` afin de réutiliser une partie du code logique et de réduire les coûts de développement.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Définir la collection d'utilisateurs
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Implémenter la logique d'authentification utilisateur
  async validate() {}
}
```

### Données utilisateur

Lors de l'implémentation de la logique d'authentification utilisateur, le traitement des données utilisateur est généralement impliqué. Dans une application NocoBase, les `collections` associées sont définies par défaut comme suit :

| Collection            | Rôle                                                                                                                             | Plugin                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `users`               | Stocke les informations utilisateur (e-mail, pseudonyme, mot de passe, etc.)                                                     | [Plugin utilisateur (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Stocke les informations des authentificateurs (entités de type d'authentification), correspondant au type et à la configuration de l'authentification | Plugin d'authentification utilisateur (`@nocobase/plugin-auth`) |
| `usersAuthenticators` | Associe les utilisateurs et les authentificateurs, et enregistre les informations utilisateur sous l'authentificateur correspondant | Plugin d'authentification utilisateur (`@nocobase/plugin-auth`) |

Généralement, les méthodes de connexion étendues utilisent les `collections` `users` et `usersAuthenticators` pour stocker les données utilisateur correspondantes. Ce n'est que dans des cas particuliers que vous devrez ajouter une nouvelle `collection` vous-même.

Les champs principaux de `usersAuthenticators` sont :

| Champ           | Description                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `uuid`          | Identifiant unique de l'utilisateur pour ce type d'authentification (par exemple, numéro de téléphone, OpenID WeChat, etc.) |
| `meta`          | Champ JSON pour d'autres informations à enregistrer                                                     |
| `userId`        | ID utilisateur                                                                                          |
| `authenticator` | Nom de l'authentificateur (identifiant unique)                                                          |

Pour les opérations de recherche et de création d'utilisateurs, le modèle de données `AuthModel` des `authenticators` encapsule également plusieurs méthodes que vous pouvez utiliser dans la classe `CustomAuth` via `this.authenticator[nomDeLaMéthode]`. Pour une référence API complète, consultez [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Rechercher un utilisateur
    this.authenticator.newUser(); // Créer un nouvel utilisateur
    this.authenticator.findOrCreateUser(); // Rechercher ou créer un nouvel utilisateur
    // ...
  }
}
```

### Enregistrement du type d'authentification

La méthode d'authentification étendue doit être enregistrée auprès du module de gestion de l'authentification.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Côté client

L'interface utilisateur côté client est enregistrée via l'interface `registerType` fournie par le client du `plugin` d'authentification utilisateur :

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Formulaire de connexion
        SignInButton, // Bouton de connexion (tiers), peut être une alternative au formulaire de connexion
        SignUpForm, // Formulaire d'inscription
        AdminSettingsForm, // Formulaire de paramètres d'administration
      },
    });
  }
}
```

### Formulaire de connexion

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Si plusieurs authentificateurs correspondant à un type d'authentification ont enregistré des formulaires de connexion, ils seront affichés sous forme d'onglets. Le titre de l'onglet sera celui de l'authentificateur configuré dans le panneau d'administration.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Bouton de connexion

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Il s'agit généralement de boutons de connexion tiers, mais cela peut en fait être n'importe quel composant.

### Formulaire d'inscription

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Si vous devez passer de la page de connexion à la page d'inscription, vous devrez gérer cette logique vous-même dans le composant de connexion.

### Formulaire de paramètres d'administration

![](https://static-docs.nocobase.com/f4b544b5b0f4afee5621ad4abf66b24f.png)

La partie supérieure présente la configuration générique de l'authentificateur, tandis que la partie inférieure correspond à la section du formulaire de configuration personnalisée qui peut être enregistrée.

### Requêtes API

Pour initier des requêtes d'interface liées à l'authentification utilisateur côté client, vous pouvez utiliser le SDK fourni par NocoBase.

```ts
import { useAPIClient } from '@nocobase/client';

// À utiliser dans un composant
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Pour les références API détaillées, consultez [@nocobase/sdk - Auth](/api/sdk/auth).