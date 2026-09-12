# Moteur de stockage : Aliyun OSS

Un moteur de stockage basé sur Aliyun OSS. Avant de l'utiliser, vous devez préparer les comptes et les autorisations nécessaires.


:::warning Remarque

Ce moteur ne prend pas en charge l’accès privé. Après l’envoi d’un fichier, NocoBase génère une URL directement accessible, et toute personne disposant de cette URL peut accéder au fichier.

Même si le bucket OSS est privé, le moteur intégré Aliyun OSS ne génère pas d’URL signées temporaires pour l’accès aux fichiers. Si vous avez besoin d’un accès privé, utilisez [S3 Pro](./s3-pro.md). Si des fichiers historiques existent déjà, consultez [Migrer vers S3 Pro](./migrate-to-s3-pro.md).

:::

## Paramètres de configuration

![Exemple de configuration du moteur de stockage Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Remarque}
Cette section présente uniquement les paramètres spécifiques au moteur de stockage Aliyun OSS. Pour les paramètres généraux, consultez les [Paramètres généraux du moteur](./index.md#paramètres-communs).
:::

### URL de base

Saisissez le préfixe de l'URL d'accès aux fichiers, comme un domaine personnalisé associé au bucket actuel : `https://oss.example.com`. Le domaine par défaut d'Aliyun OSS peut amener le navigateur à télécharger les PDF. Nous recommandons d'associer d'abord un domaine personnalisé. Consultez les [Problèmes courants](#problèmes-courants) ci-dessous.

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

## Problèmes courants

### Le PDF est téléchargé au lieu d'être prévisualisé

NocoBase prévisualise les PDF d'une autre origine dans un iframe. Le navigateur accède directement à l'URL OSS. Les en-têtes de réponse déterminent donc si le fichier est affiché ou téléchargé.

Si le PDF est téléchargé depuis l'iframe, vérifiez la requête dans le panneau « Réseau » des outils de développement. Une réponse problématique typique ressemble à ceci :

```http
Content-Type: application/pdf
Content-Disposition: attachment
x-oss-force-download: true
```

`Content-Type: application/pdf` identifie correctement le fichier, mais `Content-Disposition: attachment` demande au navigateur de le télécharger. Le domaine par défaut d'Aliyun OSS force le téléchargement dans certains cas. Consultez la documentation officielle : [Configurer un PDF pour l'afficher au lieu de le télécharger](https://help.aliyun.com/zh/oss/user-guide/how-do-i-configure-an-object-to-be-previewed-instead-of-downloaded).

Nous recommandons la configuration suivante :

1. Suivez [Accéder aux ressources OSS avec un domaine personnalisé](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names) pour associer un domaine au bucket
2. Configurez le DNS et le certificat HTTPS, puis vérifiez que le domaine accède directement au fichier
3. Configurez l'URL d'accès du moteur de stockage utilisé par NocoBase

Pour l'étape 3 :

- Avec le moteur intégré **Aliyun OSS**, définissez **URL de base** sur le domaine associé, par exemple `https://oss.example.com`
- Avec [S3 Pro](./s3-pro.md) connecté à Aliyun OSS, l'endpoint d'envoi peut continuer à utiliser l'endpoint régional OSS ; définissez l'endpoint d'accès sur le domaine personnalisé et `Full access URL style` sur `Ignore`

Envoyez un nouveau PDF pour vérifier la configuration. Si un enregistrement existant stocke une URL complète, vérifiez aussi que l'URL renvoyée au frontend utilise maintenant le domaine personnalisé.

:::tip Vérifier les en-têtes

La prévisualisation d'un PDF inter-origines dans un iframe ne nécessite pas CORS. L'affichage intégré dépend principalement de `Content-Type` et de `Content-Disposition`. Ce problème est distinct de l'exigence CORS du bouton de téléchargement décrite ci-dessous.

:::

### L'image s'affiche, mais le bouton de téléchargement signale une erreur CORS

Les images sont généralement affichées avec `<img>` et les PDF inter-origines avec un iframe. Les deux peuvent afficher des ressources sans en-têtes CORS. Toutefois, le bouton de téléchargement lit le fichier avec `fetch` et crée un Blob. Cette requête est soumise à la politique de même origine du navigateur.

L'erreur suivante indique qu'OSS n'a pas renvoyé `Access-Control-Allow-Origin` pour le site NocoBase actuel :

```text
Access to fetch at 'https://oss.example.com/path/to/file.jpg' from origin
'https://example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Suivez le guide officiel [Configurer CORS](https://help.aliyun.com/zh/oss/user-guide/configure-cross-origin-resource-sharing) et créez une règle pour le bucket. Pour les téléchargements depuis le composant d'aperçu, utilisez des valeurs comme celles-ci :

| Paramètre | Valeur recommandée |
| --- | --- |
| Allowed Origins | L'origin complet de NocoBase, par exemple `https://example.com` |
| Allowed Methods | `GET`, `HEAD` |
| Allowed Headers | `*` |
| Expose Headers | `ETag`, `Content-Disposition` |
| MaxAgeSeconds | `600` |

Si S3 Pro envoie aussi des fichiers directement depuis le navigateur, ajoutez des méthodes comme `PUT` et `POST` selon les requêtes réelles du panneau « Réseau », ou créez une règle d'envoi séparée.

Après avoir enregistré la règle, demandez à nouveau le fichier avec l'origin du site NocoBase. La réponse doit au moins contenir :

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, HEAD
```

Le navigateur a peut-être déjà mis en cache la réponse utilisée pour afficher l'image. Cette requête ne contenait pas d'en-tête `Origin`, et la réponse en cache peut ne pas contenir `Access-Control-Allow-Origin`. Si le téléchargement échoue encore après la configuration de CORS, videz le cache du fichier ou activez « Désactiver le cache » dans les outils de développement, puis réessayez.

### Vérifier les en-têtes de réponse

Utilisez `curl` pour simuler une requête inter-origines depuis le site NocoBase. Remplacez l'origin, l'URL et les paramètres de signature de l'exemple par les valeurs réelles :

```bash
curl -sS -D - -o /dev/null \
  -H 'Origin: https://example.com' \
  'https://oss.example.com/path/to/file.pdf?<signed-query>'
```

Vérifiez les résultats suivants :

- L'aperçu PDF renvoie `Content-Type: application/pdf` sans `Content-Disposition: attachment`
- Le téléchargement inter-origines renvoie un `Access-Control-Allow-Origin` correspondant au site NocoBase
- L'URL réelle utilise le domaine personnalisé au lieu du domaine par défaut `*.oss-cn-*.aliyuncs.com`

Il est normal qu'une requête sans en-tête `Origin` ne reçoive pas d'en-têtes CORS. Conservez l'en-tête `Origin` de l'exemple pendant la vérification.

## Liens associés

- [Aperçu des fichiers](../file-preview/index.md)
- [S3 Pro](./s3-pro.md)
- [Migrer vers S3 Pro](./migrate-to-s3-pro.md)
- [Moteurs de stockage](./index.md)
