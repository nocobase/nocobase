---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/multi-space/multi-app) bakın.
:::

# Çoklu Uygulama

## Tanıtım

**Çoklu Uygulama eklentisi (Multi-app)**, ayrı ayrı dağıtım yapmaya gerek kalmadan birden fazla bağımsız uygulamayı dinamik olarak oluşturmanıza ve yönetmenize olanak tanır. Her alt uygulama; kendi veritabanına, eklentilerine ve yapılandırmalarına sahip tamamen bağımsız bir örnektir (instance).

#### Kullanım Senaryoları
- **Çoklu Kiracılık (Multi-tenancy)**: Her müşterinin kendi verilerine, eklenti yapılandırmalarına ve yetki sistemlerine sahip olduğu bağımsız uygulama örnekleri sunar.
- **Farklı İş Alanları İçin Ana ve Alt Sistemler**: Bağımsız olarak dağıtılmış birkaç küçük uygulamadan oluşan büyük bir sistem.

:::warning
Çoklu uygulama eklentisi tek başına kullanıcı paylaşımı özelliği sunmaz.  
Birden fazla uygulama arasında kullanıcı entegrasyonunu sağlamak için **[Kimlik Doğrulama eklentisi](/auth-verification)** ile birlikte kullanılabilir.
:::

## Kurulum

Eklenti yöneticisinde **Çoklu uygulama (Multi-app)** eklentisini bulun ve etkinleştirin.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Kullanım Kılavuzu

### Alt Uygulama Oluşturma

Sistem ayarları menüsünde "Çoklu uygulama" seçeneğine tıklayarak çoklu uygulama yönetim sayfasına girin:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Yeni bir alt uygulama oluşturmak için "Yeni Ekle" butonuna tıklayın:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Form Alanı Açıklamaları

* **Ad**: Alt uygulama tanımlayıcısı, küresel olarak benzersizdir.
* **Görünen Ad**: Alt uygulamanın arayüzde görüntülenen adı.
* **Başlatma Modu**:
  * **İlk erişimde başlat**: Alt uygulama, yalnızca bir kullanıcı ona URL üzerinden ilk kez eriştiğinde başlatılır.
  * **Ana uygulama ile birlikte başlat**: Alt uygulama, ana uygulama ile aynı anda başlatılır (bu, ana uygulamanın başlatma süresini artırır).
* **Port**: Alt uygulamanın çalışma sırasında kullandığı port numarası.
* **Özel Alan Adı**: Alt uygulama için bağımsız bir alt alan adı (subdomain) yapılandırın.
* **Menüye Sabitle**: Alt uygulama girişini üst gezinti çubuğunun sol tarafına sabitler.
* **Veritabanı Bağlantısı**: Alt uygulamanın veri kaynağını yapılandırmak için kullanılır ve üç yöntemi destekler:
  * **Yeni Veritabanı**: Bağımsız bir veritabanı oluşturmak için mevcut veri servisini yeniden kullanır.
  * **Yeni Veri Bağlantısı**: Tamamen yeni bir veritabanı servisi yapılandırır.
  * **Şema Modu**: PostgreSQL'de alt uygulama için bağımsız bir Şema (Schema) oluşturur.
* **Yükseltme**: Bağlı veritabanı NocoBase veri yapısının eski bir sürümünü içeriyorsa, otomatik olarak mevcut sürüme yükseltilir.

### Alt Uygulamaları Çalıştırma ve Durdurma

Alt uygulamayı başlatmak için **Başlat** butonuna tıklayın.  
> Oluşturma sırasında *"İlk erişimde başlat"* seçeneği işaretlendiyse, ilk ziyarette otomatik olarak başlatılacaktır.  

Alt uygulamayı yeni bir sekmede açmak için **Görüntüle** butonuna tıklayın.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Alt Uygulama Durumu ve Günlükler (Logs)

Listede her uygulamanın bellek (RAM) ve CPU kullanımını görüntüleyebilirsiniz.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Alt uygulamanın çalışma günlüklerini görüntülemek için **Günlükler** butonuna tıklayın.  
> Alt uygulama başlatıldıktan sonra erişilemiyorsa (örneğin veritabanı bozulması gibi durumlarda), günlükleri kullanarak sorun giderme yapabilirsiniz.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Alt Uygulama Silme

Bir alt uygulamayı kaldırmak için **Sil** butonuna tıklayın.  
> Silerken veritabanının da silinip silinmeyeceğini seçebilirsiniz. Lütfen dikkatli olun, bu işlem geri alınamaz.

### Alt Uygulamalara Erişim
Varsayılan olarak alt uygulamalara erişmek için `/_app/:appName/admin/` kullanılır, örneğin:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Ayrıca, alt uygulamalar için bağımsız alt alan adları yapılandırabilirsiniz. Alan adını mevcut IP adresine yönlendirmeniz gerekir. Nginx kullanıyorsanız, alan adının Nginx yapılandırmasına da eklenmesi gerekir.

### CLI ile Alt Uygulamaları Yönetme

Proje kök dizininde, alt uygulama örneklerini **PM2** aracılığıyla yönetmek için komut satırını kullanabilirsiniz:

```bash
yarn nocobase pm2 list              # Şu anda çalışan örneklerin listesini görüntüle
yarn nocobase pm2 stop [appname]    # Belirli bir alt uygulama sürecini durdur
yarn nocobase pm2 delete [appname]  # Belirli bir alt uygulama sürecini sil
yarn nocobase pm2 kill              # Başlatılan tüm süreçleri zorla sonlandır (ana uygulama örneğini de içerebilir)
```

### Eski Çoklu Uygulama Veri Taşıma

Eski çoklu uygulama yönetim sayfasına gidin ve taşıma işlemini gerçekleştirmek için **Verileri Yeni Çoklu Uygulamaya Taşı** butonuna tıklayın.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## Sıkça Sorulan Sorular

#### 1. Eklenti Yönetimi
Alt uygulamalar, ana uygulama ile aynı eklentileri (sürümler dahil) kullanabilir ancak eklentiler bağımsız olarak yapılandırılabilir ve kullanılabilir.

#### 2. Veritabanı İzolasyonu
Alt uygulamalar bağımsız veritabanları ile yapılandırılabilir. Uygulamalar arasında veri paylaşmak isterseniz, bu harici veri kaynakları aracılığıyla sağlanabilir.

#### 3. Veri Yedekleme ve Taşıma
Şu anda ana uygulamadaki veri yedekleme işlemi alt uygulama verilerini içermez (yalnızca temel alt uygulama bilgilerini içerir). Yedekleme ve taşıma işlemleri her alt uygulamanın kendi içinde manuel olarak yapılmalıdır.

#### 4. Dağıtım ve Güncellemeler
Alt uygulama sürümleri otomatik olarak ana uygulamanın yükseltmelerini takip ederek ana ve alt uygulamalar arasında sürüm tutarlılığını sağlar.

#### 5. Kaynak Yönetimi
Her alt uygulamanın kaynak tüketimi temel olarak ana uygulama ile aynıdır. Şu anda tek bir uygulamanın bellek kullanımı yaklaşık 500-600 MB civarındadır.