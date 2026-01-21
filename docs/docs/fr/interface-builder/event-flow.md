:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Flux d'événements

## Introduction

Si vous souhaitez déclencher des actions personnalisées lorsqu'un formulaire change, vous pouvez utiliser les flux d'événements. Au-delà des formulaires, les pages, les blocs, les boutons et les champs peuvent tous utiliser les flux d'événements pour configurer des opérations personnalisées.

## Comment l'utiliser

Nous allons voir un exemple simple pour comprendre comment configurer les flux d'événements. Nous allons créer un lien entre deux tableaux où cliquer sur une ligne du tableau de gauche filtre automatiquement les données du tableau de droite.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Voici les étapes de configuration :

1. Cliquez sur l'icône "éclair" dans le coin supérieur droit du bloc de tableau de gauche pour ouvrir le panneau de configuration du flux d'événements.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Cliquez sur "Ajouter un flux d'événements" (Add event flow), sélectionnez "Clic sur une ligne" (Row click) comme "Événement déclencheur" (Trigger event), ce qui signifie que le flux se déclenchera lorsqu'une ligne du tableau sera cliquée.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. La "Condition de déclenchement" (Trigger condition) est utilisée pour configurer les conditions. Le flux d'événements ne se déclenchera que lorsque ces conditions seront remplies. Dans ce cas, nous n'avons pas besoin de configurer de conditions, donc le flux se déclenchera à chaque clic sur une ligne.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Passez la souris sur "Ajouter une étape" (Add step) pour ajouter des étapes d'opération. Sélectionnez "Définir la portée des données" (Set data scope) pour configurer la portée des données du tableau de droite.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Copiez l'UID du tableau de droite et collez-le dans le champ de saisie "UID du bloc cible" (Target block UID). Un panneau de configuration des conditions apparaîtra immédiatement en dessous, où vous pourrez configurer la portée des données du tableau de droite.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Configurons une condition comme indiqué ci-dessous :
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Après avoir configuré la portée des données, vous devez rafraîchir le bloc pour afficher les résultats filtrés. Ajoutons une étape "Rafraîchir les blocs cibles" (Refresh target blocks), puis saisissez l'UID du tableau de droite.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Enfin, cliquez sur le bouton "Enregistrer" dans le coin inférieur droit pour terminer la configuration.

## Détails des événements

### Avant le rendu

Un événement universel qui peut être utilisé dans les pages, les blocs, les boutons ou les champs. Utilisez cet événement pour les tâches d'initialisation, telles que la configuration de différentes portées de données en fonction de différentes conditions.

### Clic sur une ligne

Un événement spécifique aux blocs de tableau. Il se déclenche lorsqu'une ligne de tableau est cliquée. Lorsqu'il est déclenché, il ajoute un "enregistrement de ligne cliquée" (Clicked row record) au contexte, qui peut être utilisé comme variable dans les conditions et les étapes.

### Changement des valeurs du formulaire

Un événement spécifique aux blocs de formulaire. Il se déclenche lorsque les valeurs des champs du formulaire changent. Vous pouvez accéder aux valeurs du formulaire via la variable "Formulaire actuel" (Current form) dans les conditions et les étapes.

### Clic

Un événement spécifique aux boutons. Il se déclenche lorsque le bouton est cliqué.

## Détails des étapes

### Variable personnalisée

Permet de créer une variable personnalisée à utiliser dans le contexte.

#### Portée

Les variables personnalisées ont une portée. Par exemple, une variable définie dans le flux d'événements d'un bloc ne peut être utilisée que dans ce bloc. Pour qu'une variable soit disponible dans tous les blocs de la page actuelle, vous devez la configurer dans le flux d'événements de la page.

#### Variable de formulaire

Utilisez les valeurs d'un bloc de formulaire comme variable. Configuration :

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Titre de la variable : Titre de la variable
- Identifiant de la variable : Identifiant de la variable
- UID du formulaire : UID du formulaire

#### Autres variables

D'autres types de variables seront pris en charge à l'avenir. Restez à l'écoute.

### Définir la portée des données

Définissez la portée des données pour un bloc cible. Configuration :

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- UID du bloc cible : UID du bloc cible
- Condition : Condition de filtre

### Rafraîchir les blocs cibles

Rafraîchissez les blocs cibles. Plusieurs blocs peuvent être configurés. Configuration :

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- UID du bloc cible : UID du bloc cible

### Naviguer vers une URL

Naviguez vers une URL. Configuration :

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL : URL cible, prend en charge les variables
- Paramètres de recherche : Paramètres de requête dans l'URL
- Ouvrir dans une nouvelle fenêtre : Si cette option est cochée, ouvre l'URL dans un nouvel onglet de navigateur lors de la navigation.

### Afficher un message

Affiche des messages de retour d'information globaux.

#### Quand l'utiliser

- Permet de fournir des retours d'information de succès, d'avertissement et d'erreur.
- S'affiche centré en haut et disparaît automatiquement, offrant un retour d'information léger sans interrompre les opérations de l'utilisateur.

#### Configuration

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Type de message : Type de message
- Contenu du message : Contenu du message
- Durée : Durée d'affichage (en secondes)

### Afficher une notification

Affiche des alertes de notification globales.

#### Quand l'utiliser

Affiche des alertes de notification dans les quatre coins du système. Couramment utilisé pour :

- Contenu de notification complexe.
- Notifications interactives qui proposent aux utilisateurs des étapes suivantes.
- Notifications initiées par le système.

#### Configuration

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Type de notification : Type de notification
- Titre de la notification : Titre de la notification
- Description de la notification : Description de la notification
- Emplacement : Position, options : en haut à gauche, en haut à droite, en bas à gauche, en bas à droite.

### Exécuter du JavaScript

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Exécute du code JavaScript.