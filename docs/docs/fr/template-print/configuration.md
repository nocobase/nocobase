:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Configuration

### Activation de l'impression de modèles
L'impression de modèles est actuellement prise en charge pour les blocs de détails et les blocs de tableaux. Nous allons vous présenter ci-dessous les méthodes de configuration pour ces deux types de blocs.

#### Blocs de détails

1.  **Ouvrez le bloc de détails** :
    -   Dans l'application, accédez au bloc de détails où vous souhaitez utiliser la fonctionnalité d'impression de modèles.

2.  **Accédez au menu d'opérations de configuration** :
    -   En haut de l'interface, cliquez sur le menu "Opérations de configuration".

3.  **Sélectionnez "Impression de modèles"** :
    -   Dans le menu déroulant, cliquez sur l'option "Impression de modèles" pour activer la fonctionnalité du plugin.

![Activer l'impression de modèles](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Configuration des modèles

1.  **Accédez à la page de configuration des modèles** :
    -   Dans le menu de configuration du bouton "Impression de modèles", sélectionnez l'option "Configuration des modèles".

![Option de configuration des modèles](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Ajoutez un nouveau modèle** :
    -   Cliquez sur le bouton "Ajouter un modèle" pour accéder à la page d'ajout de modèle.

![Bouton Ajouter un modèle](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Renseignez les informations du modèle** :
    -   Dans le formulaire du modèle, renseignez le nom du modèle et sélectionnez son type (Word, Excel, PowerPoint).
    -   Téléchargez le fichier de modèle correspondant (les formats `.docx`, `.xlsx`, `.pptx` sont pris en charge).

![Configurez le nom et le fichier du modèle](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Modifiez et enregistrez le modèle** :
    -   Accédez à la page "Liste des champs", copiez les champs et insérez-les dans le modèle.
    ![Liste des champs](https://static-docs.nocobase.com/20250107141010.png)
    ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    -   Une fois les détails renseignés, cliquez sur le bouton "Enregistrer" pour finaliser l'ajout du modèle.

5.  **Gestion des modèles** :
    -   Cliquez sur le bouton "Utiliser" à droite de la liste des modèles pour activer le modèle.
    -   Cliquez sur le bouton "Modifier" pour changer le nom du modèle ou remplacer le fichier du modèle.
    -   Cliquez sur le bouton "Télécharger" pour télécharger le fichier de modèle configuré.
    -   Cliquez sur le bouton "Supprimer" pour retirer les modèles dont vous n'avez plus besoin. Le système vous demandera une confirmation pour éviter toute suppression accidentelle.
    ![Gestion des modèles](https://static-docs.nocobase.com/20250107140436.png)

#### Blocs de tableaux

L'utilisation des blocs de tableaux est fondamentalement la même que celle des blocs de détails, à quelques différences près :

1.  **Prise en charge de l'impression de plusieurs enregistrements** : Vous devez d'abord cocher les enregistrements à imprimer. Vous pouvez imprimer jusqu'à 100 enregistrements simultanément.

![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  **Gestion isolée des modèles** : Les modèles pour les blocs de tableaux et les blocs de détails ne sont pas interchangeables, car leurs structures de données sont différentes (l'un est un objet, l'autre est un tableau).