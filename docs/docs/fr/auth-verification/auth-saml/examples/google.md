:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Google Workspace

## Configurer Google comme IdP

[Console d'administration Google](https://admin.google.com/) - Applications - Applications Web et mobiles

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Après avoir configuré l'application, copiez l'**URL SSO**, l'**ID d'entité** et le **Certificat**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Ajouter un nouvel authentificateur sur NocoBase

Paramètres du plugin - Authentification utilisateur - Ajouter - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Saisissez les informations copiées précédemment :

- SSO URL: URL SSO
- Public Certificate: Certificat public
- idP Issuer: ID d'entité
- http: Cochez cette option si vous effectuez des tests en local via HTTP.

Ensuite, copiez l'ID d'émetteur/d'entité SP et l'URL ACS depuis la section Usage.

## Renseigner les informations du SP sur Google

Retournez à la console Google. Sur la page **Détails du fournisseur de services**, saisissez l'URL ACS et l'ID d'entité que vous avez copiés précédemment, puis cochez l'option **Réponse signée**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Sous **Mappage d'attributs**, ajoutez des mappages pour les attributs correspondants.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)