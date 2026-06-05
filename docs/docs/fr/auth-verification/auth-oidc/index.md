---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Authentification : OIDC

## Introduction

Le plugin Authentification : OIDC suit la norme de protocole OIDC (OpenID Connect) et utilise le flux de code d'autorisation (Authorization Code Flow) pour permettre aux utilisateurs de se connecter à NocoBase en utilisant des comptes fournis par des fournisseurs de services d'identité tiers (IdP).

## Activer le plugin

![](https://static-docs.nocobase.com/202411122358790.png)

## Ajouter une authentification OIDC

Accédez à la page de gestion des plugins d'authentification utilisateur.

![](https://static-docs.nocobase.com/202411130004459.png)

Ajouter - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Configuration

### Configuration de base

![](https://static-docs.nocobase.com/202411130006341.png)

| Configuration                                      | Description                                                                                                                                                                | Version        |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Sign up automatically when the user does not exist | Indique si un nouvel utilisateur doit être créé automatiquement si aucun utilisateur existant correspondant n'est trouvé.                                                  | -              |
| Issuer                                             | L'issuer est fourni par l'IdP et se termine généralement par `/.well-known/openid-configuration`.                                                                           | -              |
| Client ID                                          | L'ID client                                                                                                                                                                | -              |
| Client Secret                                      | Le secret client                                                                                                                                                           | -              |
| scope                                              | Facultatif, par défaut : `openid email profile`.                                                                                                                           | -              |
| id_token signed response algorithm                 | L'algorithme de signature pour l'`id_token`, par défaut : `RS256`.                                                                                                         | -              |
| Enable RP-initiated logout                         | Active la déconnexion initiée par le RP (RP-initiated logout). Déconnecte la session IdP lorsque l'utilisateur se déconnecte. L'URL de redirection post-déconnexion (Post logout redirect URL) de l'IdP doit être celle fournie dans la section [Utilisation](#utilisation). | `v1.3.44-beta` |

### Mappage des champs

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Configuration                   | Description                                                                                                                                                      |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Mappage des champs. NocoBase prend actuellement en charge le mappage de champs tels que le surnom, l'e-mail et le numéro de téléphone. Le surnom par défaut utilise `openid`. |
| Use this field to bind the user | Champ utilisé pour faire correspondre et lier l'utilisateur à un utilisateur existant. Vous pouvez choisir l'e-mail ou le nom d'utilisateur, l'e-mail étant la valeur par défaut. Les informations utilisateur fournies par l'IdP doivent inclure les champs `email` ou `username`. |

### Configuration avancée

![](https://static-docs.nocobase.com/202411130013306.png)

| Configuration                                                     | Description                                                                                                                                                                                                                                                         | Version        |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------- |
| HTTP                                                              | Indique si l'URL de rappel de NocoBase utilise le protocole HTTP, par défaut : `https`.                                                                                                                                                                             | -              |
| Port                                                              | Port de l'URL de rappel de NocoBase, par défaut : `443/80`.                                                                                                                                                                                                         | -              |
| State token                                                       | Utilisé pour vérifier la source de la requête et prévenir les attaques CSRF. Vous pouvez fournir une valeur fixe, mais **il est fortement recommandé de laisser ce champ vide pour générer des valeurs aléatoires par défaut. Si vous utilisez une valeur fixe, veuillez évaluer attentivement votre environnement et les risques de sécurité.** | -              |
| Pass parameters in the authorization code grant exchange          | Lors de l'échange d'un code contre un jeton, certains IdP peuvent exiger que l'ID client ou le secret client soient transmis en tant que paramètres. Vous pouvez cocher cette option et spécifier les noms de paramètres correspondants.                                | -              |
| Method to call the user info endpoint                             | Méthode HTTP utilisée lors de l'appel de l'API d'informations utilisateur.                                                                                                                                                                                          | -              |
| Where to put the access token when calling the user info endpoint | Méthode de transmission du jeton d'accès (access token) lors de l'appel de l'API d'informations utilisateur :<br/>- Header - Dans l'en-tête de la requête (par défaut).<br />- Body - Dans le corps de la requête, à utiliser avec la méthode `POST`.<br />- Query parameters - En tant que paramètres de requête, à utiliser avec la méthode `GET`. | -              |
| Skip SSL verification                                             | Ignore la vérification SSL lors de l'appel de l'API IdP. **Cette option expose votre système aux risques d'attaques de l'homme du milieu (man-in-the-middle). N'activez cette option que si vous comprenez clairement son objectif et ses implications. Son utilisation est fortement déconseillée dans les environnements de production.** | `v1.3.40-beta` |

### Utilisation

![](https://static-docs.nocobase.com/202411130019570.png)

| Configuration            | Description                                                                                    |
| :----------------------- | :--------------------------------------------------------------------------------------------- |
| Redirect URL             | Utilisé pour configurer l'URL de rappel (callback URL) dans l'IdP.                                                 |
| Post logout redirect URL | Utilisé pour configurer l'URL de redirection post-déconnexion (Post logout redirect URL) dans l'IdP lorsque la déconnexion initiée par le RP est activée. |

:::info
Lors des tests locaux, veuillez utiliser `127.0.0.1` au lieu de `localhost` pour l'URL. En effet, la méthode de connexion OIDC nécessite l'écriture d'un état (state) dans le cookie du client pour la validation de sécurité. Si la fenêtre de connexion apparaît brièvement puis disparaît sans succès, veuillez vérifier les journaux du serveur pour d'éventuels problèmes de non-concordance de l'état (state mismatch) et assurez-vous que le paramètre `state` est inclus dans le cookie de la requête. Cette situation se produit généralement lorsque l'état (state) dans le cookie du client ne correspond pas à l'état (state) transmis dans la requête.
:::

## Connexion

Accédez à la page de connexion et cliquez sur le bouton situé sous le formulaire de connexion pour initier une connexion tierce.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)