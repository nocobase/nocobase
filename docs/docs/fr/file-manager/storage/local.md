# Moteur de stockage : Stockage local

Les fichiers téléchargés seront enregistrés dans un répertoire local sur le disque dur du serveur. Cette option convient aux scénarios où le volume total de fichiers gérés par le système est faible, ou à des fins expérimentales.


:::warning Remarque

Le stockage local ne prend pas en charge l’accès privé. Après l’envoi d’un fichier, NocoBase génère une URL directement accessible, et toute personne disposant de cette URL peut accéder au fichier.

Si vous devez stocker des contrats, pièces d’identité, documents internes ou autres fichiers non publics, utilisez [S3 Pro](./s3-pro). Si des fichiers historiques existent déjà, consultez [Migrer vers S3 Pro](./migrate-to-s3-pro.md).

Si vous n’utilisez pas Docker ni la configuration nginx officielle, et que vous accédez aux fichiers locaux téléversés via un proxy personnalisé, assurez-vous que le chemin `/storage/uploads/` définit `X-Content-Type-Options: nosniff` et renvoie les fichiers de contenu actif comme `html`, `svg`, `xhtml` et `pdf` en tant que pièces jointes. Pour plus de détails, consultez le [guide de sécurité : stockage de fichiers](../../security/guide.md).

:::

## Paramètres de configuration

![Exemple de configuration du moteur de stockage de fichiers](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Remarque}
Cette section présente uniquement les paramètres spécifiques au moteur de stockage local. Pour les paramètres généraux, veuillez consulter les [Paramètres généraux du moteur](./index.md#引擎通用参数).
:::

### Chemin

Il représente à la fois le chemin relatif de stockage des fichiers sur le serveur et le chemin d'accès via URL. Par exemple, « `user/avatar` » (sans les barres obliques au début et à la fin) représente :

1. Le chemin relatif sur le serveur où les fichiers téléchargés sont stockés : `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Le préfixe d'adresse URL pour accéder aux fichiers : `http://localhost:13000/storage/uploads/user/avatar`.
