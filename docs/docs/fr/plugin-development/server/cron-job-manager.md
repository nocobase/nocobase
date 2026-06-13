---
title: "CronJobManager Tâches planifiées"
description: "Tâches planifiées NocoBase : app.cronJobManager, expression cron, enregistrer et planifier des tâches périodiques."
keywords: "CronJobManager, tâches planifiées, cron, app.cronJobManager, planification de tâches, NocoBase"
---

# Gestionnaire de tâches planifiées CronJobManager

`CronJobManager` est le gestionnaire de tâches planifiées fourni par NocoBase, basé sur [cron](https://www.npmjs.com/package/cron). Vous pouvez enregistrer des tâches planifiées dans vos plugins pour exécuter périodiquement une logique spécifique.

## Utilisation de base

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *',       // S'exécute tous les jours à 00:00
      onTick: async () => {
        console.log('Tâche quotidienne : nettoyage des données temporaires');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true,                  // Démarrage automatique
    });
  }

  async cleanTemporaryData() {
    // Exécutez ici la logique de nettoyage
  }
}
```

## Description des paramètres

La définition du type `CronJobParameters` est la suivante (issue de [cron](https://www.npmjs.com/package/cron)) :

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

| Paramètre  | Type  | Description  |
| ---------------- | ---------- | ---------- |
| **cronTime**     | `string \| Date \| DateTime` | Expression temporelle de la tâche planifiée. Prend en charge les expressions cron standard, par exemple `0 0 * * *` signifie une exécution quotidienne à 00:00. |
| **onTick**       | `function` | Fonction principale de la tâche. Elle sera déclenchée à l'heure spécifiée. |
| **onComplete**   | `function` | S'exécute lorsque la tâche est arrêtée par `job.stop()` ou lorsque `onTick` se termine activement. |
| **timeZone**     | `string`   | Spécifie le fuseau horaire d'exécution (par exemple `Asia/Shanghai`). |
| **context**      | `any`      | Contexte d'exécution lors de l'appel de `onTick`. |
| **runOnInit**    | `boolean`  | Indique si la tâche doit être exécutée immédiatement une fois lors de l'initialisation. |
| **utcOffset**    | `string \| number`  | Spécifie le décalage horaire UTC. |
| **unrefTimeout** | `boolean`  | Contrôle si la boucle d'événements reste active. |

## Exemples d'expressions Cron

| Expression            | Signification           |
| -------------- | ------------ |
| `* * * * *`    | S'exécute toutes les minutes      |
| `0 * * * *`    | S'exécute toutes les heures      |
| `0 0 * * *`    | S'exécute tous les jours à 00:00  |
| `0 9 * * 1`    | S'exécute tous les lundis à 09:00 |
| `*/10 * * * *` | S'exécute toutes les 10 minutes  |

:::tip Astuce

Vous pouvez utiliser [crontab.guru](https://crontab.guru/) pour vous aider à générer des expressions cron.

:::

## Contrôler le démarrage et l'arrêt des tâches

`addJob()` retourne un objet job que vous pouvez utiliser pour contrôler la tâche manuellement :

```ts
const job = app.cronJobManager.addJob({ ... });
job.start();  // Démarrer la tâche
job.stop();   // Arrêter la tâche
```

:::tip Astuce

Les tâches planifiées démarrent et s'arrêtent avec l'application ; vous n'avez généralement pas besoin d'appeler manuellement `start()` ou `stop()`.

:::

## Liens connexes

- [Plugin](./plugin.md) — cycle de vie et API centrale des plugins
- [Système d'événements](./event.md) — écouter et déclencher des événements applicatifs
- [Aperçu du développement serveur](./index.md) — vue d'ensemble des modules serveur
- [Aperçu du développement de plugins](../index.md) — présentation générale du développement de plugins
