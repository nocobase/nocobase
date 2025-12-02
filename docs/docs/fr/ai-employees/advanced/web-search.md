:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Avancé

## Introduction

Généralement, les grands modèles linguistiques (LLM) ont une actualité des données limitée et ne disposent pas des informations les plus récentes. C'est pourquoi les plateformes de services LLM en ligne proposent souvent une fonctionnalité de recherche web. Celle-ci permet à l'IA de rechercher des informations à l'aide d'outils avant de répondre, puis de baser sa réponse sur les résultats de cette recherche.

Les employés IA ont été adaptés pour intégrer la fonctionnalité de recherche web des différentes plateformes de services LLM en ligne. Vous pouvez activer cette fonctionnalité de recherche web dans la configuration du modèle de l'employé IA ainsi que directement dans les conversations.

## Activer la fonctionnalité de recherche web

Accédez à la page de configuration du plugin des employés IA, puis cliquez sur l'onglet `AI employees` pour entrer dans la page de gestion des employés IA.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Sélectionnez l'employé IA pour lequel vous souhaitez activer la fonctionnalité de recherche web, puis cliquez sur le bouton `Edit` pour accéder à la page d'édition de l'employé IA.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Dans l'onglet `Model settings`, activez l'interrupteur `Web Search`, puis cliquez sur le bouton `Submit` pour enregistrer les modifications.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Utiliser la fonctionnalité de recherche web dans les conversations

Une fois la fonctionnalité de recherche web activée pour un employé IA, une icône "Web" apparaîtra dans le champ de saisie de la conversation. La recherche web est activée par défaut ; vous pouvez cliquer sur l'icône pour la désactiver.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Lorsque la recherche web est activée, la réponse de l'employé IA affichera les résultats de la recherche web.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Différences des outils de recherche web selon les plateformes

Actuellement, la fonctionnalité de recherche web des employés IA dépend des plateformes de services LLM en ligne. L'expérience utilisateur peut donc varier. Voici les différences spécifiques :

| Plateforme | Recherche web | tools | Réponse en temps réel avec termes de recherche | Retourne des liens externes de référence dans la réponse |
| ---------- | ------------- | ----- | --------------------------------------------- | -------------------------------------------------------- |
| OpenAI     | ✅            | ✅     | ✅                                             | ✅                                                        |
| Gemini     | ✅            | ❌     | ❌                                             | ✅                                                        |
| Dashscope  | ✅            | ✅     | ❌                                             | ❌                                                        |
| Deepseek   | ❌            | ❌     | ❌                                             | ❌                                                        |