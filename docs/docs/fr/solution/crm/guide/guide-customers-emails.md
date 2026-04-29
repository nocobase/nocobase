---
title: "Clients, contacts et emails"
description: "Vue 360 des clients du CRM, score de santé IA, fusion des clients, gestion des rôles de contact, envoi/réception d'emails avec assistance IA, enregistrement des activités."
keywords: "Gestion des clients, contacts, emails, score de santé, fusion de clients, NocoBase CRM"
---

# Clients, contacts et emails

> Customer, Contact et email sont trois modules étroitement liés — le Customer est l'entité principale, le Contact est l'interlocuteur de la communication, et l'email est l'enregistrement de cette communication. Ce chapitre les présente de manière unifiée.

![cn_04-customers-emails](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_04-customers-emails.png)

## Gestion des clients

Depuis le menu supérieur, accédez à la page **Customer**, qui contient deux onglets : Liste des clients et Outil de fusion des clients.

### Liste des clients

Au-dessus de la liste se trouvent les boutons de filtrage :

| Condition de filtrage | Description |
|---------|------|
| **All** | Tous les clients |
| **Active** | Clients actifs |
| **Potential** | Clients potentiels, n'ayant pas encore signé |
| **Dormant** | Clients dormants, sans interaction depuis longtemps |
| **Key Accounts** | Grands comptes / clients clés |
| **New This Month** | Nouveaux ce mois-ci |


![04-customers-emails-2026-04-07-01-32-03](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-32-03.png)


**Colonnes clés** :

- **Score de santé IA** : barre de progression circulaire de 0–100 (🟢 70–100 sain / 🟡 40–69 alerte / 🔴 0–39 danger)
- **Dernière activité** : temps relatif + code couleur, plus la durée sans contact est longue, plus la couleur est foncée

### Détails du client

Cliquer sur le nom d'un client ouvre la popup des détails, qui contient **3 onglets** :

| Onglet | Contenu |
|-------|------|
| **Détails** | Profil client, cartes statistiques, contacts, Opportunity, commentaires |
| **Email** | Emails échangés avec tous les contacts de ce client, 5 boutons IA |
| **Historique des changements** | Journal d'audit au niveau des champs |

L'**onglet Détails** adopte une mise en page à deux colonnes 2/3 à gauche + 1/3 à droite :

- **Colonne de gauche** : avatar du client (coloré selon le niveau : Normal = gris, Important = ambre, VIP = or), résumé en 4 colonnes (niveau / taille / région / type), cartes statistiques (montant cumulé signé / nombre d'Opportunity actives / nombre d'interactions du mois, requêtes API en temps réel), liste des contacts, liste des Opportunity, zone de commentaires
- **Colonne de droite** : profil intelligent IA (étiquettes IA, anneau du score de santé, risque de désengagement, meilleur moment de contact, stratégie de communication)

![04-customers-emails-2026-04-07-01-33-47](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-33-47.png)

### Score de santé IA

Le score de santé est calculé automatiquement en synthétisant les dimensions suivantes : fréquence d'interaction, activité des Opportunity, état des commandes, couverture des contacts.

Recommandations d'utilisation :

1. Ouvrez chaque jour la liste des clients et triez par score de santé
2. Concentrez-vous en priorité sur les clients en rouge (Critical) — ils risquent de partir
3. Clients en jaune (Warning) — planifiez un suivi léger
4. Clients en vert (Healthy) — maintenance à un rythme normal

### Fusion des clients

Lorsque des enregistrements clients en doublon apparaissent, nettoyez-les via l'outil de fusion :

1. **Lancer la fusion** : dans la liste des clients, cochez plusieurs clients → cliquez sur le bouton « Customer Merge »
2. **Accéder à l'outil de fusion** : basculez vers le second onglet et consultez la liste des demandes de fusion (Pending / Merged / Cancelled)
3. **Exécuter la fusion** : sélectionnez l'enregistrement principal (Master) → comparez champ par champ les différences → prévisualisez → confirmez. Le workflow en arrière-plan migre automatiquement toutes les données associées (Opportunity, contacts, activités, commentaires, commandes, devis, partages) et désactive les clients fusionnés

![04-customers-emails-2026-04-07-01-35-37](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-35-37.png)

![04-customers-emails-2026-04-07-01-38-07](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-07.png)

:::tip[Vérifiez attentivement avant la fusion]
La fusion des clients est une opération irréversible. Avant de l'exécuter, vérifiez attentivement le choix de l'enregistrement principal et l'arbitrage des valeurs des champs.
:::


![04-customers-emails-2026-04-07-01-37-44](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-37-44.gif)

---

## Gestion des contacts

Depuis le menu supérieur, accédez à la page **Paramètres → Contact**.

### Informations sur le contact

| Champ | Description |
|------|------|
| Name | Nom du contact |
| Company | Entreprise d'appartenance (associée à l'enregistrement Customer) |
| Email | Adresse email (utilisée pour l'association automatique des emails) |
| Phone | Numéro de téléphone |
| Role | Étiquette de rôle |
| Level | Niveau du contact |
| Primary Contact | Indique s'il s'agit du contact principal de ce client |

### Étiquettes de rôle

| Rôle | Signification |
|------|------|
| Decision Maker | Décideur |
| Influencer | Influenceur |
| Technical | Responsable technique |
| Procurement | Responsable des achats |

![04-customers-emails-2026-04-07-01-38-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-26.png)

### Envoyer un email depuis un contact

Ouvrez la page de détails d'un contact ; comme pour les autres modules de gestion de données, elle contient des onglets de détails, d'emails, d'historique des champs, etc.

![04-customers-emails-2026-04-07-01-38-52](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-38-52.png)

---

### Association des emails au CRM

Les emails sont automatiquement associés aux clients, contacts et Opportunity :

- Onglet « Email » des détails client → tous les emails échangés avec les contacts de ce client
- Détails du contact → historique complet des emails de ce contact
- Détails de l'Opportunity → enregistrements de communication associés

L'association se fait via une vue, sur la base de la correspondance automatique des adresses email des contacts.

![04-customers-emails-2026-04-07-01-40-26](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-40-26.png)

![04-customers-emails-2026-04-07-01-41-13](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-13.png)

### Assistance IA pour les emails

La page Email propose 6 scénarios d'assistance IA :

| Scénario | Fonction |
|------|------|
| **Rédaction de proposition** | L'IA génère un email de proposition basé sur le contexte du client et de l'Opportunity |
| **Email de suivi** | L'IA génère un email de suivi au ton approprié |
| **Analyse d'email** | L'IA analyse le sentiment de l'email et ses points clés |
| **Résumé d'email** | L'IA produit un résumé du fil de discussion |
| **Contexte client** | L'IA synthétise les informations contextuelles sur le client |
| **Briefing pour la direction** | L'IA extrait les informations clés du fil d'emails et génère un briefing |

![04-customers-emails-2026-04-07-01-41-46](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-41-46.png)

---

## Enregistrement des activités

Depuis le menu supérieur, accédez à la page **Paramètres → Activité**. C'est le journal centralisé de toutes les interactions clients.

| Type d'activité | Description |
|---------|------|
| Meeting | Réunion |
| Call | Appel |
| Email | Email |
| Visit | Visite |
| Note | Note |
| Task | Tâche |

![04-customers-emails-2026-04-07-01-42-20](https://static-docs.nocobase.com/04-customers-emails-2026-04-07-01-42-20.png)

Les enregistrements d'activité apparaissent également dans la vue calendrier du tableau de bord Overview.

---

## Pages associées

- [Guide d'utilisation du CRM](./index.md)
- [Gestion des Lead](./guide-leads) — Création automatique de Customer et de Contact après conversion d'un Lead
- [Gestion des Opportunity](./guide-opportunities) — Opportunity associées au client
- [Employés IA](./guide-ai)
