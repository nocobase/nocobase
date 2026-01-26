:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Komut

NocoBase'de komutlar, komut satırında uygulama veya eklentilerle ilgili işlemleri yürütmek için kullanılır. Örneğin, sistem görevlerini çalıştırmak, geçiş (migration) veya senkronizasyon işlemleri gerçekleştirmek, yapılandırmayı başlatmak ya da çalışan uygulama örnekleriyle etkileşimde bulunmak gibi. Geliştiriciler, eklentiler için özel komutlar tanımlayabilir ve bunları `app` nesnesi aracılığıyla kaydederek CLI'da `nocobase <komut>` şeklinde çalıştırabilirler.

## Komut Türleri

NocoBase'de komut kaydı iki türe ayrılır:

| Tür           | Kayıt Yöntemi                          | Eklenti Etkin Olmalı mı? | Tipik Senaryolar                       |
| ------------- | -------------------------------------- | ------------------------ | -------------------------------------- |
| Dinamik Komut | `app.command()`                        | ✅ Evet                  | Eklenti işlevleriyle ilgili komutlar   |
| Statik Komut  | `Application.registerStaticCommand()`  | ❌ Hayır                 | Kurulum, başlatma, bakım komutları     |

## Dinamik Komutlar

`eklenti` komutlarını tanımlamak için `app.command()` kullanın. Komutlar yalnızca `eklenti` etkinleştirildikten sonra çalıştırılabilir. Komut dosyaları, `eklenti` dizininin altındaki `src/server/commands/*.ts` konumuna yerleştirilmelidir.

Örnek

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Açıklama

- `app.command('echo')`: `echo` adlı bir komut tanımlar.
- `.option('-v, --version')`: Komuta bir seçenek ekler.
- `.action()`: Komutun yürütme mantığını tanımlar.
- `app.version.get()`: Mevcut uygulama sürümünü alır.

Komutu Çalıştırma

```bash
nocobase echo
nocobase echo -v
```

## Statik Komutlar

`Application.registerStaticCommand()` kullanarak kaydedilen statik komutlar, `eklenti` etkinleştirilmeden çalıştırılabilir. Kurulum, başlatma, geçiş (migration) veya hata ayıklama gibi görevler için uygundur. `eklenti` sınıfının `staticImport()` metodunda kaydedilirler.

Örnek

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

Komutu Çalıştırma

```bash
nocobase echo
nocobase echo --version
```

Açıklama

- `Application.registerStaticCommand()`, uygulama örneği oluşturulmadan önce komutları kaydeder.
- Statik komutlar genellikle uygulama veya `eklenti` durumundan bağımsız genel görevleri yürütmek için kullanılır.

## Komut API'si

Komut nesneleri, komut yürütme bağlamını kontrol etmek için üç isteğe bağlı yardımcı yöntem sunar:

| Yöntem      | Amaç                                                    | Örnek                                   |
| ----------- | ------------------------------------------------------- | --------------------------------------- |
| `ipc()`     | Çalışan uygulama örnekleriyle iletişim kurar (IPC aracılığıyla) | `app.command('reload').ipc().action()`  |
| `auth()`    | Veritabanı yapılandırmasının doğru olduğunu doğrular    | `app.command('seed').auth().action()`   |
| `preload()` | Uygulama yapılandırmasını önceden yükler (`app.load()` çalıştırır) | `app.command('sync').preload().action()` |

Yapılandırma Açıklaması

- **`ipc()`**
  Varsayılan olarak, komutlar yeni bir uygulama örneğinde yürütülür.
  `ipc()` etkinleştirildikten sonra, komutlar süreçler arası iletişim (IPC) aracılığıyla o anda çalışan uygulama örneğiyle etkileşime girer. Bu, önbelleği yenileme, bildirim gönderme gibi gerçek zamanlı işlem komutları için uygundur.

- **`auth()`**
  Komut yürütülmeden önce veritabanı yapılandırmasının kullanılabilir olup olmadığını kontrol eder.
  Eğer veritabanı yapılandırması yanlışsa veya bağlantı başarısız olursa, komut yürütülmeye devam etmez. Genellikle veritabanı yazma veya okuma işlemleri içeren görevler için kullanılır.

- **`preload()`**
  Komut yürütülmeden önce uygulama yapılandırmasını önceden yükler; bu, `app.load()` çalıştırmaya eşdeğerdir.
  Yapılandırmaya veya `eklenti` bağlamına bağlı olan komutlar için uygundur.

Daha fazla API yöntemi için [AppCommand](/api/server/app-command) bölümüne bakınız.

## Yaygın Örnekler

Varsayılan Verileri Başlatma

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Varsayılan yönetici kullanıcısı başlatıldı.');
  });
```

Çalışan Örnek İçin Önbelleği Yeniden Yükleme (IPC Modu)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Çalışan uygulamadan önbelleği yeniden yüklemesi isteniyor...');
  });
```

Kurulum Komutunun Statik Kaydı

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('NocoBase ortamı kuruluyor...');
    });
});
```