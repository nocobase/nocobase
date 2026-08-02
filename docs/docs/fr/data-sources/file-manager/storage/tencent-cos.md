---
title: "Tencent Cloud COS"
description: "Configuration du moteur de stockage Tencent Cloud COS : Bucket, Region, SecretId, téléversement de fichiers vers le stockage d’objets."
keywords: "Tencent Cloud COS, stockage d’objets Tencent Cloud, stockage COS, stockage cloud, NocoBase"
---

# Tencent Cloud COS

Le moteur de stockage basé sur Tencent Cloud COS nécessite de préparer au préalable les comptes et les autorisations correspondants.

## Paramètres de configuration

![Exemple de configuration du moteur de stockage Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Remarque}
Seuls les paramètres spécifiques au moteur de stockage Tencent Cloud COS sont présentés ici. Pour les paramètres communs, consultez les [paramètres communs des moteurs](./index.md#引擎通用参数).
:::

### Région

Indiquez la région du stockage COS, par exemple : `ap-chengdu`.

:::info{title=Remarque}
Vous pouvez consulter les informations de région de l’espace de stockage dans la [console Tencent Cloud COS](https://console.cloud.tencent.com/cos). Seul le préfixe de la région est nécessaire (le nom de domaine complet n’est pas requis).
:::

### SecretId

Indiquez l’ID de la clé d’accès autorisé Tencent Cloud.

### SecretKey

Indiquez le secret de la clé d’accès autorisé Tencent Cloud.

### Bucket

Indiquez le nom du bucket du stockage COS, par exemple : `qing-cdn-1234189398`.