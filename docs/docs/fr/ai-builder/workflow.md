---
title: "Gestion des workflows"
description: "Le Skill de gestion des workflows permet de créer, éditer, activer et diagnostiquer les workflows NocoBase."
keywords: "construction par IA, workflow, déclencheur, nœud, approbation, automatisation"
---

# Gestion des workflows

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir installé le NocoBase CLI et terminé l'initialisation conformément au [Démarrage rapide de la construction par IA](./index.md).

:::

## Introduction

Le Skill de gestion des workflows permet de créer, éditer, activer et diagnostiquer les workflows NocoBase — du choix du déclencheur à la construction de la chaîne de nœuds, en passant par l'analyse des résultats d'exécution, il couvre l'ensemble du cycle de vie d'utilisation du workflow.


## Périmètre fonctionnel

Capacités :

- Créer des workflows : choisir le type de déclencheur, ajouter les nœuds de traitement un à un
- Éditer des workflows : modifier la configuration du déclencheur, ajouter/supprimer/modifier des nœuds, déplacer et copier des nœuds
- Gestion des versions : les versions déjà exécutées créent automatiquement une nouvelle révision sans affecter l'historique
- Activer et exécuter manuellement les workflows
- Diagnostiquer les exécutions échouées : localiser le nœud en échec et le message d'erreur

Limitations :

- Ne peut pas concevoir le modèle de données (utilisez [Skill Modélisation des données](./data-modeling))
- Ne peut pas installer MCP ni traiter les problèmes d'environnement (utilisez [Skill Gestion des environnements](./env-bootstrap))
- Ne peut pas supprimer un workflow entier (opération à haut risque nécessitant une confirmation séparée)
- Ne peut pas inventer des types de nœuds ou de déclencheurs

## Exemples de prompts

### Scénario A : Créer un nouveau workflow

```
Aide-moi à orchestrer un workflow qui décrémente automatiquement le stock après la création d'une commande
```

Le Skill confirme d'abord le type de déclencheur et la conception de la chaîne de nœuds, puis effectue la création étape par étape après confirmation.

![20260419234303](https://static-docs.nocobase.com/20260419234303.png)

### Scénario B : Éditer un workflow existant

```
Dans le workflow de création de commande, ajoute un nœud de notification qui envoie un message interne à l'administrateur en cas de stock insuffisant
```

Si la version actuelle a déjà été exécutée, le Skill crée d'abord une nouvelle révision avant l'édition, sans affecter l'historique d'exécution.

![20260419234419](https://static-docs.nocobase.com/20260419234419.png)

### Scénario C : Diagnostiquer un échec d'exécution

```
La dernière exécution du workflow de décrémentation du stock après création de commande a échoué, aide-moi à voir où est le problème
```

Le Skill trouve la dernière exécution échouée, localise le nœud en échec et le message d'erreur, et fournit des suggestions de correction.

![20260419234532](https://static-docs.nocobase.com/20260419234532.png)

### Scénario D : Analyser ou résumer la logique d'un workflow

```
Aide-moi à analyser la logique de traitement du workflow «décrémenter le stock à la création de commande»
```

Sortie :

```markdown
# Analyse du workflow : décrémenter le stock à la création de commande

## Vue d'ensemble du workflow
**Nom du workflow :** décrémenter le stock à la création de commande

### Déclencheur
- **Type :** Événement post-action (Action)
- **Condition de déclenchement :** déclenché lorsque la collection `orders` (commandes) exécute l'action «créer» (déclenchement global).
- **Données associées :** transporte les données associées `details` (détails de commande) lors du déclenchement.
- **Mode d'exécution :** asynchrone

---

### Chaîne d'exécution des nœuds

**[Déclencheur] Création de commande**
        │
        ▼
**[1] Boucler les détails de commande (Loop)**
    * **Cible :** `{{$context.data.details}}`
    * *Action : exécuter les étapes suivantes pour chaque détail :*
        │
        ▼
    **branchIndex=0 (corps de boucle)**
        │
        ▼
    **[2] Interroger le stock du produit (Query)**
    * **Collection :** `products`
    * **Condition de filtrage :** `id = {{$scopes.5u6lsjzf8vh.item.productId}}`
        │
        ▼
    **[3] Vérifier si le stock est suffisant (Condition)**
    * **Moteur :** `formula.js`
    * **Expression :** `{{$jobsMapByNodeKey.n6rf8lf2lum.inventory}} < {{$scopes.5u6lsjzf8vh.item.quantity}}`
        │
        ├── **YES (branchIndex=1, stock insuffisant, condition VRAIE) :**
        │   ▼
        │   **[4] Notifier le super administrateur (Notification)**
        │   *envoyer une notification aux utilisateurs du rôle root, contenant :*
        │   *nom du produit, ID du produit, stock actuel, quantité requise par la commande.*
        │
        └── **NO (branchIndex=0, stock suffisant, branche vide)**
        │
        ▼
    **[5] Décrémenter le stock (SQL)**
    * **Instruction SQL :** `UPDATE products SET inventory = inventory - :quantity`

---

### Logique clé

| Étape | Description |
| :--- | :--- |
| **Déclenchement** | À la création de la commande, le système entre dans le workflow avec la liste complète des détails de commande. |
| **Boucle** | Chaque ligne de détail est traitée individuellement, chaque ligne correspondant à un produit et sa quantité achetée. |
| **Requête** | Récupération du stock actuel du produit via `productId`. |
| **Décision** | Vérification que `inventory < quantity` est vrai (c'est-à-dire stock insuffisant). |
| **Notification** | En cas de stock insuffisant, envoi d'un message interne aux utilisateurs ayant le rôle `root`. |
| **Décrémentation** | Mise à jour directe du stock via SQL ; en raison de la convergence des branches, la décrémentation est exécutée que le stock soit suffisant ou non. |

---

### ⚠️ Problème potentiel de conception

Le `downstreamId` du nœud de condition pointe vers le nœud «Décrémenter le stock», ce qui signifie que quelle que soit la branche empruntée (stock suffisant ou insuffisant), l'exécution converge finalement vers la décrémentation. Le comportement réel est le suivant :

- **Stock suffisant** $\rightarrow$ décrémentation directe (flux normal). ✓
- **Stock insuffisant** $\rightarrow$ notification de l'administrateur d'abord, **suivie quand même de la décrémentation** (le stock peut devenir négatif).

**Analyse :** cette conception relève du modèle «autoriser la survente avec alerte préventive», ou peut-être d'un oubli logique (l'intention initiale étant probablement de bloquer la décrémentation en cas de stock insuffisant). Il faut confirmer l'intention de conception avec la partie métier.

---

### État actuel

- **État d'activation :** `false` (désactivé)
- **Historique d'exécution :** déjà exécuté 1 fois.
- **Contrôle de version :** la version actuelle est gelée, toute modification nécessite la création d'une nouvelle version.
```

## Questions fréquentes

**Pourquoi un workflow nouvellement créé ne se déclenche-t-il pas ?**

Un workflow nouvellement créé est désactivé par défaut (`enabled: false`). Vérifiez que la configuration du déclencheur est correcte avant de l'activer manuellement.

**La modification d'un workflow affecte-t-elle l'historique d'exécution ?**

Non. Si la version actuelle a déjà des enregistrements d'exécution, le Skill crée automatiquement une nouvelle révision (revision), et l'historique d'exécution reste lié à l'ancienne version, sans impact.

## Liens connexes

- [Vue d'ensemble de la construction par IA](./index.md) — vue d'ensemble et installation de tous les Skills de construction par IA
- [Modélisation des données](./data-modeling) — créer et gérer les tables avec l'IA
- [Gestion des environnements](./env-bootstrap) — vérification d'environnement, installation, déploiement et diagnostic
