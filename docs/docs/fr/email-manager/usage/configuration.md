---
pkg: "@nocobase/plugin-email-manager"
title: "Configuration des blocs e-mail"
description: "Bloc tableau d'e-mails : ajouter un bloc, configurer les champs, portée des données (tous / utilisateur courant), filtrage par adresse e-mail ou par suffixe."
keywords: "bloc e-mail, tableau d'e-mails, portée des données, filtrage par e-mail, NocoBase"
---
# Configuration des blocs

## Bloc de messages e-mail

### Ajouter un bloc

Sur la page de configuration, cliquez sur le bouton **Créer un bloc**, puis sélectionnez le bloc **Tableau d'e-mails** pour ajouter un bloc de messages e-mail.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_56_PM.png)

### Configuration des champs

Cliquez sur le bouton **Champs** du bloc pour sélectionner les champs à afficher. Pour des instructions détaillées, consultez la méthode de configuration des champs pour les tableaux.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM.png)

### Définir la portée des données
Dans la configuration située à droite du bloc, vous pouvez choisir la portée des données : tous les e-mails ou les e-mails de l'utilisateur actuellement connecté.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM%20(1).png)

### Filtrer les données par adresse e-mail

Cliquez sur le bouton de configuration à droite du bloc de messages e-mail, sélectionnez **Portée des données** pour définir la portée de filtrage des e-mails.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

Configurez la condition de filtrage, sélectionnez le champ d'adresse e-mail à filtrer, puis cliquez sur **Confirmer** pour enregistrer.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_26_PM.png)

Le bloc de messages e-mail affichera les e-mails correspondant à la condition de filtrage.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_29_PM.png)

> Le filtrage par adresse e-mail n'est pas sensible à la casse.

### Filtrer les données par suffixe d'adresse e-mail

Créez dans la collection métier un champ destiné à stocker les suffixes d'adresses e-mail (de type JSON), afin de pouvoir filtrer ultérieurement les messages e-mail.

![](https://static-docs.nocobase.com/email-manager/data-source-manager-main-NocoBase-12-02-2025_04_36_PM.png)

Renseignez les informations de suffixe d'adresse e-mail.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_38_PM.png)

Cliquez sur le bouton de configuration à droite du bloc de messages e-mail, sélectionnez **Portée des données** pour définir la portée de filtrage des e-mails.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

Configurez la condition de filtrage, sélectionnez le champ de suffixe d'e-mail à filtrer, puis cliquez sur **Confirmer** pour enregistrer.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_41_PM.png)

Le tableau des messages e-mail affichera les e-mails correspondant à la condition de filtrage.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_48_PM.png)

## Bloc de détails d'e-mail

Tout d'abord, activez la fonctionnalité **Activer le clic pour ouvrir** sur un champ du bloc de messages e-mail.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_01_PM.png)

Ajoutez le bloc **Détails de l'e-mail** dans la fenêtre contextuelle.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_02_PM.png)

Vous pouvez consulter le contenu détaillé de l'e-mail.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_03_PM.png)

Vous pouvez configurer les boutons nécessaires en bas de page.

> Si l'e-mail courant est à l'état brouillon, le formulaire d'édition de brouillon s'affiche par défaut.

## Bloc d'envoi d'e-mail

Il existe deux façons de créer un formulaire d'envoi d'e-mail :

1. Ajouter un bouton **Envoyer un e-mail** en haut du tableau :  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_04_PM.png)

2. Ajouter un bloc **Envoi d'e-mail** :  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM.png)

Ces deux méthodes permettent de créer un formulaire d'envoi d'e-mail complet.

![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM%20(1).png)

Chaque champ du formulaire d'e-mail est cohérent avec un formulaire standard et peut être configuré avec une **valeur par défaut**, des **règles de liaison**, etc.
