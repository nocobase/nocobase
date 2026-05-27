---
pkg: '@nocobase/plugin-app-supervisor'
title: 'SSO des applications'
description: 'SSO des applications en mode multi-applications : connexion automatique aux sous-applications depuis l’application principale ou le sélecteur, avec correspondance par nom d’utilisateur et inscription automatique.'
keywords: 'multi-applications,SSO des applications,connexion automatique,sélecteur d’applications,sous-application,NocoBase'
---

# SSO des applications

Le SSO des applications simplifie la connexion lorsque les utilisateurs accèdent aux sous-applications.

Une fois activé, lorsqu'un utilisateur entre dans une sous-application depuis l'application principale ou passe d'une sous-application à une autre, le système tente de le connecter automatiquement à la sous-application cible avec l'utilisateur actuel. Il n'a pas besoin de saisir ses identifiants dans chaque sous-application.

## Cas d'utilisation

Le SSO des applications convient aux scénarios suivants :

- L'application principale sert d'entrée unifiée vers plusieurs sous-applications métier
- Un système est découpé en plusieurs sous-applications, mais l'expérience de connexion doit rester continue
- Les utilisateurs changent souvent de sous-application
- Les comptes sont associés entre sous-applications par le même nom d'utilisateur

## Activer le SSO

Dans « App Supervisor », créez ou modifiez une sous-application, puis activez « SSO des applications » dans « Configuration d'authentification ».

La sous-application peut alors déclencher une connexion automatique depuis l'entrée de l'application principale ou le sélecteur d'applications.

> Après modification de la configuration d'authentification, il faut généralement redémarrer la sous-application.

![](https://static-docs.nocobase.com/202605271406542.png)

## Inscription automatique

Si l'utilisateur correspondant n'existe pas dans la sous-application cible, vous pouvez activer « Inscrire automatiquement si l'utilisateur n'existe pas ».

Lors du premier accès via le SSO, le système crée alors un utilisateur de base dans la sous-application à partir des informations de l'application principale.

La correspondance repose principalement sur le nom d'utilisateur :

- Si le nom d'utilisateur est identique, l'utilisateur correspondant de la sous-application est connecté
- Si le nom n'existe pas dans la sous-application, l'utilisateur n'est créé que si l'inscription automatique est activée
- Sinon, l'administrateur doit créer l'utilisateur dans la sous-application à l'avance

Les rôles et autorisations sont déterminés par la configuration propre à la sous-application.

## Entrées qui déclenchent la connexion automatique

Le SSO est principalement déclenché par :

- L'entrée d'une sous-application depuis l'application principale
- Le sélecteur d'applications en haut à gauche
- Le passage d'une sous-application à une autre

L'accès direct à la page de connexion ou à l'adresse propre de la sous-application ne force pas l'état de connexion de l'application principale. Cela conserve les méthodes de connexion propres à la sous-application.

## Questions fréquentes

### La connexion automatique ne fonctionne pas après activation ?

Vérifiez :

- Que le SSO est activé pour la sous-application
- Que la sous-application a été redémarrée
- Que l'utilisateur est entré depuis l'application principale ou le sélecteur
- Qu'un utilisateur avec le même nom existe dans la sous-application
- Si l'utilisateur n'existe pas, que l'inscription automatique est activée

### Pourquoi l'accès direct ne connecte-t-il pas automatiquement ?

C'est le comportement attendu. En accès direct, la sous-application peut utiliser sa propre méthode de connexion.
