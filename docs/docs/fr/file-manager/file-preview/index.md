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

* [Plugin d'aperçu des fichiers Office](../file-preview/ms-office.md)

## Aperçu PDF avec stockage externe

NocoBase prévisualise les PDF au moyen d'un iframe du navigateur. Certains navigateurs ou lecteurs PDF peuvent prendre en charge les scripts, les formulaires ou d'autres contenus interactifs dans les fichiers PDF. Si le fichier prévisualisé provient d'une source non fiable, il faut tenir compte de la limite de sécurité de l'exécution de scripts.

Nous recommandons d'isoler le domaine d'accès aux fichiers des domaines du site NocoBase et de l'API. Par exemple, servez les fichiers OSS, S3, COS ou CDN depuis un domaine dédié, au lieu de partager la même origine que le frontend ou l'API NocoBase.

Si le domaine des fichiers est différent du domaine de l'API, et que l'API n'active pas CORS pour le domaine des fichiers, les scripts exécutés dans l'environnement d'aperçu PDF sont généralement limités par la politique de même origine du navigateur. Ils ne peuvent pas lire directement la page NocoBase, le stockage du navigateur ou les réponses de l'API.
