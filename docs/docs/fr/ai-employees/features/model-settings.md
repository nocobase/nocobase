---
title: 'Configurer les modèles des employés IA'
description: 'Configurer les modèles des employés IA.'
keywords: 'AI Employee model settings,dedicated model,model scope,LLM service,NocoBase AI'
---

# Configurer les modèles des employés IA

Par défaut, les employés IA peuvent utiliser tous les services LLM et modèles activés. Les administrateurs peuvent activer des paramètres de modèle dédié pour un employé et limiter sa plage de modèles.

## Prérequis

- Le plugin **AI Employees** est activé.
- Au moins un service LLM est configuré.
- L’employé IA cible est activé.

Pour la configuration du service LLM, consultez [Configurer le service LLM](/ai-employees/features/llm-service).

## Points d'entrée

Allez dans `System Settings -> AI Employees -> AI employees`, ouvrez l’employé à configurer et passez à `Model settings`.

![](https://static-docs.nocobase.com/202605121216415.png)

## Activer les paramètres de modèle dédié

Après avoir activé `Enable dedicated model configuration`, sélectionnez les modèles autorisés dans `Models`.

- Le sélecteur de modèle du chat n’affiche que les modèles sélectionnés.
- Les tâches rapides et nœuds de workflow ne peuvent utiliser que les modèles sélectionnés.

:::info{title=Astuce}
Si les paramètres dédiés sont activés sans modèle sélectionné, aucun modèle disponible ne peut être résolu.
:::

## Désactiver les paramètres de modèle dédié

Après désactivation, les règles par défaut s’appliquent à nouveau :

- Tous les modèles LLM activés peuvent être utilisés.
- Sans sélection manuelle, le système utilise le modèle global par défaut.

## Règles de résolution du modèle

Lors de l’exécution, le modèle final est résolu dans cet ordre :

1. Si les paramètres de modèle dédié sont activés, résoudre d’abord dans la plage de modèles sélectionnés.
2. Si la requête spécifie un modèle autorisé, utiliser ce modèle.
3. Si le modèle spécifié n’est pas autorisé, utiliser le premier modèle autorisé.
4. Si les paramètres dédiés ne sont pas activés, privilégier le modèle spécifié par la requête.
5. Si aucun modèle n’est spécifié, utiliser le modèle global par défaut.

## Recommandations

- Si le déploiement local n’est pas possible, choisissez un modèle spécialisé en traduction plutôt qu’un modèle de chat général.
- Vous pouvez ajuster la concurrence selon la capacité du modèle pour contrôler débit, temps de réponse et coût.

## FAQ

### Pourquoi la liste des modèles est-elle vide ?

Souvent aucun service LLM n’est configuré ou aucun modèle n’est activé. Vérifiez `Enabled Models`.

### Pourquoi les utilisateurs ne peuvent-ils pas changer de modèle ?

Si les paramètres dédiés sont activés, seule la plage de modèles sélectionnée est disponible.

### Quelles entrées sont concernées ?

Cela affecte les nouveaux chats, tâches rapides, nœuds AI Employee de workflow et tâches intégrées du plugin. Les messages historiques ne sont pas régénérés.
