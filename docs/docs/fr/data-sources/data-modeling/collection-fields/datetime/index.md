---
title: "Vue d’ensemble"
description: "Types de champs de date et d’heure : avec ou sans fuseau horaire, date, heure, horodatage Unix, et correspondance entre les types NocoBase/MySQL/PostgreSQL."
keywords: "date et heure,DateTime,champs temporels,avec fuseau horaire,sans fuseau horaire,horodatage Unix,NocoBase"
---

# Vue d’ensemble

## Types de champs de date et d’heure

Les types de champs de date et d’heure comprennent les suivants :

- **Date et heure (avec fuseau horaire)** - La date et l’heure sont converties uniformément en UTC (temps universel coordonné), puis converties dans le fuseau horaire requis le cas échéant ;
- **Date et heure (sans fuseau horaire)** - Stocke la date et l’heure sans informations de fuseau horaire ;
- **Date (sans heure)** - Stocke uniquement la date, sans la partie correspondant à l’heure ;
- **Heure** - Stocke uniquement l’heure, sans la partie correspondant à la date ;
- **Horodatage Unix** - Stocke un horodatage Unix, généralement sous forme du nombre de secondes écoulées depuis le 1er janvier 1970.

Exemples pour les différents types de champs liés aux dates :

| **Type de champ**         | **Valeur d’exemple**                 | **Description**                                   |
|--------------------|---------------------------|--------------------------------------------|
| Date et heure (avec fuseau horaire)    | 2024-08-24T07:30:00.000Z   | La date et l’heure sont converties uniformément en UTC (temps universel coordonné)      |
| Date et heure (sans fuseau horaire)  | 2024-08-24 15:30:00        | Date et heure sans fuseau horaire, enregistrant uniquement la date et l’heure             |
| Date (sans heure)     | 2024-08-24                 | Stocke uniquement les informations de date, sans l’heure                     |
| Heure               | 15:30:00                   | Stocke uniquement les informations d’heure, sans la date                     |
| Horodatage Unix        | 1724437800                 | Nombre de secondes écoulées depuis le 1er janvier 1970 à 00:00:00 UTC |

## Correspondance entre les sources de données

Tableau de correspondance entre NocoBase, MySQL et PostgreSQL :

| **Type de champ**       | **NocoBase**               | **MySQL**          | **PostgreSQL**                |
|------------------|-----------------------------|--------------------|-------------------------------|
| Date et heure (avec fuseau horaire)   | Datetime with timezone    | TIMESTAMP<br/> DATETIME | TIMESTAMP WITH TIME ZONE      |
| Date et heure (sans fuseau horaire)  | Datetime without timezone  | DATETIME           | TIMESTAMP WITHOUT TIME ZONE   |
| Date (sans heure)     | Date                      | DATE                 | DATE                          |
| Heure               | Time                     | TIME                 | TIME WITHOUT TIME ZONE        |
| Horodatage Unix        | Unix timestamp            | INTEGER<br/>BIGINT   | INTEGER<br/>BIGINT              |
| Heure (avec fuseau horaire)      | -                         | -                  | TIME WITH TIME ZONE           |

Remarque :
- La plage de valeurs de TIMESTAMP dans MySQL se situe entre UTC `1970-01-01 00:00:01 ~ 2038-01-19 03:14:07`. Lorsque cette plage est dépassée, il est recommandé d’utiliser DATETIME ou BIGINT pour stocker l’horodatage Unix.

## Processus de traitement du stockage des dates et heures

### Avec fuseau horaire

Comprend`日期时间（不含时区）` et `Unix 时间戳`

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Remarque :
- Pour prendre en charge une plage de données plus étendue, le champ de date et d’heure (avec fuseau horaire) de NocoBase utilise DATETIME dans la base de données MySQL. La valeur de date stockée est convertie en fonction de la variable d’environnement TZ du serveur. Si la variable d’environnement TZ est modifiée, la valeur stockée de la date et de l’heure change également.
- L’écart de fuseau horaire entre l’heure UTC et l’heure locale peut entraîner une mauvaise interprétation si la valeur UTC d’origine est affichée directement.

### Sans fuseau horaire

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

L’UTC (temps universel coordonné, Coordinated Universal Time) est la norme temporelle mondiale utilisée pour coordonner et uniformiser l’heure dans le monde entier. Il s’agit d’une norme temporelle de haute précision fondée sur des horloges atomiques, synchronisée avec la rotation de la Terre.

L’heure UTC et l’heure locale présentent un décalage lié au fuseau horaire. Afficher directement la valeur UTC d’origine peut donc prêter à confusion, par exemple :

| **Fuseau horaire**       | **Date et heure**                      |
|----------------|----------------------------------|
| UTC            | 2024-08-24T07:30:00.000Z          |
| Fuseau UTC+8 | 2024-08-24 15:30:00               |
| Fuseau UTC+5 | 2024-08-24 12:30:00               |
| Fuseau UTC-5 | 2024-08-24 02:30:00               |
| Heure du Royaume-Uni (UTC+0) | 2024-08-24 07:30:00              |
| Heure du Centre (UTC-6) | 2024-08-23 01:30:00              |

Toutes les valeurs ci-dessus représentent le même instant ; seul le fuseau horaire diffère.
