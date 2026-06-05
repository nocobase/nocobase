---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



pkg: "@nocobase/plugin-email-manager"
---

# Centre d'e-mails

## Introduction
Une fois le plugin d'e-mails activé, le Centre d'e-mails est disponible par défaut. Il vous permet de connecter des comptes, de gérer vos e-mails et de configurer diverses fonctionnalités.

Cliquez sur l'icône de message e-mail en haut à droite pour accéder à la page de gestion des e-mails.

![](https://static-docs.nocobase.com/mail-1733816161753.png)

## Liaison de compte

### Lier un compte

Cliquez sur le bouton « Account setting ». Dans la fenêtre contextuelle qui s'ouvre, cliquez sur le bouton « Link account » et choisissez le type de compte e-mail que vous souhaitez lier.

![](https://static-docs.nocobase.com/mail-1733816162279.png)

Votre navigateur ouvrira automatiquement la page de connexion de votre fournisseur d'e-mails. Connectez-vous à votre compte et accordez les autorisations nécessaires.

![](https://static-docs.nocobase.com/mail-1733816162534.png)

Une fois l'autorisation terminée, vous serez redirigé vers la page NocoBase pour la liaison du compte et la synchronisation des données. (La première synchronisation peut prendre un certain temps, veuillez patienter un instant.)

![](https://static-docs.nocobase.com/mail-1733816162794.png)

Une fois la synchronisation des données terminée, la page actuelle se fermera automatiquement et vous reviendrez à la page des messages e-mail d'origine, où vous pourrez constater que le compte a été lié.

![](https://static-docs.nocobase.com/mail-1733816163177.png)

Cliquez sur la zone de superposition pour fermer la fenêtre contextuelle et afficher la liste de vos e-mails.

![](https://static-docs.nocobase.com/mail-1733816163503.png)

### Supprimer un compte
Vous pouvez cliquer sur « Delete » pour supprimer le compte et les e-mails associés.

![](https://static-docs.nocobase.com/mail-1733816163758.png)

## Gestion des e-mails

### Filtrage des e-mails

Sur la page de gestion des e-mails, la zone de gauche est dédiée aux filtres, tandis que la zone de droite affiche la liste des e-mails. Par défaut, vous accédez à la boîte de réception.

![](https://static-docs.nocobase.com/mail-1733816165536.png)

Les e-mails ayant le même objet sont regroupés. Le champ d'objet indique le nombre total d'e-mails dans la conversation.
Si certains e-mails d'une même conversation correspondent aux critères de filtrage, l'e-mail racine de la conversation s'affiche, et son type est indiqué à côté du champ d'objet.

![](https://static-docs.nocobase.com/mail-1733816165797.png)

Les objets des e-mails non lus sont affichés en gras, et l'icône d'e-mail en haut de page indique le nombre d'e-mails non lus.

![](https://static-docs.nocobase.com/mail-1733816166067.png)

### Synchroniser les e-mails manuellement

L'intervalle de synchronisation des e-mails est actuellement de 5 minutes. Si vous souhaitez forcer une synchronisation, cliquez sur le bouton « Refresh ».

![](https://static-docs.nocobase.com/mail-1733816166364.png)

### Modifier le statut de lecture

Les boutons « Mark as read » et « Mark as unread » vous permettent de modifier le statut de lecture de plusieurs e-mails en même temps.

![](https://static-docs.nocobase.com/mail-1733816166621.png)

### Envoyer un e-mail

Cliquez sur le bouton « Write email » en haut de page pour ouvrir le panneau de composition.

![](https://static-docs.nocobase.com/mail-1733816166970.png)

Après avoir rempli les informations nécessaires, vous pouvez envoyer l'e-mail. Actuellement, les pièces jointes sont limitées à 3 Mo.

![](https://static-docs.nocobase.com/mail-1733816167214.png)

### Afficher un e-mail

Cliquez sur le bouton « View » d'une ligne pour afficher les détails de l'e-mail. Il existe actuellement deux formats : le premier concerne un e-mail unique, où vous pouvez voir directement les informations détaillées.

![](https://static-docs.nocobase.com/mail-1733816167456.png)

Le second format concerne plusieurs e-mails ayant le même objet. Ils sont affichés sous forme de liste par défaut, et vous pouvez les développer ou les réduire en cliquant dessus.

![](https://static-docs.nocobase.com/mail-1733816167750.png)

Après avoir consulté les détails d'un e-mail, son statut est automatiquement défini comme lu. Vous pouvez le marquer comme non lu en cliquant sur le bouton « ... » à droite, puis en sélectionnant « Mark as unread ».

### Répondre à un e-mail

Une fois dans les détails de l'e-mail, un bouton « Reply » se trouve en bas. Vous pouvez l'utiliser pour répondre. Si plusieurs personnes sont concernées, cliquez sur « Reply all » pour répondre à tous.

![](https://static-docs.nocobase.com/mail-1733816167998.png)

### Transférer un e-mail

Vous pouvez cliquer sur le bouton « Forward » en bas de page pour transférer l'e-mail à d'autres personnes.

![](https://static-docs.nocobase.com/mail-1733816168241.png)