---
title: "Stockage local"
description: "Le moteur de stockage local enregistre les fichiers sur le disque dur du serveur. Il permet de configurer le chemin de stockage et l’URL d’accès, et convient aux déploiements sur une seule machine."
keywords: "Stockage local,Local Storage,stockage de fichiers,disque dur du serveur,NocoBase"
---

# Stockage local

Les fichiers téléversés sont enregistrés dans le répertoire du disque dur local du serveur. Cette solution convient lorsque le volume total de fichiers téléversés par le système reste limité ou dans des scénarios expérimentaux.

## Paramètres de configuration

![Exemple de configuration du moteur de stockage de fichiers](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Remarque}
Seuls les paramètres spécifiques au moteur de stockage local sont présentés ici. Pour les paramètres communs, consultez les [paramètres communs des moteurs](./index.md#引擎通用参数).
:::

### Chemin

Ce paramètre indique à la fois le chemin relatif de stockage des fichiers sur le serveur et le chemin d’accès par URL. Par exemple, « `user/avatar` » (sans « `/` » au début ni à la fin) représente :

1. Le chemin relatif sur le serveur où les fichiers téléversés sont stockés : `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. L’URL de base utilisée pour accéder aux fichiers : `http://localhost:13000/storage/uploads/user/avatar`.
