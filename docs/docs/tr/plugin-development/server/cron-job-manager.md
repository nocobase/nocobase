:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# CronJobManager Zamanlanmış Görev Yönetimi

`CronJobManager`, NocoBase tarafından sunulan, [cron](https://www.npmjs.com/package/cron) tabanlı bir zamanlanmış görev yöneticisidir. Eklentilerin, sunucu tarafında belirli bir mantığı periyodik olarak yürütmek üzere zamanlanmış görevler kaydetmesine olanak tanır.

## Temel Kullanım

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Her gün 00:00'da çalışır
      onTick: async () => {
        console.log('Günlük görev: Geçici verileri temizle');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Otomatik başlat
    });
  }

  async cleanTemporaryData() {
    // Temizleme mantığını burada uygulayın
  }
}
```

## Parametre Açıklamaları

`CronJobParameters` tip tanımı aşağıdaki gibidir ([cron](https://www.npmjs.com/package/cron) adresinden alınmıştır):

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

| Parametre        | Tip                        | Açıklama                                                                                              |
| ---------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Zamanlanmış görevin zaman ifadesi. Standart cron ifadelerini destekler, örneğin `0 0 * * *` her gün 00:00'da çalışır anlamına gelir. |
| **onTick**       | `function`                 | Görevin ana fonksiyonu. Belirtilen zamanda tetiklenecektir.                                           |
| **onComplete**   | `function`                 | Görev `job.stop()` ile durdurulduğunda veya `onTick` fonksiyonu tamamlandığında çalışır.              |
| **timeZone**     | `string`                   | Çalışma saat dilimini belirtir (örneğin `Asia/Shanghai`).                                             |
| **context**      | `any`                      | `onTick` çalıştırılırken kullanılacak bağlam.                                                         |
| **runOnInit**    | `boolean`                  | Başlatma sırasında hemen bir kez çalıştırılıp çalıştırılmayacağını belirtir.                         |
| **utcOffset**    | `string \| number`         | Saat dilimi ofsetini belirtir.                                                                        |
| **unrefTimeout** | `boolean`                  | Olay döngüsünün aktif kalıp kalmayacağını kontrol eder.                                               |

## Cron İfadesi Örnekleri

| İfade         | Anlamı                  |
| ------------- | ----------------------- |
| `* * * * *`   | Her dakika çalışır      |
| `0 * * * *`   | Her saat çalışır        |
| `0 0 * * *`   | Her gün 00:00'da çalışır |
| `0 9 * * 1`   | Her Pazartesi 09:00'da çalışır |
| `*/10 * * * *`| Her 10 dakikada bir çalışır |

> 💡 İfadeleri oluşturmak için [crontab.guru](https://crontab.guru/) adresini kullanabilirsiniz.

## Görevin Başlatılması ve Durdurulması

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Görevi başlat
job.stop();  // Görevi durdur
```

:::tip

Zamanlanmış görevler, uygulama ile birlikte başlar ve durur. Genellikle, manuel olarak başlatmanız veya durdurmanız gerekmez.

:::