---
title: "Produits, devis et commandes"
description: "Guide d'utilisation du catalogue de produits, des devis (avec processus d'approbation) et de la gestion des commandes du CRM : processus complet de la maintenance des produits à l'approbation des devis et à la livraison des commandes."
keywords: "Gestion des produits, devis, gestion des commandes, processus d'approbation, multi-devises, NocoBase CRM"
---

# Produits, devis et commandes

> Ce chapitre couvre la seconde moitié du processus de vente : maintenance du catalogue de produits, création et approbation des devis, suivi de la livraison et du paiement des commandes. Les devis sont également abordés dans la [gestion des Opportunity](./guide-opportunities) (du point de vue de l'Opportunity), tandis que ce chapitre se concentre sur les angles produit et commande.

![cn_03-products-orders](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_03-products-orders.png)

## Catalogue de produits

Depuis le menu supérieur, accédez à la page **Produit**, qui contient deux onglets :

### Liste des produits

À gauche se trouve l'arborescence des catégories (filtre JS), à droite le tableau des produits. Chaque produit comprend : nom, code, catégorie, spécification, unité, prix de référence, coût, devise.

![03-products-orders-2026-04-07-01-18-03](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-03.png)

Lors de la création d'un produit, en plus des informations de base, vous pouvez configurer un **tableau imbriqué de tarification par paliers** :

| Champ | Description |
|------|------|
| Devise | Devise de tarification |
| Quantité minimale | Quantité de départ pour ce palier de prix |
| Quantité maximale | Quantité plafond pour ce palier de prix |
| Prix unitaire | Prix unitaire correspondant à cette plage de quantité |
| Taux de remise | Pourcentage de remise sur volume |


![03-products-orders-2026-04-07-01-18-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-51.png)

Lors de la création d'un devis, après sélection d'un produit, le système associe automatiquement le palier de prix selon la quantité.

![03-products-orders-2026-04-07-01-19-39](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-19-39.png)

### Gestion des catégories

Le second onglet est un tableau arborescent des catégories de produits, qui prend en charge l'imbrication multi-niveaux. Cliquer sur « Ajouter une sous-catégorie » crée une sous-catégorie sous le nœud actuel.

![03-products-orders-2026-04-07-01-20-19](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-20-19.png)

---

## Devis

Les devis sont généralement créés depuis les détails d'une Opportunity (voir le chapitre « Créer un devis » dans [Opportunity et devis](./guide-opportunities)). Ce chapitre complète les informations sur le détail produit du devis et le processus d'approbation.

### Détail produit

Dans le tableau imbriqué des lignes de devis, après sélection d'un produit, plusieurs champs sont remplis automatiquement :

| Champ | Description |
|------|------|
| **Produit** | Sélectionner depuis le catalogue de produits |
| **Spécification** | En lecture seule, rempli automatiquement après sélection du produit |
| **Unité** | En lecture seule, remplie automatiquement |
| **Quantité** | Saisie manuelle |
| **Prix de référence** | En lecture seule, prix de référence du catalogue de produits |
| **Prix unitaire** | En lecture seule, correspond automatiquement au tarif par paliers selon la quantité |
| **Taux de remise** | En lecture seule, remise selon la tarification par paliers |
| **Montant de la ligne** | Calculé automatiquement |

![03-products-orders-2026-04-07-01-22-22](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-22-22.gif)

Le système exécute automatiquement la chaîne de calcul des montants : sous-total → remise → taxes → frais de port → montant total → équivalent en USD.

![03-products-orders-2026-04-07-01-23-13](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-23-13.gif)

### Prise en charge multi-devises

Si le client effectue ses transactions dans une devise autre que le dollar US, sélectionnez la devise correspondante. Le système **verrouille le taux de change** au moment de la création et convertit automatiquement en équivalent USD. La gestion des taux de change est maintenue dans la page **Paramètres → Taux de change**.

### Approbation

Une fois le devis créé, il doit passer par une approbation, après laquelle une nouvelle commande peut être créée.

---

## Gestion des commandes

Depuis le menu supérieur, accédez à la page **Commande**. Vous pouvez aussi créer une commande directement depuis les détails de l'Opportunity en cliquant sur « New Order » à partir d'un devis approuvé.

### Liste des commandes

En haut de la page se trouvent les boutons de filtrage :

| Bouton | Signification |
|------|------|
| **Tout** | Toutes les commandes |
| **En cours de traitement** | Commandes en cours d'exécution |
| **En attente de paiement** | En attente du paiement client |
| **Expédiées** | Expédiées en attente de confirmation de réception |
| **Terminées** | Processus terminé |

![03-products-orders-2026-04-07-01-25-09](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-09.png)

### Colonne de progression de la commande

La colonne « Progression de la commande » du tableau présente l'état actuel sous forme de barre de progression visuelle en pointillés :

```
À confirmer → Confirmée → En traitement → Expédiée → Terminée
```

Les étapes terminées sont mises en évidence, les étapes non atteintes apparaissent grisées.

### Ligne de récapitulatif

Informations récapitulatives en bas du tableau :

- **Montant des commandes sélectionnées / totales**
- **Répartition des statuts de paiement** (sous forme d'étiquettes)
- **Répartition des statuts de commande** (sous forme d'étiquettes)

![03-products-orders-2026-04-07-01-25-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-51.png)

### Créer une commande

**Du devis à la commande (recommandé)** : dans les détails de l'Opportunity, les devis au statut Approved affichent un bouton « New Order ». En cliquant, le système reprend automatiquement le client, les détails produit, le montant, la devise, le taux de change, etc.

![03-products-orders-2026-04-07-01-27-16](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-16.png)

**Création manuelle** : sur la page de liste des commandes, cliquez sur « Nouveau » et renseignez le client, les détails produit, le montant de la commande et les conditions de paiement.

### Progression du statut de la commande

Cliquez sur une commande pour ouvrir la popup de détails ; en haut se trouve un flux de statuts interactif, et un clic sur le nœud de statut suivant fait progresser le statut. Chaque changement de statut est enregistré par le système.

![03-products-orders-2026-04-07-01-27-50](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-50.png)

### Suivi des paiements

Le statut de la commande et le statut du paiement sont deux pistes indépendantes :

- **Statut de la commande** : confirmation → traitement → expédition → terminée (processus de livraison)
- **Statut du paiement** : en attente de paiement → paiement partiel → payé (processus d'encaissement)

Nous nous concentrons actuellement sur le processus front-office du CRM, sans imposer de restrictions conditionnelles sur le statut de la commande, qui sert simplement d'élément d'enregistrement. Si nécessaire, vous pouvez utiliser des règles d'interaction et des événements de table de données pour le contrôler.

---

Une fois la commande terminée, la boucle complète du processus de vente est bouclée. Découvrez ensuite la gestion des [Clients, contacts et emails](./guide-customers-emails).

## Pages associées

- [Guide d'utilisation du CRM](./index.md)
- [Gestion des Opportunity](./guide-opportunities) — Devis du point de vue de l'Opportunity
- [Clients, contacts et emails](./guide-customers-emails)
- [Tableaux de bord](./guide-overview) — Pénétration des données de commande
