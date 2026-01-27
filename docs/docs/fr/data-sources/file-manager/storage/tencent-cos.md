:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Tencent COS

Un moteur de stockage basé sur Tencent Cloud COS. Avant de l'utiliser, vous devez préparer les comptes et les autorisations nécessaires.

## Options de configuration

![Exemple d'options de configuration Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Astuce}
Cette section couvre uniquement les options spécifiques au moteur de stockage Tencent Cloud COS. Pour les paramètres génériques, veuillez consulter les [Paramètres génériques du moteur](./index.md#common-engine-parameters).
:::

### Région

Saisissez la région de stockage COS, par exemple : `ap-chengdu`.

:::info{title=Astuce}
Vous pouvez consulter les informations de région de votre compartiment de stockage dans la [Console Tencent Cloud COS](https://console.cloud.tencent.com/cos). Il suffit de ne prendre que la partie préfixe de la région (sans le nom de domaine complet).
:::

### SecretId

Saisissez l'ID de la clé d'accès autorisée Tencent Cloud.

### SecretKey

Saisissez le Secret de la clé d'accès autorisée Tencent Cloud.

### Compartiment

Saisissez le nom du compartiment COS, par exemple : `qing-cdn-1234189398`.