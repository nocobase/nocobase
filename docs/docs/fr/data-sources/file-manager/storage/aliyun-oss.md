---
title: "Alibaba Cloud OSS"
description: "Configuration du moteur de stockage Alibaba Cloud OSS : Bucket, Endpoint, AccessKey, avec prise en charge des accès publics et privés."
keywords: "Alibaba Cloud OSS, stockage d’objets Alibaba Cloud, stockage OSS, stockage cloud, NocoBase"
---

# Alibaba Cloud OSS

Le moteur de stockage basé sur Alibaba Cloud OSS nécessite de préparer au préalable les comptes et les autorisations nécessaires.

## Paramètres de configuration

![Exemple de configuration du moteur de stockage Alibaba Cloud OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Astuce}
Seuls les paramètres spécifiques au moteur de stockage Alibaba Cloud OSS sont présentés ici. Pour les paramètres communs, consultez les [paramètres généraux des moteurs](./index.md#引擎通用参数).
:::

### Région

Saisissez la région du stockage OSS, par exemple : `oss-cn-hangzhou`.

:::info{title=Astuce}
Vous pouvez consulter les informations relatives à la région de l’espace de stockage dans la [console Alibaba Cloud OSS](https://oss.console.aliyun.com/). Seul le préfixe de la région doit être indiqué (le nom de domaine complet n’est pas nécessaire).
:::

### AccessKey ID

Saisissez l’ID de la clé d’accès autorisée Alibaba Cloud.

### AccessKey Secret

Saisissez le Secret de la clé d’accès autorisée Alibaba Cloud.

### Bucket

Saisissez le nom du bucket de stockage OSS.