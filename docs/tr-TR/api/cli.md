# NocoBase CLI

NocoBase CLI, NocoBase uygulamalarını geliştirmenize, oluşturmanıza ve dağıtmanıza yardımcı olmak için tasarlanmıştır.

<Alert>

NocoBase CLI, ts-node ve node çalışma modlarını destekler.

- ts-node modu (varsayılan): geliştirme ortamı için gerçek zamanlı derlemeyi destekler, ancak yavaş yanıt verir
- node modu: üretim ortamında kullanılır, yanıt hızlıdır, ancak tüm kaynak kodunu derlemek için "yarn nocobase build"i çalıştırmanız gerekir

</Alert>

## Kullanım talimatları

```bash
$ yarn nocobase -h

Kullanım: nocobase [komut] [seçenekler]

Seçenekler:
  -h, --help

Komutlar:
  console
  db:auth               Veritabanı bağlantısının başarılı olduğunu doğrulayın
  db:sync               Koleksiyon yapılandırması aracılığıyla ilgili veri tabloları ve alanları oluşturun
  install               Kurulum
  start                 Uygulamayı üretim ortamında başlatır
  build                 Derleme ve paketleme yapar
  clean                 Derlenmiş dosyaları siler
  dev                   Geliştirme ortamı için uygulamayı başlatın ve tam zamanında derlemeyi destekleyin
  doc                   Belge geliştirme
  test                  Test
  umi
  upgrade               Sürüm yükseltme
  migrator              Veri aktarma
  pm                    Eklenti yöneticisi
  help
```

## Scaffold Uygulama

Scaffold Uygulama `package.json` \ `scripts` aşağıdaki gibi：

```json
{
  "scripts": {
    "dev": "nocobase dev",
    "start": "nocobase start",
    "clean": "nocobase clean",
    "build": "nocobase build",
    "test": "nocobase test",
    "pm": "nocobase pm",
    "postinstall": "nocobase postinstall"
  }
}
```

## Komut satırı uzantısı

NocoBase CLI, [Komut Satırı](https://github.com/tj/commander.js) üzerine kurulmuştur, komutu özgürce genişletebilirsiniz, genişletilmiş komut 'app/server/index.ts' içinde yazılabilir:

```ts
const app = new Application(config);

app.command('hello').action(() => {});
```

Veya bir eklenti için：

```ts
class MyPlugin extends Plugin {
  beforeLoad() {
    this.app.command('hello').action(() => {});
  }
}
```

Terminal çalışması

```bash
$ yarn nocobase hello
```

## Yerleşik komut satırı

Kullanım sıklığına göre sırala

### `dev`

Geliştirme ortamında uygulamayı başlatın ve kod gerçek zamanlı olarak derlenir.

<Alert>
NocoBase kurulmadığında, otomatik olarak kurulacaktır (kurulum komutuna bakın)
</Alert>

```bash
Kullanım: nocobase dev [seçenekler]

Seçenekler:
  -p, --port [port]
  --client
  --server
  -h, --help
```

Örnek

```bash
# Uygulamayı başlatın, geliştirme ortamı için tam zamanında derleme
yarn nocobase dev
# Sadece sunucuyu başlat
yarn nocobase dev --server
# sadece istemciyi başlat
yarn nocobase dev --client
```

### `start`

Üretim ortamında, uygulamayı başlatmak için kodun yarn build ile derlenmesi gereklidir.

<Alert>

- NocoBase kurulmadığında, otomatik olarak kurulacaktır (kurulum komutuna bakın)
- Kaynak kodu değiştirildiğinde, yeniden paketlenmesi gerekir (build komutuna bakın)

</Alert>

```bash
$ yarn nocobase start -h

Kullanım: nocobase start [seçenekler]

Seçenekler:
  -p, --port
  -s, --silent
  -h, --help
```

Örnek

```bash
# derlenen kodun kullanımı için sistemi başlatın,
yarn nocobase start
```

### `install`

Kurulum

```bash
$ yarn nocobase install -h

Kullanım: nocobase install [seçenekler]

Seçenekler:
  -f, --force
  -c, --clean
  -s, --silent
  -l, --lang [lang]
  -e, --root-email <rootEmail>
  -p, --root-password <rootPassword>
  -n, --root-nickname [rootNickname]
  -h, --help
```

Örnek

```bash
# İlk kurulum
yarn nocobase install -l tr-TR -e admin@nocobase.com -p admin123
# NocoBase için tüm veri sayfalarını kaldırın ve yeniden yükleyin
yarn nocobase install -f -l tr-TR -e admin@nocobase.com -p admin123
# Veritabanını boşaltın ve yeniden yükleyin
yarn nocobase install -c -l tr-TR -e admin@nocobase.com -p admin123
```

<Alert>

`-f/--force` ve `-c/--clean` 
- `-f/--force` NocoBase verileri silin
- `-c/--clean` Veritabanını boşaltın, tüm veri tabloları silinecek

</Alert>

### `upgrade`

Sürüm yükseltme

```bash
yarn nocobase upgrade
```

### `test`

jest testi, "-c, --db-clean" desteğini genişletmenin yanı sıra tüm [jest-cli](https://jestjs.io/docs/cli) seçeneklerini destekler.

```bash
$ yarn nocobase test -h

Usage: nocobase test [seçenekler]

Seçenekler:
  -c, --db-clean        Tüm testleri çalıştırmadan önce veritabanını temizleyin
  -h, --help
```

Örnek

```bash
# tüm test dosyalarını çalıştır
yarn nocobase test
# Belirtilen klasördeki tüm test dosyalarını çalıştırın
yarn nocobase test packages/core/server
# belirtilen dosyadaki tüm testleri çalıştır
yarn nocobase test packages/core/database/src/__tests__/database.test.ts

# Testi çalıştırmadan önce veritabanını temizleyin
yarn nocobase test -c
yarn nocobase test packages/core/server -c
```

### `build`

Kod üretim ortamına dağıtılmadan önce kaynak kodun derlenmesi ve paketlenmesi gerekir.Kod değiştirilirse yeniden oluşturulması gerekir.

```bash
# Tüm paketler
yarn nocobase build
# Belirtilen paket(ler)
yarn nocobase build app/server app/client
```

### `clean`

derlenmiş dosyaları sil

```bash
yarn clean
# Aynı işi aşağıdaki kod ile de yapabilirsiniz.
yarn rimraf -rf packages/*/*/{lib,esm,es,dist}
```

### `doc`

Döküman geliştirme

```bash
# Belge geliştirmeyi başlar
yarn doc  --lang=tr-TR # yarn doc dev ile aynı işi yapar
# Dokümantasyon oluşturun, varsayılan olarak ./docs/dist/ dizinine çıktı alın
yarn doc build
# Dist ile belge çıktısının son etkisini görüntüleyin
yarn doc serve --lang=tr-TR
```

### `db:auth`

Veritabanı bağlantısının başarılı olduğunu doğrulayın

```bash
$ yarn nocobase db:auth -h

Kullanım: nocobase db:auth [seçenekler]

Seçenekler:
  -r, --retry [TekrarSayısı]   TekrarSayısı yazan yere bir rakam yazın.
  -h, --help
```

### `db:sync`

Koleksiyon yapılandırması aracılığıyla veri tabloları ve alanlar oluşturun

```bash
$ yarn nocobase db:sync -h

Kullanım: nocobase db:sync [seçenek]

Seçenekler:
  -f, --force
  -h, --help   yardım içeriğini görüntüler
```

### `migrator`

Veri aktarma

```bash
$ yarn nocobase migrator

Konumsal argümanlar:
  <komut>
    up        Bekleyen taşımaları uygular
    down      Taşıma işlemlerini geri al
    pending   Bekleyen taşımaları listeler
    executed  Yürütülen taşımaları listeler
    create    Taşıma dosyası oluşturun
```

### `pm`

Eklenti yöneticisi

```bash
# Eklenti oluştur
yarn pm create hello
# Eklentiyi kaydet
yarn pm add hello
# Eklentiyi etkinleştir
yarn pm enable hello
# Eklentiyi devre dışı bırak
yarn pm disable hello
# Eklentiyi kaldır
yarn pm remove hello
```

Tamamlanmayanlar

```bash
# Eklenti sürüm yükseltme
yarn pm upgrade hello
# Eklentiyi yayınla
yarn pm publish hello
```

### `umi`

"app/client", [umi](https://umijs.org/) tabanlıdır ve ilgili diğer komutları "nocobase umi" aracılığıyla yürütebilir.

```bash
# Geliştirme ortamı için gereken .umi önbelleğini oluşturun
yarn nocobase umi generate tmp
```

### `help`

Yardım komutu, ayrıca `-h` ve `--help` seçenek parametresiyle de kullanılabilir

```bash
# Tüm yardım içeriğini göster
yarn nocobase help
# Aynı içeriğe aşağıdaki komut ile de ulaşabilirsiniz.
yarn nocobase -h
# TAynı içeriğe aşağıdaki komut ile de ulaşabilirsiniz.
yarn nocobase --help
# db:sync komutunun seçeneklerini görüntüleyin
yarn nocobase db:sync -h
```
