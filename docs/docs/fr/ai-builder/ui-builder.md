---
title: "Configuration de l'interface"
description: "Le Skill de configuration de l'interface permet de créer et d'éditer les pages, blocs, champs et configurations d'opérations de NocoBase."
keywords: "construction par IA, configuration de l'interface, pages, blocs, popups, interactions, UI Builder"
---

# Configuration de l'interface

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).

:::

## Introduction

Le Skill de configuration de l'interface permet de créer et d'éditer les pages, blocs, champs et configurations d'opérations de NocoBase — vous décrivez la page souhaitée en langage métier, et il prend en charge la génération du blueprint, la mise en page des blocs et les interactions.


## Périmètre fonctionnel

Capacités :

- Créer des pages complètes : tableau, formulaire de filtrage, popup de détails en une seule étape
- Éditer des pages existantes : ajouter des blocs, ajuster les champs, configurer des popups, ajuster la mise en page
- Configurer des interactions : valeurs par défaut, affichage/masquage de champs, calcul lié, état des boutons d'action
- Réutilisation par modèles : les popups et blocs récurrents peuvent être enregistrés en tant que modèles
- Prise en charge des tâches multi-pages : construction page par page dans l'ordre

Limitations :

- Ne peut pas configurer les permissions ACL (utilisez [Skill Configuration des permissions](./acl))
- Ne peut pas concevoir la structure des tables (utilisez [Skill Modélisation des données](./data-modeling))
- Ne peut pas orchestrer de workflows (utilisez [Skill Gestion des workflows](./workflow))
- Ne peut pas gérer la navigation des pages non modernes (v1), seules les pages v2 sont prises en charge.

## Exemples de prompts

### Scénario A : Créer une page de gestion

```
Aide-moi à créer une page de gestion des clients, avec une barre de recherche par nom et un tableau des clients affichant le nom, le téléphone, l'email et la date de création
```

Le Skill lit d'abord les champs de la table, génère le blueprint de la page et l'écrit.

![Créer une page de gestion](https://static-docs.nocobase.com/20260420100608.png)


### Scénario B : Configurer un popup

```
Quand on clique sur le nom du client dans le tableau, ouvrir une page de détails affichant tous les champs
```

Le Skill privilégie les popups de champ (clic pour ouvrir) plutôt que d'ajouter un bouton d'action supplémentaire.

![Configurer un popup](https://static-docs.nocobase.com/20260420100641.png)

### Scénario C : Définir des règles d'interaction

```
Pour le formulaire d'édition dans le popup /admin/c0vc2vmkfll/view/cec3e7a69ac/filterbytk/1, ajoute une règle de champ :
quand l'id utilisateur est 1, désactiver l'édition de username
```

Cela passera par la configuration de règles d'interaction, sans avoir à écrire la configuration manuellement.

![Définir des règles d'interaction](https://static-docs.nocobase.com/20260420100709.png)

### Scénario D : Construction multi-pages

```
Aide-moi à construire un système de gestion d'utilisateurs comportant deux pages : la page de gestion des utilisateurs et la page de gestion des rôles, regroupées dans un même groupe de pages.
```

Le Skill propose une conception simple multi-pages, et après ajustement et confirmation manuels, la construction peut être effectuée.

![Construction multi-pages](https://static-docs.nocobase.com/20260420100731.png)

## Questions fréquentes

**Que faire si après la création de la page les blocs ne contiennent pas de données ?**

Vérifiez d'abord que la table correspondante contient effectivement des enregistrements. Vérifiez également que la collection et la source de données associées au bloc sont correctes. Vous pouvez aussi utiliser directement le [Skill Modélisation des données](./data-modeling) pour créer des données simulées.

**Comment placer plusieurs blocs dans un popup ?**

Vous pouvez décrire le contenu du popup dans le prompt, par exemple «mettre un formulaire et un tableau de relations dans le popup d'édition». Le Skill génère une mise en page de popup personnalisée comportant plusieurs blocs.

**La configuration manuelle et la configuration par IA s'influencent-elles mutuellement ?**

Si la configuration manuelle et la configuration par IA sont effectuées simultanément, elles s'influencent mutuellement ; si elles ne sont pas effectuées en même temps, il n'y a pas d'influence.

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et installation de tous les Skills de construction par IA
- [Modélisation des données](./data-modeling) — créer et gérer les tables, champs et relations avec l'IA
- [Configuration des permissions](./acl) — configurer les rôles et les permissions d'accès aux données
- [Gestion des workflows](./workflow) — créer, éditer et diagnostiquer les workflows
