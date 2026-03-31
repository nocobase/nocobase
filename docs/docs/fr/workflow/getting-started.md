:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Démarrage rapide

## Configurer votre premier flux de travail

Accédez à la page de gestion du plugin flux de travail depuis le menu de configuration des plugins dans la barre de menu supérieure :

![Workflow plugin management entry](https://static-docs.nocobase.com/20251027222721.png)

L'interface de gestion affiche tous les flux de travail que vous avez créés :

![Workflow Management](https://static-docs.nocobase.com/20251027222900.png)

Cliquez sur le bouton « Nouveau » pour créer un nouveau flux de travail et sélectionnez l'événement de collection :

![Create Workflow](https://static-docs.nocobase.com/20251027222951.png)

Après avoir soumis, cliquez sur le lien « Configurer » dans la liste pour accéder à l'interface de configuration du flux de travail :

![An empty workflow](https://static-docs.nocobase.com/20251027223131.png)

Cliquez ensuite sur la carte du déclencheur pour ouvrir le panneau de configuration du déclencheur. Sélectionnez une collection que vous avez créée précédemment (par exemple, la collection « Articles »), choisissez « Après l'ajout d'un enregistrement » pour le moment du déclenchement, puis cliquez sur le bouton « Enregistrer » pour finaliser la configuration du déclencheur :

![Configure Trigger](https://static-docs.nocobase.com/20251027224735.png)

Ensuite, vous pouvez cliquer sur le bouton plus dans le flux pour ajouter un nœud. Par exemple, sélectionnez un nœud de calcul pour concaténer les champs « Titre » et « ID » des données du déclencheur :

![Add Calculation Node](https://static-docs.nocobase.com/20251027224842.png)

Cliquez sur la carte du nœud pour ouvrir le panneau de configuration du nœud. Utilisez la fonction de calcul `CONCATENATE` fournie par Formula.js pour concaténer les champs « Titre » et « ID ». Les deux champs sont insérés via le sélecteur de variables :

![Calculation node using functions and variables](https://static-docs.nocobase.com/20251027224939.png)

Créez ensuite un nœud de mise à jour d'enregistrement pour enregistrer le résultat dans le champ « Titre » :

![Create Update Record Node](https://static-docs.nocobase.com/20251027232654.png)

De même, cliquez sur la carte pour ouvrir le panneau de configuration du nœud de mise à jour d'enregistrement. Sélectionnez la collection « Articles », choisissez l'ID de l'enregistrement à mettre à jour à partir des données du déclencheur, sélectionnez « Titre » pour le champ à mettre à jour, et choisissez le résultat du nœud de calcul pour la valeur :

![Configure Update Record Node](https://static-docs.nocobase.com/20251027232802.png)

Enfin, cliquez sur le commutateur « Activer »/« Désactiver » dans la barre d'outils supérieure droite pour passer le flux de travail à l'état activé, afin qu'il puisse être déclenché et exécuté.

## Déclencher le flux de travail

Retournez à l'interface principale du système, créez un article via le bloc d'articles et renseignez le titre de l'article :

![Create post data](https://static-docs.nocobase.com/20251027233004.png)

Après avoir soumis et actualisé le bloc, vous pouvez voir que le titre de l'article a été automatiquement mis à jour au format « Titre de l'article + ID de l'article » :

![Post title modified by workflow](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Astuce}
Étant donné que les flux de travail déclenchés par des événements de collection sont exécutés de manière asynchrone, vous ne verrez pas la mise à jour des données immédiatement après la soumission. Cependant, après un court instant, vous pourrez voir le contenu mis à jour en actualisant la page ou le bloc.
:::

## Consulter l'historique d'exécution

Le flux de travail vient d'être déclenché et exécuté avec succès. Vous pouvez retourner à l'interface de gestion des flux de travail pour consulter l'historique d'exécution correspondant :

![View workflow list](https://static-docs.nocobase.com/20251027233246.png)

Dans la liste des flux de travail, vous pouvez voir que ce flux de travail a généré un historique d'exécution. Cliquez sur le lien dans la colonne du nombre d'exécutions pour ouvrir les enregistrements d'historique d'exécution du flux de travail correspondant :

![Execution history list for the corresponding workflow](https://static-docs.nocobase.com/20251027233341.png)

Cliquez ensuite sur le lien « Afficher » pour accéder à la page de détails de cette exécution, où vous pourrez voir l'état d'exécution et les données de résultat de chaque nœud :

![Workflow execution history details](https://static-docs.nocobase.com/20251027233615.png)

Les données contextuelles du déclencheur et les données de résultat de l'exécution du nœud peuvent être consultées en cliquant sur le bouton d'état dans le coin supérieur droit de la carte correspondante. Par exemple, examinons les données de résultat du nœud de calcul :

![Calculation node result](https://static-docs.nocobase.com/20251027233635.png)

Vous pouvez voir que les données de résultat du nœud de calcul contiennent le titre calculé, qui est la donnée utilisée par le nœud de mise à jour d'enregistrement suivant.

## Résumé

En suivant les étapes ci-dessus, nous avons configuré et déclenché un flux de travail simple, et nous avons également abordé les concepts fondamentaux suivants :

- **Flux de travail** : Utilisé pour définir les informations de base d'un processus, y compris le nom, le type de déclencheur et l'état d'activation. Vous pouvez y configurer un nombre illimité de nœuds. C'est l'entité qui porte le processus.
- **Déclencheur** : Chaque flux de travail contient un déclencheur, qui peut être configuré avec des conditions spécifiques pour le déclenchement du flux de travail. C'est le point d'entrée du processus.
- **Nœud** : Un nœud est une unité d'instruction au sein d'un flux de travail qui exécute une action spécifique. Plusieurs nœuds dans un flux de travail forment un processus d'exécution complet grâce à des relations amont et aval.
- **Exécution** : Une exécution est l'objet d'exécution spécifique après le déclenchement d'un flux de travail, également appelée enregistrement d'exécution ou historique d'exécution. Elle contient des informations telles que l'état de l'exécution et les données contextuelles du déclencheur. Chaque nœud a également des résultats d'exécution correspondants, qui incluent l'état et les données de résultat après l'exécution du nœud.

Pour une utilisation plus approfondie, vous pouvez consulter les contenus suivants :

- [Déclencheurs](./triggers/index)
- [Nœuds](./nodes/index)
- [Utilisation des variables](./advanced/variables)
- [Exécutions](./advanced/executions)
- [Gestion des versions](./advanced/revisions)
- [Options avancées](./advanced/options)