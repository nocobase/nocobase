# Mettre en place la conversion de leads CRM

## 1. Introduction

Ce tutoriel vous guidera pas à pas pour mettre en place dans NocoBase la fonction de conversion d'opportunités du CRM (Opportunity Conversion). Nous verrons comment créer les collections (tables de données) nécessaires, configurer les pages de gestion, concevoir le flux de conversion et mettre en place la gestion des relations, afin de vous aider à construire l'ensemble du processus métier.

🎉 [La solution CRM de NocoBase est officiellement en ligne, n'hésitez pas à l'essayer !](https://www.nocobase.com/cn/blog/crm-solution)

## 2. Préparation : créer les collections nécessaires

Avant de commencer, nous devons préparer les 4 collections suivantes et configurer leurs relations.

### 2.1 Collection LEAD (Leads)

Cette collection stocke les informations des prospects ; ses champs sont définis ainsi :


| Field name     | Nom d'affichage du champ | Field interface  | Description                                                                          |
| -------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------------------ |
| id             | **Id**                   | Integer          | Clé primaire                                                                         |
| account_id     | **account_id**           | Integer          | Clé étrangère ACCOUNT                                                                |
| contact_id     | **contact_id**           | Integer          | Clé étrangère CONTACT                                                                |
| opportunity_id | **opportunity_id**       | Integer          | Clé étrangère OPPORTUNITY                                                            |
| name           | **Nom du lead**          | Single line text | Nom du prospect                                                                      |
| company        | **Société**              | Single line text | Nom de l'entreprise du prospect                                                      |
| email          | **E-mail**               | Email            | Adresse e-mail du prospect                                                           |
| phone          | **Téléphone**            | Phone            | Téléphone de contact                                                                 |
| status         | **Statut**               | Single select    | Statut actuel du lead (non qualifié, nouveau, en cours, à entretenir, en négociation, terminé) |
| Account        | **Société**              | Many to one      | Lié à la collection Société                                                          |
| Contact        | **Contact**              | Many to one      | Lié à la collection Contact                                                          |
| Opportunity    | **Opportunité**          | Many to one      | Lié à la collection Opportunité                                                      |

### 2.2 Collection ACCOUNT (Sociétés)

Conserve les informations détaillées sur l'entreprise ; configuration des champs :


| Field name | Nom d'affichage du champ | Field interface  | Description                              |
| ---------- | ------------------------ | ---------------- | ---------------------------------------- |
| name       | **Nom**                  | Single line text | Nom du compte (entreprise ou organisation) |
| industry   | **Secteur**              | Single select    | Secteur d'activité du compte             |
| phone      | **Téléphone**            | Phone            | Téléphone du compte                      |
| website    | **Site web**             | URL              | Adresse du site web officiel             |

### 2.3 Collection CONTACT (Contacts)

Stocke les informations des contacts, avec les champs suivants :


| Field name | Nom d'affichage du champ | Field interface  | Description                |
| ---------- | ------------------------ | ---------------- | -------------------------- |
| name       | **Nom**                  | Single line text | Nom du contact             |
| email      | **E-mail**               | Email            | Adresse e-mail du contact  |
| phone      | **Téléphone**            | Phone            | Téléphone du contact       |

### 2.4 Collection OPPORTUNITY (Opportunités)

Sert à enregistrer les informations sur les opportunités :


| Field name | Nom d'affichage du champ | Field interface  | Description                                                                            |
| ---------- | ------------------------ | ---------------- | -------------------------------------------------------------------------------------- |
| name       | **Nom**                  | Single line text | Nom de l'opportunité                                                                   |
| stage      | **Étape**                | Single select    | Étape de l'opportunité (qualification, besoin, proposition, négociation, clôture, gagnée, perdue) |
| amount     | **Montant**              | Number           | Montant de l'opportunité                                                               |
| close_date | **Date de clôture**      | Datetime         | Date prévue de clôture                                                                 |

## 3. Comprendre le flux de conversion d'opportunités

### 3.1 Vue d'ensemble du flux de conversion

Une opportunité passe généralement par les étapes suivantes pour passer de lead à opportunité officielle :

![20250225211802](https://static-docs.nocobase.com/20250225211802.png)

### 3.2 Description des relations

Une fois les 4 collections ci-dessus créées et leurs relations métier mappées correctement :

![Relations](https://static-docs.nocobase.com/20250225090913.png)

## 4. Créer les pages de gestion des données

Dans l'espace de travail NocoBase, créez une page de gestion pour chaque collection, et ajoutez quelques leads aléatoires pour pouvoir tester par la suite.

![Page de gestion des données](https://static-docs.nocobase.com/20250224234721.png)

## 5. Mettre en place la conversion d'opportunités

Ce chapitre se concentre sur la conversion d'un lead en données Société, Contact et Opportunité, et sur le fait d'éviter qu'une conversion soit déclenchée plusieurs fois.

### 5.1 Créer l'action d'édition «Convertir»

Dans la page de détail du lead, créez une action d'édition appelée «Convertir». Dans la fenêtre modale de conversion, configurez :

#### 5.1.1 Afficher les informations de base du lead

Affichez les informations de base du lead actuel en lecture seule, pour empêcher l'utilisateur de modifier les données d'origine par erreur.

#### 5.1.2 Afficher les champs de relation

Affichez dans la fenêtre les trois champs de relation suivants, et activez «Création rapide» sur chaque champ : si aucune donnée correspondante n'est trouvée, vous pouvez en créer instantanément.

![Afficher les champs de relation](https://static-docs.nocobase.com/20250224234155.png)

#### 5.1.3 Configurer le mappage par défaut de la création rapide

Dans les paramètres de la fenêtre «Création rapide», configurez les valeurs par défaut de chaque champ associé pour mapper automatiquement les informations du lead vers la collection cible. Règles de mappage :

- Lead/Nom du lead → Société/Nom
- Lead/E-mail → Société/E-mail
- Lead/Téléphone → Société/Téléphone
- Lead/Nom du lead → Contact/Nom
- Lead/E-mail → Contact/E-mail
- Lead/Téléphone → Contact/Téléphone
- Lead/Nom du lead → Opportunité/Nom
- Lead/Statut → Opportunité/Étape

Capture d'écran de configuration :

![Mappage par défaut 1](https://static-docs.nocobase.com/20250225000218.png)

Ajoutons à présent un retour visuel agréable sur l'action de soumission :
![20250226154935](https://static-docs.nocobase.com/20250226154935.png)
![20250226154952](https://static-docs.nocobase.com/20250226154952.png)

Effet à la soumission :
![Mappage par défaut 2](https://static-docs.nocobase.com/20250225001256.png)

#### 5.1.4 Vérifier le résultat de la conversion

Une fois la configuration terminée, lorsque vous lancez la conversion, le système crée et associe les nouvelles données Société, Contact et Opportunité selon les règles de mappage. Aperçu :

![](https://static-docs.nocobase.com/202502252130-transfer1.gif)
![](https://static-docs.nocobase.com/202502252130-transfer2.gif)

### 5.2 Empêcher la conversion en double

Pour éviter qu'un même lead soit converti plusieurs fois, on peut procéder de la manière suivante :

#### 5.2.1 Mettre à jour le statut du lead

Dans l'action de soumission du formulaire de conversion, ajoutez une étape de mise à jour automatique pour passer le statut du lead à «Converti».

Captures d'écran :

![Mise à jour 1](https://static-docs.nocobase.com/20250225001758.png)
![Mise à jour 2](https://static-docs.nocobase.com/20250225001817.png)
Démonstration :
![202502252130-transfer](https://static-docs.nocobase.com/202502252130-transfer.gif)

#### 5.2.2 Définir une règle de liaison sur le bouton

Ajoutez au bouton de conversion une règle de liaison : lorsque le statut du lead vaut «Converti», masquez automatiquement le bouton, pour empêcher une opération en double.

Captures :

![Liaison 1](https://static-docs.nocobase.com/20250225001838.png)
![Liaison 2](https://static-docs.nocobase.com/20250225001939.png)
![Liaison 3](https://static-docs.nocobase.com/20250225002026.png)

## 6. Configurer les blocs de gestion des relations sur les pages de détail

Pour permettre aux utilisateurs de consulter les données associées sur les pages de détail de chaque collection, vous devez configurer les blocs Liste ou Détail correspondants.

### 6.1 Configurer la page de détail de la collection Société

Dans la page de détail Société (par exemple dans la fenêtre d'édition / de détail d'un contact), ajoutez les blocs Liste suivants :

- Liste Contacts
- Liste Opportunités
- Liste Leads

Capture :

![Page de détail Société](https://static-docs.nocobase.com/20250225085418.png)

### 6.2 Ajouter des règles de filtrage

Ajoutez des règles de filtrage à chaque bloc Liste pour n'afficher que les données liées à l'identifiant de la société courante.

Captures :

![Filtrage 1](https://static-docs.nocobase.com/20250225085513.png)
![Filtrage 2](https://static-docs.nocobase.com/20250225085638.png)

### 6.3 Configurer les pages de détail Contact et Opportunité

Dans la fenêtre de détail de la collection Contact, ajoutez les blocs suivants :

- Liste Opportunités
- Détail Société
- Liste Leads (filtrée par ID)

Capture :

![Détail Contact](https://static-docs.nocobase.com/20250225090231.png)

Sur la page de détail Opportunité, ajoutez aussi :

- Liste Contacts
- Détail Société
- Liste Leads (filtrée par ID)

Capture :

![Détail Opportunité](https://static-docs.nocobase.com/20250225091208.png)

## 7. Conclusion

Grâce à ces étapes, vous avez mis en place une conversion d'opportunités CRM simple et configuré la gestion des relations entre Contacts, Sociétés et Leads. Nous espérons que ce tutoriel, présenté de manière claire et progressive, vous aidera à maîtriser la construction de ce processus métier, pour gagner en confort et en efficacité dans vos projets.

---

Si vous rencontrez le moindre souci au cours de ces opérations, n'hésitez pas à venir échanger sur la [communauté NocoBase](https://forum.nocobase.com) ou à consulter la [documentation officielle](https://docs-cn.nocobase.com). Nous espérons que ce guide vous aidera à mettre en place la conversion de leads selon vos besoins, et à l'étendre avec souplesse. Bonne réussite avec vos projets !
