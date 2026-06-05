---
pkg: '@nocobase/plugin-auth'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Authentification par mot de passe

## Interface de configuration

![](https://static-docs.nocobase.com/202411131505095.png)

## Autoriser l'inscription

Lorsque l'inscription est autorisée, la page de connexion affiche un lien pour créer un compte, vous permettant d'accéder à la page d'inscription.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Page d'inscription

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Si l'inscription n'est pas autorisée, le lien de création de compte n'apparaît pas sur la page de connexion.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a3745121.png)

Lorsque l'inscription n'est pas autorisée, la page d'inscription est inaccessible.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Paramètres du formulaire d'inscription<Badge>v1.4.0-beta.7+</Badge>

Vous pouvez définir quels champs de la **collection** d'utilisateurs doivent être affichés dans le formulaire d'inscription et s'ils sont obligatoires. Au moins un champ (nom d'utilisateur ou e-mail) doit être configuré comme affiché et obligatoire.

![](https://static-docs.nocobase.com/202411262133669.png)

Page d'inscription

![](https://static-docs.nocobase.com/202411262135801.png)

## Mot de passe oublié<Badge>v1.8.0+</Badge>

La fonctionnalité "Mot de passe oublié" permet aux utilisateurs de réinitialiser leur mot de passe par vérification e-mail s'ils l'ont oublié.

### Configuration administrateur

1.  **Activer la fonctionnalité "Mot de passe oublié"**

    Dans l'onglet "Paramètres" > "Authentification" > "Mot de passe oublié", cochez la case "Activer la fonctionnalité Mot de passe oublié".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Configurer le canal de notification**

    Sélectionnez un canal de notification par e-mail (actuellement, seul l'e-mail est pris en charge). Si aucun canal de notification n'est disponible, vous devrez en ajouter un au préalable.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Configurer l'e-mail de réinitialisation du mot de passe**

    Personnalisez l'objet et le contenu de l'e-mail, en prenant en charge les formats HTML ou texte brut. Vous pouvez utiliser les variables suivantes :
    - Utilisateur actuel
    - Paramètres système
    - Lien de réinitialisation du mot de passe
    - Durée de validité du lien de réinitialisation (minutes)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Définir la durée de validité du lien de réinitialisation**

    Définissez la durée de validité (en minutes) du lien de réinitialisation. La valeur par défaut est de 120 minutes.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Flux de travail utilisateur

1.  **Initier une demande de réinitialisation de mot de passe**

    Sur la page de connexion, cliquez sur le lien "Mot de passe oublié" (l'administrateur doit avoir activé cette fonctionnalité au préalable) pour accéder à la page de réinitialisation.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Saisissez l'adresse e-mail enregistrée et cliquez sur le bouton "Envoyer l'e-mail de réinitialisation".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Réinitialiser le mot de passe**

    L'utilisateur recevra un e-mail contenant un lien de réinitialisation. Après avoir cliqué sur ce lien, il pourra définir un nouveau mot de passe sur la page qui s'ouvrira.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Une fois la configuration terminée, l'utilisateur pourra se connecter au système avec son nouveau mot de passe.

### Remarques

- Le lien de réinitialisation a une durée de validité limitée, par défaut 120 minutes après sa génération (configurable par l'administrateur).
- Le lien ne peut être utilisé qu'une seule fois et devient immédiatement invalide après usage.
- Si l'utilisateur ne reçoit pas l'e-mail de réinitialisation, veuillez vérifier l'exactitude de l'adresse e-mail ou consulter le dossier des courriers indésirables.
- L'administrateur doit s'assurer que la configuration du serveur de messagerie est correcte afin de garantir l'envoi réussi des e-mails de réinitialisation.