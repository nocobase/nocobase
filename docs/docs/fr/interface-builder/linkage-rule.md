:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Règles de liaison

## Introduction

Dans NocoBase, les Règles de liaison sont un mécanisme qui permet de contrôler le comportement interactif des éléments de l'interface utilisateur front-end. Elles vous permettent d'ajuster l'affichage et la logique comportementale des blocs, des champs et des actions dans l'interface, en fonction de différentes conditions. Cela offre une expérience interactive flexible et à faible code. Cette fonctionnalité est en constante évolution et optimisation.

En configurant des règles de liaison, vous pouvez réaliser des actions telles que :

- Masquer ou afficher certains blocs en fonction du rôle de l'utilisateur actuel. Différents rôles peuvent voir des blocs avec des portées de données différentes. Par exemple, les administrateurs voient des blocs avec des informations complètes, tandis que les utilisateurs réguliers ne voient que les blocs d'informations de base.
- Remplir ou réinitialiser automatiquement d'autres valeurs de champ lorsqu'une option est sélectionnée dans un formulaire.
- Désactiver certains champs de saisie lorsqu'une option est sélectionnée dans un formulaire.
- Définir certains champs de saisie comme obligatoires lorsqu'une option est sélectionnée dans un formulaire.
- Contrôler la visibilité ou la cliquabilité des boutons d'action sous certaines conditions.

## Configuration des conditions

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Variable de gauche

La variable de gauche dans une condition est utilisée pour définir l'« objet du jugement » dans la règle de liaison. La condition est évaluée en fonction de la valeur de cette variable pour déterminer si l'action de liaison doit être déclenchée.

Les variables sélectionnables incluent :

- Les champs du contexte, tels que `« Formulaire actuel/xxx »`, `« Enregistrement actuel/xxx »`, `« Enregistrement de la fenêtre contextuelle actuelle/xxx »`, etc.
- Les variables système globales, telles que `« Utilisateur actuel »`, `« Rôle actuel »`, etc., qui conviennent pour un contrôle dynamique basé sur l'identité de l'utilisateur, les permissions et d'autres informations.
  > ✅ Les options disponibles pour la variable de gauche sont déterminées par le contexte du bloc. Utilisez la variable de gauche de manière appropriée en fonction de vos besoins métier :
  >
  > - `« Utilisateur actuel »` représente les informations de l'utilisateur actuellement connecté.
  > - `« Formulaire actuel »` représente les valeurs saisies en temps réel dans le formulaire.
  > - `« Enregistrement actuel »` représente la valeur de l'enregistrement sauvegardé, comme un enregistrement de ligne dans un tableau.

### Opérateur

L'opérateur est utilisé pour définir la logique de l'évaluation de la condition, c'est-à-dire comment comparer la variable de gauche avec la valeur de droite. Différents types de variables de gauche prennent en charge différents opérateurs. Voici les opérateurs courants par type :

- **Type Texte** : `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, etc.
- **Type Numérique** : `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, etc.
- **Type Booléen** : `$isTruly`, `$isFalsy`
- **Type Tableau** : `$match`, `$anyOf`, `$empty`, `$notEmpty`, etc.

> ✅ Le système recommandera automatiquement une liste d'opérateurs disponibles en fonction du type de la variable de gauche, afin de garantir une logique de configuration cohérente.

### Valeur de droite

Utilisée pour la comparaison avec la variable de gauche, c'est la valeur de référence pour déterminer si la condition est remplie.

Le contenu pris en charge inclut :

- Valeurs constantes : Saisissez des nombres, du texte, des dates fixes, etc.
- Variables de contexte : comme d'autres champs du formulaire actuel, l'enregistrement actuel, etc.
- Variables système : comme l'utilisateur actuel, l'heure actuelle, le rôle actuel, etc.

> ✅ Le système adaptera automatiquement la méthode de saisie pour la valeur de droite en fonction du type de la variable de gauche, par exemple :
>
> - Lorsque la variable de gauche est un « champ de sélection », le sélecteur d'options correspondant s'affichera.
> - Lorsque la variable de gauche est un « champ de date », un sélecteur de date s'affichera.
> - Lorsque la variable de gauche est un « champ de texte », une zone de saisie de texte s'affichera.

> 💡 L'utilisation flexible des valeurs de droite (en particulier les variables dynamiques) vous permet de construire une logique de liaison basée sur l'utilisateur actuel, l'état actuel des données et le contexte, offrant ainsi une expérience interactive plus puissante.

## Logique d'exécution des règles

### Déclenchement de la condition

Lorsque la condition d'une règle est remplie (facultatif), l'action de modification de propriété située en dessous est exécutée automatiquement. Si aucune condition n'est définie, la règle est considérée comme toujours remplie par défaut, et l'action de modification de propriété est exécutée automatiquement.

### Règles multiples

Vous pouvez configurer plusieurs règles de liaison pour un formulaire. Lorsque les conditions de plusieurs règles sont remplies simultanément, le système exécute les résultats dans l'ordre, de la première à la dernière règle. Le dernier résultat sera donc la norme d'exécution finale.
Exemple : La Règle 1 définit un champ comme « Désactivé », et la Règle 2 définit le champ comme « Modifiable ». Si les conditions des deux règles sont remplies, le champ deviendra « Modifiable ».

> L'ordre d'exécution des règles multiples est crucial. Lorsque vous concevez des règles, assurez-vous de clarifier leurs priorités et leurs interrelations afin d'éviter les conflits.

## Gestion des règles

Les opérations suivantes peuvent être effectuées sur chaque règle :

- Nommage personnalisé : Attribuez un nom facile à comprendre à la règle pour faciliter sa gestion et son identification.

- Tri : Ajustez l'ordre en fonction de la priorité d'exécution des règles pour vous assurer que le système les traite dans la séquence correcte.

- Suppression : Supprimez les règles qui ne sont plus nécessaires.

- Activer/Désactiver : Désactivez temporairement une règle sans la supprimer. Cela est utile dans les scénarios où une règle doit être temporairement désactivée.

- Dupliquer la règle : Créez une nouvelle règle en copiant une règle existante pour éviter une configuration répétitive.

## À propos des variables

Lors de l'affectation de valeurs aux champs et de la configuration des conditions, l'utilisation de constantes et de variables est prise en charge. La liste des variables varie en fonction de l'emplacement du bloc. Choisir et utiliser les variables de manière appropriée peut répondre plus souplement aux besoins métier. Pour plus d'informations sur les variables, veuillez consulter [Variables](/interface-builder/variables).

## Règles de liaison de bloc

Les règles de liaison de bloc permettent de contrôler dynamiquement l'affichage d'un bloc en fonction de variables système (comme l'utilisateur actuel, le rôle) ou de variables de contexte (comme l'enregistrement de la fenêtre contextuelle actuelle). Par exemple, un administrateur peut consulter les informations complètes d'une commande, tandis qu'un rôle de service client ne peut voir que des données de commande spécifiques. Grâce aux règles de liaison de bloc, vous pouvez configurer des blocs correspondants en fonction des rôles, et définir différents champs, boutons d'action et portées de données au sein de ces blocs. Lorsque le rôle connecté est le rôle cible, le système affiche le bloc correspondant. Il est important de noter que les blocs sont affichés par défaut, vous devrez donc généralement définir la logique pour masquer le bloc.

👉 Pour plus de détails, consultez : [Bloc/Règles de liaison de bloc](/interface-builder/blocks/block-settings/block-linkage-rule)

## Règles de liaison de champ

Les règles de liaison de champ sont utilisées pour ajuster dynamiquement l'état des champs dans un formulaire ou un bloc de détails en fonction des actions de l'utilisateur, incluant principalement :

- Contrôler l'état **Afficher/Masquer** d'un champ
- Définir si un champ est **Obligatoire**
- **Affecter une valeur**
- Exécuter du JavaScript pour gérer une logique métier personnalisée

👉 Pour plus de détails, consultez : [Bloc/Règles de liaison de champ](/interface-builder/blocks/block-settings/field-linkage-rule)

## Règles de liaison d'action

Les règles de liaison d'action prennent actuellement en charge le contrôle des comportements d'action, tels que le masquage/la désactivation, basés sur des variables de contexte comme la valeur de l'enregistrement actuel et le formulaire actuel, ainsi que sur des variables globales.

👉 Pour plus de détails, consultez : [Action/Règles de liaison](/interface-builder/actions/action-settings/linkage-rule)