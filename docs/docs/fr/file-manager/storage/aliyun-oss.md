:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Moteur de stockage : Aliyun OSS

Un moteur de stockage basé sur Aliyun OSS. Avant de l'utiliser, vous devez préparer les comptes et les autorisations nécessaires.

## Paramètres de configuration

![Exemple de configuration du moteur de stockage Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Remarque}
Cette section présente uniquement les paramètres spécifiques au moteur de stockage Aliyun OSS. Pour les paramètres généraux, veuillez consulter les [Paramètres généraux du moteur](./index#引擎通用参数).
:::

### Région

Saisissez la région de stockage OSS, par exemple : `oss-cn-hangzhou`.

:::info{title=Remarque}
Vous pouvez consulter les informations de région de votre espace de stockage (bucket) dans la [console Aliyun OSS](https://oss.console.aliyun.com/). Il vous suffit d'utiliser le préfixe de la région (le nom de domaine complet n'est pas nécessaire).
:::

### AccessKey ID

Saisissez l'ID de votre clé d'accès Aliyun.

### AccessKey Secret

Saisissez le Secret de votre clé d'accès Aliyun.

### Bucket

Saisissez le nom du bucket OSS.

### Délai d'expiration

Saisissez le délai d'expiration pour le téléversement vers Aliyun OSS, en millisecondes. La valeur par défaut est de `60000` millisecondes (soit 60 secondes).