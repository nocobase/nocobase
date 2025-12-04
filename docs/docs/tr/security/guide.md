:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# NocoBase Güvenlik Rehberi

NocoBase, işlevsel tasarımından sistem uygulamasına kadar veri ve uygulama güvenliğine büyük önem verir. Platform, kullanıcı kimlik doğrulaması, erişim kontrolü ve veri şifreleme gibi birçok yerleşik güvenlik özelliği sunar. Ayrıca, gerçek ihtiyaçlarınıza göre güvenlik politikalarını esnek bir şekilde yapılandırmanıza olanak tanır. Kullanıcı verilerini korumaktan, erişim izinlerini yönetmeye veya geliştirme ve üretim ortamlarını birbirinden ayırmaya kadar NocoBase, pratik araçlar ve çözümler sağlar. Bu rehber, NocoBase'i güvenli bir şekilde kullanmanız için size yol göstermeyi, verilerinizin, uygulamalarınızın ve ortamınızın güvenliğini korumanıza yardımcı olmayı ve güvenliğinizi sağlarken sistem özelliklerini verimli bir şekilde kullanmanızı amaçlamaktadır.

## Kullanıcı Kimlik Doğrulaması

Kullanıcı kimlik doğrulaması, kullanıcı kimliklerini tanımak, yetkisiz kullanıcıların sisteme erişimini engellemek ve kullanıcı kimliklerinin kötüye kullanılmamasını sağlamak için kullanılır.

### Token Anahtarı

Varsayılan olarak, NocoBase sunucu tarafı API'leri için kimlik doğrulaması yapmak üzere JWT (JSON Web Token) kullanır. Token anahtarını sistem ortam değişkeni `APP_KEY` aracılığıyla ayarlayabilirsiniz. Uygulamanızın Token anahtarını dışarıya sızmasını önlemek için lütfen dikkatli bir şekilde yönetin. `APP_KEY` değiştirilirse, eski Token'ların da geçersiz hale geleceğini unutmayın.

### Token Politikası

NocoBase, kullanıcı Token'ları için aşağıdaki güvenlik politikalarını ayarlamanıza olanak tanır:

| Yapılandırma Öğesi          | Açıklama                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oturum Geçerlilik Süresi    | Her kullanıcı girişinin maksimum geçerlilik süresi. Oturum geçerlilik süresi boyunca Token otomatik olarak güncellenir. Süre dolduktan sonra kullanıcının tekrar giriş yapması istenir.                                                                                                                                                       |
| Token Geçerlilik Süresi     | Her verilen API Token'ının geçerlilik süresi. Token süresi dolduktan sonra, eğer oturum geçerlilik süresi içindeyse ve yenileme süresi aşılmamışsa, sunucu kullanıcı oturumunu sürdürmek için otomatik olarak yeni bir Token verir; aksi takdirde kullanıcının tekrar giriş yapması istenir. (Her Token yalnızca bir kez yenilenebilir) |
| Süresi Dolan Token Yenileme Limiti | Token süresi dolduktan sonra yenilemeye izin verilen maksimum süre.                                                                                                                                                                                                                                                          |

Genellikle, yöneticilere şunları öneririz:

- Token'ın maruz kalma süresini sınırlamak için daha kısa bir Token geçerlilik süresi belirleyin.
- Kullanıcı deneyimi ve güvenlik arasında bir denge kurmak için Token geçerlilik süresinden daha uzun, ancak çok da uzun olmayan makul bir oturum geçerlilik süresi belirleyin. Aktif kullanıcı oturumlarının kesintiye uğramamasını sağlamak ve uzun süreli oturumların kötüye kullanılma riskini azaltmak için otomatik Token yenileme mekanizmasını kullanın.
- Kullanıcı uzun süre etkin olmadığında yeni bir Token verilmeden Token'ın doğal olarak süresinin dolmasını sağlayacak makul bir süresi dolan Token yenileme limiti belirleyin. Bu, boşta kalan kullanıcı oturumlarının kötüye kullanılma riskini azaltır.

### Token İstemci Depolaması

Varsayılan olarak, kullanıcı Token'ları tarayıcının LocalStorage'ında saklanır. Tarayıcı sayfasını kapatıp tekrar açtığınızda, Token hala geçerliyse, kullanıcının tekrar giriş yapmasına gerek kalmaz.

Kullanıcıların sayfaya her girdiklerinde tekrar giriş yapmalarını istiyorsanız, `API_CLIENT_STORAGE_TYPE=sessionStorage` ortam değişkenini ayarlayarak kullanıcı Token'ını tarayıcının SessionStorage'ına kaydedebilirsiniz. Bu sayede kullanıcılar sayfayı her açtıklarında tekrar giriş yapmış olurlar.

### Parola Politikası

> Profesyonel Sürüm ve üzeri

NocoBase, parola ile girişin etkin olduğu NocoBase uygulamalarının güvenliğini artırmak için tüm kullanıcılar için parola kuralları ve parola giriş denemesi kilitleme politikaları belirlemenizi destekler. Her bir yapılandırma öğesini anlamak için [Parola Politikası](./password-policy/index.md) bölümüne başvurabilirsiniz.

#### Parola Kuralları

| Yapılandırma Öğesi                     | Açıklama                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Parola Uzunluğu**                    | Parolanın minimum uzunluk gereksinimi, maksimum uzunluk 64'tür.                                                 |
| **Parola Karmaşıklığı**                | Parolanın karmaşıklık gereksinimlerini, yani içermesi gereken karakter türlerini belirleyin.                   |
| **Parolada Kullanıcı Adı Bulunamaz** | Parolanın mevcut kullanıcının kullanıcı adını içerip içeremeyeceğini belirleyin.                                                  |
| **Parola Geçmişini Hatırla**          | Kullanıcının son kullandığı parola sayısını hatırlar. Kullanıcı parola değiştirirken bunları tekrar kullanamaz. |

#### Parola Süresi Dolma Yapılandırması

| Yapılandırma Öğesi                                    | Açıklama                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Parola Geçerlilik Süresi**                          | Kullanıcı parolalarının geçerlilik süresi. Kullanıcıların geçerlilik süresinin yeniden hesaplanması için parolalarını süresi dolmadan önce değiştirmeleri gerekir. Süresi dolmadan önce parola değiştirilmezse, eski parola ile giriş yapılamaz ve yöneticinin sıfırlama konusunda yardımcı olması gerekir. <br>Başka giriş yöntemleri yapılandırılmışsa, kullanıcı diğer yöntemleri kullanarak giriş yapabilir. |
| **Parola Süresi Dolma Hatırlatma Bildirim Kanalı** | Kullanıcının parolasının süresi dolmadan önceki 10 gün içinde, kullanıcı her giriş yaptığında bir hatırlatma gönderilir.                                                                                                                                                                                                                                                            |

#### Parola Giriş Güvenliği

| Yapılandırma Öğesi                                         | Açıklama                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maksimum Geçersiz Parola Giriş Denemesi**                | Bir kullanıcının belirli bir zaman aralığında deneyebileceği maksimum giriş denemesi sayısını belirleyin.                                                                                                                                                                 |
| **Maksimum Geçersiz Parola Giriş Zaman Aralığı (saniye)** | Kullanıcının maksimum geçersiz giriş denemesi sayısını hesaplamak için zaman aralığını saniye cinsinden belirleyin.                                                                                                                                                              |
| **Kilitleme Süresi (saniye)**                                    | Kullanıcı geçersiz parola giriş limitini aştıktan sonra kullanıcının kilitli kalacağı süreyi belirleyin (0 sınırsız anlamına gelir). <br>Kullanıcı kilitliyken, API anahtarları da dahil olmak üzere hiçbir kimlik doğrulama yöntemiyle sisteme erişim yasaklanacaktır. |

Genellikle, şunları öneririz:

- Parolaların ilişkisel tahmin veya kaba kuvvet saldırılarıyla kırılma riskini azaltmak için güçlü parola kuralları belirleyin.
- Kullanıcıları parolalarını düzenli olarak değiştirmeye zorlamak için makul bir parola geçerlilik süresi belirleyin.
- Kısa sürede sık yapılan parola giriş denemelerini sınırlamak ve kaba kuvvet parola kırma eylemlerini önlemek için geçersiz parola giriş sayısı ve zaman yapılandırmasını birleştirin.
- Güvenlik gereksinimlerinin daha katı olduğu senaryolarda, giriş limitini aştıktan sonra kullanıcıyı kilitlemek için makul bir süre belirleyebilirsiniz. Ancak, kilitleme süresi ayarının kötüye kullanılabileceğini unutmayın. Saldırganlar, hedef hesaplara kasıtlı olarak birden çok kez yanlış parola girerek hesabın kilitlenmesine ve normal şekilde kullanılamamasına neden olabilir. Gerçek kullanımda, bu tür saldırıları önlemek için IP kısıtlamaları, API frekans kısıtlamaları gibi yöntemleri birleştirebilirsiniz.
- Kötüye kullanımı önlemek için NocoBase'in varsayılan root kullanıcı adını, e-postasını ve parolasını değiştirin.
- Parola süresinin dolması veya hesabın kilitlenmesi durumunda, yönetici hesapları da dahil olmak üzere sisteme erişim mümkün olmayacağından, sistemde parolaları sıfırlama ve kullanıcıların kilidini açma yetkisine sahip birden fazla hesap oluşturmanız önerilir.

![](https://static-docs.nocobase.com/202501031618900.png)

### Kullanıcı Kilitleme

> Profesyonel Sürüm ve üzeri, parola politikası eklentisine dahildir

Geçersiz parola giriş limitini aştığı için kilitlenen kullanıcıları yönetin. Onları aktif olarak kilidini açabilir veya anormal kullanıcıları aktif olarak kilitleme listesine ekleyebilirsiniz. Bir kullanıcı kilitlendiğinde, API anahtarları da dahil olmak üzere hiçbir kimlik doğrulama yöntemiyle sisteme erişimi yasaklanacaktır.

![](https://static-docs.nocobase.com/202501031618399.png)

### API Anahtarları

NocoBase, sistem API'lerini API anahtarları aracılığıyla çağırmayı destekler. API anahtarlarını API Anahtarları eklenti yapılandırmasına ekleyebilirsiniz.

- Lütfen API anahtarına doğru rolü atayın ve rolle ilişkili izinlerin doğru şekilde yapılandırıldığından emin olun.
- API anahtarlarını kullanırken dışarıya sızmasını önleyin.
- Genellikle, API anahtarları için bir geçerlilik süresi belirlemenizi ve "Asla Süresi Dolmaz" seçeneğini kullanmamanızı öneririz.
- Bir API anahtarının anormal şekilde kullanıldığını ve sızıntı riski taşıdığını fark ederseniz, ilgili API anahtarını silerek onu geçersiz kılabilirsiniz.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Tek Oturum Açma (Single Sign-On - SSO)

> Ticari eklenti

NocoBase, OIDC, SAML 2.0, LDAP ve CAS gibi birçok ana akım protokolü destekleyen zengin bir SSO kimlik doğrulama eklentileri yelpazesi sunar. Aynı zamanda, NocoBase, diğer kimlik doğrulama türlerinin hızlı bir şekilde geliştirilmesini ve entegrasyonunu destekleyebilecek eksiksiz kimlik doğrulama yöntemi genişletme arayüzlerine sahiptir. Mevcut IdP'nizi NocoBase ile kolayca entegre edebilir, kullanıcı kimliklerini IdP üzerinde merkezi olarak yöneterek güvenliği artırabilirsiniz.
![](https://static-docs.nocobase.com/202501031619427.png)

### İki Faktörlü Kimlik Doğrulama

> Kurumsal Sürüm

İki faktörlü kimlik doğrulama, kullanıcıların parola ile giriş yaparken kimliklerini kanıtlamak için ikinci bir geçerli bilgi sağlamalarını gerektirir. Örneğin, kullanıcının güvenilir cihazına tek kullanımlık dinamik bir doğrulama kodu göndererek kullanıcı kimliğini doğrular, böylece kullanıcı kimliğinin kötüye kullanılmamasını sağlar ve parola sızıntısı riskini azaltır.

### IP Erişim Kontrolü

> Kurumsal Sürüm

NocoBase, kullanıcı erişim IP'leri için kara listeler veya beyaz listeler belirlemenizi destekler.

- Güvenlik gereksinimlerinin katı olduğu ortamlarda, yalnızca belirli IP'lerin veya IP aralıklarının sisteme erişmesine izin vermek için bir IP beyaz listesi ayarlayabilirsiniz. Bu, yetkisiz dış ağ bağlantılarını kısıtlar ve güvenlik risklerini kaynağında azaltır.
- Genel ağ erişim koşullarında, yönetici anormal erişim tespit ederse, bilinen kötü niyetli IP adreslerini veya şüpheli kaynaklardan gelen erişimleri engellemek için bir IP kara listesi ayarlayabilir. Bu, kötü niyetli taramalar ve kaba kuvvet saldırıları gibi güvenlik tehditlerini azaltır.
- Reddedilen erişim istekleri için günlük kayıtları tutulur.

## İzin Kontrolü

Sistemde farklı roller belirleyerek ve bu rollere uygun izinler atayarak, kullanıcıların kaynaklara erişim yetkilerini ayrıntılı bir şekilde kontrol edebilirsiniz. Yöneticilerin, sistem kaynaklarının sızma riskini azaltmak için gerçek senaryo ihtiyaçlarına göre makul bir yapılandırma yapması gerekir.

### Root Kullanıcısı

NocoBase ilk kurulduğunda, uygulama bir root kullanıcısı başlatır. Kötüye kullanımı önlemek için root kullanıcısının ilgili bilgilerini sistem ortam değişkenlerini ayarlayarak değiştirmeniz önerilir.

- `INIT_ROOT_USERNAME` - root kullanıcı adı
- `INIT_ROOT_EMAIL` - root kullanıcı e-postası
- `INIT_ROOT_PASSWORD` - root kullanıcı parolası, lütfen güçlü bir parola belirleyin.

Sistemi daha sonraki kullanımlarınızda, başka yönetici hesapları oluşturup kullanmanız ve uygulamayı doğrudan root kullanıcısıyla çalıştırmaktan kaçınmanız önerilir.

### Roller ve İzinler

NocoBase, sistemde roller belirleyerek, farklı rollere yetki vererek ve kullanıcıları ilgili rollere bağlayarak kullanıcıların kaynaklara erişim izinlerini kontrol eder. Her kullanıcı birden fazla role sahip olabilir ve kullanıcılar rolleri değiştirerek kaynakları farklı perspektiflerden yönetebilirler. Eğer departman eklentisi kuruluysa, rolleri departmanlarla da bağlayabilir, böylece kullanıcılar ait oldukları departmanlara atanmış rollere sahip olabilirler.

![](https://static-docs.nocobase.com/202501031620965.png)

### Sistem Yapılandırma İzinleri

Sistem yapılandırma izinleri aşağıdaki ayarları içerir:

- Yapılandırma arayüzüne izin verilip verilmediği
- eklenti kurmaya, etkinleştirmeye ve devre dışı bırakmaya izin verilip verilmediği
- eklenti yapılandırmaya izin verilip verilmediği
- Önbelleği temizlemeye ve uygulamayı yeniden başlatmaya izin verilip verilmediği
- Her bir eklentinin yapılandırma izinleri

### Menü İzinleri

Menü izinleri, kullanıcıların masaüstü ve mobil dahil olmak üzere farklı menü sayfalarına erişim yetkisini kontrol etmek için kullanılır.
![](https://static-docs.nocobase.com/202501031620717.png)

### Veri İzinleri

NocoBase, kullanıcıların sistemdeki verilere erişim izinleri üzerinde ayrıntılı kontrol sağlayarak, farklı kullanıcıların yalnızca kendi sorumluluklarıyla ilgili verilere erişebilmesini ve yetki aşımı ile veri sızıntısını önler.

#### Global Kontrol

![](https://static-docs.nocobase.com/202501031620866.png)

#### Tablo Düzeyi, Alan Düzeyi Kontrol

![](https://static-docs.nocobase.com/202501031621047.png)

#### Veri Kapsamı Kontrolü

Kullanıcıların üzerinde işlem yapabileceği veri kapsamını belirleyin. Buradaki veri kapsamının, blokta yapılandırılan veri kapsamından farklı olduğunu unutmayın. Blokta yapılandırılan veri kapsamı genellikle yalnızca ön uç veri filtrelemesi için kullanılır. Kullanıcıların veri kaynaklarına erişim izinlerini kesin olarak kontrol etmeniz gerekiyorsa, bu yapılandırmanın sunucu tarafından kontrol edilecek şekilde burada yapılması gerekir.

![](https://static-docs.nocobase.com/202501031621712.png)

## Veri Güvenliği

NocoBase, veri depolama ve yedekleme süreçlerinde veri güvenliğini sağlamak için etkili mekanizmalar sunar.

### Parola Depolama

NocoBase kullanıcı parolaları, büyük ölçekli donanım saldırılarına karşı etkili bir şekilde direnebilen scrypt algoritması kullanılarak şifrelenir ve saklanır.

### Ortam Değişkenleri ve Anahtarlar

NocoBase'de üçüncü taraf hizmetleri kullanırken, üçüncü taraf anahtar bilgilerini ortam değişkenlerine yapılandırmanızı ve şifreli olarak saklamanızı öneririz. Bu, farklı yerlerde yapılandırma ve kullanım kolaylığı sağlarken aynı zamanda güvenliği de artırır. Ayrıntılı kullanım yöntemleri için belgelere başvurabilirsiniz.

:::warning
Varsayılan olarak, anahtar AES-256-CBC algoritması kullanılarak şifrelenir. NocoBase, otomatik olarak 32 bitlik bir şifreleme anahtarı oluşturur ve bunu `storage/.data/environment/aes_key.dat` konumuna kaydeder. Kullanıcılar, anahtar dosyasının çalınmasını önlemek için dosyayı düzgün bir şekilde saklamalıdır. Veri taşımanız gerekiyorsa, anahtar dosyasının da birlikte taşınması gerekir.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Dosya Depolama

Hassas dosyaları depolamanız gerekiyorsa, S3 protokolüyle uyumlu bir bulut depolama hizmeti kullanmanız ve dosyaların özel olarak okunup yazılmasını sağlamak için ticari eklenti olan File storage: S3 (Pro) ile birlikte kullanmanız önerilir. Dahili ağ ortamında kullanmanız gerekiyorsa, MinIO gibi özel dağıtımı destekleyen ve S3 protokolüyle uyumlu depolama uygulamalarını kullanmanız tavsiye edilir.

![](https://static-docs.nocobase.com/202501031623549.png)

### Uygulama Yedeklemesi

Uygulama verilerinin güvenliğini sağlamak ve veri kaybını önlemek için veritabanını düzenli olarak yedeklemenizi öneririz.

Açık kaynak sürüm kullanıcıları, veritabanı araçlarını kullanarak yedekleme yapmak için https://www.nocobase.com/en/blog/nocobase-backup-restore adresine başvurabilirler. Ayrıca, veri sızıntısını önlemek için yedekleme dosyalarını düzgün bir şekilde saklamanızı öneririz.

Profesyonel ve üzeri sürümlerin kullanıcıları yedekleme yöneticisini kullanarak yedekleme yapabilirler. Yedekleme yöneticisi aşağıdaki özellikleri sunar:

- Zamanlanmış otomatik yedekleme: Periyodik otomatik yedeklemeler zaman ve manuel işlemleri azaltır, veri güvenliğini daha da artırır.
- Yedekleme dosyalarını bulut depolamaya senkronize etme: Yedekleme dosyalarını uygulama hizmetinin kendisinden ayırarak, sunucu arızası nedeniyle hizmetin kullanılamaz hale gelmesi durumunda yedekleme dosyalarının kaybolmasını önler.
- Yedekleme dosyası şifrelemesi: Yedekleme dosyalarına parola belirleyerek, yedekleme dosyası sızıntısı nedeniyle veri sızıntısı riskini azaltır.

![](https://static-docs.nocobase.com/202501031623107.png)

## Çalışma Ortamı Güvenliği

NocoBase'i doğru bir şekilde dağıtmak ve çalışma ortamının güvenliğini sağlamak, NocoBase uygulamalarının güvenliğini temin etmenin anahtarlarından biridir.

### HTTPS Dağıtımı

Ortadaki adam saldırılarını önlemek için, NocoBase uygulama sitenize bir SSL/TLS sertifikası eklemenizi öneririz. Bu, verilerin ağ üzerinden iletimi sırasında güvenliğini sağlar.

### API İletim Şifrelemesi

> Kurumsal Sürüm

Daha katı veri güvenliği gereksinimleri olan ortamlarda, NocoBase API iletim şifrelemesini etkinleştirmeyi destekler. Bu, API istek ve yanıt içeriklerini şifreleyerek açık metin iletimini önler ve veri kırma eşiğini yükseltir.

### Özel Dağıtım

Varsayılan olarak, NocoBase'in üçüncü taraf hizmetlerle iletişim kurmasına gerek yoktur ve NocoBase ekibi hiçbir kullanıcı bilgisi toplamaz. Yalnızca aşağıdaki iki işlemi gerçekleştirirken NocoBase sunucusuna bağlanmak gerekir:

1. NocoBase Hizmet platformu aracılığıyla ticari eklentileri otomatik olarak indirme.
2. Ticari sürüm uygulamaları için çevrimiçi kimlik doğrulama ve etkinleştirme.

Belirli bir kolaylıktan feragat etmeye istekliyseniz, bu iki işlem de çevrimdışı olarak tamamlanabilir ve doğrudan NocoBase sunucusuna bağlanmayı gerektirmez.

NocoBase, tamamen dahili ağ dağıtımını destekler, bkz:

- https://www.nocobase.com/en/blog/load-docker-image
- [eklentileri yüklemek ve yükseltmek için eklenti dizinine yükleyin](/get-started/install-upgrade-plugins#third-party-plugins)

### Çoklu Ortam İzolasyonu

> Profesyonel Sürüm ve üzeri

Gerçek kullanımda, kurumsal kullanıcıların test ve üretim ortamlarını izole etmelerini öneririz. Bu, üretim ortamındaki uygulama verilerinin ve çalışma ortamının güvenliğini sağlar. Geçiş yönetimi eklentisi ile uygulama verileri farklı ortamlar arasında taşınabilir.

![](https://static-docs.nocobase.com/202501031627729.png)

## Denetim ve İzleme

### Denetim Günlükleri

> Kurumsal Sürüm

NocoBase'in denetim günlüğü işlevi, sistemdeki kullanıcıların etkinlik kayıtlarını tutar. Kullanıcıların önemli işlemlerini ve erişim davranışlarını kaydederek yöneticiler şunları yapabilir:

- Kullanıcıların erişim IP'si, cihazı ve işlem zamanı gibi bilgileri kontrol ederek anormal davranışları zamanında tespit edebilir.
- Sistemdeki veri kaynaklarının işlem geçmişini takip edebilir.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Uygulama Günlükleri

NocoBase, kullanıcıların sistemin çalışma durumunu ve davranış kayıtlarını anlamalarına, sistem sorunlarını zamanında tespit etmelerine ve konumlandırmalarına yardımcı olmak için çeşitli günlük türleri sunar. Bu sayede sistemin güvenliği ve kontrol edilebilirliği farklı boyutlardan sağlanır. Başlıca günlük türleri şunlardır:

- İstek günlüğü: Erişilen URL'ler, HTTP yöntemleri, istek parametreleri, yanıt süreleri ve durum kodları gibi bilgileri içeren API istek günlükleri.
- Sistem günlüğü: Hizmet başlatma, yapılandırma değişiklikleri, hata mesajları ve önemli işlemler gibi uygulama çalışma olaylarını kaydeder.
- SQL günlüğü: Veritabanı işlem ifadelerini ve bunların yürütme sürelerini kaydeder; sorgulama, güncelleme, ekleme ve silme gibi eylemleri kapsar.
- iş akışı günlüğü: iş akışının yürütme günlüğü; yürütme süresi, çalışma bilgileri ve hata bilgileri gibi detayları içerir.