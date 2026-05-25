---
title: 'Lina : Ingénieure localisation'
description: 'Documentation des employés IA NocoBase.'
keywords: 'Lina,Localization Engineer,AI translation,Localization Management,AI Employee,NocoBase'
---

# Lina : Ingénieure localisation

## Rôle

Lina : Ingénieure localisation est spécialisé dans ce scénario intégré de NocoBase et aide à accomplir les tâches associées plus efficacement.

![](https://static-docs.nocobase.com/202605121152196.png)

:::info{title=Astuce}
Lina est dédiée aux scénarios de localisation et n’utilise pas les Skills ou Tools généraux.
:::

## Scénarios

- Traduire en lot les entrées système et plugin.
- Traduire les contenus des collections, champs et menus.
- Traduire uniquement les entrées sélectionnées dans le tableau.

## Prérequis

Avant d’utiliser Lina, effectuez la configuration suivante :

- Activez le plugin **Gestion de la localisation**.
- Configurez un service LLM disponible et attribuez un modèle par défaut à Lina. Voir [Configurer les modèles des employés IA](/ai-employees/features/model-settings) et [Recommandations de modèle](#recommandations-de-modèle).
- Activez la langue cible dans les paramètres système.
- Synchronisez les entrées à traduire sur la page de gestion de la localisation.

:::info{title=Astuce}
Lina crée des tâches de traduction pour la langue actuelle.
:::

## Configuration du prompt

Ouvrez la fenêtre de modification de Lina depuis `Paramètres système -> Employés IA -> AI employees`, puis ajustez le prompt dans `Role setting`. Le prompt sert généralement à définir les informations du domaine métier, les règles terminologiques et les contraintes de sortie. Il ne doit pas être trop long, sinon il peut ne pas convenir aux modèles spécialisés en traduction.

![](https://static-docs.nocobase.com/202605191351816.png)

Exemple de prompt par défaut :

```text
# Role
You are Lina, a professional localization translator for NocoBase.

# Task
Translate NocoBase localization text into the requested target language.

# Translation requirements
1. Keep the translation faithful, concise, and natural for product UI.
2. Use consistent NocoBase and software terminology.
3. Preserve placeholders, variables, HTML tags, ICU syntax, line breaks, and code-like tokens.
4. Return only the translated text. Do not explain, quote, or use Markdown.
5. If the text should not be translated, return it unchanged.
```

Les traductions de référence et le texte à traduire n’ont pas besoin d’être écrits dans le prompt de Lina. Lors de la création d’une tâche, le système les ajoute automatiquement selon le contenu de l’entrée, la langue cible et la configuration des langues de référence dans la boîte de confirmation.

## Utilisation

Sur la page de gestion de la localisation, cliquez sur l’avatar de Lina et choisissez le périmètre de traduction IA.

### Traduction incrémentale

Traduit uniquement les entrées qui n’ont pas encore de traduction dans la langue actuelle.

Pour les entrées intégrées, si une traduction existe déjà dans le pack de langue système ou plugin de la langue cible, l’entrée est considérée comme déjà traduite même si aucun enregistrement correspondant n’a encore été écrit dans la table des traductions de localisation, et elle n’est pas comptée dans la traduction incrémentale.

### Traduction des éléments sélectionnés

Sélectionnez d’abord des entrées dans le tableau, puis traduisez uniquement le contenu sélectionné.

Si aucune entrée n’est sélectionnée, le système demande d’en sélectionner.

### Traduction complète

Traduit toutes les entrées éligibles de la langue actuelle.

:::warning{title=Remarque}
La traduction complète peut remplacer des traductions existantes. Vérifiez la langue cible, le nombre d’entrées et le modèle avant de commencer.
:::

## Confirmation de la tâche

Avant de créer la tâche, le système affiche une boîte de confirmation avec :

- Description de la tâche.
- Nombre d’entrées à traduire.
- Fournisseur à utiliser.
- Modèle à utiliser.
- Configuration des langues de traduction de référence.

La traduction complète et la traduction incrémentale permettent aussi de choisir le périmètre de traduction dans la boîte de confirmation :

- **Tout** : traite toutes les entrées correspondant aux conditions de la tâche actuelle.
- **Entrées intégrées** : entrées système et plugin.
- **Entrées personnalisées** : noms de routes, noms de collections et de champs, ainsi que contenu UI.

La traduction des éléments sélectionnés traite uniquement les enregistrements déjà cochés dans le tableau. Elle n’affiche donc pas le périmètre de traduction. Elle affiche aussi une seule configuration générale des langues de référence, sans distinguer les entrées intégrées et personnalisées.

Si le nombre d’entrées à traduire est 0, le système affiche un message et ne crée pas de tâche en arrière-plan. Après confirmation, le système crée une tâche en arrière-plan. La progression est visible dans les tâches asynchrones. Une fois terminée, les traductions sont écrites dans la langue correspondante.

![](https://static-docs.nocobase.com/202605191341968.png)

## Traductions de référence

Les entrées courtes comme champs, boutons et statuts utilisent des traductions de référence existantes pour améliorer la cohérence.

- Les entrées intégrées utilisent les traductions chinoises comme référence par défaut et le japonais comme référence de secours.
- Les entrées personnalisées utilisent la langue par défaut du système comme référence par défaut et le chinois comme référence de secours.
- Les utilisateurs peuvent ajuster la langue par défaut et la langue de secours dans la boîte de confirmation de la tâche.
- Le système utilise d’abord la traduction de référence dans la langue par défaut. Si elle n’existe pas, il essaie ensuite la langue de secours.

Lorsqu’une référence existe, Lina utilise un prompt de sémantique similaire :

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Recommandations de modèle

La traduction de localisation traite souvent de nombreuses entrées. Si possible, utilisez d’abord un petit modèle spécialisé déployé localement, car les modèles en ligne ont souvent des limites de débit, concurrence ou tokens.

Si le déploiement local n’est pas possible, choisissez un modèle spécialisé en traduction plutôt qu’un modèle de chat général. Les modèles de traduction conviennent généralement mieux aux entrées courtes, aux textes d’interface et à la traduction par lots. Lina organise le prompt de l’employée, les traductions de référence et le texte à traduire dans un prompt envoyé au modèle. Les utilisateurs peuvent ajuster le prompt de Lina pour contrôler le style et les règles de traduction.

Vous pouvez ajuster la concurrence selon la capacité du modèle pour contrôler débit, temps de réponse et coût.

Pour une pratique complète avec un petit modèle spécialisé déployé localement, consultez [Utiliser Lina et HY-MT1.5-1.8B local pour traduire les entrées de localisation](/ai-employees/scenarios/localization-hy-mt).

:::info{title=Astuce}
La concurrence est contrôlée par `AI_LOCALIZATION_CONCURRENCY`. Valeur par défaut `10`, plage autorisée `1` à `20`; les valeurs hors plage utilisent la valeur par défaut.
:::

## Progression et gestion des échecs

Les tâches de traduction de Lina s’exécutent en arrière-plan et écrivent les résultats entrée par entrée.

![](https://static-docs.nocobase.com/202605121235761.png)

Si une entrée échoue, l’erreur est enregistrée et la tâche s’arrête afin d’éviter des résultats incontrôlés.

- Le plugin AI ou Async Task Manager n’est pas activé.
- Lina n’a pas de modèle disponible configuré.
- Le service de modèle est indisponible ou expire.

Vérifiez les détails de la tâche asynchrone et les logs serveur pour fournisseur, modèle, langue cible, ID d’entrée et durée.

## Relecture avant publication

Après la traduction IA, relisez avant publication :

- Les entrées courtes comme menus, boutons et champs correspondent au contexte produit.
- Variables, espaces réservés et balises HTML sont conservés.
- La terminologie métier est cohérente.
- Publiez après relecture.
