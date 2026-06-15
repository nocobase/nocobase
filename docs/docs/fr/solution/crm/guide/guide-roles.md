---
title: "Rôles et permissions"
description: "Présentation du système de rôles du CRM : quelles pages chaque poste peut voir, sur quelles données il peut opérer."
keywords: "Rôles et permissions, permissions de données, permissions de menu, rôles de département, NocoBase CRM"
---

# Rôles et permissions

> Selon leur poste, les personnes qui se connectent au CRM voient des menus et opèrent sur des données différents. Ce chapitre vous aide à répondre à une question : **« Que puis-je voir et que puis-je faire ? »**

## Quel rôle suis-je ?

Les rôles proviennent de deux voies :
1. **Rôle individuel** — un rôle qui vous est attribué directement par l'administrateur, qui vous suit
   ![08-roles-2026-04-07-01-45-14](https://static-docs.nocobase.com/08-roles-2026-04-07-01-45-14.png)

2. **Rôle de département** — votre département est associé à un rôle, vous l'héritez automatiquement en rejoignant le département

![08-roles-2026-04-07-01-46-57](https://static-docs.nocobase.com/08-roles-2026-04-07-01-46-57.png)

Les deux s'additionnent. Par exemple, si vous avez le rôle individuel « Commercial » et que vous êtes ajouté au département Marketing, vous disposez à la fois des permissions des rôles ventes et marketing.

![cn_08-roles](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles.png)

> \* **Sales Manager** et **Executive** ne sont pas associés à un département ; ils sont attribués directement aux personnes par l'administrateur.

---

## Pages visibles par chaque rôle

Une fois connecté, la barre de menu n'affiche que les pages auxquelles vous avez accès :

![cn_08-roles_1](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_1.png)

> ¹ Le commercial ne voit que le tableau de bord personnel SalesRep, sans voir les vues SalesManager ni Executive.

![08-roles-2026-04-07-01-47-48](https://static-docs.nocobase.com/08-roles-2026-04-07-01-47-48.png)

---

## Sur quelles données puis-je opérer ?

### Logique centrale des permissions de données

![cn_08-roles_2](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_2.png)

### Permissions de données du commercial

C'est le rôle le plus largement utilisé, à signaler particulièrement :

![cn_08-roles_3](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_3.png)

**Pourquoi les Lead sont-ils visibles par tous ?**
- Vous devez voir les Lead « non assignés » pour pouvoir les revendiquer
- Lors d'une détection de doublon, vous devez voir l'ensemble des données pour éviter les doublons
- Les Lead des autres, vous ne pouvez que les voir, sans pouvoir les modifier

![08-roles-2026-04-07-01-48-42](https://static-docs.nocobase.com/08-roles-2026-04-07-01-48-42.png)

**Pourquoi ne voit-on que ses propres clients ?**
- Le client est un actif central, avec un rattachement clair
- Pour empêcher de voir les coordonnées des clients des autres
- Pour les transferts, contactez votre manager

![08-roles-2026-04-07-01-50-37](https://static-docs.nocobase.com/08-roles-2026-04-07-01-50-37.png)

**² Le contact suit le client**

L'étendue des contacts que vous pouvez voir :
1. Les contacts dont vous êtes directement responsable
2. **Tous** les contacts du client dont vous êtes responsable (même créés par d'autres)

> Exemple : vous êtes responsable du client « Huawei », alors tous les contacts de Huawei vous sont visibles, peu importe qui les a saisis.

![08-roles-2026-04-07-01-51-26](https://static-docs.nocobase.com/08-roles-2026-04-07-01-51-26.png)

### Permissions de données des autres rôles

| Rôle | Données entièrement gérables | Autres données |
|------|-----------------|---------|
| Responsable des ventes | Toutes les données CRM | — |
| Direction | — | Toutes en lecture seule + export |
| Finance | Commandes, paiements, taux de change, devis | Autres en lecture seule |
| Marketing | Lead, étiquettes de Lead, modèles d'analyse de données | Autres en lecture seule |
| Customer Success Manager | Customer, contacts, activités, commentaires, fusion des clients | Autres en lecture seule |
| Support technique | Activités, commentaires (uniquement les siens) | Contacts visibles pour ceux dont il est responsable |
| Produit | Produits, catégories, tarification par paliers | Autres en lecture seule |

---

## Détection de doublons : résoudre le problème du « ne pas pouvoir voir »

Comme les données clients sont isolées par rattachement, vous ne voyez pas les clients des autres commerciaux. Mais avant de saisir un nouveau Lead ou un nouveau client, vous devez vérifier **si quelqu'un est déjà en train de le suivre**.

![cn_08-roles_4](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_08-roles_4.png)

La page de détection de doublons prend en charge trois types de recherche :

- **Détection de doublon Lead** : saisissez nom, entreprise, email ou mobile
- **Détection de doublon Customer** : saisissez nom de l'entreprise ou téléphone
- **Détection de doublon Contact** : saisissez nom, email ou mobile

Le résultat de la détection affiche **qui est le responsable**. Si l'enregistrement existe déjà, contactez directement le collègue concerné pour vous coordonner et éviter les conflits.

![08-roles-2026-04-07-01-52-51](https://static-docs.nocobase.com/08-roles-2026-04-07-01-52-51.gif)

---

## Foire aux questions

**Q : Je ne vois pas une certaine page, que faire ?**

Cela signifie que votre rôle n'a pas l'autorisation d'accéder à cette page. Si l'activité l'exige, contactez l'administrateur pour ajustement.

**Q : Je peux voir les données mais il n'y a pas de bouton modifier/supprimer ?**

Vous n'avez qu'un droit de consultation sur ces données. C'est en général parce qu'elles ne sont pas sous votre responsabilité (vous n'êtes pas l'owner). Les boutons d'action sans permission sont directement masqués et ne s'affichent pas.

**Q : Je viens de rejoindre un nouveau département, quand les permissions prennent-elles effet ?**

Immédiatement. Rafraîchissez la page pour voir le nouveau menu.

**Q : Une personne peut-elle avoir plusieurs rôles ?**

Oui. Le rôle individuel et le rôle de département s'additionnent. Par exemple, si on vous a attribué « Commercial » à titre individuel et que vous avez rejoint le département Marketing, vous disposez à la fois des permissions des rôles ventes et marketing.

## Documents associés

- [Présentation du système et tableaux de bord](./guide-overview) — Méthodes d'utilisation des différents tableaux de bord
- [Gestion des Lead](./guide-leads) — Processus complet des Lead
- [Gestion des clients](./guide-customers-emails) — Vue 360 des clients
