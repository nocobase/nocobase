---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Variables et Secrets

## Introduction

Ce chapitre couvre la configuration et la gestion centralisées des variables d'environnement et des secrets. Ces outils sont essentiels pour le stockage sécurisé des données sensibles, la réutilisation des données de configuration et l'isolation des configurations entre les différents environnements.

## Différences avec `.env`

| **Caractéristique**       | **Fichier `.env`**                                                                                 | **Variables et secrets configurés dynamiquement**                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Emplacement de stockage** | Stocké dans le fichier `.env` à la racine du projet                                                | Stocké dans la table `environmentVariables` de la base de données                                                                                               |
| **Méthode de chargement**  | Chargé dans `process.env` via des outils comme `dotenv` au démarrage de l'application             | Lu dynamiquement et chargé dans `app.environment` au démarrage de l'application                                                                                 |
| **Méthode de modification** | Nécessite une édition directe du fichier et un redémarrage de l'application pour que les changements prennent effet | Prend en charge la modification à l'exécution ; les changements sont appliqués immédiatement après le rechargement de la configuration de l'application |
| **Isolation des environnements** | Chaque environnement (développement, test, production) nécessite une maintenance distincte des fichiers `.env` | Chaque environnement (développement, test, production) nécessite une maintenance distincte des données dans la table `environmentVariables` |
| **Scénarios applicables** | Convient aux configurations statiques et fixes, comme les informations de la base de données principale de l'application | Convient aux configurations dynamiques nécessitant des ajustements fréquents ou liées à la logique métier (bases de données externes, stockage de fichiers, etc.) |

## Installation

C'est un plugin intégré, vous n'avez donc pas besoin de l'installer séparément.

## Utilisation

### Réutilisation des données de configuration

Par exemple, si plusieurs étapes d'un flux de travail nécessitent des nœuds d'e-mail et donc une configuration SMTP, vous pouvez stocker la configuration SMTP commune dans les variables d'environnement.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Stockage des données sensibles

Utilisez-les pour stocker des informations de configuration de bases de données externes, des clés de stockage de fichiers cloud et d'autres données sensibles.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Isolation de la configuration des environnements

Dans les différents environnements (développement, test, production), nous utilisons des stratégies de gestion de configuration indépendantes. Cela garantit que les configurations et les données de chaque environnement ne s'interfèrent pas mutuellement. Chaque environnement dispose de ses propres paramètres, variables et ressources, ce qui permet d'éviter les conflits et de s'assurer que le système fonctionne comme prévu dans chaque contexte.

Par exemple, la configuration des services de stockage de fichiers peut différer entre les environnements de développement et de production, comme illustré ci-dessous :

Environnement de développement

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Environnement de production

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Gestion des variables d'environnement

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Ajout de variables d'environnement

- Vous pouvez les ajouter individuellement ou par lots.
- Le stockage en clair et chiffré est pris en charge.

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Ajout individuel

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Ajout par lots

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Remarques importantes

### Redémarrage de l'application

Après avoir modifié ou supprimé des variables d'environnement, une notification de redémarrage de l'application apparaîtra en haut de l'écran. Les modifications ne prendront effet qu'après le redémarrage de l'application.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Stockage chiffré

Les données chiffrées des variables d'environnement utilisent le chiffrement symétrique AES. La CLÉ PRIVÉE pour le chiffrement et le déchiffrement est stockée dans le répertoire de stockage. Veuillez la conserver en lieu sûr ; si elle est perdue ou écrasée, les données chiffrées ne pourront plus être déchiffrées.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Plugins prenant actuellement en charge les variables d'environnement

### Action : Requête personnalisée

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Authentification : CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Authentification : DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Authentification : LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Authentification : OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Authentification : SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Authentification : WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### source de données : MariaDB externe

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### source de données : MySQL externe

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### source de données : Oracle externe

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### source de données : PostgreSQL externe

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### source de données : SQL Server externe

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### source de données : KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### source de données : API REST

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Stockage de fichiers : Local

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Stockage de fichiers : Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Stockage de fichiers : Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Stockage de fichiers : Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Stockage de fichiers : S3 Pro

Non adapté

### Carte : AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Carte : Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Paramètres d'e-mail

Non adapté

### Notification : E-mail

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Formulaires publics

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Paramètres système

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Vérification : SMS Aliyun

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Vérification : SMS Tencent

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### flux de travail

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)