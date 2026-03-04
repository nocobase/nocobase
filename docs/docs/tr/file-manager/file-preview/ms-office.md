---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/file-manager/file-preview/ms-office) bakın.
:::

# Office Dosya Önizleme <Badge>v1.8.11+</Badge>

Office Dosya Önizleme eklentisi, NocoBase uygulamalarında Word, Excel ve PowerPoint gibi Office formatındaki dosyaları önizlemek için kullanılır.  
Microsoft tarafından sunulan genel bir çevrimiçi hizmete dayalıdır; bu hizmet, herkese açık bir URL üzerinden erişilebilen dosyaların bir önizleme arayüzüne yerleştirilmesini sağlayarak kullanıcıların bu dosyaları indirmeden veya bir Office uygulaması kullanmadan tarayıcıda görüntülemesine olanak tanır.

## Kullanım Kılavuzu

Varsayılan olarak eklenti **devre dışı** durumdadır. Eklenti yöneticisinde etkinleştirildikten sonra herhangi bir ek yapılandırma gerektirmeden kullanılabilir.

![Eklenti etkinleştirme arayüzü](https://static-docs.nocobase.com/20250731140048.png)

Bir koleksiyonun dosya alanına bir Office dosyası (Word / Excel / PowerPoint) başarıyla yüklendikten sonra, ilgili dosya simgesine veya bağlantısına tıklayarak dosya içeriğini açılır pencerede veya gömülü önizleme arayüzünde görüntüleyebilirsiniz.

![Önizleme işlemi örneği](https://static-docs.nocobase.com/20250731143231.png)

## Çalışma Prensibi

Bu eklenti tarafından sunulan gömülü önizleme, Microsoft'un genel çevrimiçi hizmetine (Office Web Viewer) dayanır. Temel süreç şu şekildedir:

- Ön uç, kullanıcı tarafından yüklenen dosya için herkese açık bir URL oluşturur (S3 imzalı URL'ler dahil);
- Eklenti, dosya önizlemesini bir iframe içinde aşağıdaki adresi kullanarak yükler:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<Public File URL>
  ```

- Microsoft hizmeti, bu URL'den dosya içeriğini talep eder, işler ve görüntülenebilir bir sayfa döndürür.

## Dikkat Edilmesi Gerekenler

- Bu eklenti Microsoft'un çevrimiçi hizmetine bağlı olduğundan, ağ bağlantısının normal olduğundan ve Microsoft'un ilgili hizmetlerine erişilebildiğinden emin olunmalıdır.
- Microsoft, sağladığınız dosya URL'sine erişecektir ve dosya içeriği, önizleme sayfasını oluşturmak için sunucuları tarafından kısa bir süre önbelleğe alınacaktır. Bu nedenle belirli bir gizlilik riski bulunmaktadır; bu konuda endişeleriniz varsa, bu eklenti tarafından sunulan önizleme işlevini kullanmamanız önerilir[^1].
- Önizlenecek dosyanın herkese açık bir URL olması gerekir. Normal şartlarda, NocoBase'e yüklenen dosyalar otomatik olarak erişilebilir genel bağlantılar oluşturur (S3-Pro eklentisi tarafından oluşturulan imzalı URL'ler dahil), ancak dosyanın erişim izinleri kısıtlanmışsa veya dosya bir iç ağ ortamında depolanıyorsa önizlenemez[^2].
- Bu hizmet, oturum açma kimlik doğrulamasını veya özel depolamadaki kaynakları desteklemez. Örneğin, yalnızca bir iç ağ içinden erişilebilen veya oturum açma gerektiren dosyalar bu önizleme işlevini kullanamaz.
- Dosya içeriği Microsoft hizmeti tarafından alındıktan sonra kısa bir süre önbelleğe alınabilir. Kaynak dosya silinse bile, önizleme içeriğine bir süre daha erişilebilir.
- Dosya boyutları için önerilen sınırlar vardır: Önizleme kararlılığını sağlamak için Word ve PowerPoint dosyalarının 10 MB'ı, Excel dosyalarının ise 5 MB'ı geçmemesi önerilir[^3].
- Şu anda bu hizmet için resmi ve net bir ticari kullanım lisansı açıklaması bulunmamaktadır. Lütfen kullanırken riskleri kendiniz değerlendirin[^4].

## Desteklenen Dosya Formatları

Eklenti, dosyanın MIME türüne veya dosya uzantısına bağlı olarak yalnızca aşağıdaki Office dosya formatlarının önizlemesini destekler:

- Word belgeleri:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) veya `application/msword` (`.doc`)
- Excel tabloları:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) veya `application/vnd.ms-excel` (`.xls`)
- PowerPoint sunumları:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) veya `application/vnd.ms-powerpoint` (`.ppt`)
- OpenDocument metni: `application/vnd.oasis.opendocument.text` (`.odt`)

Diğer formatlardaki dosyalar için bu eklentinin önizleme işlevi etkinleştirilmeyecektir.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)