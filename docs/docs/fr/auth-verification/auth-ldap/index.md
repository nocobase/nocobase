---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# Authentification : LDAP

## Introduction

Le plugin Authentification : LDAP respecte le standard du protocole LDAP (Lightweight Directory Access Protocol), permettant aux utilisateurs de se connecter à NocoBase en utilisant leurs identifiants de serveur LDAP.

## Activer le plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Ajouter l'authentification LDAP

Accédez à la page de gestion des plugins d'authentification.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Ajouter - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Configuration

### Configuration de base

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - Crée automatiquement un nouvel utilisateur si aucun utilisateur existant correspondant n'est trouvé.
- LDAP URL - Adresse du serveur LDAP.
- Bind DN - DN utilisé pour tester la connectivité du serveur et rechercher des utilisateurs.
- Bind password - Mot de passe du Bind DN.
- Test connection - Cliquez sur ce bouton pour tester la connectivité du serveur et la validité du Bind DN.

### Configuration de la recherche

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - DN utilisé pour rechercher des utilisateurs.
- Search filter - Condition de filtrage pour la recherche d'utilisateurs, utilisez `{{account}}` pour représenter le compte utilisateur utilisé lors de la connexion.
- Scope - `Base`, `One level`, `Subtree`, par défaut `Subtree`.
- Size limit - Taille de la page de recherche.

### Mappage des attributs

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - Champ utilisé pour lier l'utilisateur à un utilisateur existant. Si le compte de connexion est un nom d'utilisateur, sélectionnez 'Nom d'utilisateur' ; si c'est une adresse e-mail, sélectionnez 'E-mail'. Par défaut : Nom d'utilisateur.
- Attribute map - Mappage des attributs utilisateur aux champs de la table des utilisateurs NocoBase.

## Connexion

Accédez à la page de connexion et saisissez le nom d'utilisateur et le mot de passe LDAP dans le formulaire de connexion.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>