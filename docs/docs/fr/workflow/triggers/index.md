:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Présentation

Un déclencheur est le point d'entrée d'un flux de travail. Lorsqu'un événement qui remplit les conditions du déclencheur se produit pendant l'exécution de l'application, le flux de travail sera déclenché et exécuté. Le type de déclencheur est aussi le type de flux de travail ; vous le choisissez lors de la création du flux de travail, et il ne peut pas être modifié par la suite. Voici les types de déclencheurs actuellement pris en charge :

- [Événements de collection](./collection) (Intégré)
- [Tâche planifiée](./schedule) (Intégré)
- [Avant l'action](./pre-action) (Fourni par le plugin `@nocobase/plugin-workflow-request-interceptor`)
- [Après l'action](./post-action) (Fourni par le plugin `@nocobase/plugin-workflow-action-trigger`)
- [Action personnalisée](./custom-action) (Fourni par le plugin `@nocobase/plugin-workflow-custom-action-trigger`)
- [Approbation](./approval) (Fourni par le plugin `@nocobase/plugin-workflow-approval`)
- [Webhook](./webhook) (Fourni par le plugin `@nocobase/plugin-workflow-webhook`)

Le moment où chaque événement est déclenché est illustré dans la figure ci-dessous :

![Événements de flux de travail](https://static-docs.nocobase.com/20251029221709.png)

Par exemple, lorsqu'un utilisateur soumet un formulaire, ou lorsque les données d'une collection changent suite à une action utilisateur ou un appel de programme, ou encore lorsqu'une tâche planifiée atteint son heure d'exécution, un flux de travail configuré peut être déclenché.

Les déclencheurs liés aux données (tels que les actions, les événements de collection) transportent généralement des données de contexte de déclenchement. Ces données agissent comme des variables et peuvent être utilisées par les nœuds du flux de travail comme paramètres de traitement pour automatiser le traitement des données. Par exemple, lorsqu'un utilisateur soumet un formulaire, si le bouton de soumission est lié à un flux de travail, ce flux de travail sera déclenché et exécuté. Les données soumises seront injectées dans l'environnement de contexte du plan d'exécution afin que les nœuds suivants puissent les utiliser comme variables.

Après avoir créé un flux de travail, sur la page d'affichage du flux de travail, le déclencheur est affiché comme un nœud d'entrée au début du processus. En cliquant sur cette carte, vous ouvrirez le tiroir de configuration. Selon le type de déclencheur, vous pouvez configurer ses conditions pertinentes.

![Déclencheur_Nœud d'entrée](https://static-docs.nocobase.com/20251029222231.png)