:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Eklenti Geliştirmeye Genel Bakış

NocoBase, **mikro çekirdek mimarisi** kullanır. Çekirdek yalnızca eklenti yaşam döngüsü planlaması, bağımlılık yönetimi ve temel yeteneklerin kapsüllenmesinden sorumludur. Tüm işlevler eklenti olarak sağlanır. Bu nedenle, eklentinin organizasyon yapısını, yaşam döngüsünü ve yönetim yaklaşımını anlamak, NocoBase'i özelleştirmenin ilk adımıdır.

## Temel Kavramlar

- **Tak Çalıştır**: Eklentiler, ihtiyaca göre kurulabilir, etkinleştirilebilir veya devre dışı bırakılabilir. Bu sayede, kodda değişiklik yapmadan işlevleri esnek bir şekilde birleştirebilirsiniz.
- **Uçtan Uca Entegrasyon**: Eklentiler genellikle hem sunucu tarafı hem de istemci tarafı uygulamaları içerir. Bu, veri mantığı ile arayüz etkileşimleri arasında tutarlılık sağlar.

## Temel Eklenti Yapısı

Her eklenti, bağımsız bir npm paketidir ve genellikle aşağıdaki dizin yapısını içerir:

```bash
plugin-hello/
├─ package.json          # Eklenti adı, bağımlılıklar ve NocoBase eklenti meta bilgileri
├─ client.js             # Çalışma zamanında yüklenmek üzere ön uç derleme çıktısı
├─ server.js             # Çalışma zamanında yüklenmek üzere sunucu tarafı derleme çıktısı
├─ src/
│  ├─ client/            # İstemci tarafı kaynak kodu; bloklar, eylemler, alanlar vb. kaydedilebilir.
│  └─ server/            # Sunucu tarafı kaynak kodu; kaynaklar, olaylar, komut satırları vb. kaydedilebilir.
```

## Dizin Kuralları ve Yükleme Sırası

NocoBase, eklentileri yüklemek için varsayılan olarak aşağıdaki dizinleri tarar:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Geliştirme aşamasındaki eklentiler (en yüksek öncelik)
└── storage/
    └── plugins/          # Derlenmiş eklentiler, örn. yüklenmiş veya yayınlanmış eklentiler
```

- `packages/plugins`: Yerel eklenti geliştirme için kullanılan dizindir, gerçek zamanlı derlemeyi ve hata ayıklamayı destekler.
- `storage/plugins`: Ticari sürümler veya üçüncü taraf eklentiler gibi derlenmiş eklentileri depolar.

## Eklenti Yaşam Döngüsü ve Durumları

Bir eklenti genellikle aşağıdaki aşamalardan geçer:

1.  **Oluşturma (create)**: CLI aracılığıyla bir eklenti şablonu oluşturulur.
2.  **Çekme (pull)**: Eklenti paketi yerel olarak indirilir, ancak henüz veritabanına yazılmaz.
3.  **Etkinleştirme (enable)**: İlk etkinleştirildiğinde "kayıt + başlatma" işlemini yürütür; sonraki etkinleştirmelerde yalnızca mantığı yükler.
4.  **Devre Dışı Bırakma (disable)**: Eklentinin çalışmasını durdurur.
5.  **Kaldırma (remove)**: Eklentiyi sistemden tamamen kaldırır.

:::tip

-   `pull` işlemi yalnızca eklenti paketini indirir; gerçek kurulum süreci ilk `enable` (etkinleştirme) ile tetiklenir.
-   Bir eklenti yalnızca `pull` (çekme) işlemiyle indirilmiş ancak etkinleştirilmemişse, yüklenmeyecektir.

:::

### CLI Komut Örnekleri

```bash
# 1. Eklenti iskeleti oluşturun
yarn pm create @my-project/plugin-hello

# 2. Eklenti paketini çekin (indirin veya bağlayın)
yarn pm pull @my-project/plugin-hello

# 3. Eklentiyi etkinleştirin (ilk etkinleştirmede otomatik olarak kurulur)
yarn pm enable @my-project/plugin-hello

# 4. Eklentiyi devre dışı bırakın
yarn pm disable @my-project/plugin-hello

# 5. Eklentiyi kaldırın
yarn pm remove @my-project/plugin-hello
```

## Eklenti Yönetim Arayüzü

Tarayıcınızda eklenti yöneticisine erişerek eklentileri sezgisel olarak görüntüleyebilir ve yönetebilirsiniz:

**Varsayılan Adres:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Eklenti Yöneticisi](https://static-docs.nocobase.com/20251030195350.png)