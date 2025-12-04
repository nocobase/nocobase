:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# CronJobManager – Menedżer Zadań Cyklicznych

`CronJobManager` to menedżer zadań cyklicznych dostarczany przez NocoBase, oparty na bibliotece [cron](https://www.npmjs.com/package/cron). Umożliwia wtyczkom rejestrowanie zadań cyklicznych na serwerze, które służą do okresowego wykonywania określonej logiki.

## Podstawowe Użycie

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Wykonuje się codziennie o 00:00
      onTick: async () => {
        console.log('Codzienne zadanie: czyszczenie danych tymczasowych');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Automatyczne uruchomienie
    });
  }

  async cleanTemporaryData() {
    // Tutaj należy zaimplementować logikę czyszczenia
  }
}
```

## Opis Parametrów

Definicja typu `CronJobParameters` jest następująca (pochodzi z [cron](https://www.npmjs.com/package/cron)):

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

| Parametr       | Typ                        | Opis                                                                                              |
| :------------- | :------------------------- | :------------------------------------------------------------------------------------------------ |
| **cronTime**   | `string \| Date \| DateTime` | Wyrażenie czasowe dla zadania cyklicznego. Obsługuje standardowe wyrażenia cron, np. `0 0 * * *` oznacza wykonanie codziennie o 00:00. |
| **onTick**     | `function`                 | Główna funkcja zadania. Zostanie wywołana w określonym czasie.                                     |
| **onComplete** | `function`                 | Wykonuje się, gdy zadanie zostanie zatrzymane przez `job.stop()` lub po zakończeniu funkcji `onTick`. |
| **timeZone**   | `string`                   | Określa strefę czasową wykonania (np. `Asia/Shanghai`).                                           |
| **context**    | `any`                      | Kontekst podczas wykonywania `onTick`.                                                            |
| **runOnInit**  | `boolean`                  | Czy wykonać zadanie natychmiast po inicjalizacji.                                                 |
| **utcOffset**  | `string \| number`         | Określa przesunięcie strefy czasowej (UTC offset).                                                |
| **unrefTimeout** | `boolean`                  | Kontroluje, czy pętla zdarzeń pozostaje aktywna.                                                  |

## Przykłady Wyrażeń Cron

| Wyrażenie      | Znaczenie                         |
| :------------- | :-------------------------------- |
| `* * * * *`    | Wykonuje się co minutę            |
| `0 * * * *`    | Wykonuje się co godzinę           |
| `0 0 * * *`    | Wykonuje się codziennie o 00:00   |
| `0 9 * * 1`    | Wykonuje się w każdy poniedziałek o 09:00 |
| `*/10 * * * *` | Wykonuje się co 10 minut          |

> 💡 Mogą Państwo skorzystać z [crontab.guru](https://crontab.guru/), aby pomóc sobie w generowaniu wyrażeń.

## Sterowanie Uruchamianiem i Zatrzymywaniem Zadań

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Uruchamia zadanie
job.stop();  // Zatrzymuje zadanie
```

:::tip

Zadania cykliczne uruchamiają się i zatrzymują wraz z aplikacją. Zazwyczaj nie ma potrzeby ręcznego uruchamiania ani zatrzymywania ich, chyba że jest to absolutnie konieczne.

:::