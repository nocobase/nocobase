---
pkg: "@nocobase/plugin-field-signature"
---

# Champ de collection : signature manuscrite

## Présentation

Le champ de signature manuscrite permet aux utilisateurs de signer sur un canevas avec la souris ou un écran tactile. Une fois sauvegardée, l'image de la signature est écrite dans la **collection de fichiers** sélectionnée et réutilise les flux d'upload et de stockage de fichiers fournis par le **File Manager**.

## Installation

1. Vérifiez que l'environnement courant est en **édition Pro ou supérieure** et que la licence est valide.
2. Ouvrez le **Plugin Manager**, trouvez **Champ de collection : signature manuscrite** (`@nocobase/plugin-field-signature`) et activez-le.
3. Assurez-vous que le **File Manager** (`@nocobase/plugin-file-manager`) est activé. Le champ de signature manuscrite en dépend pour fournir la collection de fichiers, les capacités d'upload et de stockage. S'il n'est pas activé, l'image de la signature ne pourra pas être sauvegardée.

## Mode d'emploi

### Ajouter un champ

Allez dans **Source de données** → sélectionnez la collection → **Configurer les champs** → **Ajouter un champ** → choisissez **Signature manuscrite** dans le groupe Multimédia.

### Configuration du champ

- **Collection de fichiers** : obligatoire ; sélectionnez une collection de fichiers utilisée pour sauvegarder les fichiers (par exemple `attachments`). L'image de la signature y sera enregistrée.
- La configuration de stockage et les règles d'upload effectivement utilisées pour l'image de la signature sont déterminées par la collection de fichiers sélectionnée elle-même.

### Configuration de l'interface

- Après avoir ajouté un champ de signature manuscrite à un formulaire, vous pouvez ajuster les **paramètres de signature** dans la configuration d'interface du champ : couleur du trait, couleur de fond, largeur et hauteur du canevas de signature, ainsi que largeur et hauteur de la miniature.
- Dans les scénarios d'affichage en lecture seule, vous pouvez également ajuster la largeur et la hauteur de la miniature de signature pour contrôler la taille d'affichage de l'image.

### Opérations dans l'interface

- Cliquez sur la zone du champ pour ouvrir le canevas de signature. Une fois la signature terminée et confirmée, elle est uploadée et associée à l'enregistrement de fichier correspondant.
- Sur les appareils à petit écran, vous pouvez utiliser une interface de signature de type horizontal/plein écran pour faciliter l'écriture.
