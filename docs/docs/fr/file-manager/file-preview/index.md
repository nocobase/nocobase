---
pkg: '@nocobase/plugin-file-manager'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Aperçu des fichiers

Dans les interfaces contenant des champs de fichier, y compris des champs de pièces jointes, vous pouvez prévisualiser les fichiers en cliquant sur la miniature ou l'icône du fichier. La fonction d'aperçu intégrée prend en charge plusieurs types de fichiers, notamment les images, les PDF et la plupart des types de fichiers pris en charge nativement par les navigateurs.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

Pour les types de fichiers qui ne prennent pas en charge l'aperçu natif, vous pouvez activer l'aperçu en installant ou en étendant les plugins de prévisualisation de fichiers correspondants. Par exemple, après avoir installé le plugin d'aperçu des fichiers Office, vous pouvez prévisualiser les fichiers Word, Excel et PowerPoint.

NocoBase fournit actuellement les plugins d'aperçu de fichiers suivants :

- [Plugin d'aperçu des fichiers Office](./ms-office.md)

## Fonctionnement de l'aperçu PDF

NocoBase choisit le mode d'aperçu selon que l'URL du fichier PDF a la même origine que la page actuelle :

| URL du fichier | Stockage courant | Mode d'aperçu | Exigence CORS |
| --- | --- | --- | --- |
| Même origine que NocoBase | Stockage local | NocoBase lit le fichier et le rend avec PDF.js intégré | Aucun CORS inter-origines |
| Origine différente | Stockage externe comme OSS, S3, COS ou CDN | Le navigateur ouvre l'URL dans un iframe | L'aperçu dans l'iframe ne nécessite pas CORS |

:::tip Critère de sélection

Le mode d'aperçu dépend de l'origine de l'URL, et non directement du nom du moteur de stockage. Un stockage local servi depuis un domaine de fichiers distinct est traité comme une origine différente. Un stockage externe accessible par un proxy NocoBase de même origine est traité comme étant de même origine.

:::

### Stockage local ou URL de même origine

Les URL du stockage local commencent généralement par `/storage/uploads/` et ont la même origine que la page NocoBase. Pour l'aperçu, NocoBase lit les données PDF, puis utilise PDF.js intégré pour rendre les pages et le texte.

Cette méthode ne dépend pas du lecteur PDF intégré au navigateur. Même si la réponse utilise `Content-Disposition: attachment` pour des raisons de sécurité, NocoBase peut lire et rendre le fichier dans le composant d'aperçu. L'URL doit rester accessible avec la session actuelle.

### Stockage externe ou URL d'une autre origine

OSS, S3, COS et les CDN utilisent généralement un domaine distinct. NocoBase place l'URL du PDF dans un iframe. Le résultat dépend donc du navigateur et des en-têtes de réponse du service de stockage.

Pour ouvrir le PDF dans l'iframe, le service doit normalement renvoyer `Content-Type: application/pdf` et ne pas forcer le téléchargement avec `Content-Disposition: attachment`. Si la réponse impose un téléchargement, le navigateur télécharge directement le fichier et NocoBase ne peut pas remplacer ce comportement dans le frontend.

Le chargement d'un PDF inter-origines dans un iframe ne nécessite pas CORS. Toutefois, le bouton de téléchargement lit le fichier avec `fetch` et crée un Blob. Les téléchargements inter-origines exigent donc que le service autorise les requêtes CORS provenant du site NocoBase.

### Remarques concernant Aliyun OSS

Dans certains cas, le domaine par défaut d'Aliyun OSS force le téléchargement en renvoyant `Content-Disposition: attachment` et `x-oss-force-download: true`. Les images peuvent rester visibles, tandis qu'un PDF ouvert dans l'iframe est téléchargé.

Vous pouvez généralement résoudre ce problème en associant un domaine personnalisé au bucket et en configurant NocoBase pour accéder aux fichiers par ce domaine. Consultez les [problèmes courants d'Aliyun OSS](../storage/aliyun-oss.md#problèmes-courants) pour la configuration et le diagnostic.

### Limite de sécurité de l'aperçu inter-origines

Certains navigateurs ou lecteurs PDF peuvent prendre en charge les scripts, les formulaires ou d'autres contenus interactifs dans les fichiers PDF. Si le fichier prévisualisé provient d'une source non fiable, il faut tenir compte de la limite de sécurité de l'exécution de scripts.

Nous recommandons d'isoler le domaine d'accès aux fichiers des domaines du site NocoBase et de l'API. Par exemple, servez les fichiers OSS, S3, COS ou CDN depuis un domaine dédié, au lieu de partager la même origine que le frontend ou l'API NocoBase.

Si le domaine des fichiers est différent du domaine de l'API, et que l'API n'active pas CORS pour le domaine des fichiers, les scripts exécutés dans l'environnement d'aperçu PDF sont généralement limités par la politique de même origine du navigateur. Ils ne peuvent pas lire directement la page NocoBase, le stockage du navigateur ou les réponses de l'API.

## Liens associés

- [Plugin d'aperçu des fichiers Office](./ms-office.md)
- [Aliyun OSS](../storage/aliyun-oss.md)
- [S3 Pro](../storage/s3-pro.md)
