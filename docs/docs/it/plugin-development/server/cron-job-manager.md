:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# CronJobManager Gestione delle attività pianificate

`CronJobManager` è un gestore di attività pianificate fornito da NocoBase, basato su [cron](https://www.npmjs.com/package/cron). Permette ai plugin di registrare attività pianificate sul server per eseguire periodicamente una logica specifica.

## Utilizzo di base

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Esecuzione giornaliera alle 00:00
      onTick: async () => {
        console.log('Attività giornaliera: pulizia dei dati temporanei');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Avvio automatico
    });
  }

  async cleanTemporaryData() {
    // Esegua qui la logica di pulizia
  }
}
```

## Descrizione dei parametri

La definizione del tipo `CronJobParameters` è la seguente (da [cron](https://www.npmjs.com/package/cron)):

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

| Parametro        | Tipo                       | Descrizione                                                                                              |
| ---------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Espressione temporale dell'attività pianificata. Supporta espressioni cron standard, ad esempio `0 0 * * *` significa esecuzione giornaliera alle 00:00. |
| **onTick**       | `function`                 | Funzione principale dell'attività. Verrà attivata all'ora specificata.                                   |
| **onComplete**   | `function`                 | Viene eseguita quando l'attività viene interrotta da `job.stop()` o dopo che la funzione `onTick` è stata completata. |
| **timeZone**     | `string`                   | Specifica il fuso orario di esecuzione (ad esempio `Asia/Shanghai`).                                     |
| **context**      | `any`                      | Contesto durante l'esecuzione di `onTick`.                                                               |
| **runOnInit**    | `boolean`                  | Indica se eseguire l'attività immediatamente una volta all'inizializzazione.                             |
| **utcOffset**    | `string \| number`         | Specifica l'offset del fuso orario.                                                                      |
| **unrefTimeout** | `boolean`                  | Controlla se il ciclo di eventi rimane attivo.                                                           |

## Esempi di espressioni Cron

| Espressione        | Significato                  |
| ------------------ | ---------------------------- |
| `* * * * *`        | Esecuzione ogni minuto       |
| `0 * * * *`        | Esecuzione ogni ora          |
| `0 0 * * *`        | Esecuzione giornaliera alle 00:00 |
| `0 9 * * 1`        | Esecuzione ogni lunedì alle 09:00 |
| `*/10 * * * *`     | Esecuzione ogni 10 minuti    |

> 💡 Può utilizzare [crontab.guru](https://crontab.guru/) per aiutarLa a generare le espressioni.

## Controllo dell'avvio e dell'arresto delle attività

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Avvia l'attività
job.stop();  // Ferma l'attività
```

:::tip

Le attività pianificate si avviano e si fermano insieme all'applicazione. Generalmente, non è necessario avviarle o fermarle manualmente, a meno che non sia strettamente indispensabile.

:::