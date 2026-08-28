# Tencent Cloud COS

Un moteur de stockage basé sur Tencent Cloud COS. Avant de l'utiliser, vous devrez préparer les comptes et les autorisations nécessaires.


:::warning Remarque

Ce moteur ne prend pas en charge l’accès privé. Après l’envoi d’un fichier, NocoBase génère une URL directement accessible, et toute personne disposant de cette URL peut accéder au fichier.

Même si le bucket COS est privé, le moteur intégré Tencent COS ne génère pas d’URL signées temporaires pour l’accès aux fichiers. Si vous avez besoin d’un accès privé, utilisez [S3 Pro](./s3-pro). Si des fichiers historiques existent déjà, consultez [Migrer vers S3 Pro](./migrate-to-s3-pro.md).

:::

## Paramètres de configuration

![Exemple de configuration du moteur de stockage Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Note}
Cette section présente uniquement les paramètres spécifiques au moteur de stockage Tencent Cloud COS. Pour les paramètres généraux, veuillez consulter les [Paramètres généraux du moteur](./index.md#general-engine-parameters).
:::

### Région

Saisissez la région de stockage COS, par exemple : `ap-chengdu`.

:::info{title=Note}
Vous pouvez consulter les informations de région de votre compartiment (bucket) dans la [console Tencent Cloud COS](https://console.cloud.tencent.com/cos). Il vous suffit d'utiliser le préfixe de la région (le nom de domaine complet n'est pas nécessaire).
:::

### SecretId

Saisissez l'ID de votre clé d'accès Tencent Cloud.

### SecretKey

Saisissez le Secret de votre clé d'accès Tencent Cloud.

### Compartiment (Bucket)

Saisissez le nom du compartiment (bucket) COS, par exemple : `qing-cdn-1234189398`.