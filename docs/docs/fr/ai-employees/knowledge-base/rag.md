---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Génération augmentée par récupération (RAG)"
description: "Activez le RAG pour les employés IA, configurez Knowledge Base, Retrieval strategy, Top K et Score, puis contrôlez l'accès aux bases de connaissances à l'aide des rôles utilisateur."
keywords: "RAG,génération augmentée par récupération,récupération de base de connaissances,Retrieval strategy,autorisations de base de connaissances,Top K,NocoBase"
---

# Récupération RAG

## Introduction

Dans NocoBase, le **RAG (génération augmentée par récupération)** permet à un employé IA de récupérer du contenu pertinent dans les bases de connaissances avant de répondre à une question.

Les bases de connaissances qu'un employé IA peut réellement utiliser dépendent à la fois de sa configuration `Knowledge Base` et des autorisations associées aux rôles de l'utilisateur actuel. Seules les bases incluses dans ces deux périmètres sont interrogées.

## Configurer les bases de connaissances d'un employé IA

Accédez à la page de configuration `AI employees`, sélectionnez l'employé IA pour lequel vous souhaitez activer le RAG, puis cliquez sur `Edit`. Dans le panneau d'édition, ouvrez l'onglet `Knowledge Base` et activez `Enable`.

![](https://static-docs.nocobase.com/ai-employee-knowledge-base-settings-202608171620.png)

Les paramètres disponibles sont les suivants :

- `Knowledge Base` — Facultatif. Si ce champ reste vide, l'employé IA interroge toutes les bases de connaissances activées auxquelles les rôles de l'utilisateur actuel ont accès. Si vous sélectionnez des bases, seules celles qui sont sélectionnées et autorisées pour l'utilisateur sont interrogées
- `Retrieval strategy` — Détermine quand la récupération depuis les bases de connaissances est exécutée :
  - `Retrieve on demand` — L'employé IA récupère du contenu uniquement lorsqu'il estime que la question actuelle en a besoin. Les nouveaux employés IA utilisent cette stratégie par défaut, et elle est recommandée dans la plupart des cas
  - `Automatically retrieve for every question` — La récupération est exécutée avant l'envoi de chaque question à l'employé IA. Utilisez cette option lorsque chaque interaction dépend du contenu des bases de connaissances
- `Knowledge Base Prompt` — Définit comment le contenu récupéré est transmis à l'employé IA. `{knowledgeBaseData}` est un espace réservé fixe ; ne le supprimez pas et ne le modifiez pas
- `Top K` — Nombre maximal de résultats renvoyés à chaque récupération. La plage est comprise entre 1 et 100, et la valeur par défaut est 3
- `Score` — Score minimal de similarité requis pour un résultat. La plage est comprise entre 0 et 1, et la valeur par défaut est 0,6. Une valeur plus élevée produit du contenu plus pertinent, mais peut réduire le nombre de résultats

Cliquez sur `Submit` pour enregistrer la configuration.

## Configurer les autorisations des bases de connaissances

Sélectionner des bases de connaissances pour un employé IA ne donne pas accès à tous les utilisateurs. Accédez à `Users & Permissions / Roles & Permissions`, sélectionnez le rôle attribué à l'utilisateur, puis ouvrez `Permissions / Knowledge bases`.

Sélectionnez `Available` pour chaque base de connaissances à laquelle le rôle doit pouvoir accéder. Pour accorder automatiquement à ce rôle l'accès aux bases créées ultérieurement, sélectionnez `New knowledge bases are allowed by default`.

![](https://static-docs.nocobase.com/knowledge-base-role-permissions-202608171620.png)

:::warning Remarque

Le périmètre des bases de connaissances disponible pour un employé IA correspond à l'intersection entre sa configuration `Knowledge Base` et les autorisations des rôles de l'utilisateur actuel. Les bases non autorisées sont automatiquement exclues.

:::

## Lorsque l'utilisateur n'a accès à aucune base de connaissances

Si les bases de connaissances sont activées pour un employé IA, mais que le périmètre configuré ne recoupe pas les autorisations des rôles de l'utilisateur actuel, l'employé IA répond d'abord à l'aide d'informations qui ne dépendent pas d'une base de connaissances. Il ajoute ensuite un avertissement bien visible indiquant qu'aucun contenu de base de connaissances n'a été utilisé faute d'autorisation et recommandant de contacter un administrateur.

![](https://static-docs.nocobase.com/ai-employee-no-knowledge-base-access-side-panel-202608171653.png)

Si l'utilisateur peut accéder à au moins une base de connaissances, mais que la question actuelle ne renvoie aucun contenu pertinent, l'avertissement relatif aux autorisations n'est pas affiché.

## Liens connexes

- [Base de connaissances](./knowledge-base/index.md) — Créer et gérer les bases de connaissances utilisées pour la récupération RAG
- [Rôles et autorisations](../../users-permissions/acl/permissions.md) — Configurer l'accès au système, aux menus et aux données pour chaque rôle
