---
pkg: '@nocobase/plugin-ai'
title: 'Bloc AI Chat box'
description: 'Guide destiné aux administrateurs et aux créateurs de pages NocoBase pour ajouter un bloc AI Chat box, configurer les fonctions de conversation, définir le Work context, gérer les conversations et ajouter des Actions.'
keywords: 'AI Chat box,Employé AI,bloc de page,Work context,Scope,Actions,NocoBase'
---

# Bloc AI Chat box

Dans NocoBase, **AI Chat box** est un bloc de conversation AI qui peut être ajouté directement à une page. Vous pouvez le placer sur une page métier afin de fournir un point d'accès fixe à un assistant AI dédié à cette page.

Chaque bloc AI Chat box conserve son propre état de conversation et de saisie. Les créateurs de pages peuvent également limiter les employés AI, les modèles, le téléversement de fichiers, la recherche web et le contexte de travail disponibles pour adapter le bloc au scénario métier.

:::tip Avant de commencer

Commencez par [configurer un service LLM](../features/llm-service.md) et [activer au moins un employé AI](../features/enable-ai-employee.md).

:::

## Ajouter un bloc AI Chat box

1. Ouvrez la page à configurer.
2. Cliquez sur `UI Editor` en haut à droite pour passer en mode d'édition de page.
3. Cliquez sur `Add block`.
4. Dans `Other blocks`, sélectionnez `AI chat box`.

![Sélectionner AI chat box dans le menu Add block](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/add-ai-chat-box-block-3.png)

## Structure du bloc

![Bloc AI Chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/ai-chat-box-overview-2.png)

AI Chat box comprend trois zones, de haut en bas :

- **Zone d'actions supérieure** — accès à la liste des conversations, Actions, actions personnalisées et nouvelle conversation ; lorsque la zone de messages est masquée, un bouton de messages apparaît également
- **Zone de messages** — affiche les messages du brouillon ou de la conversation en cours
- **Zone d'envoi** — champ de saisie, sélection du contexte, téléversement de fichiers, recherche web, sélection de l'employé AI, sélection du modèle, bouton d'envoi et avertissement

### Ajouter du contenu dans le body du bloc

En mode d'édition de page, cliquez sur `Add block` dans AI Chat box pour ajouter l'un des blocs suivants au-dessus de la zone de chat :

- JS block
- Iframe
- Markdown

Ces blocs sont utiles pour afficher des instructions, des pages externes ou des informations complémentaires. Le menu interne propose uniquement ces trois types de blocs et ne permet pas d'imbriquer un autre AI Chat box.

## Configurer AI Chat box

Placez le pointeur sur le bloc et ouvrez son menu de configuration. Cliquez sur `Edit chat box` pour configurer la portée des conversations, le message par défaut, le Work context, les employés AI et les modèles.

![Fenêtre de configuration Edit chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/edit-chat-box-settings-2.png)

### Paramètres Edit chat box

| Paramètre | Description |
| --- | --- |
| `Scope` | Contrôle les AI Chat boxes qui partagent une liste de conversations. Un nouveau bloc utilise par défaut son propre UID afin de séparer les conversations. |
| `Background` | Ajoute un prompt système après la définition de l'employé AI afin de préciser le rôle, l'objectif ou les exigences de réponse de la page actuelle. |
| `Default user message` | Préremplit la zone d'envoi avec un message utilisateur par défaut au début d'une nouvelle conversation. |
| `Work context` | Sélectionne les blocs de page ajoutés par défaut à un nouveau brouillon. |
| `AI employees` | Limite les employés AI métier sélectionnables dans ce bloc. Laissez ce champ vide pour autoriser tous les employés AI métier disponibles. |
| `Models` | Limite les modèles sélectionnables dans ce bloc. Laissez ce champ vide pour autoriser tous les modèles disponibles. |

### Autres paramètres du bloc

| Paramètre | Description |
| --- | --- |
| `Show messages` | Contrôle l'affichage direct de la zone de messages dans le bloc. Lorsque cette option est désactivée, utilisez le bouton de messages en haut pour ouvrir le panneau droit. |
| `Sender placeholder` | Modifie le texte indicatif de la zone d'envoi. |
| `Enable add context` | Affiche ou masque l'accès à la sélection du contexte dans la zone d'envoi. |
| `Enable upload files` | Affiche ou masque l'accès au téléversement de fichiers. Lorsque cette option est désactivée, coller un fichier ne lance pas de téléversement. |
| `Enable web search` | Affiche ou masque le commutateur de recherche web. La désactivation coupe également la recherche web du brouillon actuel. |
| `Enable employee select` | Affiche ou masque le sélecteur d'employé AI. |
| `Enable model select` | Affiche ou masque le sélecteur de modèle. |
| `Show disclaimer` | Affiche ou masque l'avertissement AI sous la zone d'envoi. |

## Configurer le Work context

Dans `Work context` sous `Edit chat box`, cliquez sur le bouton d'ajout de contexte, sélectionnez `Pick block`, puis choisissez le bloc de page à fournir à l'AI. Après l'enregistrement, le bloc sélectionné devient le contexte de travail par défaut des nouvelles conversations et peut être retiré de la zone d'envoi avant l'envoi.

## Masquer les messages et utiliser le panneau droit

Après avoir désactivé `Show messages`, le corps du bloc conserve uniquement la zone d'envoi. Un bouton de messages apparaît en haut ; cliquez dessus pour ouvrir le panneau de messages depuis la droite.

![Panneau droit avec la zone de messages masquée](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/messages-side-panel-2.png)

Lorsque le panneau est ouvert, le reste du bloc est recouvert par une superposition. Cliquez sur la superposition ou de nouveau sur le bouton de messages pour fermer le panneau.

Cette disposition convient lorsque AI Chat box sert de point d'entrée léger sur une page : seule la zone d'envoi reste habituellement visible, et le panneau est ouvert pour consulter les messages.

## Gérer l'historique des conversations

Cliquez sur le bouton de liste des conversations en haut à gauche du bloc pour afficher l'historique correspondant au Scope actuel.

Tenez compte des règles suivantes :

- Plusieurs AI Chat boxes utilisant le même Scope peuvent afficher la même liste de conversations
- Chaque bloc conserve indépendamment sa conversation actuelle, son brouillon, son employé AI, son modèle, ses pièces jointes et son état de contexte
- Le chatbox flottant global ne filtre pas selon le Scope du bloc et ne masque donc pas les conversations qui possèdent un Scope
- Lorsque Scope est vidé, le bloc ne filtre plus la liste selon Scope et affiche les conversations sans Scope ainsi que celles utilisant d'autres Scopes

En règle générale, conserver le Scope généré pour un nouveau bloc suffit à séparer l'historique de chaque assistant de page. Configurez le même Scope uniquement lorsque plusieurs blocs doivent partager la même liste de conversations.

## Ajouter des Actions

En mode d'édition de page, cliquez sur `Actions` en haut du bloc pour ajouter l'une des actions suivantes :

- JS Action
- AI employee

Après avoir ajouté un AI employee, vous pouvez configurer des tâches rapides pour cet employé.

Le paramètre `Chat box uid` d'une tâche rapide indique dans quel AI Chat box la tâche doit s'exécuter. Un AI employee ajouté directement dans un AI Chat box pointe par défaut vers l'UID du bloc actuel.

Si le AI Chat box indiqué n'est pas monté, NocoBase signale que le bloc cible est introuvable et ne bascule pas vers le chatbox flottant global. Consultez [Tâches rapides des employés AI](../features/task.md) pour la configuration détaillée.

## Configurer un assistant propre à une page

Les étapes suivantes permettent de créer un assistant AI léger pour une page :

1. Ajoutez un bloc AI Chat box et déplacez-le vers la position appropriée sur la page.
2. Saisissez un Background propre à la page dans `Edit chat box`.
3. Sélectionnez un ou plusieurs Work contexts.
4. Limitez les employés et les modèles disponibles dans `AI employees` et `Models`.
5. Quittez le mode d'édition, saisissez une question et envoyez-la.

## Remarques

- Le bloc AI Chat box et le chatbox flottant global en bas à droite sont des points d'entrée distincts ; la conversation actuelle et l'état de saisie ne sont pas synchronisés automatiquement
- Dans un AI Chat box, `Add block` permet uniquement d'ajouter JS block, Iframe et Markdown
- La modification de Scope affecte la portée de la liste de conversations et ne copie pas la conversation ou le brouillon actuellement ouvert dans un autre bloc
