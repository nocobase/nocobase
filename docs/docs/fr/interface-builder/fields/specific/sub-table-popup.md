:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/fields/specific/sub-table-popup).
:::

# Sous-tableau (édition en fenêtre contextuelle)

## Présentation

Le sous-tableau (édition en fenêtre contextuelle) est utilisé pour gérer les données d'associations multiples (telles que Un-à-Plusieurs ou Plusieurs-à-Plusieurs) au sein d'un formulaire. Le tableau affiche uniquement les enregistrements actuellement associés. L'ajout ou l'édition d'enregistrements s'effectue dans une fenêtre contextuelle (popup), et les données sont soumises à la base de données de manière collective lors de la soumission du formulaire principal.

## Utilisation

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Scénarios applicables :**

- Champs d'association : O2M / M2M / MBM
- Utilisations typiques : détails de commande, listes de sous-éléments, tags/membres associés, etc.

## Configuration du champ

### Autoriser la sélection de données existantes (Par défaut : Activé)

Prend en charge la sélection d'associations à partir d'enregistrements existants.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Composant de champ

[Composant de champ](/interface-builder/fields/association-field) : permet de passer à d'autres composants de champ de relation, tels que la sélection simple, le sélecteur de collection, etc.

### Autoriser la suppression du lien des données existantes (Par défaut : Activé)

> Contrôle si les données associées existantes dans le formulaire d'édition peuvent être déliées. Les données nouvellement ajoutées peuvent toujours être supprimées.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Autoriser l'ajout (Par défaut : Activé)

Contrôle l'affichage du bouton "Ajouter". Si l'utilisateur ne dispose pas des permissions `create` pour la collection cible, le bouton sera désactivé avec une info-bulle indiquant l'absence de permission.

### Autoriser l'édition rapide (Par défaut : Désactivé)

Une fois activé, le survol d'une cellule fait apparaître une icône d'édition, permettant une modification rapide du contenu de la cellule.

Vous pouvez activer l'édition rapide pour tous les champs via les paramètres du composant de champ d'association.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Elle peut également être activée pour des champs de colonne individuels.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Taille de la page (Par défaut : 10)

Définit le nombre d'enregistrements affichés par page dans le sous-tableau.

## Notes sur le comportement

- Lors de la sélection d'enregistrements existants, une déduplication est effectuée sur la base de la clé primaire pour éviter les associations en double d'un même enregistrement.
- Les nouveaux enregistrements sont directement ajoutés au sous-tableau, et la vue se déplace automatiquement vers la page contenant le nouvel enregistrement.
- L'édition en ligne modifie uniquement les données de la ligne actuelle.
- La suppression délie uniquement l'association dans le formulaire actuel ; elle ne supprime pas les données sources de la base de données.
- Les données sont enregistrées dans la base de données uniquement lors de la soumission du formulaire principal.