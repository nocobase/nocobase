:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/ai-employees/features/task).
:::

# Tâches de raccourci

Pour permettre aux employés IA de commencer à travailler plus efficacement, nous pouvons lier des employés IA à des blocs de scénario et prédéfinir plusieurs tâches courantes.

Cela permet aux utilisateurs de lancer le traitement d'une tâche en un clic, sans avoir à **sélectionner un bloc** et **saisir une commande** à chaque fois.

## Liaison d'un employé IA à un bloc

Une fois en mode d'édition de l'interface utilisateur (UI), sur les blocs prenant en charge les `Actions`, sélectionnez le menu `AI employees` sous `Actions`, puis choisissez un employé IA. Cet employé IA sera alors lié au bloc actuel.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Une fois la liaison terminée, à chaque accès à la page, la zone Actions du bloc affichera l'employé IA lié au bloc actuel.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Configuration des tâches

Après être passé en mode d'édition de l'interface utilisateur, survolez l'icône de l'employé IA lié au bloc. Un bouton de menu apparaîtra ; sélectionnez `Edit tasks` pour accéder à la page de configuration des tâches.

Sur la page de configuration des tâches, vous pouvez ajouter plusieurs tâches pour l'employé IA actuel.

Chaque onglet représente une tâche indépendante ; cliquez sur le signe « + » à côté pour ajouter une nouvelle tâche.

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

Formulaire de configuration des tâches :

- Saisissez le titre de la tâche dans le champ `Title`. Ce titre apparaîtra dans la liste des tâches de l'employé IA.
- Saisissez le contenu principal de la tâche dans le champ `Background`. Ce contenu servira d'invite système (system prompt) lors de la conversation avec l'employé IA.
- Saisissez le message utilisateur par défaut dans le champ `Default user message`. Il sera automatiquement rempli dans la zone de saisie de l'utilisateur après la sélection de la tâche.
- Dans `Work context`, choisissez les informations de contexte de l'application à envoyer par défaut à l'employé IA. Cette opération est identique à celle effectuée dans le panneau de discussion.
- Le sélecteur `Skills` affiche les compétences dont dispose l'employé IA actuel. Vous pouvez désactiver une compétence pour que l'employé IA l'ignore lors de l'exécution de cette tâche.
- La case à cocher `Send default user message automatically` permet de configurer l'envoi automatique du message utilisateur par défaut dès que l'on clique pour exécuter la tâche.

## Liste des tâches

Une fois les tâches configurées pour l'employé IA, elles apparaîtront dans la fenêtre contextuelle de profil de l'employé IA ainsi que dans le message d'accueil avant le début de la conversation. Cliquez simplement sur une tâche pour l'exécuter.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)