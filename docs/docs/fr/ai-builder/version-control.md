---
title: "Contrôle de version"
description: "Le Skill de contrôle de version (nocobase-revision) crée des versions restaurables de l'application après les jalons terminés par AI Builder."
keywords: "AI Builder,contrôle de version,nocobase-revision,nb revision create,restaurer une version"
---

# Contrôle de version

:::tip Prérequis

- Avant de lire cette page, installez NocoBase CLI et terminez l'initialisation comme indiqué dans [Démarrage rapide AI Builder](./index.md)
- Activez les plugins « Backup Management » et « Version Control »
- Les éditions Community et Standard n'incluent pas le plugin Version Control. Si vous avez seulement besoin d'un point de retour avant des changements importants, utilisez [Backup Management](../ops-management/backup-manager/index.mdx)

:::

## Introduction

Le Skill de contrôle de version (`nocobase-revision`) crée une version restaurable de l'application après qu'AI Builder a terminé un jalon significatif. Par exemple, après avoir construit une page, créé un ensemble de collections ou configuré un workflow, l'IA peut exécuter `nb revision create` pour enregistrer l'état actuel.

Il ne crée pas une version pour chaque modification de champ. Par défaut, il enregistre uniquement lorsqu'un jalon clair est terminé et vérifié, afin que la liste des versions reste lisible et que les points de restauration soient plus faciles à choisir.

Pour la liste des versions, la création manuelle, la restauration et les paramètres de conservation, consultez le [guide du plugin Version Control](../ops-management/version-control/index.md).

## Capacités

Peut faire :

- Créer une version après un jalon de construction terminé et vérifié
- Rédiger une description courte indiquant ce qui a été enregistré
- Créer des versions avec l'environnement CLI actuel

Ne peut pas faire :

- Remplacer les capacités de sauvegarde et de restauration fournies par le plugin Backup Management
- Créer des versions si le plugin Version Control n'est pas activé
- Restaurer automatiquement vers une version. Utilisez le [plugin Version Control](../ops-management/version-control/index.md) pour restaurer une version

## Exemples de prompts

### Scénario A : enregistrer une configuration de page terminée

```text
Enregistre la construction actuelle comme version : page de gestion des clients, zone de filtres et formulaire d'édition terminés
```

Le Skill transforme la description en une note de version concise, puis crée la version.

Mode commande :

```bash
nb revision create "Page de gestion des clients, zone de filtres et formulaire d'édition terminés"
```

### Scénario B : enregistrer un modèle de données et un workflow

```text
Les collections fournisseurs et le workflow d'approbation des achats sont vérifiés. Crée une version.
```

C'est adapté aux travaux qui combinent plusieurs capacités. Par exemple, créer des collections avec [Modélisation des données](./data-modeling), configurer un processus d'approbation avec [Gestion des workflows](./workflow), vérifier le résultat, puis enregistrer une version.

### Scénario C : créer une version dans un environnement spécifique

```text
Dans l'environnement dev, enregistre une version : page de gestion des tickets et champs SLA terminés
```

Si l'environnement indiqué n'est pas l'environnement CLI actuel, le Skill confirme d'abord la cible afin d'éviter d'enregistrer la version dans la mauvaise application.

Mode commande :

```bash
nb revision create --env dev --yes "Page de gestion des tickets et champs SLA terminés"
```

## Rédiger les descriptions de version

Une description de version doit dire ce qui a été terminé, et non se limiter à une étiquette vague.

Recommandé :

- `Registre clients, page de détail et flux de soumission d'approbation terminés`
- `Collections fournisseurs, formulaire de demande d'achat et workflow d'approbation terminés`
- `Completed customer detail page, edit form, and submission workflow wiring`

Non recommandé :

- `snapshot`
- `backup`
- `test`
- `version 2`
- Date ou horodatage seulement

N'incluez pas non plus de token, URL, mot de passe ou autre information sensible. La description apparaît dans la liste des versions et doit rester claire, lisible et auditable.

## FAQ

**Quand créer une version ?**

Après un jalon qui peut être vérifié indépendamment. Par exemple, une page s'ouvre et s'édite correctement, les relations entre collections ont été validées, ou un workflow a été enregistré et sa chaîne de nœuds vérifiée.

**Pourquoi ne pas créer une version après chaque ajustement de l'IA ?**

Trop de petites versions rendent rapidement la liste difficile à lire. Une version doit généralement représenter un point auquel vous pouvez revenir pour continuer le travail, pas seulement un renommage de champ ou un déplacement de bouton.

**Faut-il vérifier le résultat avant de créer une version ?**

Oui. Le Skill de contrôle de version sert à enregistrer un résultat terminé et vérifié. Si une page affiche encore une erreur ou si un workflow n'est pas confirmé, demandez d'abord à l'IA de corriger et de vérifier.

**Où restaurer une version ?**

Dans la liste des versions du plugin Version Control. La restauration écrase la configuration actuelle de l'application et les données incluses dans cette version. Avant l'opération, lisez le [guide du plugin Version Control](../ops-management/version-control/index.md).

## Liens connexes

- [Guide du plugin Version Control](../ops-management/version-control/index.md) — créer manuellement, restaurer et configurer les règles de version
- [Backup Management](../ops-management/backup-manager/index.mdx) — capacité de base requise par Version Control
- [Vue d'ensemble AI Builder](./index.md) — vue d'ensemble et installation de tous les Skills AI Builder
- [Gestion des publications](./publish.md) — publication multi-environnements, sauvegarde, restauration et migration
