:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/logger).
:::

# ctx.logger

Une encapsulation de journalisation basée sur [pino](https://github.com/pinojs/pino), offrant des journaux JSON structurés de haute performance. Il est recommandé d'utiliser `ctx.logger` au lieu de `console` pour faciliter la collecte et l'analyse des journaux.

## Scénarios d'utilisation

`ctx.logger` peut être utilisé dans tous les scénarios RunJS pour le débogage, le suivi des erreurs, l'analyse des performances, etc.

## Définition du type

```ts
logger: pino.Logger;
```

`ctx.logger` est une instance de `engine.logger.child({ module: 'flow-engine' })`, c'est-à-dire un logger enfant pino avec un contexte `module`.

## Niveaux de journalisation

pino prend en charge les niveaux suivants (du plus haut au plus bas) :

| Niveau | Méthode | Description |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Erreur fatale, entraînant généralement l'arrêt du processus |
| `error` | `ctx.logger.error()` | Erreur, indiquant l'échec d'une requête ou d'une opération |
| `warn` | `ctx.logger.warn()` | Avertissement, indiquant des risques potentiels ou des situations anormales |
| `info` | `ctx.logger.info()` | Informations générales sur l'exécution |
| `debug` | `ctx.logger.debug()` | Informations de débogage, utilisées pendant le développement |
| `trace` | `ctx.logger.trace()` | Trace détaillée, utilisée pour un diagnostic approfondi |

## Utilisation recommandée

Le format recommandé est `level(msg, meta)` : le message en premier, suivi d'un objet de métadonnées optionnel.

```ts
ctx.logger.info('Chargement du bloc terminé');
ctx.logger.info('Opération réussie', { recordId: 456 });
ctx.logger.warn('Avertissement de performance', { duration: 5000 });
ctx.logger.error('Échec de l\'opération', { userId: 123, action: 'create' });
ctx.logger.error('Échec de la requête', { err });
```

pino prend également en charge `level(meta, msg)` (objet en premier) ou `level({ msg, ...meta })` (objet unique), qui peuvent être utilisés selon vos besoins.

## Exemples

### Utilisation de base

```ts
ctx.logger.info('Chargement du bloc terminé');
ctx.logger.warn('Échec de la requête, utilisation du cache', { err });
ctx.logger.debug('Enregistrement en cours...', { recordId: ctx.record?.id });
```

### Création d'un logger enfant avec child()

```ts
// Créer un logger enfant avec contexte pour la logique actuelle
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Exécution de l\'étape 1');
log.debug('Exécution de l\'étape 2', { step: 2 });
```

### Relation avec console

Il est recommandé d'utiliser directement `ctx.logger` pour obtenir des journaux JSON structurés. Si vous avez l'habitude d'utiliser `console`, les correspondances sont : `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Format des journaux

pino produit du JSON structuré, où chaque entrée de journal contient :

- `level` : Niveau de journalisation (numérique)
- `time` : Horodatage (millisecondes)
- `msg` : Message du journal
- `module` : Fixé à `flow-engine`
- Autres champs personnalisés (transmis via des objets)

## Remarques

- Les journaux sont au format JSON structuré, ce qui facilite leur collecte, leur recherche et leur analyse.
- Les loggers enfants créés via `child()` suivent également la recommandation de syntaxe `level(msg, meta)`.
- Certains environnements d'exécution (comme les flux de travail) peuvent utiliser des méthodes de sortie de journaux différentes.

## Liens connexes

- [pino](https://github.com/pinojs/pino) — La bibliothèque de journalisation sous-jacente