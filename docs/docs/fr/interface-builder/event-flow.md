:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/interface-builder/event-flow).
:::

# Flux d'événements

## Introduction

Si vous souhaitez déclencher des opérations personnalisées lors de la modification d'un formulaire, vous pouvez utiliser les flux d'événements pour y parvenir. Outre les formulaires, les pages, les blocs, les boutons et les champs peuvent également utiliser les flux d'événements pour configurer des opérations personnalisées.

## Comment l'utiliser

L'exemple simple suivant illustre comment configurer un flux d'événements. Réalisons une liaison entre deux tableaux : lorsque vous cliquez sur une ligne du tableau de gauche, les données du tableau de droite sont automatiquement filtrées.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Les étapes de configuration sont les suivantes :

1. Cliquez sur l'icône « éclair » en haut à droite du bloc de tableau de gauche pour ouvrir l'interface de configuration du flux d'événements.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Cliquez sur « Ajouter un flux d'événements (Add event flow) », sélectionnez « Clic sur une ligne » pour l'« Événement déclencheur », ce qui signifie qu'il se déclenchera lors du clic sur une ligne du tableau.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Configurez le « Moment d'exécution », utilisé pour contrôler l'ordre de ce flux d'événements par rapport aux processus intégrés du système. En général, conservez la valeur par défaut ; si vous souhaitez afficher un message ou naviguer après l'exécution de la logique intégrée, vous pouvez choisir « Après tous les flux ». Pour plus d'explications, voir ci-dessous [Moment d'exécution](#moment-dexécution).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. La « Condition de déclenchement (Trigger condition) » est utilisée pour configurer des conditions ; le flux d'événements ne se déclenchera que si les conditions sont remplies. Ici, nous n'avons pas besoin de configuration, le flux se déclenchera dès qu'une ligne est cliquée.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Survolez « Ajouter une étape (Add step) » pour ajouter des étapes d'opération. Choisissez « Définir la portée des données (Set data scope) » pour configurer la portée des données du tableau de droite.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Copiez l'UID du tableau de droite et saisissez-le dans le champ « UID du bloc cible (Target block UID) ». Une interface de configuration de condition s'affichera immédiatement en dessous pour configurer la portée des données du tableau de droite.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Configurons une condition, comme illustré ci-dessous :
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Après avoir configuré la portée des données, vous devez rafraîchir le bloc pour afficher les résultats du filtrage. Configurons ensuite le rafraîchissement du bloc de tableau de droite. Ajoutez une étape « Rafraîchir les blocs cibles (Refresh target blocks) », puis saisissez l'UID du tableau de droite.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Enfin, cliquez sur le bouton Enregistrer en bas à droite pour terminer la configuration.

## Détails des événements

### Avant le rendu

Événement universel, utilisable dans les pages, blocs, boutons ou champs. Cet événement permet d'effectuer des travaux d'initialisation, comme configurer différentes portées de données selon différentes conditions.

### Clic sur une ligne (Row click)

Événement exclusif aux blocs de tableau. Se déclenche lors du clic sur une ligne du tableau. Lors du déclenchement, un « Clicked row record » est ajouté au contexte, utilisable comme variable dans les conditions et les étapes.

### Changement des valeurs du formulaire (Form values change)

Événement exclusif aux blocs de formulaire. Se déclenche lorsque la valeur d'un champ du formulaire est modifiée. Vous pouvez obtenir les valeurs du formulaire via la variable « Current form » dans les conditions et les étapes.

### Clic (Click)

Événement exclusif aux boutons. Se déclenche lors du clic sur le bouton.

## Moment d'exécution

Dans la configuration du flux d'événements, deux concepts peuvent être confondus :

- **Événement déclencheur :** Quand commencer l'exécution (par exemple : Avant le rendu, Clic sur une ligne, Clic, Changement des valeurs du formulaire, etc.).
- **Moment d'exécution :** Une fois que l'événement déclencheur se produit, à quel endroit votre **flux d'événements personnalisé** doit être inséré dans le **processus intégré** pour être exécuté.

### Qu'est-ce qu'un « processus intégré / étape intégrée » ?

De nombreuses pages, blocs ou opérations possèdent leur propre processus de traitement intégré au système (par exemple : soumission, ouverture d'une fenêtre contextuelle, requête de données, etc.). Lorsque vous ajoutez un flux d'événements personnalisé pour le même événement (par exemple « Clic »), le « Moment d'exécution » permet de décider :

- S'il faut exécuter votre flux d'événements avant ou après la logique intégrée ;
- Ou s'il faut insérer votre flux d'événements avant ou après une étape spécifique du processus intégré.

### Comment comprendre les options du moment d'exécution dans l'interface ?

- **Avant tous les flux (par défaut) :** S'exécute en premier. Idéal pour l'« interception/préparation » (par exemple : validation, confirmation secondaire, initialisation de variables, etc.).
- **Après tous les flux :** S'exécute après la fin de la logique intégrée. Idéal pour la « finalisation/retour » (par exemple : message de notification, rafraîchissement d'autres blocs, navigation, etc.).
- **Avant un flux spécifique / Après un flux spécifique :** Point d'insertion plus précis. Nécessite de choisir un « processus intégré » spécifique après la sélection.
- **Avant une étape de flux spécifique / Après une étape de flux spécifique :** Point d'insertion le plus précis. Nécessite de choisir à la fois le « processus intégré » et l'« étape du processus intégré ».

> Conseil : Si vous n'êtes pas sûr de l'option à choisir, privilégiez les deux premières (« Avant / Après »).

## Détails des étapes

### Variable personnalisée (Custom variable)

Permet de définir une variable personnalisée pour l'utiliser ensuite dans le contexte.

#### Portée

Les variables personnalisées ont une portée ; par exemple, une variable définie dans le flux d'événements d'un bloc ne peut être utilisée que dans ce bloc. Si vous souhaitez qu'elle soit utilisable dans tous les blocs de la page actuelle, vous devez la configurer dans le flux d'événements de la page.

#### Variable de formulaire (Form variable)

Utilise la valeur d'un bloc de formulaire spécifique comme variable. La configuration est la suivante :

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title : Titre de la variable
- Variable identifier : Identifiant de la variable
- Form UID : UID du formulaire

#### Autres variables

D'autres variables seront supportées ultérieurement, restez à l'écoute.

### Définir la portée des données (Set data scope)

Définit la portée des données du bloc cible. La configuration est la suivante :

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID : UID du bloc cible
- Condition : Condition de filtrage

### Rafraîchir les blocs cibles (Refresh target blocks)

Rafraîchit les blocs cibles, permet de configurer plusieurs blocs. La configuration est la suivante :

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID : UID du bloc cible

### Naviguer vers une URL (Navigate to URL)

Redirige vers une URL. La configuration est la suivante :

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL : URL cible, supporte l'utilisation de variables
- Search parameters : Paramètres de requête dans l'URL
- Open in new window : Si coché, ouvre une nouvelle page de navigateur lors de la redirection

### Afficher un message (Show message)

Affiche globalement des informations de retour sur l'opération.

#### Quand l'utiliser

- Permet de fournir des informations de retour telles que succès, avertissement et erreur.
- S'affiche centré en haut et disparaît automatiquement ; c'est un mode de notification léger qui n'interrompt pas les opérations de l'utilisateur.

#### Configuration spécifique

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type : Type de message
- Message content : Contenu du message
- Duration : Durée d'affichage, en secondes

### Afficher une notification (Show notification)

Affiche globalement des alertes de notification.

#### Quand l'utiliser

Affiche des alertes de notification dans les quatre coins du système. Souvent utilisé dans les cas suivants :

- Contenu de notification complexe.
- Notifications avec interaction, proposant des actions à l'utilisateur.
- Notifications poussées par le système.

#### Configuration spécifique

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type : Type de notification
- Notification title : Titre de la notification
- Notification description : Description de la notification
- Placement : Position, les options sont : haut-gauche, haut-droite, bas-gauche, bas-droite

### Exécuter du JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Exécute du code JavaScript.

## Exemple

### Formulaire : Appeler une API tierce pour remplir des champs

Scénario : Déclencher un flux d'événements dans un formulaire pour appeler une API tierce, puis remplir automatiquement les champs du formulaire avec les données obtenues.

Étapes de configuration :

1. Ouvrez la configuration du flux d'événements dans le bloc de formulaire et ajoutez un nouveau flux ;
2. Sélectionnez « Avant le rendu » comme événement déclencheur ;
3. Sélectionnez « Après tous les flux » comme moment d'exécution ;
4. Ajoutez l'étape « Exécuter du JavaScript (Execute JavaScript) », copiez et modifiez le code suivant selon vos besoins :

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Note: ctx.api will include the current NocoBase authentication/custom headers by default
  // Here we override it with an "empty Authorization" to avoid sending the token to a third party
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// replace it with actual field name
ctx.form.setFieldsValue({ username });
```