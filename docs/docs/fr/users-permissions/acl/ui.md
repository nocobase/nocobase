---
pkg: '@nocobase/plugin-acl'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Application dans l'interface utilisateur

## Permissions des blocs de données

La visibilité des blocs de données d'une collection est contrôlée par les permissions d'affichage. Les configurations individuelles priment sur les paramètres globaux.

Comme illustré ci-dessous : avec les permissions globales, le rôle « admin » dispose d'un accès complet, mais la collection « Commandes » peut avoir des permissions individuelles configurées, la rendant invisible.

Configuration des permissions globales :

![](https://static-docs.nocobase.com/3d026311739c7cf5fdcd03f710d09bc4.png)

Configuration des permissions individuelles pour la collection « Commandes » :

![](https://static-docs.nocobase.com/a88caba1cad47001c1601bf402a4a2c1.png)

Dans l'interface utilisateur, tous les blocs de la collection « Commandes » ne sont pas affichés.

Voici le processus de configuration complet :

![](https://static-docs.nocobase.com/b283c004ffe0b746fddbffcf4f27b1df.gif)

## Permissions des champs

**Affichage** : Détermine si des champs spécifiques sont visibles au niveau du champ, permettant de contrôler quels champs sont visibles pour certains rôles au sein de la collection « Commandes ».

![](https://static-docs.nocobase.com/30dea84d984d95039e6f7b180955a6cf.png)

Dans l'interface utilisateur, seuls les champs avec des permissions configurées sont visibles dans le bloc de la collection « Commandes ». Les champs système (Id, Créé le, Dernière mise à jour le) conservent les permissions d'affichage même sans configuration spécifique.

![](https://static-docs.nocobase.com/40cc49b517efe701147fd2e799e79dcc.png)

- **Modification** : Contrôle si les champs peuvent être modifiés et enregistrés (mis à jour).

  Comme illustré, configurez les permissions de modification pour les champs de la collection « Commandes » (la quantité et les articles associés ont des permissions de modification) :

  ![](https://static-docs.nocobase.com/6531ca4122f0887547b5719e2146ba93.png)

  Dans l'interface utilisateur, seuls les champs avec des permissions de modification sont affichés dans le bloc de formulaire d'action de modification au sein de la collection « Commandes ».

  ![](https://static-docs.nocobase.com/12982450c311ec1bf87eb9dc5fb04650.png)

  Voici le processus de configuration complet :

  ![](https://static-docs.nocobase.com/1dbe559a9579c2e052e194e50edc74a7.gif)

- **Ajout** : Détermine si les champs peuvent être ajoutés (créés).

  Comme illustré, configurez les permissions d'ajout pour les champs de la collection « Commandes » (le numéro de commande, la quantité, les articles et l'expédition ont des permissions d'ajout) :

  ![](https://static-docs.nocobase.com/3ab1bbe41e61915e920fd257f2e0da7e.png)

  Dans l'interface utilisateur, seuls les champs avec des permissions d'ajout sont affichés dans le bloc de formulaire d'action d'ajout de la collection « Commandes ».

  ![](https://static-docs.nocobase.com/8d0c07893b63771c428974f9e126bf35.png)

- **Exportation** : Contrôle si les champs peuvent être exportés.
- **Importation** : Contrôle si les champs supportent l'importation.

## Permissions d'action

Les permissions configurées individuellement ont la priorité la plus élevée. Si des permissions spécifiques sont configurées, elles remplacent les paramètres globaux ; sinon, les paramètres globaux sont appliqués.

- **Ajout** : Contrôle si le bouton d'action d'ajout est visible dans un bloc.

  Comme illustré, configurez les permissions d'action individuelles pour la collection « Commandes » afin de permettre l'ajout :

  ![](https://static-docs.nocobase.com/2e3123b5dbc72ae78942481360626629.png)

  Dans l'interface utilisateur, lorsque l'action d'ajout est autorisée, le bouton d'ajout apparaît dans la zone d'action du bloc de la collection « Commandes ».

  ![](https://static-docs.nocobase.com/f0458980d450544d94c73160d75ba96c.png)

- **Affichage** : Détermine si le bloc de données est visible.

  Comme illustré, la configuration des permissions globales est la suivante (aucune permission d'affichage) :

  ![](https://static-docs.nocobase.com/6e4a1e6ea92f50bf84959dedbf1d5683.png)

  Configuration des permissions individuelles pour la collection « Commandes » :

  ![](https://static-docs.nocobase.com/f2dd142a40fe19fb657071fd901b2291.png)

  Dans l'interface utilisateur : les blocs de données de toutes les autres collections restent masqués, mais le bloc de la collection « Commandes » est affiché.

  Voici le processus de configuration complet de l'exemple :

  ![](https://static-docs.nocobase.com/b92f0edc51a27b52e85cdeb76271b936.gif)

- **Modification** : Contrôle si le bouton d'action de modification est affiché dans un bloc.

  ![](https://static-docs.nocobase.com/fb1c0290e2a833f1c2b415c761e54c45.gif)

  Les permissions d'action peuvent être affinées en définissant la portée des données.

  Par exemple, configurez la collection « Commandes » de sorte que les utilisateurs ne puissent modifier que leurs propres données :

  ![](https://static-docs.nocobase.com/b082308f62a3a9084cab78a370c14a9f.gif)

- **Suppression** : Contrôle la visibilité du bouton d'action de suppression dans un bloc.

  ![](https://static-docs.nocobase.com/021c9e79bcc1ad221b606a9555ff5644.gif)

- **Exportation** : Contrôle la visibilité du bouton d'action d'exportation dans un bloc.

- **Importation** : Contrôle la visibilité du bouton d'action d'importation dans un bloc.

## Permissions d'association

### En tant que champ

- Les permissions d'un champ d'association sont contrôlées par les permissions de champ de la collection source. Cela contrôle si le composant entier du champ d'association est affiché.

Par exemple, dans la collection « Commandes », le champ d'association « Client » n'a que les permissions d'affichage, d'importation et d'exportation.

![](https://static-docs.nocobase.com/d0dc797aae73feeabc436af285dd4f59.png)

Dans l'interface utilisateur, cela signifie que le champ d'association « Client » ne sera pas affiché dans les blocs d'action d'ajout et de modification de la collection « Commandes ».

Voici le processus de configuration complet de l'exemple :

![](https://static-docs.nocobase.com/372f8a4f414feea097c23b2ba326c0ef.gif)

- Les permissions pour les champs au sein du composant de champ d'association (tel qu'un sous-tableau ou un sous-formulaire) sont déterminées par les permissions de la collection cible.

Lorsque le composant de champ d'association est un sous-formulaire :

Comme illustré ci-dessous, le champ d'association « Client » dans la collection « Commandes » a toutes les permissions, tandis que la collection « Clients » elle-même est configurée en lecture seule.

Configuration des permissions individuelles pour la collection « Commandes », où le champ d'association « Client » a toutes les permissions de champ :

![](https://static-docs.nocobase.com/3a3ab9722f14a7b3a35361219d67fa40.png)

Configuration des permissions individuelles pour la collection « Clients », où les champs n'ont que des permissions d'affichage :

![](https://static-docs.nocobase.com/46704d179b931006a9a22852e6c5089e.png)

Dans l'interface utilisateur : le champ d'association « Client » est visible dans le bloc de la collection « Commandes ». Cependant, lorsqu'il est basculé vers un sous-formulaire, les champs au sein du sous-formulaire sont visibles dans la vue détaillée mais ne sont pas affichés dans les actions d'ajout et de modification.

Voici le processus de configuration complet de l'exemple :

![](https://static-docs.nocobase.com/932dbf6ac46e36ee357ff3e8b9ea1423.gif)

Pour contrôler davantage les permissions des champs au sein du sous-formulaire, vous pouvez accorder des permissions à des champs individuels.

Comme illustré, la collection « Clients » est configurée avec des permissions de champ individuelles (le nom du client n'est ni visible ni modifiable).

![](https://static-docs.nocobase.com/e7b875521cbc4e28640f027f36d0413c.png)

Voici le processus de configuration complet de l'exemple :

![](https://static-docs.nocobase.com/7a07e68c2fe2a13f0c2cef19be489264.gif)

Lorsque le composant de champ d'association est un sous-tableau, la situation est cohérente avec celle d'un sous-formulaire :

Comme illustré, le champ d'association « Expédition » dans la collection « Commandes » a toutes les permissions, tandis que la collection « Expéditions » est configurée en lecture seule.

Dans l'interface utilisateur : ce champ d'association est visible. Cependant, lorsqu'il est basculé vers un sous-tableau, les champs au sein du sous-tableau sont visibles dans l'action d'affichage mais pas dans les actions d'ajout et de modification.

![](https://static-docs.nocobase.com/fd4b7d81cdd765db789d9c85cf9dc324.gif)

Pour contrôler davantage les permissions des champs au sein du sous-tableau, vous pouvez accorder des permissions à des champs individuels :

![](https://static-docs.nocobase.com/51d70a624cb2b0366e421bcdc8abb7fd.gif)

### En tant que bloc

- La visibilité d'un bloc d'association est contrôlée par les permissions de la collection cible du champ d'association correspondant, et est indépendante des permissions du champ d'association.

Par exemple, l'affichage du bloc d'association « Client » est contrôlé par les permissions de la collection « Clients ».

![](https://static-docs.nocobase.com/633ebb301767430b740ecfce11df47b3.gif)

- Les champs au sein d'un bloc d'association sont contrôlés par les permissions de champ dans la collection cible.

Comme illustré, vous pouvez définir des permissions d'affichage pour des champs individuels dans la collection « Clients ».

![](https://static-docs.nocobase.com/35af9426c20911323b17f67f81bac8fc.gif)