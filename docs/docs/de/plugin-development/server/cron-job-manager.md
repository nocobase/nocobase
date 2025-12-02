:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# CronJobManager – Verwaltung zeitgesteuerter Aufgaben

`CronJobManager` ist ein von NocoBase bereitgestellter Manager für zeitgesteuerte Aufgaben, der auf [cron](https://www.npmjs.com/package/cron) basiert. Er ermöglicht es Plugins, serverseitig zeitgesteuerte Aufgaben zu registrieren, um bestimmte Logik periodisch auszuführen.

## Grundlegende Verwendung

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Täglich um 00:00 Uhr ausführen
      onTick: async () => {
        console.log('Tägliche Aufgabe: Temporäre Daten bereinigen');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Automatisch starten
    });
  }

  async cleanTemporaryData() {
    // Hier die Bereinigungslogik ausführen
  }
}
```

## Parameterbeschreibung

Die Typdefinition für `CronJobParameters` sieht wie folgt aus (aus [cron](https://www.npmjs.com/package/cron)):

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

| Parameter        | Typ                        | Beschreibung                                                                                             |
| ---------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Zeitlicher Ausdruck für die zeitgesteuerte Aufgabe. Unterstützt Standard-Cron-Ausdrücke, z. B. bedeutet `0 0 * * *` die tägliche Ausführung um 00:00 Uhr. |
| **onTick**       | `function`                 | Die Hauptfunktion der Aufgabe. Sie wird zur angegebenen Zeit ausgelöst.                                  |
| **onComplete**   | `function`                 | Wird ausgeführt, wenn die Aufgabe durch `job.stop()` beendet wird oder nachdem die `onTick`-Funktion abgeschlossen ist. |
| **start**        | `boolean`                  | Gibt an, ob die Aufgabe automatisch gestartet werden soll.                                               |
| **timeZone**     | `string`                   | Legt die Ausführungszeitzone fest (z. B. `Asia/Shanghai`).                                               |
| **context**      | `any`                      | Der Kontext bei der Ausführung von `onTick`.                                                             |
| **runOnInit**    | `boolean`                  | Gibt an, ob die Aufgabe bei der Initialisierung sofort einmal ausgeführt werden soll.                    |
| **utcOffset**    | `string \| number`         | Legt den Zeitzonen-Offset fest.                                                                          |
| **unrefTimeout** | `boolean`                  | Steuert, ob der Event-Loop aktiv bleibt.                                                                 |

## Beispiele für Cron-Ausdrücke

| Ausdruck       | Bedeutung                     |
| -------------- | ----------------------------- |
| `* * * * *`    | Jede Minute ausführen         |
| `0 * * * *`    | Jede Stunde ausführen         |
| `0 0 * * *`    | Täglich um 00:00 Uhr ausführen |
| `0 9 * * 1`    | Jeden Montag um 09:00 Uhr ausführen |
| `*/10 * * * *` | Alle 10 Minuten ausführen     |

> 💡 Sie können [crontab.guru](https://crontab.guru/) verwenden, um Ausdrücke zu generieren.

## Starten und Stoppen von Aufgaben steuern

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Aufgabe starten
job.stop();  // Aufgabe stoppen
```

:::tip

Zeitgesteuerte Aufgaben starten und stoppen zusammen mit der Anwendung. Normalerweise müssen Sie sie nicht manuell starten oder stoppen.

:::