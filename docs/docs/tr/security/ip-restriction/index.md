---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# IP Kısıtlamaları

## Giriş

NocoBase, yöneticilerin kullanıcı erişim IP'leri için beyaz liste veya kara liste oluşturarak yetkisiz harici ağ bağlantılarını kısıtlamasına veya bilinen kötü amaçlı IP adreslerini engellemesine olanak tanır. Bu sayede güvenlik riskleri azalır. Ayrıca, yöneticiler erişim reddi günlüklerini sorgulayarak riskli IP'leri tespit edebilirler.

## Yapılandırma Kuralları

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### IP Filtreleme Modları

- **Kara Liste**: Bir kullanıcının erişim IP'si listedeki bir IP ile eşleştiğinde, sistem erişimi **reddedecektir**; eşleşmeyen IP'lere ise varsayılan olarak **izin verilir**.
- **Beyaz Liste**: Bir kullanıcının erişim IP'si listedeki bir IP ile eşleştiğinde, sistem erişime **izin verecektir**; eşleşmeyen IP'lere ise varsayılan olarak **erişim engellenir**.

### IP Listesi

Sisteme erişmesine izin verilen veya engellenen IP adreslerini tanımlamak için kullanılır. Belirli işlevi, seçilen IP filtreleme moduna bağlıdır. IP adresleri veya CIDR ağ segmentleri girebilirsiniz; birden fazla adresi virgül veya yeni satır karakteriyle ayırabilirsiniz.

## Günlükleri Sorgulama

Bir kullanıcının erişimi reddedildikten sonra, erişim IP'si sistem günlüklerine yazılır ve ilgili günlük dosyası analiz için indirilebilir.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Günlük Örneği:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Yapılandırma Önerileri

### Kara Liste Modu Önerileri

- Bilinen kötü amaçlı IP adreslerini ekleyerek potansiyel ağ saldırılarını önleyin.
- Kara listeyi düzenli olarak kontrol edin ve güncelleyin; geçersiz veya artık engellenmesi gerekmeyen IP adreslerini kaldırın.

### Beyaz Liste Modu Önerileri

- Güvenilir dahili ağ IP adreslerini (örneğin ofis ağ segmentleri gibi) ekleyerek çekirdek sistemlere güvenli erişimi sağlayın.
- Erişim kesintilerini önlemek için beyaz listeye dinamik olarak atanmış IP adreslerini dahil etmekten kaçının.

### Genel Öneriler

- Yapılandırmayı basitleştirmek için CIDR ağ segmentlerini kullanın; örneğin, tek tek IP adresleri eklemek yerine 192.168.0.0/24 kullanabilirsiniz.
- Yanlış işlemler veya sistem arızaları durumunda hızlıca kurtarmak için IP listesi yapılandırmalarını düzenli olarak yedekleyin.
- Erişim günlüklerini düzenli olarak izleyerek anormal IP'leri tespit edin ve kara veya beyaz listeyi zamanında ayarlayın.