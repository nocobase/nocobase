---
pkg: '@nocobase/plugin-acl'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Configuration des permissions

## Permissions générales

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Permissions de configuration

1.  **Permet de configurer l'interface :** Cette permission contrôle si un utilisateur est autorisé à configurer l'interface. L'activation de cette permission fait apparaître un bouton de configuration de l'interface utilisateur. Le rôle "admin" dispose de cette permission activée par défaut.
2.  **Permet d'installer, d'activer, de désactiver les plugins :** Cette permission détermine si un utilisateur peut activer ou désactiver des plugins. Lorsqu'elle est active, l'utilisateur a accès à l'interface du gestionnaire de plugins. Le rôle "admin" dispose de cette permission activée par défaut.
3.  **Permet de configurer les plugins :** Cette permission autorise l'utilisateur à configurer les paramètres des plugins ou à gérer les données backend des plugins. Le rôle "admin" dispose de cette permission activée par défaut.
4.  **Permet de vider le cache, de redémarrer l'application :** Cette permission est liée aux tâches de maintenance du système, telles que la suppression du cache et le redémarrage de l'application. Une fois activés, les boutons d'opération correspondants apparaissent dans le centre personnel. Cette permission est désactivée par défaut.
5.  **Les nouveaux éléments de menu sont accessibles par défaut :** Les menus nouvellement créés sont accessibles par défaut, et ce paramètre est activé par défaut.

### Permissions d'action globales

Les permissions d'action globales s'appliquent universellement à toutes les **collections** et sont classées par type d'opération. Ces permissions peuvent être configurées en fonction de la portée des données : toutes les données ou les données propres à l'utilisateur. La première option permet d'effectuer des opérations sur l'ensemble de la **collection**, tandis que la seconde restreint les opérations aux données pertinentes pour l'utilisateur.

## Permissions d'action des collections

![](https://static-docs.nocobase.com/6a0281391cecdea6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Les permissions d'action des **collections** affinent les permissions d'action globales en permettant de configurer individuellement l'accès aux ressources au sein de chaque **collection**. Ces permissions sont divisées en deux aspects :

1.  **Permissions d'action :** Celles-ci incluent les actions d'ajout, de visualisation, d'édition, de suppression, d'exportation et d'importation. Les permissions sont définies en fonction de la portée des données :
    -   **Toutes les données :** Accorde à l'utilisateur la possibilité d'effectuer des actions sur tous les enregistrements de la **collection**.
    -   **Mes données :** Restreint l'utilisateur à effectuer des actions uniquement sur les enregistrements qu'il a créés.

2.  **Permissions de champ :** Les permissions de champ vous permettent de définir des permissions spécifiques pour chaque champ lors de différentes opérations. Par exemple, certains champs peuvent être configurés pour être en lecture seule, sans privilèges d'édition.

## Permissions d'accès aux menus

Les permissions d'accès aux menus contrôlent l'accès en fonction des éléments de menu.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Permissions de configuration des plugins

Les permissions de configuration des **plugins** contrôlent la capacité à configurer des paramètres de **plugin** spécifiques. Lorsqu'elles sont activées, l'interface de gestion des **plugins** correspondante apparaît dans le centre d'administration.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)