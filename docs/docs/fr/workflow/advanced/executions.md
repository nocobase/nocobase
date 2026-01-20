:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Plan d'exécution (Historique)

Chaque fois qu'un flux de travail est déclenché, un plan d'exécution correspondant est créé pour suivre le processus de cette tâche. Chaque plan d'exécution possède une valeur de statut qui indique son état actuel, que vous pouvez consulter dans la liste et les détails de l'historique d'exécution :

![Statut du plan d'exécution](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Lorsque tous les nœuds de la branche principale du flux sont exécutés jusqu'à la fin du processus avec le statut « Terminé », l'ensemble du plan d'exécution se termine avec le statut « Terminé ». Si un nœud de la branche principale du flux atteint un statut final tel que « Échec », « Erreur », « Annulé » ou « Rejeté », l'ensemble du plan d'exécution sera **interrompu prématurément** avec le statut correspondant. Lorsqu'un nœud de la branche principale du flux est en statut « En attente », l'ensemble du plan d'exécution est mis en pause, mais affiche toujours le statut « En cours », jusqu'à ce que le nœud en attente soit repris. Les différents types de nœuds gèrent l'état d'attente différemment. Par exemple, un nœud manuel nécessite une intervention humaine, tandis qu'un nœud de délai doit attendre que le temps spécifié s'écoule avant de continuer.

Les statuts d'un plan d'exécution sont les suivants :

| Statut           | Statut du dernier nœud exécuté dans le flux principal | Signification                                                                                             |
| :--------------- | :-------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| En file d'attente | -                                                   | Le flux de travail a été déclenché et un plan d'exécution a été généré, en attente dans la file pour que l'ordonnanceur organise son exécution. |
| En cours         | En attente                                          | Le nœud nécessite une pause, en attente d'une entrée supplémentaire ou d'un rappel pour continuer.         |
| Terminé          | Terminé                                             | Aucun problème n'a été rencontré, et tous les nœuds ont été exécutés un par un comme prévu.                 |
| Échec            | Échec                                               | Échec dû au non-respect de la configuration du nœud.                                                      |
| Erreur           | Erreur                                              | Le nœud a rencontré une erreur de programme non gérée et s'est terminé prématurément.                     |
| Annulé           | Annulé                                              | Un nœud en attente a été annulé de l'extérieur par l'administrateur du flux de travail, se terminant prématurément. |
| Rejeté           | Rejeté                                              | Dans un nœud de traitement manuel, il a été rejeté manuellement, et le processus suivant ne continuera pas. |

Dans l'exemple du [Démarrage rapide](../getting-started.md), nous savons déjà qu'en consultant les détails de l'historique d'exécution d'un flux de travail, vous pouvez vérifier si tous les nœuds ont été exécutés normalement, ainsi que le statut d'exécution et les données de résultat de chaque nœud exécuté. Dans certains flux de travail et nœuds avancés, un nœud peut avoir plusieurs résultats, comme le résultat d'un nœud de boucle :

![Résultats de nœuds issus de multiples exécutions](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Conseil}
Les flux de travail peuvent être déclenchés simultanément, mais ils sont exécutés séquentiellement dans une file d'attente. Même si plusieurs flux de travail sont déclenchés en même temps, ils seront exécutés l'un après l'autre, et non en parallèle. Par conséquent, un statut « En file d'attente » signifie que d'autres flux de travail sont en cours d'exécution et qu'il faut attendre.

Le statut « En cours » indique uniquement que le plan d'exécution a démarré et qu'il est généralement mis en pause en raison de l'état d'attente d'un nœud interne. Cela ne signifie pas que ce plan d'exécution a monopolisé les ressources d'exécution en tête de file. Par conséquent, lorsqu'un plan d'exécution est « En cours », d'autres plans d'exécution « En file d'attente » peuvent toujours être planifiés pour démarrer.
:::

## Statut d'exécution des nœuds

Le statut d'un plan d'exécution est déterminé par l'exécution de chacun de ses nœuds. Dans un plan d'exécution déclenché, chaque nœud produit un statut d'exécution après son exécution, et ce statut détermine si le processus suivant continuera. Normalement, après l'exécution réussie d'un nœud, le nœud suivant est exécuté, jusqu'à ce que tous les nœuds soient exécutés séquentiellement ou que le processus soit interrompu. Lorsque vous rencontrez des nœuds liés au contrôle de flux, tels que les branches, les boucles, les branches parallèles, les délais, etc., le flux d'exécution vers le nœud suivant est déterminé en fonction des conditions configurées dans le nœud et des données de contexte d'exécution.

Les statuts possibles d'un nœud après exécution sont les suivants :

| Statut       | Est un état final | Interrompt prématurément | Signification                                                                                             |
| :----------- | :---------------: | :----------------------: | :-------------------------------------------------------------------------------------------------------- |
| En attente   |        Non        |           Non            | Le nœud nécessite une pause, en attente d'une entrée supplémentaire ou d'un rappel pour continuer.         |
| Terminé      |        Oui        |           Non            | Aucun problème n'a été rencontré, l'exécution a réussi, et le processus continue vers le nœud suivant jusqu'à la fin. |
| Échec        |        Oui        |           Oui            | Échec dû au non-respect de la configuration du nœud.                                                      |
| Erreur       |        Oui        |           Oui            | Le nœud a rencontré une erreur de programme non gérée et s'est terminé prématurément.                     |
| Annulé       |        Oui        |           Oui            | Un nœud en attente a été annulé de l'extérieur par l'administrateur du flux de travail, se terminant prématurément. |
| Rejeté       |        Oui        |           Oui            | Dans un nœud de traitement manuel, il a été rejeté manuellement, et le processus suivant ne continuera pas. |

À l'exception du statut « En attente », tous les autres statuts sont des états finaux pour l'exécution d'un nœud. Le processus ne continuera que si l'état final est « Terminé » ; sinon, l'exécution de l'ensemble du flux de travail sera interrompue prématurément. Lorsqu'un nœud se trouve dans un flux de branche (branche parallèle, condition, boucle, etc.), l'état final produit par l'exécution du nœud sera géré par le nœud qui a initié la branche, et cela déterminera le déroulement de l'ensemble du flux de travail.

Par exemple, lorsque vous utilisez un nœud conditionnel en mode « Continuer si 'Oui' », si le résultat est « Non » pendant l'exécution, l'ensemble du flux de travail sera interrompu prématurément avec un statut « Échec », et les nœuds suivants ne seront pas exécutés, comme illustré ci-dessous :

![Échec de l'exécution du nœud](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Conseil}
Tous les statuts de terminaison autres que « Terminé » peuvent être considérés comme des échecs, mais les raisons de ces échecs sont différentes. Vous pouvez consulter les résultats d'exécution du nœud pour mieux comprendre la cause de l'échec.
:::