---
title: 'NocoBase externe'
description: 'Connectez une autre application NocoBase comme source de données externe et découvrez la configuration, les fonctionnalités disponibles et les limites des workflows.'
keywords: 'NocoBase externe,source de données NocoBase,gestionnaire de sources de données,workflow,NocoBase'
---

# NocoBase externe

## Introduction

La source de données NocoBase externe connecte une autre application NocoBase à l'application actuelle tout en conservant les métadonnées de l'application distante, notamment les collections, les interfaces de champs, les titres et les champs d'association.

Par rapport à une source de données de base de données externe, il n'est généralement pas nécessaire de reconfigurer les interfaces de champs ni de créer manuellement les champs d'association. En plus de consulter, créer, modifier et supprimer des enregistrements, elle prend aussi en charge le téléversement et l'aperçu de fichiers, l'importation et l'exportation, les requêtes de graphiques ainsi que certains scénarios de workflow.

## Ajouter une Source de Données

Après avoir activé le plugin, ajoutez une source de données NocoBase externe dans le gestionnaire de sources de données, puis renseignez les informations d'accès de l'application distante.

| Option | Description |
| --- | --- |
| URL de l'API | L'URL complète de l'API de l'application NocoBase distante, par exemple `https://example.com/api` |
| Origin | L'origine publique de l'application NocoBase distante, par exemple `https://example.com`. Elle sert principalement à gérer les URL d'aperçu des fichiers locaux de l'application distante |
| API key | L'identifiant utilisé par l'application actuelle pour accéder à l'application NocoBase distante |
| En-têtes de requête | En-têtes supplémentaires envoyés à l'application distante, par exemple les informations d'espace |
| Délai d'expiration | Délai d'expiration des requêtes vers l'application distante |

Une fois la source de données activée, le système charge les collections de l'application distante.

![](https://static-docs.nocobase.com/202606101149185.png)

## Autorisations

Une source de données NocoBase externe est soumise aux autorisations de l'application actuelle et de l'application distante.

- Dans l'application actuelle, vous pouvez configurer les autorisations d'accès aux différentes collections et champs comme pour les autres sources de données externes.
- Dans l'application distante, les données sont lues et modifiées selon les autorisations de l'API key configurée.

Les sources de données NocoBase externes ne renvoient pas les métadonnées d'autorisation utilisées pour contrôler finement la visibilité des boutons côté frontend. Certains boutons peuvent donc ne pas être masqués automatiquement selon les autorisations comme avec la source de données principale. Qu'un bouton soit visible ou non, les opérations soumises passent toujours par la vérification des autorisations côté serveur dans l'application actuelle, et les opérations non autorisées sont refusées.

:::warning{title=Remarque}
Préparez une API key dédiée pour la source de données NocoBase externe et n'accordez que les autorisations de collections et d'opérations nécessaires. Si un utilisateur dispose d'une autorisation dans l'application actuelle mais que l'opération échoue, vérifiez les autorisations de l'API key distante.
:::

## Utiliser les Collections

Une fois les collections chargées, sélectionnez cette source de données dans la configuration des pages, des blocs, des graphiques ou des workflows pour utiliser les collections de l'application distante.

Lorsque la structure des collections change dans l'application distante, rechargez les collections dans l'application actuelle.

## Fonctionnalités

Les sources de données NocoBase externes servent principalement à utiliser dans l'application actuelle les collections et les données d'une application distante. La structure des collections, la configuration des champs et les données réelles restent gérées par l'application distante.

### Collections et Champs

L'application actuelle charge les métadonnées de l'application distante, notamment les collections, les interfaces de champs, les titres et les champs d'association. Par rapport à une source de données de base de données externe, vous n'avez généralement pas besoin de reconfigurer les interfaces de champs ni de créer manuellement les champs d'association dans l'application actuelle.

L'application actuelle ne permet pas de configurer directement les champs d'une source de données NocoBase externe. Pour ajouter des champs, ajuster des types de champs ou modifier des champs d'association, effectuez les changements dans l'application distante, puis rechargez les collections dans l'application actuelle.

### Enregistrements et Données Associées

Les sources de données NocoBase externes permettent de consulter, créer, modifier et supprimer des enregistrements dans les blocs de page, ainsi que de consulter et maintenir les données associées. Les opérations sont lancées par l'application actuelle et envoyées à l'application distante via l'API key configurée.

### Fichiers et Pièces Jointes

Les fichiers sont téléversés vers le stockage utilisé par l'application distante. L'application actuelle lance les requêtes de téléversement, d'aperçu et de téléchargement, mais les fichiers eux-mêmes ne sont pas stockés dans l'application actuelle.

Origin sert principalement à gérer les URL d'aperçu des fichiers stockés localement par l'application distante. Si l'application distante renvoie un chemin relatif, l'application actuelle utilise Origin pour compléter l'URL d'accès au fichier. Origin doit être l'adresse d'accès publique de l'application NocoBase distante, par exemple :

```text
https://example.com
```

N'utilisez pas l'URL de l'API comme Origin.

### Importation et Exportation

Les opérations d'importation et d'exportation lisent ou écrivent dans la source de données au moyen de fichiers externes et sont transmises à l'application distante pour exécution. L'application actuelle traite les opérations utilisateur, relaie les requêtes et renvoie les résultats de téléchargement. Les lectures et écritures réelles des données sont effectuées par l'application distante.

- Importer des enregistrements : l'application actuelle reçoit le fichier d'importation téléversé et le transmet à l'application distante pour exécuter l'importation.
- Exporter des enregistrements : l'application actuelle transmet la requête à l'application distante pour exporter les enregistrements. En mode synchrone, le fichier d'enregistrements renvoyé par l'application distante est diffusé vers le navigateur pour téléchargement. En mode asynchrone, une tâche asynchrone locale est créée, l'exportation est lancée dans l'application distante, la progression est synchronisée avec la tâche locale et le fichier résultat est diffusé depuis l'application distante lors du téléchargement.
- Exporter des pièces jointes : l'application actuelle transmet la requête à l'application distante pour exporter les pièces jointes. En mode synchrone, l'archive de pièces jointes renvoyée par l'application distante est diffusée vers le navigateur pour téléchargement. En mode asynchrone, une tâche asynchrone locale est créée, l'exportation des pièces jointes est lancée dans l'application distante, la progression est synchronisée avec la tâche locale et l'archive est diffusée depuis l'application distante lors du téléchargement.

### Impression de Modèle

L'impression de modèle peut utiliser les enregistrements d'une source de données NocoBase externe. Les modèles d'impression et la configuration des actions d'impression sont stockés dans l'application actuelle. Lors de l'impression, l'application actuelle lit les enregistrements distants et les données associées, puis génère le fichier d'impression dans l'application actuelle.

### Graphiques

#### Panneau de Requête

Les sources de données NocoBase externes peuvent être utilisées dans le panneau de requête des graphiques. L'application actuelle traite les paramètres de requête selon les autorisations locales configurées pour les graphiques, la source de données, la collection et les champs, puis demande les résultats à l'application distante.

L'API key distante doit également disposer de l'accès aux données correspondantes, sinon la requête échoue.

#### Panneau SQL

Le panneau SQL est le mode de requête SQL des graphiques et sert uniquement aux requêtes. L'application actuelle enregistre la configuration SQL et lance l'appel, tandis que le SQL est transmis à l'application distante pour exécution.

Lors de l'utilisation du panneau SQL, l'utilisateur local doit disposer des autorisations de configuration de l'interface dans l'application actuelle, et l'API key distante doit également disposer des autorisations de configuration de l'interface dans l'application distante. Le SQL n'est pas décomposé par autorisations de collection et de champ comme dans le panneau de requête. Accordez donc avec prudence les autorisations de configuration de l'interface aux utilisateurs locaux et à l'API key correspondante.

### Workflows

Les sources de données NocoBase externes peuvent impliquer des workflows dans l'application actuelle et dans l'application distante. L'application actuelle réagit aux événements des pages locales, des boutons et des chaînes de requêtes API. Après réception des requêtes transmises, l'application distante les traite selon sa propre configuration de workflow.

L'application actuelle n'écoute pas les événements de création, de mise à jour ou de suppression qui se produisent dans les collections distantes. Les événements des collections distantes ne sont déclenchés que dans l'application distante.

#### Déclencheurs

Le tableau suivant indique le comportement des déclencheurs affectés par les sources de données NocoBase externes dans l'application actuelle et l'application distante lorsque le workflow correspondant est activé.

| Déclencheur | Application actuelle | Application distante | Description |
| --- | --- | --- | --- |
| Événement avant action | Déclenché | Déclenché uniquement en mode global | Dans l'application actuelle, le mode global est déclenché et le mode local suit les liaisons de boutons de l'application actuelle. Après réception de la requête transmise par l'application distante, seul le mode global est déclenché |
| Événement après action | Déclenché | Déclenché uniquement en mode global | Dans l'application actuelle, le mode global est déclenché et le mode local suit les liaisons de boutons de l'application actuelle. Après réception de la requête transmise par l'application distante, seul le mode global est déclenché |
| Événement d'action personnalisée | Déclenché | Non déclenché | Un bouton "Déclencher le workflow" lié dans l'application actuelle déclenche le workflow local. Les requêtes CRUD transmises ne déclenchent pas d'événements d'action personnalisée distants |
| Événement de collection | Non déclenché | Déclenché | Les données réelles changent dans l'application distante. L'application actuelle ne déclenche pas d'événements de collection locaux, tandis que l'application distante déclenche ses propres événements de collection |
| Déclencheur planifié par champ de date | Non déclenché | Déclenché | L'application actuelle ne se déclenche pas sur la base des champs des collections distantes. L'application distante se déclenche selon sa propre configuration de champs de date |

Les déclencheurs qui ne dépendent pas des sources de données se déclenchent dans l'application actuelle et l'application distante selon leurs propres configurations.

Pour orchestrer dans l'application actuelle des workflows qui opèrent sur des données NocoBase externes, utilisez les événements avant action, les événements après action ou les événements d'action personnalisée. Les workflows existants dans l'application distante s'exécutent indépendamment dans l'application distante.

#### Nœuds

Le tableau suivant ne liste que les nœuds liés aux sources de données. Les nœuds généraux, comme condition, calcul, boucle et traitement JSON, ne dépendent pas du type de source de données et peuvent être utilisés normalement.

| Nœud | Disponible | Description |
| --- | --- | --- |
| Rechercher des enregistrements | Disponible | Recherche les enregistrements dans l'application distante |
| Créer un enregistrement | Disponible | Crée des enregistrements dans l'application distante |
| Mettre à jour un enregistrement | Disponible | Met à jour les enregistrements dans l'application distante |
| Supprimer un enregistrement | Disponible | Supprime les enregistrements dans l'application distante |
| Nœud SQL | Non disponible | Le nœud SQL de workflow prend uniquement en charge les sources de données de base de données |
| Nœud d'agrégation | Non disponible | Le nœud d'agrégation prend uniquement en charge les sources de données de base de données |

## FAQ

### Les Collections N'apparaissent Pas

Vérifiez que la source de données est activée et que l'URL de l'API et l'API key sont correctes. L'application distante doit également autoriser cette API key à accéder aux collections correspondantes.

### Les Fichiers Sont Téléversés Mais Ne Peuvent Pas Être Prévisualisés

Si l'application actuelle ou l'application distante utilise un stockage local de fichiers, vérifiez qu'Origin est bien l'adresse d'accès publique de l'application correspondante. Origin ne doit pas être l'URL de l'API.

### L'application Actuelle A Les Autorisations, Mais L'opération Échoue

Vérifiez les autorisations de l'API key dans l'application distante. Les sources de données NocoBase externes sont soumises aux autorisations de l'application actuelle et de l'application distante.

### Les Collections Ne Sont Plus Utilisables Après Une Erreur Du Service Distant

Si l'application distante renvoie 502, redémarre ou est temporairement indisponible, l'application actuelle peut temporairement ne pas lire les métadonnées des collections distantes. Une fois le service distant rétabli, l'application actuelle recharge automatiquement les métadonnées lors du prochain accès aux collections de cette source de données.

### Pourquoi Les Champs Ne Peuvent Pas Être Configurés Dans L'application Actuelle

Les sources de données NocoBase externes utilisent la structure des collections et la configuration des champs de l'application distante. Modifiez les champs dans l'application distante, puis rechargez les collections dans l'application actuelle.
