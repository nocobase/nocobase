:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Vue d'ensemble

## Types de champs de date et heure

Voici les différents types de champs de date et heure :

- **Date et heure (avec fuseau horaire)** : Ces valeurs sont standardisées en temps universel coordonné (UTC) et sont sujettes à des ajustements de fuseau horaire si nécessaire.
- **Date et heure (sans fuseau horaire)** : Ce type stocke les données de date et d'heure sans inclure d'informations de fuseau horaire.
- **Date (sans heure)** : Ce format stocke exclusivement les informations de date, en omettant toute composante horaire.
- **Heure** : Stocke uniquement les informations d'heure, sans inclure la date.
- **Timestamp Unix** : Ce type représente le nombre de secondes écoulées depuis le 1er janvier 1970 et est stocké en tant que timestamp Unix.

Voici des exemples pour chaque type de champ lié à la date et à l'heure :

| **Type de champ**                 | **Exemple de valeur**          | **Description**                                            |
|-----------------------------------|--------------------------------|------------------------------------------------------------|
| Date et heure (avec fuseau horaire) | 2024-08-24T07:30:00.000Z       | Converti en UTC et peut être ajusté pour les fuseaux horaires |
| Date et heure (sans fuseau horaire) | 2024-08-24 15:30:00            | Stocke la date et l'heure sans considération de fuseau horaire |
| Date (sans heure)                 | 2024-08-24                     | Capture uniquement la date, sans information d'heure       |
| Heure                             | 15:30:00                       | Capture uniquement l'heure, sans détails de date           |
| Timestamp Unix                    | 1724437800                     | Représente les secondes écoulées depuis le 1er janvier 1970 00:00:00 UTC |

## Comparaisons des sources de données

Voici un tableau comparatif pour NocoBase, MySQL et PostgreSQL :

| **Type de champ**                 | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|-----------------------------------|----------------------------|----------------------------|----------------------------------------|
| Date et heure (avec fuseau horaire) | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Date et heure (sans fuseau horaire) | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Date (sans heure)                 | Date                       | DATE                       | DATE                                   |
| Heure                             | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Timestamp Unix                    | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Heure (avec fuseau horaire)       | -                          | -                          | TIME WITH TIME ZONE                    |

**Remarque :**
- Le type `TIMESTAMP` de MySQL couvre une plage allant du `1970-01-01 00:00:01 UTC` au `2038-01-19 03:14:07 UTC`. Pour les dates et heures en dehors de cette plage, il est recommandé d'utiliser `DATETIME` ou `BIGINT` pour stocker les timestamps Unix.

## Processus de traitement du stockage des dates et heures

### Avec fuseau horaire

Cela inclut les types `Date et heure (avec fuseau horaire)` et `Timestamp Unix`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Remarque :**
- Afin de prendre en charge une plage de dates plus étendue, NocoBase utilise le type `DATETIME` dans la base de données MySQL pour les champs de date et heure (avec fuseau horaire). La valeur de date stockée est convertie en fonction de la variable d'environnement `TZ` du serveur, ce qui signifie que si cette variable change, la valeur de date et heure stockée sera également modifiée.
- Étant donné qu'il existe un décalage de fuseau horaire entre l'heure UTC et l'heure locale, afficher directement la valeur UTC brute pourrait induire les utilisateurs en erreur.

### Sans fuseau horaire

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

L'UTC (Temps Universel Coordonné) est le standard horaire mondial utilisé pour coordonner et synchroniser l'heure partout dans le monde. C'est un standard de temps de haute précision, maintenu par des horloges atomiques et synchronisé avec la rotation de la Terre.

La différence entre l'heure UTC et l'heure locale peut prêter à confusion lors de l'affichage des valeurs UTC brutes. Par exemple :

| **Fuseau horaire** | **Date et heure**             |
|--------------------|-------------------------------|
| UTC                | 2024-08-24T07:30:00.000Z      |
| UTC+8              | 2024-08-24 15:30:00           |
| UTC+5              | 2024-08-24 12:30:00           |
| UTC-5              | 2024-08-24 02:30:00           |
| UTC+0              | 2024-08-24 07:30:00           |
| UTC-6              | 2024-08-23 01:30:00           |

Ces différentes heures correspondent toutes au même instant, simplement exprimées dans des fuseaux horaires variés.