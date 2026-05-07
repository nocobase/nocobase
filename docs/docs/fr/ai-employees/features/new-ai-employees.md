:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/ai-employees/features/new-ai-employees).
:::

# Nouvel employé IA

Si les employés IA intégrés ne répondent pas à vos besoins, vous pouvez créer et personnaliser votre propre employé IA.

## Commencer la création

Accédez à la page de gestion des `AI employees` et cliquez sur `New AI employee`.

## Configuration du profil de base

Configurez les éléments suivants dans l'onglet `Profile` :

- `Username` : identifiant unique.
- `Nickname` : nom d'affichage.
- `Position` : description du poste.
- `Avatar` : avatar de l'employé.
- `Bio` : courte introduction.
- `About me` : prompt système.
- `Greeting message` : message de bienvenue de la conversation.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Paramétrage du rôle (Role setting)

Dans l'onglet `Role setting`, configurez le prompt système (System Prompt) de l'employé. Ce contenu définit l'identité, les objectifs, les limites de travail et le style de réponse de l'employé lors des conversations.

Il est recommandé d'inclure au moins :

- Le positionnement du rôle et le champ de responsabilités.
- Les principes de traitement des tâches et la structure des réponses.
- Les interdictions, les limites d'information et le ton ou style requis.

Vous pouvez insérer des variables selon vos besoins (par exemple : utilisateur actuel, rôle actuel, langue actuelle, heure), afin que le prompt s'adapte automatiquement au contexte de chaque session.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Configuration des compétences et des connaissances

Configurez les permissions de compétences dans l'onglet `Skills` ; si la fonctionnalité de base de connaissances est activée, vous pouvez poursuivre la configuration dans les onglets relatifs à la base de connaissances.

## Terminer la création

Cliquez sur `Submit` pour terminer la création.