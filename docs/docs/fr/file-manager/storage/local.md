# Moteur de stockage : Stockage local

Les fichiers téléchargés seront enregistrés dans un répertoire local sur le disque dur du serveur. Cette option convient aux scénarios où le volume total de fichiers gérés par le système est faible, ou à des fins expérimentales.


:::warning Remarque

Utilisez autant que possible les URL stables `/files/` pour les fichiers locaux afin que NocoBase puisse vérifier l’enregistrement et l’autorisation de consultation du rôle actuel. Les anciennes URL `/storage/uploads/` n’appliquent pas les autorisations au niveau de l’enregistrement, mais Docker, le Nginx intégré et les configurations générées par la CLI NocoBase les limitent par défaut aux utilisateurs connectés.

Si vous devez stocker des contrats, pièces d’identité, documents internes ou autres fichiers non publics, utilisez [S3 Pro](./s3-pro). Si des fichiers historiques existent déjà, consultez [Migrer vers S3 Pro](./migrate-to-s3-pro.md).

Si un Nginx personnalisé sert les fichiers locaux via `alias`, son emplacement `/storage/uploads/` doit utiliser `auth_request` pour appeler le endpoint d’authentification NocoBase. Sinon, il contourne le contrôle de connexion par défaut. Définissez également `X-Content-Type-Options: nosniff` et renvoyez les fichiers de contenu actif tels que `html`, `svg`, `xhtml` et `pdf` en pièces jointes. Consultez [Proxy inverse Nginx](../../nocobase-cli/production/reverse-proxy/nginx.md) pour un exemple complet et la configuration des sous-applications, ainsi que le [guide de sécurité : stockage de fichiers](../../security/guide.md#stockage-de-fichiers) pour les risques associés.

Si une intégration existante dépend de l’accès anonyme aux anciennes URL, définissez `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` et redémarrez l’application. Ce commutateur de compatibilité affecte uniquement `/storage/uploads/` et ne modifie pas les autorisations au niveau de l’enregistrement pour `/files/`.

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
