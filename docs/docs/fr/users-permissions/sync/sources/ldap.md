---
pkg: '@nocobase/plugin-auth-ldap'
title: "Synchroniser les données utilisateur depuis LDAP"
description: "Synchronisez les utilisateurs et départements LDAP avec NocoBase en réutilisant un authentificateur LDAP existant."
keywords: "LDAP,synchronisation utilisateur,synchronisation département,Bind DN,Search DN,NocoBase"
---

# Synchroniser les données utilisateur depuis LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Introduction

Le plugin **Authentification : LDAP** peut utiliser un authentificateur LDAP existant comme source de synchronisation. Il réutilise la connexion, le Bind DN, le Search DN, la portée de recherche et le mappage des attributs, puis écrit les utilisateurs et, facultativement, la hiérarchie des départements dans NocoBase.

## Prérequis

1. Installez et activez **Authentification : LDAP** et **Synchronisation des données utilisateur**.
2. Créez et testez un authentificateur LDAP. Consultez [Authentification : LDAP](/auth-verification/auth-ldap/).
3. Vérifiez que le mappage contient les champs requis, tels que nom d'utilisateur ou e-mail, surnom et téléphone.

## Ajouter une source LDAP

Accédez à **Utilisateurs et permissions > Synchroniser**, cliquez sur **Ajouter** et sélectionnez **LDAP**.

| Champ | Description |
| --- | --- |
| Nom de la source | Nom unique de la source. |
| Activée | Autorise les synchronisations LDAP manuelles et planifiées. |
| Authentificateur LDAP | Authentificateur existant dont la connexion et le mappage sont réutilisés. |
| Filtre de synchronisation | Filtre LDAP des utilisateurs. Valeur par défaut : `(&(objectCategory=person)(objectClass=user))`. |
| Limite de taille | Nombre maximal d'entrées par recherche ; vide utilise la limite du serveur. |
| Taille de page | Taille des recherches LDAP paginées. |
| Synchroniser les départements | Synchronise la hiérarchie LDAP comme départements NocoBase. |
| DN de recherche des départements | Requis pour les départements, par exemple `ou=departments,dc=example,dc=com`. |

:::info
La source utilise le Bind DN et le mot de passe de l'authentificateur sélectionné ; elle n'enregistre pas une seconde copie des identifiants.
:::

## Synchroniser les utilisateurs

Enregistrez et activez la source, puis cliquez sur **Synchroniser**. Ouvrez **Tâche** pour consulter le résultat et réessayer une tâche en échec.

La correspondance dépend du champ **Utiliser ce champ pour lier l'utilisateur** de l'authentificateur. Gardez ce réglage et le mappage stables après la première synchronisation afin d'éviter les doublons.

## Synchroniser les départements

Activez **Synchroniser les départements** et renseignez le **DN de recherche des départements**. Le plugin recherche les unités d'organisation, conserve leur hiérarchie et associe l'utilisateur au département à partir de son Distinguished Name.

## Champs synchronisés

### Champs des utilisateurs

| Attribut ou réglage LDAP | Champ ou utilisation NocoBase |
| --- | --- |
| Attribut du compte de connexion | Identifiant source unique et nom d'utilisateur ou e-mail choisi pour la liaison. Généralement déduit de `{{account}}` dans le filtre, par exemple `uid`, `sAMAccountName` ou `mail`. L'utilisateur est ignoré si l'attribut manque. |
| Mappage vers `username` | Nom d'utilisateur. |
| Mappage vers `nickname` | Surnom. |
| Mappage vers `email` | Adresse e-mail. |
| Mappage vers `phone` | Téléphone. |
| `distinguishedName`, sinon DN de l'entrée | Département synchronisé le plus proche dans le chemin DN, défini comme principal. |

Pour un attribut multivalué, seule la première valeur est synchronisée. Les attributs non mappés ne sont pas synchronisés.

### Champs des départements

| Attribut ou structure LDAP | Champ ou utilisation NocoBase |
| --- | --- |
| `objectGUID` | Identifiant source unique. Les unités sans cet attribut sont ignorées. |
| `ou`, `cn`, `name` | La première valeur non vide devient le nom du département. |
| `distinguishedName`, sinon DN de l'entrée | Identifie le département et son parent pour construire la hiérarchie. |

Par défaut, la recherche cible les objets `organizationalUnit` et `container`. Les appartenances multiples via `memberOf` et les responsables de département ne sont pas synchronisés actuellement.

## Dépannage

- Si aucun utilisateur n'est trouvé, vérifiez Search DN, portée, permissions du Bind DN et filtre.
- Si le résultat est tronqué, configurez la taille de page et vérifiez les limites du serveur LDAP.
- Si des départements manquent, vérifiez l'activation et la couverture du DN de recherche.
- Consultez les détails de la tâche et les journaux pour les erreurs de connexion, de liaison et de recherche.
