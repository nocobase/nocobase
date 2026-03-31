:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Modifier une fenêtre modale

## Introduction

Toute action ou tout champ qui ouvre une fenêtre modale lors d'un clic permet de configurer le mode d'ouverture, la taille, etc., de cette fenêtre.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Mode d'ouverture

- Tiroir

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Boîte de dialogue

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Sous-page

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Taille de la fenêtre modale

- Grande
- Moyenne (par défaut)
- Petite

## UID de la fenêtre modale

L'« UID de la fenêtre modale » est l'identifiant unique (UID) du composant qui ouvre la fenêtre modale. Il correspond également au segment `viewUid` dans l'URL actuelle `view/:viewUid`. Vous pouvez l'obtenir rapidement en cliquant sur « Copier l'UID de la fenêtre modale » dans le menu des paramètres du champ ou du bouton qui déclenche la fenêtre.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

La configuration de l'UID de la fenêtre modale permet de réutiliser cette dernière.

### Fenêtre modale interne (par défaut)
- L'« UID de la fenêtre modale » est égal à l'UID du bouton d'action actuel (par défaut, il s'agit de l'UID de ce bouton).

### Fenêtre modale externe (réutilisation d'une fenêtre existante)
- Saisissez l'UID d'un autre bouton déclencheur (l'UID de la fenêtre modale) dans le champ « UID de la fenêtre modale » pour réutiliser cette fenêtre à un autre endroit.
- Utilisation typique : partager la même interface utilisateur et la même logique de fenêtre modale sur plusieurs pages/blocs, évitant ainsi la duplication de la configuration.
- Lorsque vous utilisez une fenêtre modale externe, certaines configurations ne peuvent pas être modifiées (voir ci-dessous).

## Autres configurations associées

- `Data source / Collection` : Lecture seule. Indique la source de données et la collection auxquelles la fenêtre modale est liée ; par défaut, elle utilise la collection du bloc actuel. En mode fenêtre modale externe, elle hérite de la configuration de la fenêtre modale cible et ne peut pas être modifiée.
- `Association name` : Facultatif. Permet d'ouvrir la fenêtre modale à partir d'un champ d'association ; affiché uniquement lorsqu'une valeur par défaut existe. En mode fenêtre modale externe, elle hérite de la configuration de la fenêtre modale cible et ne peut pas être modifiée.
- `Source ID` : Apparaît uniquement lorsque `Association name` est défini ; utilise par défaut le `sourceId` du contexte actuel ; peut être modifié en une variable ou une valeur fixe selon les besoins.
- `filterByTk` : Peut être vide, une variable facultative ou une valeur fixe, utilisé pour filtrer les enregistrements de données de la fenêtre modale.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)