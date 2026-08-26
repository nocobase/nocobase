# Vue d'ensemble des fonctionnalités du CRM Sales Cloud

Dans ce chapitre, nous découpons le système en plusieurs modules selon les fonctions métier, en détaillant pour chacun ses fonctionnalités principales et la structure des données associées. La solution se concentre non seulement sur la fluidité des processus métier, mais accorde aussi une grande importance à la pertinence du stockage des données et à l'extensibilité du système.

---

## 1. Gestion des leads

### Vue d'ensemble

Le module de gestion des leads collecte et gère les informations des prospects. Le système permet de saisir des leads via différents canaux (site web, téléphone, e-mail, etc.) et propose des fonctions de mise à jour de statut, d'enregistrement de suivi et de notes. Lors de la conversion d'un lead, le système détecte automatiquement les doublons pour transformer correctement le lead en client, contact et opportunité.

### Tables associées

- **Leads (table des leads)**
  Stocke les informations de base du lead : nom, coordonnées, source, statut actuel, notes, etc. Conserve la date de création et l'historique des mises à jour pour faciliter les statistiques et l'analyse.

---

## 2. Gestion des clients et des contacts

### Vue d'ensemble

Ce module aide les utilisateurs à constituer et à maintenir leurs fiches clients. Les entreprises peuvent enregistrer le nom de la société, le secteur, l'adresse et d'autres informations clés, et gérer en parallèle les contacts associés (nom, fonction, téléphone, e-mail). Le système prend en charge des relations one-to-many ou many-to-many entre clients et contacts, garantissant l'intégrité et la mise à jour synchronisée des données.

### Tables associées

- **Accounts (table des clients)**
  Conserve la fiche détaillée du client, y compris les informations sur la société et d'autres données métier.
- **Contacts (table des contacts)**
  Stocke les informations personnelles liées au client et établit, via une clé étrangère, le lien avec la table des clients pour assurer la cohérence des données.

### Schéma du flux de conversion des leads

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

- Saisie du lead → suivi du lead (mise à jour du statut) → validation du lead → conversion en client, contact et opportunité

---

## 3. Gestion des opportunités

### Vue d'ensemble

Le module de gestion des opportunités se concentre sur la création d'opportunités commerciales à partir des leads convertis ou des informations des clients existants. Les utilisateurs peuvent enregistrer la date de clôture prévue, l'étape actuelle, le montant estimé et la probabilité de succès. Le système permet aussi de gérer dynamiquement les étapes de vente et, en cas d'échec, d'enregistrer les motifs détaillés pour optimiser les stratégies commerciales. Le module permet également d'associer plusieurs produits à une même opportunité, en calculant automatiquement le montant total.

### Tables associées

- **Opportunities (table des opportunités)**
  Enregistre les informations détaillées de chaque opportunité : date de clôture, étape, montant estimé, etc.
- **OpportunityLineItem (table des lignes d'opportunité)**
  Stocke les produits associés à l'opportunité : ID produit, quantité, prix unitaire, remise, etc., et permet le calcul automatique des montants.

### Étapes de conversion

- Création de l'opportunité → gestion (mise à jour des étapes) → génération du devis → validation client → génération de la commande de vente → exécution de la commande et mise à jour des statuts

---

## 4. Gestion des produits et des grilles tarifaires

### Vue d'ensemble

Ce module gère les informations produits et leur stratégie tarifaire. Le système permet de saisir les informations de base d'un produit (référence, nom, description, stock, prix, etc.) et de définir plusieurs modèles de prix. En associant les produits à des grilles tarifaires, vous pouvez gérer avec souplesse les besoins de tarification selon les marchés et les segments clients.

### Tables associées

- **Products (table des produits)**
  Stocke toutes les informations détaillées des produits, comme base pour la génération des devis et commandes.
- **PriceBooks (grilles tarifaires)**
  Gère les différents modèles de prix et les produits associés, et permet d'ajuster dynamiquement la stratégie tarifaire selon les besoins.

---

## 5. Gestion des devis

### Vue d'ensemble

Le module de gestion des devis génère un devis officiel à partir d'une opportunité existante, en enregistrant la durée de validité, la remise, le taux de TVA et le montant total. Le système intègre un workflow de validation qui permet à la hiérarchie d'examiner et d'ajuster les devis. Chaque devis peut contenir plusieurs lignes de produits, ce qui assure l'exactitude des calculs.

### Tables associées

- **Quotes (table des devis)**
  Enregistre les informations de base : opportunité associée, validité, remise, taux de TVA, statut global, etc.
- **QuoteLineItems (lignes de devis)**
  Stocke les détails de chaque produit du devis, et calcule automatiquement le montant par ligne et le total.

---

## 6. Gestion des commandes de vente

### Vue d'ensemble

Le module des commandes de vente convertit les devis validés en commandes et suit l'ensemble du cycle, de la création à la livraison. Les utilisateurs peuvent consulter en temps réel le statut de la commande, l'historique de validation et la situation logistique, pour mieux maîtriser l'avancement.

### Tables associées

- **SalesOrders (table des commandes de vente)**
  Enregistre les informations détaillées : devis associé, statut de la commande, validations, statut d'expédition, date de création, etc.

---

## 7. Gestion des activités

### Vue d'ensemble

Le module de gestion des activités aide l'équipe commerciale à organiser son quotidien : tâches, réunions, appels téléphoniques. Le système permet d'enregistrer le contenu de l'activité, les participants et les notes associées, et propose des fonctions de planning et de rappels pour s'assurer que toutes les activités se déroulent comme prévu.

### Tables associées

- **Activities (table des activités)**
  Stocke les tâches, réunions et appels : type d'activité, date, participants et clients ou opportunités associées.

---

## 8. Reporting et analyse de données

### Vue d'ensemble

Ce module aide l'entreprise à suivre en temps réel ses performances commerciales et la conversion via des statistiques multidimensionnelles et des graphiques. Le système permet de générer des entonnoirs de vente, des analyses de taux de conversion et des rapports de performance, pour aider la direction à prendre ses décisions.

### Description

Le reporting et l'analyse n'ont pas de table dédiée : ils s'appuient sur les données stockées dans les autres modules, agrégées et analysées pour offrir un retour en temps réel et anticiper les tendances.

---

## 9. Gestion des campagnes marketing (module optionnel)

### Vue d'ensemble

En tant que fonctionnalité auxiliaire, le module de campagnes marketing sert à planifier et suivre les actions marketing. Le système permet d'enregistrer la planification, le budget, l'exécution et l'évaluation, et de calculer le taux de conversion des leads et le ROI, pour soutenir vos actions promotionnelles.

### Description

La structure des données de ce module peut être étendue selon les besoins ; aujourd'hui, il sert principalement à enregistrer l'exécution des actions marketing et à compléter les données du module de gestion des leads.
