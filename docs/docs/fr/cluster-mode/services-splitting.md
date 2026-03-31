:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Séparation des services <Badge>v1.9.0+</Badge>

## Introduction

Généralement, tous les services d'une application NocoBase s'exécutent dans la même instance Node.js. À mesure que les fonctionnalités de l'application se complexifient avec la croissance de l'activité, certains services gourmands en temps peuvent impacter les performances globales.

Pour améliorer les performances de l'application, NocoBase permet de séparer les services de l'application pour les exécuter sur différents nœuds en mode cluster. Cela évite que les problèmes de performance d'un seul service n'affectent l'ensemble de l'application et sa capacité à répondre aux requêtes des utilisateurs.

D'autre part, cela permet également une mise à l'échelle horizontale ciblée de certains services, améliorant ainsi l'utilisation des ressources du cluster.

Lors du déploiement de NocoBase en cluster, différents services peuvent être séparés et déployés pour s'exécuter sur des nœuds distincts. Le diagramme suivant illustre la structure de séparation :

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Quels services peuvent être séparés ?

### Flux de travail asynchrone

**Clé de service** : `workflow:process`

Les flux de travail en mode asynchrone seront mis en file d'attente pour exécution après avoir été déclenchés. Ces flux de travail peuvent être considérés comme des tâches d'arrière-plan, et les utilisateurs n'ont généralement pas besoin d'attendre le retour des résultats. En particulier pour les processus complexes et longs avec un volume de déclenchement élevé, il est recommandé de les séparer pour les exécuter sur des nœuds indépendants.

### Autres tâches asynchrones de niveau utilisateur

**Clé de service** : `async-task:process`

Cela inclut les tâches créées par les actions de l'utilisateur, telles que l'importation et l'exportation asynchrones. En cas de volumes de données importants ou de forte concurrence, il est recommandé de les séparer pour les exécuter sur des nœuds indépendants.

## Comment séparer les services ?

La séparation des différents services sur des nœuds distincts est réalisée en configurant la variable d'environnement `WORKER_MODE`. Cette variable d'environnement peut être configurée selon les règles suivantes :

- `WORKER_MODE=<vide>` : Lorsqu'elle n'est pas configurée ou est vide, le mode de travail est identique à celui de l'instance unique actuelle, acceptant toutes les requêtes et traitant toutes les tâches. Ceci est compatible avec les applications qui n'étaient pas configurées auparavant.
- `WORKER_MODE=!` : Le mode de travail consiste à traiter uniquement les requêtes et aucune tâche.
- `WORKER_MODE=workflow:process,async-task:process` : Configuré avec un ou plusieurs identifiants de service (séparés par des virgules), le mode de travail consiste à traiter uniquement les tâches pour ces identifiants et à ne pas traiter les requêtes.
- `WORKER_MODE=*` : Le mode de travail consiste à traiter toutes les tâches d'arrière-plan, quel que soit le module, mais à ne pas traiter les requêtes.
- `WORKER_MODE=!,workflow:process` : Le mode de travail consiste à traiter les requêtes et simultanément les tâches pour un identifiant spécifique.
- `WORKER_MODE=-` : Le mode de travail consiste à ne traiter aucune requête ni tâche (ce mode est requis au sein du processus worker).

Par exemple, dans un environnement K8S, les nœuds ayant la même fonctionnalité de séparation peuvent utiliser la même configuration de variable d'environnement, facilitant ainsi la mise à l'échelle horizontale d'un type de service spécifique.

## Exemples de configuration

### Plusieurs nœuds avec traitement séparé

Supposons qu'il y ait trois nœuds : `node1`, `node2` et `node3`. Ils peuvent être configurés comme suit :

- `node1` : Traite uniquement les requêtes d'interface utilisateur, configurez `WORKER_MODE=!`.
- `node2` : Traite uniquement les tâches de flux de travail, configurez `WORKER_MODE=workflow:process`.
- `node3` : Traite uniquement les tâches asynchrones, configurez `WORKER_MODE=async-task:process`.

### Plusieurs nœuds avec traitement mixte

Supposons qu'il y ait quatre nœuds : `node1`, `node2`, `node3` et `node4`. Ils peuvent être configurés comme suit :

- `node1` et `node2` : Traitent toutes les requêtes régulières, configurez `WORKER_MODE=!`, et un équilibreur de charge distribuera automatiquement les requêtes à ces deux nœuds.
- `node3` et `node4` : Traitent toutes les autres tâches d'arrière-plan, configurez `WORKER_MODE=*`.

## Référence pour les développeurs

Lors du développement de plugins métier, vous pouvez séparer les services qui consomment des ressources importantes en fonction des exigences du scénario. Cela peut être réalisé de la manière suivante :

1. Définissez un nouvel identifiant de service, par exemple `my-plugin:process`, pour la configuration de la variable d'environnement, et fournissez une documentation à ce sujet.
2. Dans la logique métier côté serveur du plugin, utilisez l'interface `app.serving()` pour vérifier l'environnement et déterminer si le nœud actuel doit fournir un service spécifique en fonction de la variable d'environnement.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// Dans le code côté serveur du plugin
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Traitez la logique métier de ce service
} else {
  // Ne traitez pas la logique métier de ce service
}
```