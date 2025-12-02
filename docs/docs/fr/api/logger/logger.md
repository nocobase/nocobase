:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Logger

## Créer un Logger

### `createLogger()`

Crée un logger personnalisé.

#### Signature

- `createLogger(options: LoggerOptions)`

#### Type

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Détails

| Propriété    | Description                      |
| :----------- | :------------------------------- |
| `dirname`    | Répertoire de sortie des logs    |
| `filename`   | Nom du fichier de log            |
| `format`     | Format des logs                  |
| `transports` | Méthode de sortie des logs       |

### `createSystemLogger()`

Crée les logs d'exécution système selon une méthode spécifiée. Référez-vous à [Logger - Log système](/log-and-monitor/logger/index.md#system-log)

#### Signature

- `createSystemLogger(options: SystemLoggerOptions)`

#### Type

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // imprime les erreurs séparément, par défaut à true
}
```

#### Détails

| Propriété       | Description                                              |
| :-------------- | :------------------------------------------------------- |
| `seperateError` | Indique si les logs de niveau `error` doivent être produits séparément |

### `requestLogger()`

Middleware pour la journalisation des requêtes et réponses d'API.

```ts
app.use(requestLogger(app.name));
```

#### Signature

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Type

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Détails

| Propriété           | Type                              | Description                                                              | Valeur par défaut                                                                                                                                                 |
| :------------------ | :-------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Permet d'ignorer la journalisation de certaines requêtes en fonction de leur contexte. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Liste blanche des informations de requête à inclure dans les logs.       | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Liste blanche des informations de réponse à inclure dans les logs.      | `['status']`                                                                                                                                            |

### app.createLogger()

#### Définition

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

Lorsque `dirname` est un chemin relatif, les fichiers de log seront générés dans le répertoire portant le nom de l'application actuelle.

### plugin.createLogger()

L'utilisation est identique à celle de `app.createLogger()`.

#### Définition

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Configuration des logs

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Récupère le niveau de log actuellement configuré dans le système.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Concatène les chemins de répertoires en se basant sur le répertoire de logs actuellement configuré dans le système.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Récupère les méthodes de sortie des logs actuellement configurées dans le système.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Récupère le format des logs actuellement configuré dans le système.

## Sortie des logs

### Transports

Méthodes de sortie prédéfinies.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Documentation associée

- [Guide de développement - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)