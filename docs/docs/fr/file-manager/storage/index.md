:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Aperçu

## Introduction

Les moteurs de stockage sont utilisés pour enregistrer des fichiers sur des services spécifiques, tels que le stockage local (sur le disque dur du serveur), le stockage cloud, etc.

Avant de téléverser des fichiers, vous devez configurer un moteur de stockage. Le système ajoute automatiquement un moteur de stockage local lors de l'installation, que vous pouvez utiliser directement. Vous avez également la possibilité d'ajouter de nouveaux moteurs ou de modifier les paramètres de ceux qui existent déjà.

## Types de moteurs de stockage

Actuellement, NocoBase prend en charge les types de moteurs de stockage intégrés suivants :

- [Stockage local](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Le système ajoute automatiquement un moteur de stockage local lors de l'installation, que vous pouvez utiliser directement. Vous pouvez également ajouter de nouveaux moteurs ou modifier les paramètres de ceux qui existent déjà.

## Paramètres communs

En plus des paramètres spécifiques à chaque type de moteur, les sections suivantes décrivent les paramètres communs (en prenant le stockage local comme exemple) :

![Exemple de configuration d'un moteur de stockage de fichiers](https://static-docs.nocobase.com/20240529115151.png)

### Titre

Le nom du moteur de stockage, utilisé pour l'identification humaine.

### Nom système

Le nom système du moteur de stockage, utilisé pour l'identification par le système. Il doit être unique au sein du système. Si vous le laissez vide, le système en générera un aléatoirement.

### Préfixe d'URL publique

La partie préfixe de l'URL accessible publiquement pour le fichier. Il peut s'agir de l'URL de base d'un CDN, par exemple : "`https://cdn.nocobase.com/app`" (sans le "`/`" final).

### Chemin

Le chemin relatif utilisé lors du stockage des fichiers. Cette partie sera également automatiquement ajoutée à l'URL finale lors de l'accès. Par exemple : "`user/avatar`" (sans "`/`" au début ni à la fin).

### Limite de taille de fichier

La limite de taille pour les fichiers téléversés vers ce moteur de stockage. Les fichiers dépassant cette taille ne pourront pas être téléversés. La limite par défaut du système est de 20 Mo, et elle peut être ajustée jusqu'à un maximum de 1 Go.

### Types de fichiers

Vous pouvez restreindre les types de fichiers qui peuvent être téléversés en utilisant le format de description de la syntaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Par exemple : `image/*` représente les fichiers image. Plusieurs types peuvent être séparés par des virgules, comme : `image/*, application/pdf` qui autorise les fichiers image et PDF.

### Moteur de stockage par défaut

Lorsque cette option est cochée, ce moteur est défini comme le moteur de stockage par défaut du système. Si un champ de pièce jointe ou une **collection** de fichiers ne spécifie pas de moteur de stockage, les fichiers téléversés seront enregistrés dans le moteur de stockage par défaut. Le moteur de stockage par défaut ne peut pas être supprimé.

### Conserver le fichier lors de la suppression de l'enregistrement

Lorsque cette option est cochée, le fichier téléversé dans le moteur de stockage sera conservé même si l'enregistrement de données dans la table des pièces jointes ou la **collection** de fichiers est supprimé. Par défaut, cette option n'est pas cochée, ce qui signifie que le fichier dans le moteur de stockage sera supprimé en même temps que l'enregistrement.

:::info{title=Conseil}
Après le téléversement d'un fichier, le chemin d'accès final est construit en concaténant plusieurs parties :

```
<Préfixe d'URL publique>/<Chemin>/<Nom de fichier><Extension>
```

Par exemple : `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::