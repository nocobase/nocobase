:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/ai-employees/quick-start).
:::

# Démarrage rapide

Configurons une configuration minimale utilisable d'employé AI en 5 minutes.

## Installer le plugin

Les employés AI sont intégrés à NocoBase (`@nocobase/plugin-ai`), aucune installation séparée n'est donc requise.

## Configurer les modèles

Vous pouvez configurer les services LLM via l'un des accès suivants :

1. Accès administration : `Paramètres système -> Employés AI -> Service LLM`.
2. Raccourci interface : Dans le panneau de discussion AI, utilisez le `Sélecteur de modèle` pour choisir un modèle, puis cliquez sur le raccourci "Ajouter un service LLM" pour y accéder directement.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Généralement, vous devez confirmer :
1. Sélectionner le fournisseur (Provider).
2. Renseigner la clé API.
3. Configurer les `Modèles activés` ; utilisez simplement "Recommend" par défaut.

## Activer les employés intégrés

Les employés AI intégrés sont activés par défaut et n'ont généralement pas besoin d'être activés individuellement.

Si vous devez ajuster la disponibilité (activer/désactiver un employé spécifique), modifiez l'interrupteur `Activé` dans la page de liste `Paramètres système -> Employés AI`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Commencer à collaborer

Sur la page de l'application, survolez le raccourci en bas à droite et choisissez un employé AI.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Cliquez pour ouvrir la boîte de dialogue de discussion AI :

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Vous pouvez également :  
* Ajouter des blocs
* Ajouter des pièces jointes
* Activer la recherche Web
* Changer d'employé AI
* Sélectionner des modèles

Ils peuvent également obtenir automatiquement la structure de la page comme contexte. Par exemple, Dex sur un bloc de formulaire peut lire la structure des champs du formulaire et appeler les compétences appropriées pour agir sur la page.

## Tâches raccourcies

Vous pouvez prédéfinir des tâches courantes pour chaque employé AI à l'emplacement actuel, afin de commencer à travailler en un clic, ce qui est rapide et pratique.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Aperçu des employés intégrés

NocoBase propose plusieurs employés AI intégrés pour différents scénarios.

Il vous suffit de :

1. Configurer les services LLM.
2. Ajuster l'état d'activation des employés si nécessaire (activés par défaut).
3. Sélectionner un modèle dans la discussion et commencer à collaborer.

| Nom de l'employé | Rôle | Capacités clés |
| :--- | :--- | :--- |
| **Cole** | Assistant NocoBase | Questions-réponses sur l'utilisation du produit, recherche de documents |
| **Ellis** | Expert en e-mails | Rédaction d'e-mails, génération de résumés, suggestions de réponses |
| **Dex** | Expert en organisation de données | Traduction de champs, formatage, extraction d'informations |
| **Viz** | Analyste d'insights | Analyse de données, analyse de tendances, interprétation d'indicateurs clés |
| **Lexi** | Assistant de traduction | Traduction multilingue, aide à la communication |
| **Vera** | Analyste de recherche | Recherche sur le Web, agrégation d'informations, recherche approfondie |
| **Dara** | Expert en visualisation de données | Configuration de graphiques, génération de rapports visuels |
| **Orin** | Expert en modélisation de données | Aide à la conception de structures de collections, suggestions de champs |
| **Nathan** | Ingénieur Frontend | Aide à l'écriture de fragments de code frontend, ajustements de style |

**Remarques**

Certains employés AI intégrés n'apparaissent pas dans la liste en bas à droite car ils ont des scénarios de travail dédiés :

- Orin : pages de modélisation de données.
- Dara : blocs de configuration de graphiques.
- Nathan : JS Block et autres éditeurs de code.