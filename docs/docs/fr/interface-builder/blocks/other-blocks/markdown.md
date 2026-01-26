:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Bloc Markdown

## Introduction

Le bloc Markdown n'a pas besoin d'être lié à une **source de données**. Il utilise la syntaxe Markdown pour définir du contenu textuel et peut servir à afficher du texte formaté.

## Ajouter un bloc

Vous pouvez ajouter un bloc Markdown à une page ou à une fenêtre contextuelle.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Vous pouvez également ajouter un bloc Markdown en ligne (inline-block) à l'intérieur des blocs de formulaire et de détails.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Moteur de template

Nous utilisons le **[moteur de template Liquid](https://liquidjs.com/tags/overview.html)**, qui offre des capacités de rendu de template puissantes et flexibles. Cela permet de générer et d'afficher du contenu de manière dynamique et personnalisée. Grâce à ce moteur de template, vous pouvez :

- **Interpolation dynamique** : Utilisez des espaces réservés dans le template pour référencer des variables. Par exemple, `{{ ctx.user.userName }}` est automatiquement remplacé par le nom d'utilisateur correspondant.
- **Rendu conditionnel** : Il prend en charge les instructions conditionnelles (`{% if %}...{% else %}`), ce qui permet d'afficher un contenu différent en fonction de l'état des données.
- **Boucles** : Utilisez `{% for item in list %}...{% endfor %}` pour parcourir des tableaux ou des **collections** afin de générer des listes, des tableaux ou des modules répétitifs.
- **Filtres intégrés** : Il propose un ensemble riche de filtres (tels que `upcase`, `downcase`, `date`, `truncate`, etc.) pour formater et traiter les données.
- **Extensibilité** : Il prend en charge les variables et fonctions personnalisées, rendant la logique du template réutilisable et maintenable.
- **Sécurité et isolation** : Le rendu du template est exécuté dans un environnement sandbox, ce qui empêche l'exécution directe de code dangereux et améliore la sécurité.

Grâce au moteur de template Liquid, les développeurs et les créateurs de contenu peuvent **facilement réaliser l'affichage de contenu dynamique, la génération de documents personnalisés et le rendu de templates pour des structures de données complexes**, améliorant ainsi considérablement l'efficacité et la flexibilité.

## Utiliser des variables

Le Markdown sur une page prend en charge les variables système courantes (telles que l'utilisateur actuel, le rôle actuel, etc.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Le Markdown dans une fenêtre contextuelle d'action de ligne de bloc (ou une sous-page) prend en charge davantage de variables de contexte de données (telles que l'enregistrement actuel, l'enregistrement de la fenêtre contextuelle actuelle, etc.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## Code QR

Vous pouvez configurer des codes QR dans Markdown.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```