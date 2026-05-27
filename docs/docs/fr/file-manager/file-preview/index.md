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

* Plugin d'aperçu des fichiers Office

## Aperçu PDF avec stockage externe

L'aperçu PDF utilise PDF.js pour afficher les fichiers dans le navigateur. Le navigateur doit d'abord lire le contenu du fichier PDF, puis le transmettre à PDF.js pour le rendu. Par conséquent, lorsque les fichiers sont stockés dans un stockage externe comme OSS, S3, COS ou un CDN, et que le domaine d'accès au fichier est différent du domaine du site NocoBase, le stockage externe doit autoriser le site NocoBase à lire les fichiers entre origines.

Si CORS n'est pas configuré, le téléchargement des PDF peut toujours fonctionner normalement, mais l'aperçu peut échouer avec une erreur de chargement du fichier.

La configuration CORS du stockage externe ou du CDN doit inclure :

```http
Access-Control-Allow-Origin: https://your-nocobase-domain
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Disposition, Content-Type
```

`Access-Control-Allow-Origin` doit être défini sur le domaine réel utilisé pour accéder à NocoBase. Évitez d'utiliser durablement `*` pour des fichiers non publics, car cela élargit la liste des sites pouvant lire les fichiers.
