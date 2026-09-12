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
Lorsque « URL d’origine » est sélectionné, l’adresse finale du stockage est construite à partir de plusieurs parties :

```
<Préfixe d'URL publique>/<Chemin>/<Nom de fichier><Extension>
```

Par exemple : `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.

Lorsque « URL NocoBase » est sélectionné, l’enregistrement du fichier renvoie un chemin NocoBase au format `/files/...`. La configuration ci-dessus reste utilisée pour accéder au service de stockage.
:::

## URL des fichiers et contrôle d’accès

Un moteur de stockage peut renvoyer une URL NocoBase ou l’URL d’origine du service de stockage. L’URL NocoBase est utilisée par défaut. Sélectionnez l’URL d’origine uniquement lorsqu’un service externe doit utiliser directement l’adresse de stockage.

Cette configuration s’applique à chaque moteur de stockage. Après son enregistrement, les fichiers existants et les nouveaux fichiers téléversés dans ce moteur renvoient les URL sous la forme sélectionnée. Les fichiers ne sont ni déplacés ni téléversés de nouveau.

![Configuration de l’URL du fichier](https://static-docs.nocobase.com/20260723221234.png)

### URL NocoBase

L’enregistrement du fichier renvoie un chemin d’accès fourni par NocoBase, par exemple :

```text
/files/main/main/attachments/1.png
```

Les requêtes vers cette URL passent d’abord par NocoBase et respectent les autorisations de consultation configurées pour l’enregistrement de fichier correspondant. NocoBase lit le fichier ou redirige vers l’adresse générée par le service de stockage uniquement après validation des autorisations.

C’est le choix recommandé par défaut. L’enregistrement renvoie un chemin NocoBase, les appelants n’ont donc pas besoin de savoir si le stockage utilisé est local ou cloud.

### URL d’origine

L’enregistrement du fichier renvoie directement l’adresse générée par le service de stockage, par exemple :

```text
https://storage.example.com/path/to/file.png
```

Cette URL ne vérifie pas les autorisations de consultation de l’enregistrement. Pour le stockage local, il s’agit généralement d’une ancienne URL `/storage/uploads/`, qui exige une connexion par défaut sans vérifier à nouveau l’enregistrement individuel. Pour le stockage cloud, il s’agit généralement d’une adresse de stockage objet ou de CDN dont la politique d’accès est contrôlée par ce service.

Sélectionnez l’URL d’origine uniquement lorsque l’appelant ne peut pas utiliser une URL NocoBase, par exemple s’il ne peut pas suivre les redirections `302` ou s’il a explicitement besoin d’une adresse de stockage objet ou de CDN.

:::warning Remarque

Après avoir sélectionné l’URL d’origine, toute personne disposant d’une URL valide peut contourner les autorisations de l’enregistrement de fichier NocoBase. Pour le stockage local, l’ancienne URL reste soumise au contrôle de connexion de `/storage/uploads/` ; exposer directement le répertoire via un Nginx personnalisé peut contourner ce contrôle. Pour le stockage cloud, si l’URL ne possède ni signature ni expiration, assurez-vous que le bucket et le fichier autorisent la lecture publique.

:::

### Autoriser l’accès public

« Autoriser l’accès public » ne prend effet que lorsque « URL NocoBase » est sélectionné. Lorsque cette option est cochée, le moteur renvoie toujours une URL NocoBase, mais NocoBase ne vérifie plus les autorisations de l’enregistrement lors de l’accès. Toute personne disposant de l’URL peut accéder au fichier.

Cette option ne modifie pas la configuration de lecture publique du service de stockage. Elle contrôle uniquement si NocoBase vérifie les autorisations de l’enregistrement du fichier.

Markdown, les pages externes et les services tiers peuvent également utiliser une URL NocoBase publique. Pour une utilisation externe, complétez le chemin renvoyé par l’API en une URL absolue incluant le domaine NocoBase et assurez-vous que l’appelant peut suivre les redirections `302`.

:::warning Comportement du stockage local

Une URL NocoBase de stockage local redirige finalement vers `/storage/uploads/`. « Autoriser l’accès public » ignore les autorisations de l’enregistrement à l’étape `/files/`, mais l’ancienne URL exige toujours une connexion par défaut. Pour rendre les fichiers locaux lisibles anonymement, définissez également `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` et redémarrez l’application. Cette variable expose tout l’ancien chemin `/storage/uploads/`, pas seulement le stockage sélectionné ; évaluez donc tous les fichiers existants avant de l’activer.

Avec un Nginx personnalisé, configurez également `auth_request` pour `/storage/uploads/`. Consultez [Proxy inverse Nginx](../../nocobase-cli/production/reverse-proxy/nginx.md) pour la configuration complète.

:::

### Comment choisir

| Cas d’utilisation | URL du fichier | Autoriser l’accès public |
| --- | --- | --- |
| Les fichiers doivent respecter les autorisations de rôle et de données | URL NocoBase | Non coché |
| Markdown, une page externe ou un service tiers nécessite un accès public au fichier | URL NocoBase | Coché |
| L’appelant ne peut pas suivre les redirections `302` ou doit utiliser directement l’adresse de stockage | URL d’origine | Non applicable |

:::warning Remarque

[Le stockage local](./local), [Amazon S3](./amazon-s3), [Aliyun OSS](./aliyun-oss) et [Tencent COS](./tencent-cos) ne génèrent pas d’URL signées temporaires. Même avec l’URL NocoBase et les autorisations de l’enregistrement activées, l’adresse d’origine peut contourner ces autorisations. Les anciennes URL locales exigent toujours une connexion par défaut ; l’accès à une URL d’origine de stockage cloud dépend de la configuration de lecture publique du service.

Pour les contrats, pièces d’identité, documents internes ou autres fichiers qui ne doivent pas être publics, utilisez [S3 Pro](./s3-pro) et consultez sa configuration dédiée au contrôle d’accès.

:::

Si vous utilisez déjà un moteur de stockage public et souhaitez migrer les fichiers existants vers S3 Pro, consultez [Migrer vers S3 Pro](./migrate-to-s3-pro.md).
