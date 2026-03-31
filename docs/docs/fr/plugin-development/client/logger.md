:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Le Logger

NocoBase propose un système de journalisation (logging) performant basé sur [pino](https://github.com/pinojs/pino). Partout où vous avez accès à un `context`, vous pouvez obtenir une instance de logger via `ctx.logger` pour enregistrer les journaux essentiels lors de l'exécution d'un **plugin** ou du système.

## Utilisation de base

```ts
// Enregistre les erreurs fatales (par exemple, échec de l'initialisation)
ctx.logger.fatal('Application initialization failed', { error });

// Enregistre les erreurs générales (par exemple, erreurs de requête API)
ctx.logger.error('Data loading failed', { status, message });

// Enregistre les avertissements (par exemple, risques de performance ou opérations utilisateur inattendues)
ctx.logger.warn('Current form contains unsaved changes');

// Enregistre les informations d'exécution générales (par exemple, composant chargé)
ctx.logger.info('User profile component loaded');

// Enregistre les informations de débogage (par exemple, changements d'état)
ctx.logger.debug('Current user state', { user });

// Enregistre les informations de trace détaillées (par exemple, flux de rendu)
ctx.logger.trace('Component rendered', { component: 'UserProfile' });
```

Ces méthodes correspondent à différents niveaux de journalisation (du plus élevé au plus bas) :

| Niveau    | Méthode             | Description                                                              |
| --------- | ------------------- | ------------------------------------------------------------------------ |
| `fatal`   | `ctx.logger.fatal()` | Erreurs fatales, entraînant généralement l'arrêt du programme             |
| `error`   | `ctx.logger.error()` | Journaux d'erreurs, indiquant un échec de requête ou d'opération         |
| `warn`    | `ctx.logger.warn()`  | Informations d'avertissement, signalant des risques potentiels ou des situations inattendues |
| `info`    | `ctx.logger.info()`  | Informations d'exécution courantes                                       |
| `debug`   | `ctx.logger.debug()` | Informations de débogage, destinées à l'environnement de développement   |
| `trace`   | `ctx.logger.trace()` | Informations de trace détaillées, généralement utilisées pour un diagnostic approfondi |

## Format des journaux

Chaque sortie de journal est au format JSON structuré et contient par défaut les champs suivants :

| Champ      | Type   | Description                                |
| ---------- | ------ | ------------------------------------------ |
| `level`    | number | Niveau du journal                          |
| `time`     | number | Horodatage (millisecondes)                 |
| `pid`      | number | ID du processus                            |
| `hostname` | string | Nom d'hôte                                 |
| `msg`      | string | Message du journal                         |
| Autres     | object | Informations de contexte personnalisées    |

Exemple de sortie :

```json
{
  "level": 30,
  "time": 1730540153064,
  "pid": 12765,
  "hostname": "nocobase.local",
  "msg": "HelloModel rendered",
  "a": "a"
}
```

## Liaison de contexte

`ctx.logger` injecte automatiquement des informations de contexte, telles que le **plugin** actuel, le module ou la source de la requête, permettant ainsi de tracer plus précisément l'origine des journaux.

```ts
plugin.context.logger.info('Plugin initialized');
model.context.logger.error('Model validation failed', { model: 'User' });
```

Exemple de sortie (avec contexte) :

```json
{
  "level": 30,
  "msg": "Plugin initialized",
  "plugin": "plugin-audit-trail"
}
```

## Logger personnalisé

Vous pouvez créer des instances de logger personnalisées dans vos **plugins**, en héritant ou en étendant les configurations par défaut :

```ts
const logger = ctx.logger.child({ module: 'MyPlugin' });
logger.info('Submodule started');
```

Les loggers enfants héritent de la configuration du logger principal et y attachent automatiquement le contexte.

## Hiérarchie des niveaux de journalisation

Les niveaux de journalisation de Pino suivent une définition numérique du plus élevé au plus bas, où les nombres plus petits indiquent une priorité plus faible.  
Voici le tableau complet de la hiérarchie des niveaux de journalisation :

| Nom du niveau | Valeur    | Nom de la méthode | Description                                                              |
| ------------- | --------- | ----------------- | ------------------------------------------------------------------------ |
| `fatal`       | 60        | `logger.fatal()`  | Erreurs fatales, empêchant généralement le programme de continuer à s'exécuter |
| `error`       | 50        | `logger.error()`  | Erreurs générales, indiquant un échec de requête ou des opérations inattendues |
| `warn`        | 40        | `logger.warn()`   | Informations d'avertissement, signalant des risques potentiels ou des situations inattendues |
| `info`        | 30        | `logger.info()`   | Informations courantes, enregistrant l'état du système ou les opérations normales |
| `debug`       | 20        | `logger.debug()`  | Informations de débogage, utilisées pour l'analyse des problèmes en phase de développement |
| `trace`       | 10        | `logger.trace()`  | Informations de trace détaillées, utilisées pour un diagnostic approfondi |
| `silent`      | -Infinity | (aucune méthode correspondante) | Désactive toutes les sorties de journal                                  |

Pino n'affiche que les journaux dont le niveau est supérieur ou égal à la configuration `level` actuelle. Par exemple, lorsque le niveau de journalisation est `info`, les journaux `debug` et `trace` seront ignorés.

## Bonnes pratiques pour le développement de **plugins**

1.  **Utilisez le logger de contexte**  
    Utilisez `ctx.logger` dans les contextes de **plugin**, de modèle ou d'application pour inclure automatiquement les informations d'origine.

2.  **Distinguez les niveaux de journalisation**  
    -   Utilisez `error` pour enregistrer les exceptions métier.  
    -   Utilisez `info` pour enregistrer les changements d'état.  
    -   Utilisez `debug` pour enregistrer les informations de débogage de développement.

3.  **Évitez la journalisation excessive**  
    Il est recommandé de n'activer les niveaux `debug` et `trace` que dans les environnements de développement.

4.  **Utilisez des données structurées**  
    Passez des paramètres d'objet plutôt que de concaténer des chaînes de caractères, ce qui facilite l'analyse et le filtrage des journaux.

En suivant ces pratiques, les développeurs peuvent suivre plus efficacement l'exécution des **plugins**, résoudre les problèmes et maintenir un système de journalisation structuré et extensible.