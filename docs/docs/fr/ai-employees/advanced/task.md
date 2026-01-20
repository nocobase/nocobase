:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Avancé

## Introduction

Les employés IA peuvent être liés à des pages ou à des blocs. Une fois liés, vous pouvez configurer des tâches spécifiques à votre activité, permettant ainsi aux utilisateurs d'utiliser rapidement l'employé IA pour traiter des tâches directement sur la page ou le bloc.

## Lier un employé IA à une page

Une fois la page en mode d'édition d'interface utilisateur (UI), un signe « + » apparaît à côté du bouton d'accès rapide de l'employé IA, dans le coin inférieur droit. Passez la souris sur ce signe « + » pour afficher la liste des employés IA. Sélectionnez un employé IA pour le lier à la page actuelle.

![20251022134656](https://static-docs.nocobase.com/20251022134656.png)

Une fois le lien établi, l'employé IA associé à la page actuelle s'affichera dans le coin inférieur droit chaque fois que vous accéderez à cette page.

![20251022134903](https://static-docs.nocobase.com/20251022134903.png)

## Lier un employé IA à un bloc

Lorsque la page est en mode d'édition d'interface utilisateur (UI), sur un bloc qui prend en charge la configuration des `Actions`, sélectionnez le menu `AI employees` sous `Actions`, puis choisissez un employé IA pour le lier au bloc actuel.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Une fois le lien établi, l'employé IA associé au bloc actuel s'affichera dans la zone `Actions` du bloc chaque fois que vous accéderez à cette page.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Configurer les tâches

Une fois la page en mode d'édition d'interface utilisateur (UI), passez la souris sur l'icône de l'employé IA lié à la page ou au bloc. Un bouton de menu apparaîtra. Sélectionnez `Edit tasks` pour accéder à la page de configuration des tâches.

![20251022135710](https://static-docs.nocobase.com/20251022135710.png)

Une fois sur la page de configuration des tâches, vous pouvez ajouter plusieurs tâches pour l'employé IA actuel.

Chaque onglet représente une tâche indépendante. Cliquez sur le signe « + » à côté pour ajouter une nouvelle tâche.

![20251022140058](https://static-docs.nocobase.com/20251022140058.png)

Formulaire de configuration des tâches :

- Dans le champ `Title`, saisissez le titre de la tâche. Décrivez brièvement le contenu de la tâche. Ce titre apparaîtra dans la liste des tâches de l'employé IA.
- Dans le champ `Background`, saisissez le contenu principal de la tâche. Ce contenu sera utilisé comme invite système lors de la conversation avec l'employé IA.
- Dans le champ `Default user message`, saisissez le message utilisateur par défaut à envoyer. Il sera automatiquement pré-rempli dans le champ de saisie utilisateur après la sélection de la tâche.
- Dans `Work context`, sélectionnez les informations de contexte d'application par défaut à envoyer à l'employé IA. Cette opération est identique à celle effectuée dans la boîte de dialogue.
- La zone de sélection `Skills` affiche les compétences dont dispose l'employé IA actuel. Vous pouvez désélectionner une compétence pour que l'employé IA l'ignore et ne l'utilise pas lors de l'exécution de cette tâche.
- La case à cocher `Send default user message automatically` permet de configurer si le message utilisateur par défaut doit être envoyé automatiquement après avoir cliqué pour exécuter la tâche.

![20251022140805](https://static-docs.nocobase.com/20251022140805.png)

## Liste des tâches

Une fois les tâches configurées pour un employé IA, elles s'afficheront dans la fenêtre contextuelle de profil de l'employé IA et dans le message d'accueil avant le début d'une conversation. Cliquez sur une tâche pour l'exécuter.

![20251022141231](https://static-docs.nocobase.com/20251022141231.png)