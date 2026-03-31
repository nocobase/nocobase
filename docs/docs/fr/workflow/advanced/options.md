:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Configuration avancée

## Mode d'exécution

Les flux de travail s'exécutent de manière "asynchrone" ou "synchrone", selon le type de déclencheur choisi lors de leur création. En mode asynchrone, après le déclenchement d'un événement spécifique, le flux de travail entre dans une file d'attente et est exécuté un par un par un processus de planification en arrière-plan. Le mode synchrone, quant à lui, ne passe pas par la file d'attente après le déclenchement ; il démarre directement son exécution et fournit un retour immédiat une fois terminé.

Les événements de collection, les événements post-action, les événements d'action personnalisée, les événements planifiés et les événements d'approbation s'exécutent par défaut de manière asynchrone. Les événements pré-action s'exécutent par défaut de manière synchrone. Les événements de collection et les événements de formulaire prennent en charge les deux modes, que vous pouvez choisir lors de la création d'un flux de travail :

![Mode synchrone_Créer un flux de travail synchrone](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Conseil}
En raison de leur nature, les flux de travail synchrones ne peuvent pas utiliser de nœuds qui génèrent un état "d'attente", comme le "traitement manuel".
:::

## Suppression automatique de l'historique d'exécution

Lorsqu'un flux de travail est déclenché fréquemment, vous pouvez configurer la suppression automatique de l'historique d'exécution pour réduire l'encombrement et alléger la pression de stockage sur la base de données.

Vous pouvez également configurer la suppression automatique de l'historique d'exécution d'un flux de travail dans ses fenêtres de création et d'édition :

![Configuration de la suppression automatique de l'historique d'exécution](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

La suppression automatique peut être configurée en fonction de l'état du résultat d'exécution. Dans la plupart des cas, il est recommandé de ne cocher que l'état "Terminé" afin de conserver les enregistrements des exécutions ayant échoué pour un dépannage ultérieur.

Il est recommandé de ne pas activer la suppression automatique de l'historique d'exécution lors du débogage d'un flux de travail, afin de pouvoir utiliser cet historique pour vérifier si la logique d'exécution du flux de travail correspond à vos attentes.

:::info{title=Conseil}
La suppression de l'historique d'un flux de travail ne réduit pas son nombre d'exécutions.
:::