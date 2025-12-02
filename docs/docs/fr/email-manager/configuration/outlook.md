---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Configuration Microsoft

### Prérequis
Pour permettre aux utilisateurs de connecter leurs boîtes aux lettres Outlook à NocoBase, vous devez déployer l'application sur un serveur capable d'accéder aux services Microsoft. Le backend utilisera les API Microsoft.

### Créer un compte

1. Rendez-vous sur https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Connectez-vous à votre compte Microsoft.
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Créer un locataire

1. Rendez-vous sur https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount et connectez-vous à votre compte.
    
2. Remplissez les informations de base et obtenez le code de vérification.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Remplissez les autres informations et continuez.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Remplissez les informations de votre carte de crédit (vous pouvez ignorer cette étape pour l'instant).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Obtenir l'ID client

1. Cliquez sur le menu supérieur et sélectionnez "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Sélectionnez "App registrations" dans le menu de gauche.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Cliquez sur "New registration" en haut de la page.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Remplissez les informations et soumettez.

Le nom peut être choisi librement. Pour les types de compte, sélectionnez l'option indiquée dans l'image ci-dessous. Vous pouvez laisser l'URI de redirection vide pour l'instant.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Récupérez l'ID client.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Autorisation d'API

1. Ouvrez le menu "API permissions" sur la gauche.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Cliquez sur le bouton "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Cliquez sur "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Recherchez et ajoutez les permissions suivantes. Le résultat final devrait ressembler à l'image ci-dessous.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (Par défaut)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Obtenir la clé secrète

1. Cliquez sur "Certificates & secrets" dans le menu de gauche.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Cliquez sur le bouton "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Remplissez la description et la date d'expiration, puis cliquez sur Ajouter.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Récupérez l'ID secret.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Copiez l'ID client et la clé secrète client, puis collez-les dans la page de configuration des e-mails.

![](https://static-docs.nocobase.com/mail-1733818630710.png)