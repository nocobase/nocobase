:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Vektör Veritabanı

## Giriş

Bir bilgi tabanında, vektör veritabanı vektörleştirilmiş bilgi tabanı belgelerini depolar. Vektörleştirilmiş belgeler, belgeler için bir dizin görevi görür.

Bir yapay zeka çalışanı (AI Agent) sohbetinde RAG (Retrieval-Augmented Generation) alma özelliği etkinleştirildiğinde, kullanıcının mesajı vektörleştirilir. Ardından, vektör veritabanından bilgi tabanı belgelerinin parçaları alınarak ilgili belge paragrafları ve orijinal metin eşleştirilir.

Şu anda, AI Bilgi Tabanı **eklenti**si yalnızca PGVector vektör veritabanını yerleşik olarak desteklemektedir; bu, bir PostgreSQL veritabanı **eklenti**sidir.

## Vektör Veritabanı Yönetimi

AI Çalışanı **eklenti**sinin yapılandırma sayfasına gidin, `Vector store` sekmesine tıklayın ve vektör veritabanı yönetim sayfasına erişmek için `Vector database` seçeneğini belirleyin.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Sağ üst köşedeki `Add new` (Yeni Ekle) düğmesine tıklayarak yeni bir `PGVector` vektör veritabanı bağlantısı ekleyin:

- `Name` (Ad) giriş kutusuna bağlantı adını girin;
- `Host` (Ana Bilgisayar) giriş kutusuna vektör veritabanının IP adresini girin;
- `Port` (Bağlantı Noktası) giriş kutusuna vektör veritabanının port numarasını girin;
- `Username` (Kullanıcı Adı) giriş kutusuna vektör veritabanının kullanıcı adını girin;
- `Password` (Şifre) giriş kutusuna vektör veritabanının şifresini girin;
- `Database` (Veritabanı) giriş kutusuna veritabanı adını girin;
- `Table name` (Tablo Adı) giriş kutusuna, vektör verilerini depolamak için yeni bir tablo oluştururken kullanılacak tablo adını girin;

Gerekli tüm bilgileri girdikten sonra, vektör veritabanı hizmetinin kullanılabilir olup olmadığını test etmek için `Test` (Test Et) düğmesine tıklayın ve bağlantı bilgilerini kaydetmek için `Submit` (Gönder) düğmesine tıklayın.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)