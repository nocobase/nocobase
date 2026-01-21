:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Vue d'ensemble

Un flux de travail est généralement composé de plusieurs étapes opérationnelles connectées. Chaque nœud représente l'une de ces étapes et constitue une unité logique de base dans le processus. Tout comme dans un langage de programmation, différents types de nœuds représentent différentes instructions, ce qui détermine leur comportement. Lorsque le flux de travail s'exécute, le système entre séquentiellement dans chaque nœud et exécute ses instructions.

:::info{title=Remarque}
Le déclencheur d'un flux de travail n'est pas un nœud. Il est uniquement affiché comme un point d'entrée dans le diagramme de flux, mais c'est un concept différent d'un nœud. Pour plus de détails, veuillez consulter le contenu des [Déclencheurs](../triggers/index.md).
:::

D'un point de vue fonctionnel, les nœuds actuellement implémentés peuvent être divisés en plusieurs grandes catégories (29 types de nœuds au total) :

- Intelligence Artificielle
  - [Grand Modèle de Langage](../../ai-employees/workflow/nodes/llm/chat.md) (fourni par le plugin @nocobase/plugin-workflow-llm)
- Contrôle de Flux
  - [Condition](./condition.md)
  - [Conditions Multiples](./multi-conditions.md)
  - [Boucle](./loop.md) (fourni par le plugin @nocobase/plugin-workflow-loop)
  - [Variable](./variable.md) (fourni par le plugin @nocobase/plugin-workflow-variable)
  - [Branche Parallèle](./parallel.md) (fourni par le plugin @nocobase/plugin-workflow-parallel)
  - [Appeler un flux de travail](./subflow.md) (fourni par le plugin @nocobase/plugin-workflow-subflow)
  - [Sortie de flux de travail](./output.md) (fourni par le plugin @nocobase/plugin-workflow-subflow)
  - [Mappage de variables JSON](./json-variable-mapping.md) (fourni par le plugin @nocobase/plugin-workflow-json-variable-mapping)
  - [Délai](./delay.md) (fourni par le plugin @nocobase/plugin-workflow-delay)
  - [Terminer le flux de travail](./end.md)
- Calcul
  - [Calcul](./calculation.md)
  - [Calcul de date](./date-calculation.md) (fourni par le plugin @nocobase/plugin-workflow-date-calculation)
  - [Calcul JSON](./json-query.md) (fourni par le plugin @nocobase/plugin-workflow-json-query)
- Actions sur les collections
  - [Créer des données](./create.md)
  - [Mettre à jour des données](./update.md)
  - [Supprimer des données](./destroy.md)
  - [Interroger des données](./query.md)
  - [Requête d'agrégation](./aggregate.md) (fourni par le plugin @nocobase/plugin-workflow-aggregate)
  - [Action SQL](./sql.md) (fourni par le plugin @nocobase/plugin-workflow-sql)
- Traitement Manuel
  - [Traitement Manuel](./manual.md) (fourni par le plugin @nocobase/plugin-workflow-manual)
  - [Approbation](./approval.md) (fourni par le plugin @nocobase/plugin-workflow-approval)
  - [CC](./cc.md) (fourni par le plugin @nocobase/plugin-workflow-cc)
- Autres Extensions
  - [Requête HTTP](./request.md) (fourni par le plugin @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (fourni par le plugin @nocobase/plugin-workflow-javascript)
  - [Envoyer un e-mail](./mailer.md) (fourni par le plugin @nocobase/plugin-workflow-mailer)
  - [Notification](../../notification-manager/index.md#工作流通知节点) (fourni par le plugin @nocobase/plugin-workflow-notification)
  - [Réponse](./response.md) (fourni par le plugin @nocobase/plugin-workflow-webhook)
  - [Message de réponse](./response-message.md) (fourni par le plugin @nocobase/plugin-workflow-response-message)