:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Logger

La journalisation NocoBase est basée sur <a href="https://github.com/winstonjs/winston" target="_blank">Winston</a>. Par défaut, NocoBase catégorise les journaux en journaux de requêtes API, journaux d'exécution système et journaux d'exécution SQL. Les journaux de requêtes API et d'exécution SQL sont générés en interne par l'application. Les développeurs de **plugins** n'ont généralement besoin d'enregistrer que les journaux d'exécution système liés à leurs **plugins**.

Ce document explique comment créer et enregistrer des journaux lors du développement de **plugins**.

## Méthodes d'enregistrement par défaut

NocoBase met à votre disposition des méthodes pour enregistrer les journaux d'exécution système. Ces journaux sont formatés selon des champs prédéfinis et sont écrits dans des fichiers spécifiques.

```ts
// Méthode d'enregistrement par défaut
app.log.info("message");

// Utilisation dans un middleware
async function (ctx, next) {
  ctx.log.info("message");
}

// Utilisation dans les plugins
class CustomPlugin extends Plugin {
  async load() {
    this.log.info("message");
  }
}
```

Toutes les méthodes ci-dessus suivent l'utilisation suivante :

Le premier paramètre est le message du journal. Le second est un objet `metadata` facultatif, qui peut contenir n'importe quelle paire clé-valeur. Les champs `module`, `submodule` et `method` seront extraits comme des champs distincts, tandis que les autres champs seront regroupés dans le champ `meta`.

```ts
app.log.info('message', {
  module: 'module',
  submodule: 'submodule',
  method: 'method',
  key1: 'value1',
  key2: 'value2',
});
// => level=info timestamp=2023-12-27 10:30:23 message=message module=module submodule=submodule method=method meta={"key1": "value1", "key2": "value2"}

app.log.debug();
app.log.warn();
app.log.error();
```

## Enregistrer dans d'autres fichiers

Si vous souhaitez utiliser la méthode d'enregistrement par défaut du système, mais que vous ne voulez pas que les journaux soient écrits dans le fichier par défaut, vous pouvez créer une instance de logger système personnalisée à l'aide de `createSystemLogger`.

```ts
import { createSystemLogger } from '@nocobase/logger';

const logger = createSystemLogger({
  dirname: '/pathto/',
  filename: 'xxx',
  seperateError: true, // Indique si les journaux de niveau `error` doivent être enregistrés séparément dans 'xxx_error.log'.
});
```

## Logger personnalisé

Si vous préférez utiliser les méthodes natives de Winston plutôt que celles fournies par le système, vous pouvez créer des journaux en utilisant les méthodes suivantes.

### `createLogger`

```ts
import { createLogger } from '@nocobase/logger';

const logger = createLogger({
  // options
});
```

L'objet `options` étend les `winston.LoggerOptions` originales.

- `transports` - Vous pouvez utiliser `'console' | 'file' | 'dailyRotateFile'` pour appliquer les méthodes de sortie prédéfinies.
- `format` - Vous pouvez utiliser `'logfmt' | 'json' | 'delimiter'` pour appliquer les formats d'enregistrement prédéfinis.

### `app.createLogger`

Dans les scénarios multi-applications, il est parfois utile de personnaliser les répertoires et fichiers de sortie. Vous pouvez alors enregistrer les journaux dans un répertoire portant le nom de l'application courante.

```ts
app.createLogger({
  dirname: '',
  filename: 'custom', // Enregistre dans /storage/logs/main/custom.log
});
```

### `plugin.createLogger`

Le cas d'utilisation et la méthode sont identiques à ceux de `app.createLogger`.

```ts
class CustomPlugin extends Plugin {
  async load() {
    const logger = this.createLogger({
      // Enregistre dans /storage/logs/main/custom-plugin/YYYY-MM-DD.log
      dirname: 'custom-plugin',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }
}
```