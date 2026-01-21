:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Proje Dizin Yapısı

İster Git'ten kaynak kodunu klonlayın, ister `create-nocobase-app` kullanarak bir proje başlatın, oluşturulan NocoBase projesi esasen **Yarn Workspace** tabanlı bir çoklu paket deposudur (monorepo).

## Üst Düzey Dizinlere Genel Bakış

Aşağıdaki örnekte `my-nocobase-app/` proje dizini olarak kullanılmıştır. Farklı ortamlarda küçük farklılıklar olabilir:

```bash
my-nocobase-app/
├── packages/              # Proje kaynak kodu
│   ├── plugins/           # Geliştirilmekte olan eklenti kaynak kodu (derlenmemiş)
├── storage/               # Çalışma zamanı verileri ve dinamik olarak oluşturulan içerik
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Derlenmiş eklentiler (arayüz üzerinden yüklenenler dahil)
│   └── tar/               # Eklenti paketleme dosyaları (.tar)
├── scripts/               # Yardımcı betikler ve araç komutları
├── .env*                  # Farklı ortamlar için değişken yapılandırmaları
├── lerna.json             # Lerna çalışma alanı yapılandırması
├── package.json           # Kök paket yapılandırması, çalışma alanını ve betikleri tanımlar
├── tsconfig*.json         # TypeScript yapılandırmaları (ön uç, arka uç, yol eşleme)
├── vitest.config.mts      # Vitest birim testi yapılandırması
└── playwright.config.ts   # Playwright E2E testi yapılandırması
```

## packages/ Alt Dizini Açıklaması

`packages/` dizini, NocoBase'in çekirdek modüllerini ve genişletilebilir paketlerini içerir. İçerik, projenin kaynağına bağlıdır:

- **`create-nocobase-app` aracılığıyla oluşturulan projeler**: Varsayılan olarak yalnızca `packages/plugins/` dizinini içerir ve özel eklenti kaynak kodunu depolamak için kullanılır. Her alt dizin bağımsız bir npm paketidir.
- **Resmi kaynak deposu klonlandığında**: `core/`, `plugins/`, `pro-plugins/`, `presets/` gibi daha fazla alt dizin görebilirsiniz; bunlar sırasıyla çerçeve çekirdeğine, yerleşik eklentilere ve resmi ön ayar çözümlerine karşılık gelir.

Hangi durum olursa olsun, `packages/plugins` özel eklentileri geliştirmek ve hata ayıklamak için ana konumdur.

## storage/ Çalışma Zamanı Dizini

`storage/` dizini, çalışma zamanında oluşturulan verileri ve derleme çıktılarını depolar. Yaygın alt dizin açıklamaları şunlardır:

- `apps/`: Çoklu uygulama senaryoları için yapılandırma ve önbellek.
- `logs/`: Çalışma zamanı günlükleri ve hata ayıklama çıktıları.
- `uploads/`: Kullanıcı tarafından yüklenen dosyalar ve medya kaynakları.
- `plugins/`: Arayüz aracılığıyla yüklenen veya CLI ile içe aktarılan paketlenmiş eklentiler.
- `tar/`: `yarn build <plugin> --tar` komutu çalıştırıldıktan sonra oluşturulan sıkıştırılmış eklenti paketleri.

> Genellikle `storage` dizinini `.gitignore` dosyasına eklemeniz ve dağıtım veya yedekleme sırasında ayrı olarak ele almanız önerilir.

## Ortam Yapılandırması ve Proje Betikleri

- `.env`, `.env.test`, `.env.e2e`: Sırasıyla yerel çalıştırma, birim/entegrasyon testi ve uçtan uca test için kullanılır.
- `scripts/`: Yaygın bakım betiklerini (veritabanı başlatma, yayın yardımcı araçları vb. gibi) depolar.

## Eklenti Yükleme Yolları ve Önceliği

Eklentiler birden fazla konumda bulunabilir. NocoBase, başlatılırken bunları aşağıdaki öncelik sırasına göre yükler:

1. `packages/plugins` içindeki kaynak kodu sürümü (yerel geliştirme ve hata ayıklama için).
2. `storage/plugins` içindeki paketlenmiş sürüm (arayüz aracılığıyla yüklenen veya CLI ile içe aktarılan).
3. `node_modules` içindeki bağımlılık paketleri (npm/yarn aracılığıyla yüklenen veya çerçeveye yerleşik olan).

Aynı ada sahip bir eklenti hem kaynak dizininde hem de paketlenmiş dizinde bulunduğunda, sistem yerel geçersiz kılmaları ve hata ayıklamayı kolaylaştırmak için kaynak sürümünü yüklemeye öncelik verir.

## Eklenti Dizin Şablonu

CLI kullanarak bir eklenti oluşturun:

```bash
yarn pm create @my-project/plugin-hello
```

Oluşturulan dizin yapısı aşağıdaki gibidir:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Derleme çıktısı (gerektiğinde oluşturulur)
├── src/                     # Kaynak kodu dizini
│   ├── client/              # Ön uç kodu (bloklar, sayfalar, modeller vb.)
│   │   ├── plugin.ts        # İstemci tarafı eklenti ana sınıfı
│   │   └── index.ts         # İstemci tarafı giriş noktası
│   ├── locale/              # Çoklu dil kaynakları (ön uç ve arka uç arasında paylaşılır)
│   ├── swagger/             # OpenAPI/Swagger belgeleri
│   └── server/              # Sunucu tarafı kodu
│       ├── collections/     # Koleksiyon tanımları
│       ├── commands/        # Özel komutlar
│       ├── migrations/      # Veritabanı geçiş betikleri
│       ├── plugin.ts        # Sunucu tarafı eklenti ana sınıfı
│       └── index.ts         # Sunucu tarafı giriş noktası
├── index.ts                 # Ön uç ve arka uç köprü dışa aktarımı
├── client.d.ts              # Ön uç tür bildirimleri
├── client.js                # Ön uç derleme çıktısı
├── server.d.ts              # Sunucu tarafı tür bildirimleri
├── server.js                # Sunucu tarafı derleme çıktısı
├── .npmignore               # Yayınlama yoksayma yapılandırması
└── package.json
```

> Derleme tamamlandıktan sonra, `dist/` dizini ile `client.js` ve `server.js` dosyaları eklenti etkinleştirildiğinde yüklenir.
> Geliştirme aşamasında yalnızca `src/` dizinini değiştirmeniz yeterlidir. Yayınlamadan önce `yarn build <plugin>` veya `yarn build <plugin> --tar` komutunu çalıştırmanız yeterlidir.