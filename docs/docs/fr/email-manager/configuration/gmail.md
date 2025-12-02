---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Configuration Google

### Prérequis

Pour permettre aux utilisateurs de connecter leurs comptes Google Mail à NocoBase, vous devez déployer l'application sur un serveur qui peut accéder aux services Google. En effet, le backend effectuera des appels à l'API Google.

### Créer un compte

1. Ouvrez https://console.cloud.google.com/welcome pour accéder à Google Cloud.
2. Lors de votre première visite, vous devrez accepter les conditions d'utilisation.

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Créer une application

1. Cliquez sur "Select a project" en haut de la page.

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Cliquez sur le bouton "NEW PROJECT" dans la fenêtre contextuelle.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Remplissez les informations du projet.

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Une fois le projet créé, sélectionnez-le.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Activer l'API Gmail

1. Cliquez sur le bouton "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Accédez au tableau de bord "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Recherchez "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Cliquez sur le bouton "ENABLE" pour activer l'API Gmail.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Configurer l'écran de consentement OAuth

1. Cliquez sur le menu "OAuth consent screen" à gauche.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Sélectionnez "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Remplissez les informations du projet (elles seront affichées sur la page d'autorisation), puis cliquez sur Enregistrer.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Remplissez les informations de contact du développeur, puis cliquez sur Continuer.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Cliquez sur Continuer.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Ajoutez des utilisateurs de test pour les essais avant la publication de l'application.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Cliquez sur Continuer.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Vérifiez les informations récapitulatives, puis retournez au tableau de bord.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Créer des identifiants

1. Cliquez sur le menu "Credentials" à gauche.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Cliquez sur le bouton "CREATE CREDENTIALS", puis sélectionnez "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Sélectionnez "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Remplissez les informations de l'application.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Saisissez le domaine de déploiement final du projet (l'exemple ici est une adresse de test NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Ajoutez l'URI de redirection autorisée. Elle doit être `domaine + "/admin/settings/mail/oauth2"`. Exemple : `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Cliquez sur Créer pour afficher les informations OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Copiez l'ID client et le secret client, puis collez-les dans la page de configuration des e-mails.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Cliquez sur Enregistrer pour terminer la configuration.

### Publier l'application

Une fois que vous avez terminé le processus ci-dessus et testé des fonctionnalités comme la connexion d'autorisation des utilisateurs de test et l'envoi d'e-mails, vous pouvez publier l'application.

1. Cliquez sur le menu "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Cliquez sur le bouton "EDIT APP", puis sur le bouton "SAVE AND CONTINUE" en bas de page.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Cliquez sur le bouton "ADD OR REMOVE SCOPES" pour sélectionner les étendues d'autorisation utilisateur.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Recherchez "Gmail API", puis cochez "Gmail API" (assurez-vous que la valeur de l'étendue est l'API Gmail avec "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Cliquez sur le bouton "UPDATE" en bas de page pour enregistrer.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Cliquez sur le bouton "SAVE AND CONTINUE" en bas de chaque page, puis cliquez enfin sur le bouton "BACK TO DASHBOARD" pour revenir à la page du tableau de bord.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Cliquez sur le bouton "PUBLISH APP". Une page de confirmation apparaîtra, listant les informations requises pour la publication. Cliquez ensuite sur le bouton "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Retournez à la page de la console, et vous verrez que le statut de publication est "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Cliquez sur le bouton "PREPARE FOR VERIFICATION", remplissez les informations requises, puis cliquez sur le bouton "SAVE AND CONTINUE" (les données de l'image sont fournies à titre d'exemple uniquement).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Continuez à remplir les informations nécessaires (les données de l'image sont fournies à titre d'exemple uniquement).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Cliquez sur le bouton "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Cliquez sur le bouton "SUBMIT FOR VERIFICATION" pour soumettre la vérification.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Attendez le résultat de l'approbation.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Si l'approbation est toujours en attente, les utilisateurs peuvent cliquer sur le lien non sécurisé pour autoriser et se connecter.

![](https://static-docs.nocobase.com/mail-1735633689645.png)