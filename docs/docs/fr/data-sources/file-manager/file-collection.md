---
title: "Table des fichiers"
description: "La table des fichiers conserve le titre, le nom, la taille, le type MIME, le chemin, l’URL, l’adresse d’aperçu, l’emplacement de stockage et les métadonnées d’extension des fichiers, afin de les associer aux champs de pièces jointes."
keywords: "Table des fichiers,File Collection,attachments,métadonnées,pièces jointes,NocoBase"
---

# Table des fichiers

<PluginInfo name="file-manager"></PluginInfo>

## Présentation

La table des fichiers convient à la conservation des métadonnées des fichiers, comme le nom, l’extension, la taille, le type MIME, le chemin, l’URL, l’adresse d’aperçu, l’emplacement de stockage et les métadonnées personnalisées. Le contenu des fichiers est conservé par le moteur de stockage des fichiers, tandis que la table des fichiers conserve leurs métadonnées.

La table des fichiers peut uniquement être créée depuis la page de la base de données principale. Les bases de données externes, les sources de données REST API et les sources de données NocoBase externes ne prennent pas en charge la création de tables de fichiers.

## Cas d’utilisation

La table des fichiers convient aux scénarios métier suivants :

- Pièces jointes de contrats, factures et justificatifs de remboursement
- Images de produits, pièces d’identité des employés et documents de projet
- Fichiers téléversés, fichiers d’aperçu et fichiers à télécharger des enregistrements métier
- Bibliothèque de pièces jointes nécessitant une gestion distincte des métadonnées de fichiers

## Processus d’utilisation

La table des fichiers n’est généralement pas utilisée directement comme table métier principale. Le processus courant est le suivant :

1. Créer une table des fichiers pour conserver le titre, le nom, la taille, le type, l’URL, l’emplacement de stockage et autres métadonnées des fichiers.
2. Créer un champ de relation dans la table métier et l’associer à la table des fichiers. Par exemple, associer la table « Pièces jointes de contrat » dans la table « Contrats ».
3. Ajouter le champ de relation dans le bloc de formulaire de la table métier afin que les utilisateurs puissent téléverser des fichiers lors de la création ou de la modification d’un enregistrement métier.
4. Une fois le téléversement terminé, NocoBase écrit les métadonnées du fichier dans la table des fichiers et associe l’enregistrement du fichier à l’enregistrement métier actuel via le champ de relation.
5. Afficher le champ de pièce jointe dans le bloc de détails, le bloc de tableau ou le bloc de liste de la table métier afin que les utilisateurs puissent consulter, prévisualiser ou télécharger les fichiers.

## Configuration de la création

Dans la base de données principale, cliquez sur « Create collection », puis sélectionnez « File collection » pour créer une table des fichiers.

![20240324090414](https://static-docs.nocobase.com/20240324090414.png)

La configuration de création d’une table des fichiers est globalement identique à celle d’une table ordinaire. Une série de champs de métadonnées de fichiers est préconfigurée afin de conserver le titre, le chemin, l’URL, l’emplacement de stockage et les informations d’extension des fichiers téléversés.

| Configuration | Description |
| --- | --- |
| Collection display name | Nom d’affichage de la table dans l’interface, par exemple « Pièces jointes de contrat », « Fichiers de facture » ou « Images de produits ». |
| Collection name | Nom d’identification de la table, utilisé pour les références internes telles que l’API, les champs de relation, les autorisations et les workflows. |
| Categories | Catégorie de la table. La catégorie influe uniquement sur l’organisation de l’interface de gestion des tables et ne modifie pas la structure de la table. |
| Description | Description de la table. Vous pouvez préciser quels fichiers elle conserve, qui les téléverse et à quelles tables métier ils sont associés. |
| Preset fields | Champs prédéfinis. Lors de la création d’une table des fichiers, il est recommandé de conserver les champs système et les champs intégrés à la table des fichiers. |

### Champs intégrés

Après sa création, une table des fichiers contient généralement les champs intégrés suivants. Le contenu des fichiers est conservé dans le stockage des fichiers, tandis que la table des fichiers conserve ces métadonnées.

| Champ | Nom du champ | Description |
| --- | --- | --- |
| ID | `id` | Champ de clé primaire par défaut, utilisé pour identifier de manière unique un enregistrement de fichier. |
| Title | `title` | Titre du fichier, généralement utilisé pour l’affichage dans l’interface. |
| File name | `filename` | Nom du fichier. |
| Extension name | `extname` | Extension du fichier. |
| Size | `size` | Taille du fichier. |
| MIME type | `mimetype` | Type MIME du fichier. |
| Path | `path` | Chemin du fichier dans le stockage. |
| URL | `url` | Adresse d’accès au fichier. |
| Preview | `preview` | Adresse d’aperçu du fichier. |
| Storage | `storage` / `storageId` | Stockage auquel appartient le fichier. `storage` est un champ de relation et `storageId` est la clé étrangère correspondante. |
| Meta | `meta` | Métadonnées d’extension du fichier. |
| Date de création | `createdAt` | Enregistre automatiquement la date de création de l’enregistrement du fichier. |
| Créateur | `createdBy` | Enregistre automatiquement l’utilisateur ayant téléversé ou créé l’enregistrement du fichier. |
| Date de mise à jour | `updatedAt` | Enregistre automatiquement la date de la dernière mise à jour de l’enregistrement du fichier. |
| Dernier modificateur | `updatedBy` | Enregistre automatiquement l’utilisateur ayant effectué la dernière mise à jour de l’enregistrement du fichier. |
| Espace | `space` | Disponible après l’activation du [plugin multi-espace](../../multi-app/multi-space/index.md), il permet d’isoler les données par espace. Il n’apparaît pas lorsque le mode multi-espace n’est pas activé. |

![20240324090527](https://static-docs.nocobase.com/20240324090527.png)

### Champ de clé primaire

Comme les tables ordinaires, les tables des fichiers doivent posséder un champ de clé primaire. Les champs de pièces jointes et les champs de relation utilisent la clé primaire pour associer les métadonnées des fichiers.

Si la table des fichiers ne possède pas de clé primaire, définissez « Record unique key » lors de la modification de la table de données. Sinon, les enregistrements de pièces jointes risquent de ne pas pouvoir être correctement associés, prévisualisés ou modifiés.

## Créer une relation
Créez un champ de relation dans la table métier et associez-le à la table des fichiers.

![20240324091529](https://static-docs.nocobase.com/20240324091529.png)

## Utilisation dans la configuration des pages

Les données de la table des fichiers sont généralement générées automatiquement lors du téléversement via le composant de pièces jointes. Elles sont utilisées dans les blocs de formulaire, de détails ou de relation.

![20260710160424](https://static-docs.nocobase.com/20260710160424.png)

![20240324091321](https://static-docs.nocobase.com/20240324091321.png)

| Emplacement de configuration | Utilisation |
| --- | --- |
| [Bloc de formulaire](../../interface-builder/blocks/data-blocks/form.md) | Téléverser des pièces jointes dans les enregistrements de la table métier. |
| [Bloc de détails](../../interface-builder/blocks/data-blocks/details.md) | Afficher, prévisualiser ou télécharger des pièces jointes. |
| [Bloc de tableau](../../interface-builder/blocks/data-blocks/table.md) | Afficher les champs de pièces jointes dans une liste. |
| [Bloc de relation](../../interface-builder/blocks/data-blocks/table.md) | Gérer directement les enregistrements de fichiers associés à l’enregistrement métier actuel. |


## Modifier la configuration

Dans la liste des tables de données, cliquez sur « Edit » à droite de la table des fichiers pour modifier son nom d’affichage, sa catégorie, sa description, le mode de pagination simplifié et d’autres paramètres tels que « Record unique key ».

Les champs de métadonnées des fichiers sont généralement renseignés automatiquement lors du téléversement. Il est déconseillé d’attribuer une autre signification métier à des champs tels que `url`, `path` et `storageId`. Si vous devez étendre les informations métier des fichiers, vous pouvez ajouter des champs, par exemple « Type de fichier », « Étape concernée » ou « Archivé ».

## Supprimer une table de données

Dans la liste des tables de données, cliquez sur « Delete » à droite de la table des fichiers pour la supprimer.

La suppression d’une table des fichiers supprime les enregistrements de métadonnées des fichiers ainsi que les métadonnées Collection associées. Avant la suppression, vérifiez si les champs de pièces jointes, les champs de relation, les blocs de page, les autorisations, les workflows et les API des tables métier en dépendent encore.

:::danger Avertissement

La table des fichiers conserve les métadonnées des fichiers. La suppression d’un enregistrement de la table des fichiers peut invalider les références aux pièces jointes dans les enregistrements métier ; la suppression simultanée du contenu des fichiers dépend du stockage des fichiers et de la configuration métier. Avant toute opération, vérifiez si les fichiers sont encore utilisés par le système métier.

:::

## Liens associés

- [Table ordinaire](../data-source-main/general-collection.md) — Consulter la configuration générale et les modes d’utilisation des blocs
- [Champs de table de données](../data-modeling/collection-fields/index.md) — Consulter la configuration des champs de pièces jointes et des champs de relation
- [Gestionnaire de fichiers](../../plugins/@nocobase/plugin-file-manager/index.md) — Consulter la configuration du stockage des fichiers
- [Multi-espace](../../multi-app/multi-space/index.md) — En savoir plus sur les champs d’espace et les capacités d’isolation par espace