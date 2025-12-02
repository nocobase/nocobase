:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Vue d'ensemble

## Moteurs intégrés

Actuellement, NocoBase prend en charge les types de moteurs intégrés suivants :

- [Stockage local](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Un moteur de stockage local est automatiquement ajouté lors de l'installation du système et peut être utilisé directement. Vous pouvez également ajouter de nouveaux moteurs ou modifier les paramètres de ceux qui existent déjà.

## Paramètres communs des moteurs

En plus des paramètres spécifiques à chaque type de moteur, les éléments suivants sont des paramètres communs (en prenant le stockage local comme exemple) :

![Exemple de configuration d'un moteur de stockage de fichiers](https://static-docs.nocobase.com/20240529115151.png)

### Titre

Le nom du moteur de stockage, utilisé pour l'identification humaine.

### Nom du système

Le nom système du moteur de stockage, utilisé pour l'identification par le système. Il doit être unique au sein du système. Si vous le laissez vide, il sera généré aléatoirement par le système.

### URL de base d'accès

Le préfixe de l'adresse URL permettant l'accès externe au fichier. Il peut s'agir de l'URL de base d'un CDN, par exemple : « `https://cdn.nocobase.com/app` » (sans le « `/` » final).

### Chemin

Le chemin relatif utilisé lors du stockage des fichiers. Cette partie sera également automatiquement ajoutée à l'URL finale lors de l'accès. Par exemple : « `user/avatar` » (sans le « `/` » initial ou final).

### Limite de taille de fichier

La limite de taille pour les fichiers téléchargés vers ce moteur de stockage. Les fichiers dépassant cette taille ne pourront pas être téléchargés. La limite par défaut du système est de 20 Mo, et la limite maximale ajustable est de 1 Go.

### Type de fichier

Vous pouvez limiter les types de fichiers qui peuvent être téléchargés en utilisant le format de description de la syntaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Par exemple, `image/*` représente les fichiers image. Plusieurs types peuvent être séparés par des virgules, comme : `image/*, application/pdf` pour autoriser les fichiers image et PDF.

### Moteur de stockage par défaut

Lorsque cette option est cochée, le moteur est défini comme moteur de stockage par défaut du système. Si un champ de pièce jointe ou une collection de fichiers ne spécifie pas de moteur de stockage, les fichiers téléchargés seront enregistrés dans le moteur de stockage par défaut. Le moteur de stockage par défaut ne peut pas être supprimé.

### Conserver les fichiers lors de la suppression des enregistrements

Lorsque cette option est cochée, les fichiers téléchargés dans le moteur de stockage sont conservés même lorsque les enregistrements de données de la collection de pièces jointes ou de la collection de fichiers sont supprimés. Par défaut, cette option n'est pas cochée, ce qui signifie que les fichiers du moteur de stockage sont supprimés en même temps que les enregistrements.

:::info{title=Conseil}
Après le téléchargement d'un fichier, le chemin d'accès final est construit en concaténant plusieurs parties :

```
<Access base URL>/<Path>/<FileName><Extension>
```

Par exemple : `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::