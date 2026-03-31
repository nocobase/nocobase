---
pkg: '@nocobase/plugin-record-history'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Historique des enregistrements

## Introduction

Le plugin **Historique des enregistrements** permet de suivre les modifications de données en enregistrant automatiquement des instantanés et les différences des opérations de **création**, de **mise à jour** et de **suppression**. Il vous aide à retracer rapidement les changements de données et à auditer les activités opérationnelles.

![](https://static-docs.nocobase.com/202511011338499.png)

## Activer l'historique des enregistrements

### Ajouter des collections et des champs

Accédez d'abord à la page de configuration du plugin Historique des enregistrements pour ajouter les collections et les champs dont vous souhaitez suivre l'historique. Pour améliorer l'efficacité de l'enregistrement et éviter la redondance des données, nous vous recommandons de ne configurer que les collections et les champs essentiels. Les champs tels que l'**ID unique**, la **date de création**, la **date de mise à jour**, l'**utilisateur créateur** et l'**utilisateur modificateur** n'ont généralement pas besoin d'être enregistrés.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Synchroniser les instantanés de données historiques

- Pour les données créées avant l'activation de l'historique des enregistrements, les modifications ne peuvent être enregistrées qu'après la génération d'un instantané lors de la première mise à jour ; par conséquent, la première mise à jour ou suppression ne laissera pas de trace historique.
- Si vous souhaitez conserver l'historique des données existantes, vous pouvez effectuer une synchronisation unique des instantanés.
- La taille de l'instantané par collection est calculée comme suit : nombre d'enregistrements × nombre de champs à enregistrer.
- Si le volume de données est important, nous vous recommandons de filtrer par portée de données et de ne synchroniser que les enregistrements importants.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Cliquez sur le bouton **« Synchroniser les instantanés historiques »**, configurez les champs et la portée des données, puis lancez la synchronisation.

![](https://static-docs.nocobase.com/202511011320958.png)

La tâche de synchronisation sera mise en file d'attente et exécutée en arrière-plan. Vous pouvez rafraîchir la liste pour vérifier son état d'achèvement.

## Utiliser le bloc Historique des enregistrements

### Ajouter un bloc

Sélectionnez le **bloc Historique des enregistrements** et choisissez une collection pour ajouter le bloc d'historique correspondant à votre page.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Si vous ajoutez un bloc d'historique dans une fenêtre contextuelle de détails d'enregistrement, vous pouvez sélectionner **« Enregistrement actuel »** pour afficher l'historique spécifique à cet enregistrement.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Modifier les modèles de description

Cliquez sur **« Modifier le modèle »** dans les paramètres du bloc pour configurer le texte de description des enregistrements d'opérations.

![](https://static-docs.nocobase.com/202511011340406.png)

Vous pouvez configurer des modèles de description distincts pour les opérations de **création**, de **mise à jour** et de **suppression**. Pour les opérations de mise à jour, vous pouvez également configurer le modèle de description pour les changements de champs, soit comme un modèle unique pour tous les champs, soit pour des champs spécifiques individuellement.

![](https://static-docs.nocobase.com/202511011346400.png)

Vous pouvez utiliser des variables lors de la configuration du texte.

![](https://static-docs.nocobase.com/202511011347163.png)

Après la configuration, vous pouvez choisir d'appliquer le modèle à **Tous les blocs d'historique des enregistrements de la collection actuelle** ou **Uniquement ce bloc d'historique des enregistrements**.

![](https://static-docs.nocobase.com/202511011348885.png)