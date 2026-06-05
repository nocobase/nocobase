:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Se connecter avec Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Obtenir les identifiants Google OAuth 2.0

[Console Google Cloud](https://console.cloud.google.com/apis/credentials) - Créer des identifiants - ID client OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Accédez à l'interface de configuration et renseignez l'URL de redirection autorisée. Vous pouvez obtenir cette URL de redirection lors de l'ajout d'un authentificateur dans NocoBase. Elle est généralement de la forme `http(s)://host:port/api/oidc:redirect`. Pour plus de détails, consultez la section [Manuel de l'utilisateur - Configuration](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Ajouter un nouvel authentificateur sur NocoBase

Paramètres du plugin - Authentification utilisateur - Ajouter - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Référez-vous aux paramètres présentés dans la section [Manuel de l'utilisateur - Configuration](../index.md#configuration) pour finaliser la configuration de l'authentificateur.