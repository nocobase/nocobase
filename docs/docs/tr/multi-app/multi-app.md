---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Çoklu Uygulama


## Giriş

**Çoklu Uygulama eklentisi**, ayrı ayrı dağıtım yapmanıza gerek kalmadan birden fazla bağımsız uygulama oluşturmanıza ve yönetmenize olanak tanır. Her bir alt uygulama, kendi veritabanına, eklentilerine ve yapılandırmasına sahip tamamen bağımsız bir örnektir.

#### Kullanım Senaryoları
- **Çok Kiracılılık**: Bağımsız uygulama örnekleri sunar, böylece her müşterinin kendi verileri, eklenti yapılandırmaları ve izin sistemi olur.
- **Farklı iş alanları için ana ve alt sistemler**: Birden fazla bağımsız olarak dağıtılmış küçük uygulamalardan oluşan büyük bir sistem.


:::warning
Çoklu Uygulama eklentisi, tek başına kullanıcı paylaşım yeteneği sunmaz.
Eğer birden fazla uygulama arasında kullanıcıları paylaşmanız gerekiyorsa, bunu **[Kimlik Doğrulama eklentisi](/auth-verification)** ile birlikte kullanabilirsiniz.
:::


## Kurulum

Eklenti yöneticisinde **Çoklu Uygulama (Multi-app)** eklentisini bulun ve etkinleştirin.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Kullanım Kılavuzu


### Alt Uygulama Oluşturma

Sistem ayarları menüsünde "Çoklu Uygulama"ya tıklayarak çoklu uygulama yönetim sayfasına gidin:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

"Yeni Ekle" düğmesine tıklayarak yeni bir alt uygulama oluşturun:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Form Alanı Açıklamaları

*   **Ad**: Alt uygulama tanımlayıcısı, küresel olarak benzersizdir.
*   **Görünen Ad**: Alt uygulamanın arayüzde gösterilen adıdır.
*   **Başlatma Modu**:
    *   **İlk ziyarette başlat**: Alt uygulama, bir kullanıcı URL aracılığıyla ilk kez eriştiğinde başlar;
    *   **Ana uygulama ile birlikte başlat**: Alt uygulama, ana uygulama ile aynı anda başlar (bu, ana uygulamanın başlangıç süresini artıracaktır).
*   **Port**: Alt uygulamanın çalışma zamanında kullandığı port numarasıdır.
*   **Özel Alan Adı**: Alt uygulama için bağımsız bir alt alan adı yapılandırın.
*   **Menüye Sabitle**: Alt uygulama girişini üst gezinme çubuğunun sol tarafına sabitleyin.
*   **Veritabanı Bağlantısı**: Alt uygulama için veri kaynağını yapılandırmak için kullanılır, aşağıdaki üç yöntemi destekler:
    *   **Yeni veritabanı**: Mevcut veri hizmetini yeniden kullanarak bağımsız bir veritabanı oluşturur;
    *   **Yeni veri bağlantısı**: Tamamen yeni bir veritabanı hizmeti yapılandırır;
    *   **Şema modu**: PostgreSQL'de alt uygulama için bağımsız bir şema oluşturur.
*   **Yükseltme**: Bağlı veritabanı eski bir NocoBase veri yapısı sürümü içeriyorsa, otomatik olarak mevcut sürüme yükseltilecektir.


### Alt Uygulama Başlatma ve Durdurma

**Başlat** düğmesine tıklayarak alt uygulamayı başlatabilirsiniz;
> Oluşturma sırasında *"İlk ziyarette başlat"* seçeneği işaretlendiyse, ilk ziyarette otomatik olarak başlayacaktır.

**Görüntüle** düğmesine tıklayarak alt uygulamayı yeni bir sekmede açın.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Alt Uygulama Durumu ve Logları

Listede, her uygulamanın kullandığı bellek ve CPU'yu görüntüleyebilirsiniz.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

**Loglar** düğmesine tıklayarak alt uygulamanın çalışma zamanı loglarını görüntüleyebilirsiniz.
> Alt uygulama başlatıldıktan sonra erişilemez durumdaysa (örneğin, bozuk bir veritabanı nedeniyle), logları kullanarak sorun giderebilirsiniz.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Alt Uygulama Silme

**Sil** düğmesine tıklayarak alt uygulamayı kaldırabilirsiniz.
> Silme işlemi sırasında veritabanını da silip silmemeyi seçebilirsiniz. Lütfen dikkatli olun, bu işlem geri alınamaz.


### Alt Uygulamaya Erişim
Varsayılan olarak, alt uygulamalara `/_app/:appName/admin/` yolu kullanılarak erişilir, örneğin:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Ayrıca, alt uygulama için bağımsız bir alt alan adı yapılandırabilirsiniz. Alan adını mevcut IP adresine çözümlemeniz gerekir ve eğer Nginx kullanıyorsanız, alan adını Nginx yapılandırmasına da eklemeniz gerekir.


### Komut Satırı Aracılığıyla Alt Uygulamaları Yönetme

Proje kök dizininde, PM2 aracılığıyla alt uygulama örneklerini komut satırından yönetebilirsiniz:

```bash
yarn nocobase pm2 list              # Şu anda çalışan örneklerin listesini görüntüleyin
yarn nocobase pm2 stop [appname]    # Belirli bir alt uygulama sürecini durdurun
yarn nocobase pm2 delete [appname]  # Belirli bir alt uygulama sürecini silin
yarn nocobase pm2 kill              # Başlatılan tüm süreçleri zorla sonlandırın (ana uygulamanın örneğini içerebilir)
```

### Eski Çoklu Uygulama Verilerini Taşıma

Eski çoklu uygulama yönetim sayfasına gidin ve verileri taşımak için **Verileri yeni çoklu uygulamaya taşı** düğmesine tıklayın.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Sıkça Sorulan Sorular

#### 1. Eklenti Yönetimi
Alt uygulamalar, ana uygulama ile aynı eklentileri (sürümleri dahil) kullanabilir, ancak bağımsız olarak yapılandırılabilir ve kullanılabilirler.

#### 2. Veritabanı İzolasyonu
Alt uygulamalar bağımsız veritabanları ile yapılandırılabilir. Uygulamalar arasında veri paylaşmak isterseniz, bunu harici veri kaynakları aracılığıyla yapabilirsiniz.

#### 3. Veri Yedekleme ve Taşıma
Şu anda, ana uygulamadaki veri yedeklemeleri alt uygulama verilerini (yalnızca temel alt uygulama bilgilerini) içermemektedir. Her alt uygulama içinde verileri manuel olarak yedeklemeniz ve taşımanız gerekmektedir.

#### 4. Dağıtım ve Güncellemeler
Bir alt uygulamanın sürümü, ana uygulama ile birlikte otomatik olarak yükseltilecektir, böylece ana ve alt uygulamalar arasında sürüm tutarlılığı sağlanır.

#### 5. Kaynak Yönetimi
Her alt uygulamanın kaynak tüketimi, ana uygulama ile temel olarak aynıdır. Şu anda, tek bir uygulama yaklaşık 500-600MB bellek kullanmaktadır.