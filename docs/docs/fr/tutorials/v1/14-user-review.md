# Mettre en place la validation des inscriptions utilisateurs

Ce document propose deux approches pour mettre en place la validation des inscriptions utilisateurs, conçues pour différents scénarios métier :

- **Approche 1** : convient aux scénarios où vous souhaitez mettre en place rapidement et simplement un processus de validation des inscriptions. Cette approche utilise la fonction d'inscription par défaut du système, en attribuant à chaque nouvel utilisateur un rôle « Visiteur » sans permission ; l'administrateur valide ensuite manuellement et met à jour le rôle dans le back-office.
- **Approche 2** : convient aux scénarios qui nécessitent un processus de validation plus flexible et personnalisé. En concevant une table d'informations de demande dédiée, en configurant un workflow de validation et en activant le [plugin Public forms](https://docs-cn.nocobase.com/handbook/public-forms), vous gérez l'ensemble du flux, depuis la soumission d'une demande d'inscription jusqu'à la création automatique d'un nouvel utilisateur.

  ![](https://static-docs.nocobase.com/20250219144832.png)

---

## 1. Approche 1 : utiliser un rôle « Visiteur » sans permission

### 1.0 Cas d'usage

Adaptée aux scénarios où les exigences de validation sont simples, où l'on souhaite utiliser la fonction d'inscription native et faire valider manuellement les utilisateurs depuis le back-office.

### 1.1 Activer l'authentification par mot de passe et autoriser l'inscription

#### 1.1.1 Accéder à la page d'authentification utilisateur

Il faut d'abord vérifier si la fonction d'inscription est activée. Dans les paramètres système, accédez à la page [Authentification utilisateur](https://docs-cn.nocobase.com/handbook/auth/user) ; cette page gère tous les canaux d'authentification, comme « Connexion par identifiant et mot de passe », [Connexion Google](https://docs-cn.nocobase.com/handbook/auth-oidc/example/google), etc. (extensible via des plugins).

![](https://static-docs.nocobase.com/20250208164554.png)

L'interrupteur de la fonction d'inscription se trouve ici :
![](https://static-docs.nocobase.com/20250219084856.png)

### 1.2 Définir le rôle par défaut (essentiel)

#### 1.2.1 Créer un rôle « Visiteur »

Le système active la fonction d'inscription par défaut, mais le rôle par défaut peut ne pas convenir.

Il faut donc d'abord créer un rôle « Visiteur » dans la « Liste des rôles » comme rôle par défaut, sans aucune permission. Tous les nouveaux utilisateurs inscrits se verront automatiquement attribuer ce rôle.

![](https://static-docs.nocobase.com/20250208163521.png)

### 1.3 Configurer l'interface de validation des inscriptions (essentiel)

Passez en mode édition et configurez dans le back-office un bloc Table simple, en sélectionnant la table des utilisateurs, pour afficher et gérer les utilisateurs inscrits.

![](https://static-docs.nocobase.com/20250208165406.png)

### 1.4 Tester le processus de validation et mettre à jour manuellement le rôle

- Après inscription, la page du nouvel utilisateur s'affiche par défaut vide.
  ![](https://static-docs.nocobase.com/20250219084449.png)
- Dans l'interface d'administration, pour les utilisateurs dont les informations sont correctes, modifiez manuellement leur rôle pour le rôle souhaité afin de finaliser la validation.
  ![](https://static-docs.nocobase.com/20250219084702.png)

### 1.5 Configurer une page d'information (optionnel)

#### 1.5.1 Créer une nouvelle page, par exemple « Inscription réussie », et y afficher un message d'information

> **Étape optionnelle** : vous pouvez ajouter dans cette page vide un message convivial, par exemple « Votre compte est en cours de validation, merci de patienter », pour informer l'utilisateur de son statut actuel.
> ![](https://static-docs.nocobase.com/Pasted%20image%2020250208231631.png)

#### 1.5.2 Attribuer les permissions de la page d'information

Rendez-vous ensuite dans la configuration des permissions utilisateurs et attribuez cette page au rôle « Visiteur ». Après inscription réussie, l'utilisateur sera automatiquement redirigé vers cette page.
![](https://static-docs.nocobase.com/20250211223123.png)

### 1.6 Étendre les champs de la table des utilisateurs (optionnel)

> **Étape optionnelle** : si vous avez besoin de collecter des informations supplémentaires lors de l'inscription pour faciliter la validation, vous pouvez ajouter des champs (par exemple « Motif de la demande » ou « Code d'invitation ») à la table des utilisateurs. Si vous n'avez besoin que d'une validation basique, vous pouvez sauter cette étape.

#### 1.6.1 Ajouter de nouveaux champs de demande

Allez dans la « Table des utilisateurs » et ajoutez un nouveau champ pour enregistrer le motif de la demande ou le code d'invitation saisi par l'utilisateur lors de son inscription.
![](https://static-docs.nocobase.com/20250208164321.png)

#### 1.6.2 Activer les champs dans « Authentification utilisateur »

![](https://static-docs.nocobase.com/Pasted%20image%2020250219090248.png)

Une fois la configuration terminée, rendez-vous sur la page de connexion et cliquez sur «Créer un compte» : vous verrez les champs correspondants dans le formulaire d'inscription (s'ils sont configurés comme optionnels, ils seront affichés ; sinon, c'est le formulaire de base qui apparaît).
![](https://static-docs.nocobase.com/20250219090447.png)

#### 1.6.3 Ajouter les champs correspondants à la page de validation

Ajoutez ces deux nouveaux champs sur la page de validation : vous pouvez ainsi consulter les informations en temps réel et modifier le rôle de l'utilisateur.

![](https://static-docs.nocobase.com/20250208165622.png)

---

## 2. Approche 2 : ne pas ouvrir le canal d'inscription et créer une table intermédiaire de validation

### 2.0 Cas d'usage

Adaptée aux scénarios qui nécessitent un processus de validation plus flexible et personnalisé.

Cette approche s'appuie sur une table dédiée d'informations de demande, sur la configuration d'un workflow et sur le [plugin Public forms](https://docs-cn.nocobase.com/handbook/public-forms) pour gérer l'ensemble du flux, depuis la soumission de la demande d'inscription jusqu'à la création automatique de l'utilisateur. Les étapes principales garantissent les fonctionnalités de base et peuvent être enrichies par la suite selon les besoins.

### 2.1 Préparation préalable (essentiel)

#### 2.1.1 Concevoir la table d'informations de demande

##### 2.1.1.1 Créer la table « Informations de demande »

- **Création de la table**
  Dans le back-office NocoBase, créez une nouvelle table pour stocker les informations de demande d'inscription.
- **Configuration des champs**
  Ajoutez à la table les champs suivants, en veillant à utiliser le bon type et la bonne description :


  | Field display name     | Field name         | Field interface  | Description                                                              |
  | ---------------------- | ------------------ | ---------------- | ------------------------------------------------------------------------ |
  | **ID**                 | id                 | Integer          | Généré automatiquement, identifiant unique de l'enregistrement           |
  | **Username**           | username           | Single line text | Nom d'utilisateur du demandeur                                           |
  | **Email**              | email              | Email            | Adresse e-mail du demandeur                                              |
  | **Phone**              | phone              | Phone            | Téléphone du demandeur                                                   |
  | **Full Name**          | full_name          | Single line text | Nom complet du demandeur                                                 |
  | **Application Reason** | application_reason | Long text        | Motif ou explication de la demande saisi par le demandeur                |
  | **User Type**          | user_type          | Single select    | Type d'utilisateur futur (par exemple inscription par e-mail, ouverte)   |
  | **Status**             | status             | Single select    | État actuel de la demande (en attente, validée, refusée)                 |
  | **Initial Password**   | initial_password   | Single line text | Mot de passe initial du nouvel utilisateur (par défaut : nocobase)       |
  | **Created at**         | createdAt          | Created at       | Date de création enregistrée par le système                              |
  | **Created by**         | createdBy          | Created by       | Créateur enregistré par le système                                       |
  | **Last updated at**    | updatedAt          | Last updated at  | Date de la dernière modification enregistrée par le système              |
  | **Last updated by**    | updatedBy          | Last updated by  | Auteur de la dernière modification enregistré par le système             |
- **Aperçu de la structure de la table**
  Reportez-vous à l'image ci-dessous pour vérifier la configuration :
  ![](https://static-docs.nocobase.com/20250208145543.png)

##### 2.1.1.2 Saisie et affichage des données

- **Configurer l'interface de validation**
  Configurez sur l'interface principale une page d'administration « Validation des inscriptions », pour afficher les informations de demande soumises.
- **Saisir des données de test**
  Accédez à l'interface d'administration et saisissez quelques données de test pour vérifier que les données s'affichent correctement.
  ![](https://static-docs.nocobase.com/20250208151429.png)

### 2.2 Configuration du workflow

Cette section explique comment configurer le workflow pour créer automatiquement un nouvel utilisateur après validation de la demande.

#### 2.2.1 Créer le workflow de validation

##### 2.2.1.1 Nouveau workflow

- **Accéder à l'interface des workflows**
  Dans le back-office NocoBase, accédez à la page de configuration des workflows et choisissez «Nouveau workflow».
- **Choisir l'événement déclencheur**
  Vous pouvez choisir [«Événement après action»](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action) ou [«Événement avant action»](https://docs-cn.nocobase.com/handbook/workflow/triggers/pre-action) ; nous prenons ici l'événement avant action en exemple.
- **Configurer les nœuds du workflow**
  Créez un nœud «Créer un utilisateur» qui transforme les données du formulaire actuel en données du nouvel utilisateur, et configurez le mappage des champs et la logique de traitement.
  Voir l'illustration :
  ![](https://static-docs.nocobase.com/20250208153202.png)

#### 2.2.2 Configurer les boutons de validation du formulaire

##### 2.2.2.1 Ajouter les boutons «Valider» et «Refuser»

Dans le formulaire d'informations de demande, ajoutez les deux boutons «Valider» et «Refuser».
![](https://static-docs.nocobase.com/20250208153302.png)

##### 2.2.2.2 Configurer le comportement des boutons

- **Configurer le bouton «Valider»**
  - Le lier au workflow que vous venez de créer ;
  - Lors de la soumission, définir la valeur du champ «Statut» sur «Validée».
    Voir l'illustration :
    ![](https://static-docs.nocobase.com/20250208153429.png)
    ![](https://static-docs.nocobase.com/20250208153409.png)
- **Configurer le bouton «Refuser»**
  - Lors de la soumission, définir la valeur du champ «Statut» sur «Refusée».

##### 2.2.2.3 Définir des règles de liaison sur les boutons

Pour éviter les opérations en double, configurez une règle de liaison : lorsque le «Statut» n'est pas «En attente», masquez les boutons.
Voir l'illustration :
![](https://static-docs.nocobase.com/20250208153749.png)

### 2.3 Activer et configurer le plugin Public forms

Grâce au [plugin Public forms](https://docs-cn.nocobase.com/handbook/public-forms), les utilisateurs peuvent soumettre leur demande d'inscription depuis une page publique.

#### 2.3.1 Activer le plugin Public forms

##### 2.3.1.1 Activation du plugin

- **Accéder à la gestion des plugins**
  Dans le back-office, recherchez et activez le plugin «Public forms».
  Voir l'illustration :
  ![](https://static-docs.nocobase.com/20250208154258.png)

#### 2.3.2 Créer et configurer un formulaire public

##### 2.3.2.1 Créer le formulaire public

- **Nouveau formulaire**
  Dans le back-office, créez un formulaire public pour permettre aux utilisateurs de soumettre leur demande d'inscription.
- **Configurer les éléments du formulaire**
  Ajoutez les champs nécessaires (nom d'utilisateur, e-mail, téléphone, etc.) et définissez les règles de validation appropriées.
  Voir l'illustration :
  ![](https://static-docs.nocobase.com/20250208155044.png)

#### 2.3.3 Activer et configurer le plugin Public forms (essentiel)

##### 2.3.3.1 Tester le formulaire public

- **Ouvrir la page**
  Accédez à la page du formulaire public, remplissez et soumettez les données de la demande.
- **Vérifier le fonctionnement**
  Vérifiez que les données arrivent correctement dans la table d'informations de demande, et qu'après validation par le workflow, un nouvel utilisateur est bien créé automatiquement.
  Aperçu :
  ![](https://static-docs.nocobase.com/202502191351-register2.gif)

### 2.4 Extensions ultérieures (étapes optionnelles)

Une fois le processus d'inscription et de validation de base en place, vous pouvez l'enrichir selon vos besoins :

#### 2.4.1 Inscription par code d'invitation

- **Description** : limiter le périmètre et le nombre d'utilisateurs inscrits via un code d'invitation.
- **Approche** : ajouter un champ Code d'invitation dans le formulaire de demande, et utiliser un «événement avant action» pour valider et intercepter ce champ avant la soumission.

#### 2.4.2 Notification automatique par e-mail

- **Description** : envoyer automatiquement des e-mails pour informer du résultat de la validation, de l'inscription réussie, etc.
- **Approche** : combiner les nœuds e-mail de NocoBase au workflow pour ajouter l'envoi d'e-mails.

---

Si vous rencontrez le moindre souci au cours de ces opérations, n'hésitez pas à venir échanger sur la [communauté NocoBase](https://forum.nocobase.com) ou à consulter la [documentation officielle](https://docs-cn.nocobase.com). Nous espérons que ce guide vous aidera à mettre en place la validation des inscriptions selon vos besoins, et à l'étendre avec souplesse. Bonne réussite avec vos projets !
