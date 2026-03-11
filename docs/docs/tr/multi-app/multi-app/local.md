---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/multi-app/multi-app/local) bakın.
:::

# Paylaşımlı Bellek Modu

## Giriş

Kullanıcılar işlerini uygulama düzeyinde bölmek istediklerinde ancak karmaşık dağıtım ve operasyon mimarileri getirmek istemediklerinde, paylaşımlı bellek çoklu uygulama modunu kullanabilirler.

Bu modda, tek bir NocoBase örneği içinde birden fazla uygulama aynı anda çalışabilir. Her uygulama bağımsızdır, bağımsız veritabanlarına bağlanabilir, ayrı ayrı oluşturulabilir, başlatılabilir ve durdurulabilir; ancak aynı süreci ve bellek alanını paylaşırlar, böylece kullanıcıların hala yalnızca bir NocoBase örneği yönetmesi gerekir.

## Kullanım Kılavuzu

### Çevresel Değişken Yapılandırması

Çoklu uygulama özelliğini kullanmadan önce, NocoBase başlatılırken aşağıdaki çevresel değişkenlerin ayarlandığından emin olun:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Uygulama Oluşturma

Sistem ayarları menüsünde 「Uygulama Denetleyicisi」'ne tıklayarak uygulama yönetimi sayfasına girin.

![](https://static-docs.nocobase.com/202512291056215.png)

Yeni bir uygulama oluşturmak için 「Yeni Ekle」 butonuna tıklayın.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Yapılandırma Öğesi Açıklaması

| Yapılandırma Öğesi | Açıklama |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Uygulama adı**   | Uygulamanın arayüzde görüntülenen adı |
| **Uygulama kimliği**   | Uygulama tanımlayıcısı, küresel olarak benzersiz |
| **Başlatma modu**   | - İlk ziyarette başlat: Kullanıcı alt uygulamaya ilk kez bir URL üzerinden eriştiğinde başlatılır<br>- Ana uygulama ile birlikte başlat: Ana uygulama başlatıldığında alt uygulamayı da başlatır (ana uygulamanın başlatma süresini artırır) |
| **Ortam**       | Paylaşımlı bellek modunda yalnızca yerel ortam kullanılabilir, yani `local` |
| **Veritabanı bağlantısı** | Uygulamanın ana veri kaynağını yapılandırmak için kullanılır, şu üç yöntemi destekler:<br>- Yeni veritabanı: Mevcut veritabanı servisini yeniden kullanın ve bağımsız bir veritabanı oluşturun<br>- Yeni veri bağlantısı: Diğer veritabanı servislerine bağlanın<br>- Şema modu: Mevcut ana veri kaynağı PostgreSQL olduğunda, uygulama için bağımsız bir Şema oluşturun |
| **Yükseltme**       | Bağlı veritabanında NocoBase uygulama verilerinin düşük bir sürümü varsa, mevcut uygulama sürümüne otomatik yükseltmeye izin verilip verilmeyeceği |
| **JWT Anahtarı**   | Uygulama oturumunun ana uygulamadan ve diğer uygulamalardan bağımsız olmasını sağlamak için uygulama için otomatik olarak bağımsız bir JWT anahtarı oluşturur |
| **Özel alan adı** | Uygulama için bağımsız erişim alan adı yapılandırın |

### Uygulama Başlatma

Alt uygulamayı başlatmak için **Başlat** butonuna tıklayabilirsiniz.

> Oluşturma sırasında _“İlk ziyarette başlat”_ seçeneği işaretlendiyse, ilk erişimde otomatik olarak başlatılacaktır.

![](https://static-docs.nocobase.com/202512291121065.png)

### Uygulama Erişimi

**Ziyaret Et** butonuna tıkladığınızda, alt uygulama yeni bir sekmede açılacaktır.

Alt uygulamaya erişmek için varsayılan olarak `/apps/:appName/admin/` kullanılır, örneğin:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Aynı zamanda, alt uygulama için bağımsız bir alan adı da yapılandırabilirsiniz; alan adını mevcut IP'ye yönlendirmeniz gerekir. Nginx kullanıyorsanız, Nginx yapılandırmasına da alan adını eklemeniz gerekir.

### Uygulama Durdurma

Alt uygulamayı durdurmak için **Durdur** butonuna tıklayabilirsiniz.

![](https://static-docs.nocobase.com/202512291122113.png)

### Uygulama Durumu

Listede her uygulamanın mevcut durumunu görüntüleyebilirsiniz.

![](https://static-docs.nocobase.com/202512291122339.png)

### Uygulama Silme

Uygulamayı kaldırmak için **Sil** butonuna tıklayabilirsiniz.

![](https://static-docs.nocobase.com/202512291122178.png)

## Sıkça Sorulan Sorular

### 1. Eklenti Yönetimi

Diğer uygulamaların kullanabileceği eklentiler ana uygulama ile aynıdır (sürümler dahil), ancak eklentiler bağımsız olarak yapılandırılabilir ve kullanılabilir.

### 2. Veritabanı İzolasyonu

Diğer uygulamalar bağımsız veritabanları yapılandırabilir. Uygulamalar arasında veri paylaşmak isterseniz, harici veri kaynağı aracılığıyla bunu gerçekleştirebilirsiniz.

### 3. Veri Yedekleme ve Taşıma

Şu anda ana uygulama üzerindeki veri yedekleme, diğer uygulamaların verilerini içermeyi desteklememektedir (yalnızca temel uygulama bilgilerini içerir). Diğer uygulamalar içinde manuel olarak yedekleme ve taşıma yapılması gerekir.

### 4. Dağıtım ve Güncelleme

Paylaşımlı bellek modunda, diğer uygulamaların sürümleri ana uygulamayı otomatik olarak takip ederek yükseltilecek ve uygulama sürümlerinin tutarlılığı otomatik olarak sağlanacaktır.

### 5. Uygulama Oturumu

- Uygulama bağımsız bir JWT anahtarı kullanıyorsa, uygulama oturumu ana uygulamadan ve diğer uygulamalardan bağımsızdır. Aynı alan adının alt yolları üzerinden farklı uygulamalara erişiliyorsa, uygulama TOKEN'ı LocalStorage'da önbelleğe alındığı için uygulamalar arasında geçiş yaparken yeniden giriş yapılması gerekir. Daha iyi oturum izolasyonu sağlamak için farklı uygulamalar için bağımsız alan adları yapılandırılması önerilir.
- Uygulama bağımsız bir JWT anahtarı kullanmıyorsa, ana uygulamanın oturumunu paylaşır; aynı tarayıcıda diğer uygulamalara eriştikten sonra ana uygulamaya dönerken yeniden giriş yapmaya gerek kalmaz. Ancak bu bir güvenlik riski oluşturur; farklı uygulamaların kullanıcı kimlikleri (ID) çakışırsa, kullanıcının diğer uygulamaların verilerine yetkisiz erişimine neden olabilir.