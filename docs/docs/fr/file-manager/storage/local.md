:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Moteur de stockage : Stockage local

Les fichiers téléchargés seront enregistrés dans un répertoire local sur le disque dur du serveur. Cette option convient aux scénarios où le volume total de fichiers gérés par le système est faible, ou à des fins expérimentales.

## Paramètres de configuration

![Exemple de configuration du moteur de stockage de fichiers](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Remarque}
Cette section présente uniquement les paramètres spécifiques au moteur de stockage local. Pour les paramètres généraux, veuillez consulter les [Paramètres généraux du moteur](./index.md#引擎通用参数).
:::

### Chemin

Il représente à la fois le chemin relatif de stockage des fichiers sur le serveur et le chemin d'accès via URL. Par exemple, « `user/avatar` » (sans les barres obliques au début et à la fin) représente :

1. Le chemin relatif sur le serveur où les fichiers téléchargés sont stockés : `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Le préfixe d'adresse URL pour accéder aux fichiers : `http://localhost:13000/storage/uploads/user/avatar`.