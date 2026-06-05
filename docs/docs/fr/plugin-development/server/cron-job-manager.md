:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# CronJobManager

`CronJobManager` est un gestionnaire de tâches planifiées proposé par NocoBase, basé sur [cron](https://www.npmjs.com/package/cron). Il permet à vos plugins d'enregistrer des tâches planifiées sur le serveur pour exécuter périodiquement une logique spécifique.

## Utilisation de base

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // S'exécute tous les jours à 00:00
      onTick: async () => {
        console.log('Tâche quotidienne : nettoyage des données temporaires');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Démarrage automatique
    });
  }

  async cleanTemporaryData() {
    // Exécutez ici la logique de nettoyage
  }
}
```

## Description des paramètres

La définition du type `CronJobParameters` est la suivante (tirée de [cron](https://www.npmjs.com/package/cron)) :

```ts
export declare interface CronJobParameters {
  cronTime: string | Date | DateTime;
  onTick: CronCommand;
  onComplete?: CronCommand | null;
  start?: boolean;
  timeZone?: string;
  context?: any;
  runOnInit?: boolean;
  utcOffset?: string | number;
  unrefTimeout?: boolean;
}
```

| Paramètre        | Type                       | Description                                                                                             |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Expression temporelle de la tâche planifiée. Prend en charge les expressions cron standard, par exemple `0 0 * * *` signifie une exécution quotidienne à 00:00. |
| **onTick**       | `function`                 | Fonction principale de la tâche. Elle sera déclenchée à l'heure spécifiée.                               |
| **onComplete**   | `function`                 | S'exécute lorsque la tâche est arrêtée par `job.stop()` ou après l'achèvement de la fonction `onTick`. |
| **timeZone**     | `string`                   | Spécifie le fuseau horaire d'exécution (par exemple, `Asia/Shanghai`).                                  |
| **context**      | `any`                      | Contexte d'exécution de `onTick`.                                                                       |
| **runOnInit**    | `boolean`                  | Indique si la tâche doit être exécutée immédiatement une fois lors de l'initialisation.                |
| **utcOffset**    | `string \| number`         | Spécifie le décalage horaire UTC.                                                                       |
| **unrefTimeout** | `boolean`                  | Contrôle si la boucle d'événements reste active.                                                        |

## Exemples d'expressions Cron

| Expression       | Signification                 |
| ---------------- | ----------------------------- |
| `* * * * *`      | S'exécute toutes les minutes  |
| `0 * * * *`      | S'exécute toutes les heures   |
| `0 0 * * *`      | S'exécute tous les jours à 00:00 |
| `0 9 * * 1`      | S'exécute tous les lundis à 09:00 |
| `*/10 * * * *`   | S'exécute toutes les 10 minutes |

> 💡 Vous pouvez utiliser [crontab.guru](https://crontab.guru/) pour vous aider à générer des expressions.

## Contrôler le démarrage et l'arrêt des tâches

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Démarre la tâche
job.stop();  // Arrête la tâche
```

:::tip

Les tâches planifiées démarrent et s'arrêtent avec l'application. Vous n'avez généralement pas besoin de les démarrer ou de les arrêter manuellement, sauf si cela est nécessaire.

:::