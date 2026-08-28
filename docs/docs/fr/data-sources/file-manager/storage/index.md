---
title: "Moteurs de stockage de fichiers"
description: "Moteurs de stockage du champ de pièces jointes : stockage local, Alibaba Cloud OSS, Amazon S3, Tencent Cloud COS, S3 Pro, configuration du titre, du chemin, de l’URL d’accès, etc."
keywords: "Stockage de fichiers,Storage,OSS,S3,COS,Stockage local,Stockage cloud,NocoBase"
---

# Présentation

## Moteurs intégrés

NocoBase prend actuellement en charge les types de moteurs intégrés suivants :

- [Stockage local](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Lors de l’installation du système, un moteur de stockage local est automatiquement ajouté et peut être utilisé directement. Vous pouvez également ajouter un nouveau moteur ou modifier les paramètres d’un moteur existant.

## Paramètres généraux des moteurs

Outre les paramètres propres à chaque type de moteur, les paramètres suivants sont communs à tous les moteurs (avec le stockage local comme exemple) :

![Exemple de configuration d’un moteur de stockage de fichiers](https://static-docs.nocobase.com/20240529115151.png)

### Titre

Nom du moteur de stockage, utilisé pour l’identifier manuellement.

### Nom système

Nom système du moteur de stockage, utilisé pour l’identification par le système. Il doit être unique dans le système. S’il n’est pas renseigné, le système en génère automatiquement un de manière aléatoire.

### Base de l’URL d’accès

Préfixe de l’adresse URL permettant d’accéder publiquement au fichier. Il peut s’agir de la base de l’URL d’accès d’un CDN, par exemple : « `https://cdn.nocobase.com/app` » (sans le « `/` » final).

### Chemin

Chemin relatif utilisé lors du stockage des fichiers. Lors de l’accès, cette partie est également automatiquement concaténée à l’URL finale. Par exemple : « `user/avatar` » (sans « `/` » au début ni à la fin).

### Limite de taille des fichiers

Limite de taille appliquée aux fichiers téléversés vers ce moteur de stockage. Les fichiers dépassant cette limite ne pourront pas être téléversés. La limite par défaut du système est de 20 Mo, et peut être augmentée jusqu’à 1 Go.

### Types de fichiers

Vous pouvez limiter les types de fichiers téléversés en utilisant la syntaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Par exemple, `image/*` représente les fichiers image. Plusieurs types peuvent être séparés par des virgules anglaises, par exemple : `image/*, application/pdf` autorise les fichiers image et les fichiers PDF.

### Moteur de stockage par défaut

Une fois cette option cochée, le moteur est défini comme moteur de stockage par défaut du système. Lorsque aucun moteur de stockage n’est spécifié dans un champ de pièces jointes ou une table de fichiers, les fichiers téléversés sont enregistrés dans le moteur de stockage par défaut. Le moteur de stockage par défaut ne peut pas être supprimé.

### Conserver les fichiers lors de la suppression des enregistrements

Une fois cette option cochée, les fichiers déjà téléversés dans le moteur de stockage sont conservés lorsque les enregistrements de la table des pièces jointes ou de la table de fichiers sont supprimés. Cette option n’est pas cochée par défaut : lors de la suppression d’un enregistrement, les fichiers correspondants sont également supprimés du moteur de stockage.

:::info{title=Remarque}
Après le téléversement d’un fichier, le chemin d’accès final est constitué de plusieurs parties :

```
<访问 URL 基础>/<路径>/<文件名><后缀名>
```

Par exemple : `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::