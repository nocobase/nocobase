:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Composants de champ de relation

## Introduction

Les composants de champ de relation de NocoBase sont conçus pour vous aider à mieux afficher et gérer les données associées. Quelle que soit la nature de la relation, ces composants sont flexibles et polyvalents, vous permettant de les choisir et de les configurer selon vos besoins spécifiques.

### Sélecteur déroulant

Pour tous les champs de relation, à l'exception de ceux dont la collection cible est une collection de fichiers, le composant par défaut en mode édition est le sélecteur déroulant. Les options du sélecteur affichent la valeur du champ de titre, ce qui est idéal pour les scénarios où les données associées peuvent être rapidement sélectionnées en affichant une information clé du champ.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Pour plus de détails, consultez [Sélecteur déroulant](/interface-builder/fields/specific/select)

### Sélecteur de données

Le sélecteur de données affiche les informations dans une fenêtre modale. Vous pouvez y configurer les champs à afficher (y compris les champs de relations imbriquées), ce qui permet une sélection plus précise des données associées.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Pour plus de détails, consultez [Sélecteur de données](/interface-builder/fields/specific/picker)

### Sous-formulaire

Lorsque vous gérez des données de relation plus complexes, l'utilisation d'un sélecteur déroulant ou d'un sélecteur de données peut s'avérer peu pratique. Dans ces situations, vous devriez ouvrir fréquemment des fenêtres modales. Pour ces cas de figure, le sous-formulaire est la solution : il vous permet de gérer directement les champs de la collection associée sur la page actuelle ou dans le bloc de la fenêtre modale en cours, sans avoir à ouvrir de nouvelles fenêtres à répétition. Le flux de travail est ainsi plus fluide. Les relations à plusieurs niveaux sont affichées sous forme de formulaires imbriqués.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Pour plus de détails, consultez [Sous-formulaire](/interface-builder/fields/specific/sub-form)

### Sous-tableau

Le sous-tableau affiche les enregistrements de relations un-à-plusieurs ou plusieurs-à-plusieurs sous forme de tableau. Il offre un moyen clair et structuré d'afficher et de gérer les données associées, et prend en charge la création de nouvelles données en masse ou la sélection de données existantes à associer.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Pour plus de détails, consultez [Sous-tableau](/interface-builder/fields/specific/sub-table)

### Sous-détail

Le sous-détail est le composant correspondant au sous-formulaire en mode lecture seule. Il permet d'afficher des données avec des relations imbriquées à plusieurs niveaux.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Pour plus de détails, consultez [Sous-détail](/interface-builder/fields/specific/sub-detail)

### Gestionnaire de fichiers

Le gestionnaire de fichiers est un composant de champ de relation spécifiquement utilisé lorsque la collection cible de la relation est une collection de fichiers.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Pour plus de détails, consultez [Gestionnaire de fichiers](/interface-builder/fields/specific/file-manager)

### Titre

Le composant de champ de titre est un composant de champ de relation utilisé en mode lecture seule. En configurant le champ de titre, vous pouvez configurer le composant de champ correspondant.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Pour plus de détails, consultez [Titre](/interface-builder/fields/specific/title)