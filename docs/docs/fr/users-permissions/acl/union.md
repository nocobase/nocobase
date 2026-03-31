---
pkg: '@nocobase/plugin-acl'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Union des rôles

L'union des rôles est un mode de gestion des autorisations. Selon les paramètres du système, les développeurs peuvent choisir d'utiliser les `Rôles indépendants`, d'`Autoriser l'union des rôles` ou l'`Union des rôles uniquement`, afin de répondre à différents besoins en matière d'autorisations.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Rôles indépendants

Par défaut, le système utilise des rôles indépendants : l'union des rôles n'est pas activée, et les utilisateurs doivent basculer individuellement entre les rôles qu'ils possèdent.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Autoriser l'union des rôles

Les développeurs système peuvent activer l'option `Autoriser l'union des rôles`, permettant aux utilisateurs de disposer simultanément des autorisations de tous les rôles qui leur sont attribués, tout en leur permettant de basculer individuellement entre leurs rôles.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Union des rôles uniquement

Les utilisateurs sont contraints d'utiliser uniquement l'union des rôles et ne peuvent pas basculer individuellement entre les rôles.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Règles de l'union des rôles

L'union des rôles confère le maximum d'autorisations de tous les rôles. Vous trouverez ci-dessous les explications sur la manière de déterminer les autorisations lorsque des rôles ont des paramètres conflictuels pour une même option.

### Fusion des autorisations d'opération

Exemple : Le Rôle 1 (role1) est configuré pour `Autoriser la configuration de l'interface`, et le Rôle 2 (role2) est configuré pour `Autoriser l'installation, l'activation et la désactivation des plugins`.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Lors de la connexion avec le rôle **Toutes les autorisations**, l'utilisateur disposera simultanément de ces deux autorisations.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Fusion de la portée des données

#### Lignes de données

Scénario 1 : Plusieurs rôles définissant des conditions sur le même champ

Rôle A, condition configurée : Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rôle B, condition configurée : Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Après fusion :**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Scénario 2 : Différents rôles définissant des conditions sur des champs différents

Rôle A, condition configurée : Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rôle B, condition configurée : Le nom contient « Ja »

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Après fusion :**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Colonnes de données

Rôle A, champs visibles configurés : Nom, Âge

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rôle B, champs visibles configurés : Nom, Sexe

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Après fusion :**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Combinaison de lignes et de colonnes

Rôle A, condition configurée : Age < 30, champs visibles : Nom, Âge

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rôle B, condition configurée : Le nom contient « Ja », champs visibles : Nom, Sexe

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Après fusion :**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Remarque : Les cellules avec un fond rouge indiquent des données invisibles dans les rôles individuels, mais visibles dans le rôle fusionné.**

#### Résumé

Règles de fusion des rôles pour la portée des données :

1.  Entre les lignes, si l'une des conditions est remplie, la ligne dispose des autorisations.
2.  Entre les colonnes, les champs sont combinés.
3.  Lorsque les lignes et les colonnes sont toutes deux configurées, elles sont fusionnées séparément (lignes avec lignes, colonnes avec colonnes), et non par des combinaisons ligne-colonne.