---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Configuration des blocs

## Bloc de messages électroniques

### Ajouter un bloc

Sur la page de configuration, cliquez sur le bouton **Créer un bloc**, puis sélectionnez le bloc **Messages électroniques (Tous)** ou **Messages électroniques (Personnel)** pour ajouter un bloc de messages électroniques.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Configuration des champs

Cliquez sur le bouton **Champs** du bloc pour sélectionner les champs à afficher. Pour des instructions détaillées, consultez la méthode de configuration des champs pour les tableaux.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Configuration du filtrage des données

Cliquez sur l'icône de configuration à droite du tableau et sélectionnez **Portée des données** pour définir la plage de données à utiliser pour filtrer les e-mails.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

Vous pouvez filtrer les e-mails ayant le même suffixe à l'aide de variables :
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## Bloc de détails d'e-mail

Tout d'abord, activez la fonctionnalité **Activer le clic pour ouvrir** sur un champ du bloc de messages électroniques :
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

Ajoutez le bloc **Détails de l'e-mail** dans la fenêtre contextuelle :
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Vous pouvez consulter le contenu détaillé de l'e-mail :
![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

Vous pouvez configurer les boutons nécessaires en bas de page.

## Bloc d'envoi d'e-mail

Il existe deux façons de créer un formulaire d'envoi d'e-mail :

1. Ajoutez un bouton **Envoyer un e-mail** en haut du tableau :
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2. Ajoutez un bloc **Envoyer un e-mail** :
   ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Ces deux méthodes permettent de créer un formulaire d'envoi d'e-mail complet :
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Chaque champ du formulaire d'e-mail est cohérent avec un formulaire standard et peut être configuré avec une **Valeur par défaut** ou des **Règles de liaison**, etc.

> Les formulaires de réponse et de transfert d'e-mail, intégrés en bas des détails de l'e-mail, incluent par défaut un traitement de données partiel qui peut être modifié via le **FlowEngine**.