# Configuration avancée

## Paramètres de délai d'expiration

À partir de la version `2.1.0`, les flux de travail prennent en charge les paramètres de délai d'expiration afin de limiter la durée maximale d'une exécution, depuis le début du traitement jusqu'à sa fin. Ces paramètres sont utiles pour éviter qu'un flux de travail n'occupe indéfiniment des ressources d'exécution en raison d'un traitement long, d'une attente de traitement manuel ou d'une attente de rappel externe.

Dans la fenêtre de création ou de modification du flux de travail, développez les « Options avancées » pour configurer les « Paramètres de délai d'expiration » :

![20260604212454](https://static-docs.nocobase.com/20260604212454.png)

Les options disponibles sont les suivantes :

- Saisissez `0` pour ne pas limiter le délai d'expiration (valeur par défaut).
- Saisissez une valeur supérieure à `0` pour activer la limite de délai d'expiration. L'interface permet de choisir les secondes, les minutes, les heures et les jours comme unités.
- Le délai d'expiration maximal est de 180 jours.

### Règles de comptabilisation

Le délai d'expiration commence à être comptabilisé lorsque le flux de travail entre pour la première fois dans un processeur. Après le déclenchement d'un flux de travail, le temps passé dans la file d'attente en attendant la planification, ou stocké pour un démarrage différé, n'est pas comptabilisé dans ce délai.

Après l'entrée dans un processeur, le délai continue à être comptabilisé, y compris le temps d'exécution réel des nœuds et le temps passé par les nœuds déjà en état d'attente, par exemple un traitement manuel, une approbation, un délai ou l'attente d'un rappel externe. Le délai d'expiration ne s'interrompt pas lorsque le flux de travail attend une action utilisateur.

L'échéance du délai d'expiration est déterminée au démarrage de cette exécution. Modifier les paramètres de délai d'expiration du flux de travail n'affecte que les exécutions qui commenceront à être traitées ensuite ; les exécutions déjà démarrées ne sont pas recalculées.

### Traitement après expiration

Si l'exécution n'est pas terminée lorsque le délai est atteint, le système met fin à cette exécution :

- Le statut de l'historique d'exécution devient « Abandonné », et la raison d'arrêt s'affiche comme « Expiré ».
- Les tâches de nœud actuellement en cours ou en attente sont marquées comme « Abandonné ».
- Les nœuds suivants ne sont pas exécutés.
- Si cette exécution possède des exécutions de sous-flux encore en cours, celles-ci sont également abandonnées avec l'exécution parente.

Exemples :

- Si un nœud de boucle exécute une boucle très longue et que les traitements internes sont coûteux, au point que l'ensemble du nœud de boucle dépasse le délai configuré, le nœud de boucle en cours et ses nœuds internes sont arrêtés de force, et les nœuds suivants ne sont pas exécutés.
- Si un nœud de traitement manuel ou d'approbation reste en attente pendant longtemps et dépasse le délai configuré, le nœud en attente est arrêté de force, les nœuds suivants ne sont pas exécutés, et les tâches associées sont annulées.

:::info{title=Conseil}
Les paramètres de délai d'expiration constituent une limite globale pour toute l'exécution du flux de travail, et non un délai propre à un nœud. Si vous devez seulement limiter le temps d'attente d'un nœud particulier, comme un nœud de requête HTTP ou de script JavaScript, utilisez les paramètres de délai de ce nœud.
:::

:::info{title=Conseil}
Si vous devez mettre en place un traitement métier avec limite de temps, par exemple « marquer un ticket comme expiré si personne ne le traite dans les 10 minutes », utilisez généralement le [nœud de délai](../nodes/delay.md) avec des branches parallèles pour organiser le traitement suivant. Le délai global met directement fin à l'exécution en cours ; il convient donc comme protection de secours, mais pas pour porter des branches métier ultérieures.
:::

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
