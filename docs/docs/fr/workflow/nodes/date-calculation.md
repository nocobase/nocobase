---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Calcul de dates

## Introduction

Le nœud de calcul de dates propose neuf fonctions de calcul, notamment l'ajout ou la soustraction d'une période, la mise en forme de chaînes de caractères temporelles et la conversion d'unités de durée. Chaque fonction possède des types de valeurs d'entrée et de sortie spécifiques et peut également recevoir les résultats d'autres nœuds comme variables de paramètres. Il utilise un système de pipeline pour enchaîner les résultats des fonctions configurées afin d'obtenir le résultat attendu.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Calcul de dates ».

![Nœud de calcul de dates_Créer un nœud](https://static-docs.nocobase.com/[图片].png)

## Configuration du nœud

![Nœud de calcul de dates_Configuration du nœud](https://static-docs.nocobase.com/20240817184423.png)

### Valeur d'entrée

La valeur d'entrée peut être une variable ou une constante de date. La variable peut correspondre aux données qui ont déclenché ce flux de travail, ou au résultat d'un nœud en amont dans ce flux de travail. Pour une constante, vous pouvez sélectionner n'importe quelle date.

### Type de valeur d'entrée

Désigne le type de la valeur d'entrée. Il existe deux valeurs possibles.

*   Type Date : La valeur d'entrée peut être convertie en un type date-heure, comme un horodatage numérique ou une chaîne de caractères représentant une heure.
*   Type Numérique : Étant donné que le type de valeur d'entrée affecte le choix des étapes de calcul temporel suivantes, il est nécessaire de sélectionner correctement le type de valeur d'entrée.

### Étapes de calcul

Chaque étape de calcul est composée d'une fonction de calcul et de sa configuration de paramètres. Elle adopte une conception en pipeline, où le résultat du calcul de la fonction précédente sert de valeur d'entrée pour le calcul de la fonction suivante. De cette manière, une série de calculs et de conversions temporelles peut être effectuée.

Après chaque étape de calcul, le type de sortie est également fixe et affectera les fonctions disponibles pour l'étape de calcul suivante. Le calcul ne peut se poursuivre que si les types correspondent. Dans le cas contraire, le résultat d'une étape sera la sortie finale du nœud.

## Fonctions de calcul

### Ajouter une période de temps

-   Type de valeur d'entrée : Date
-   Paramètres
    -   La quantité à ajouter, qui peut être un nombre ou une variable intégrée au nœud.
    -   L'unité de temps.
-   Type de valeur de sortie : Date
-   Exemple : Si la valeur d'entrée est `2024-7-15 00:00:00`, la quantité est `1` et l'unité est « jour », le résultat du calcul est `2024-7-16 00:00:00`.

### Soustraire une période de temps

-   Type de valeur d'entrée : Date
-   Paramètres
    -   La quantité à soustraire, qui peut être un nombre ou une variable intégrée au nœud.
    -   L'unité de temps.
-   Type de valeur de sortie : Date
-   Exemple : Si la valeur d'entrée est `2024-7-15 00:00:00`, la quantité est `1` et l'unité est « jour », le résultat du calcul est `2024-7-14 00:00:00`.

### Calculer la différence avec une autre date

-   Type de valeur d'entrée : Date
-   Paramètres
    -   La date avec laquelle calculer la différence, qui peut être une constante de date ou une variable du contexte du flux de travail.
    -   L'unité de temps.
    -   Faut-il prendre la valeur absolue ?
    -   Opération d'arrondi : Vous pouvez choisir de conserver les décimales, d'arrondir, d'arrondir à l'entier supérieur ou d'arrondir à l'entier inférieur.
-   Type de valeur de sortie : Numérique
-   Exemple : Si la valeur d'entrée est `2024-7-15 00:00:00`, l'objet de comparaison est `2024-7-16 06:00:00`, l'unité est « jour », la valeur absolue n'est pas prise et les décimales sont conservées, le résultat du calcul est `-1.25`.

:::info{title=Conseil}
Lorsque la valeur absolue et l'arrondi sont configurés simultanément, la valeur absolue est prise en compte en premier, puis l'arrondi est appliqué.
:::

### Obtenir la valeur d'une date dans une unité spécifique

-   Type de valeur d'entrée : Date
-   Paramètres
    -   L'unité de temps.
-   Type de valeur de sortie : Numérique
-   Exemple : Si la valeur d'entrée est `2024-7-15 00:00:00` et l'unité est « jour », le résultat du calcul est `15`.

### Définir la date au début d'une unité spécifique

-   Type de valeur d'entrée : Date
-   Paramètres
    -   L'unité de temps.
-   Type de valeur de sortie : Date
-   Exemple : Si la valeur d'entrée est `2024-7-15 14:26:30` et l'unité est « jour », le résultat du calcul est `2024-7-15 00:00:00`.

### Définir la date à la fin d'une unité spécifique

-   Type de valeur d'entrée : Date
-   Paramètres
    -   L'unité de temps.
-   Type de valeur de sortie : Date
-   Exemple : Si la valeur d'entrée est `2024-7-15 14:26:30` et l'unité est « jour », le résultat du calcul est `2024-7-15 23:59:59`.

### Vérifier si c'est une année bissextile

-   Type de valeur d'entrée : Date
-   Paramètres
    -   Aucun paramètre
-   Type de valeur de sortie : Booléen
-   Exemple : Si la valeur d'entrée est `2024-7-15 14:26:30`, le résultat du calcul est `true`.

### Formater en chaîne de caractères

-   Type de valeur d'entrée : Date
-   Paramètres
    -   Le format, consultez [Day.js: Format](https://day.js.org/docs/zh-CN/display/format)
-   Type de valeur de sortie : Chaîne de caractères
-   Exemple : Si la valeur d'entrée est `2024-7-15 14:26:30` et le format est `the time is YYYY/MM/DD HH:mm:ss`, le résultat du calcul est `the time is 2024/07/15 14:26:30`.

### Convertir l'unité

-   Type de valeur d'entrée : Numérique
-   Paramètres
    -   L'unité de temps avant la conversion.
    -   L'unité de temps après la conversion.
    -   Opération d'arrondi : Vous pouvez choisir de conserver les décimales, d'arrondir, d'arrondir à l'entier supérieur ou d'arrondir à l'entier inférieur.
-   Type de valeur de sortie : Numérique
-   Exemple : Si la valeur d'entrée est `2`, l'unité avant conversion est « semaine », l'unité après conversion est « jour » et les décimales ne sont pas conservées, le résultat du calcul est `14`.

## Exemple

![Nœud de calcul de dates_Exemple](https://static-docs.nocobase.com/20240817184137.png)

Supposons qu'il y ait un événement promotionnel. Nous souhaitons ajouter une date de fin de promotion au champ d'un produit lors de sa création. Cette date de fin est fixée à 23:59:59 le dernier jour de la semaine suivant la date de création du produit. Nous pouvons donc créer deux fonctions temporelles et les exécuter en pipeline :

-   Calculer la date de la semaine suivante.
-   Réinitialiser le résultat à 23:59:59 du dernier jour de cette semaine.

De cette manière, nous obtenons la valeur temporelle souhaitée et la transmettons au nœud suivant, par exemple un nœud de modification de collection, pour ajouter la date de fin de la promotion à la collection.