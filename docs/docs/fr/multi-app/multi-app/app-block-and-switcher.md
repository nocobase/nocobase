---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Bloc Applications et sélecteur'
description: 'Bloc Applications et sélecteur dans le mode multi-applications : afficher les entrées des sous-applications, configurer les icônes, la visibilité et le sélecteur en haut à gauche.'
keywords: 'multi-applications,bloc Applications,sélecteur d’applications,entrée de sous-application,NocoBase'
---

# Bloc Applications et sélecteur

En plus de gérer les sous-applications dans l'administration, le mode multi-applications peut fournir des entrées d'applications dans le frontend. Les usages courants sont :

- Ajouter un bloc « Applications » sur une page pour afficher les sous-applications accessibles
- Activer le sélecteur d'applications en haut à gauche pour passer de l'application principale aux sous-applications

## Bloc Applications

![](https://static-docs.nocobase.com/202605271350840.png)

Le bloc « Applications » affiche une liste de sous-applications sur une page frontend. Il convient pour créer un portail simple permettant aux utilisateurs d'ouvrir différentes applications métier depuis une seule page.

Chaque application affiche :

- Icône de l'application
- Nom de l'application
- Entrée d'accès

Cliquer sur une application ouvre la sous-application correspondante.

### Configurer l'icône

Lors de la création ou de la modification d'une application dans App Supervisor, vous pouvez téléverser une icône dans « Configuration d'affichage ».

Si aucune icône n'est téléversée, le système génère une icône par défaut à partir de la première lettre du nom de l'application.

![](https://static-docs.nocobase.com/202605271402603.png)

### Masquer une application

Si une application ne doit pas apparaître dans le bloc « Applications », cochez « Masquer dans le bloc Applications » dans sa configuration.

Après masquage :

- L'application peut toujours être gérée dans l'administration
- L'application reste accessible par son adresse directe
- Elle n'apparaît simplement plus dans le bloc « Applications »

![](https://static-docs.nocobase.com/202605271403980.png)

## Sélecteur d'applications

![](https://static-docs.nocobase.com/202605271403304.png)

Le sélecteur d'applications s'affiche en haut à gauche et permet de passer rapidement à d'autres applications.

Pour afficher une application dans le sélecteur, activez « Afficher dans le sélecteur d'applications » dans sa configuration.

Une fois activé, les utilisateurs peuvent voir le sélecteur dans l'application principale ou les sous-applications et ouvrir d'autres applications depuis la liste.

![](https://static-docs.nocobase.com/202605271404322.png)

### Mode d'ouverture

Le sélecteur ouvre les applications comme suit :

- De l'application principale vers une sous-application : nouvel onglet
- D'une sous-application vers une autre : onglet actuel

Cela évite d'interrompre le travail dans l'application principale tout en rendant le passage entre sous-applications plus naturel.
