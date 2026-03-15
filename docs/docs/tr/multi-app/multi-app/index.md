---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/multi-app/multi-app/index) bakın.
:::

# Çoklu Uygulama Yönetimi

## İşlevsel Genel Bakış

Çoklu uygulama yönetimi, bir veya daha fazla çalışma ortamında fiziksel olarak izole edilmiş birden fazla NocoBase uygulama örneği oluşturmak ve yönetmek için NocoBase tarafından sunulan birleşik bir uygulama yönetimi çözümüdür. Uygulama denetleyicisi (AppSupervisor) aracılığıyla kullanıcılar, farklı iş ve ölçek aşamalarının ihtiyaçlarını karşılamak için tek bir giriş noktasından birden fazla uygulama oluşturabilir ve sürdürebilirler.

## Tek Uygulama

Projenin başlangıç aşamasında çoğu kullanıcı tek bir uygulama ile başlar.

Bu modda, sistemin yalnızca bir NocoBase örneği dağıtması gerekir ve tüm iş işlevleri, veriler ve kullanıcılar aynı uygulama içinde çalışır. Dağıtımı basittir, yapılandırma maliyeti düşüktür; prototip doğrulama, küçük projeler veya dahili araçlar için çok uygundur.

Ancak işler giderek karmaşıklaştıkça, tek bir uygulama bazı doğal sınırlamalarla karşılaşır:

- İşlevler sürekli eklenir ve sistem hantallaşır
- Farklı iş birimleri arasında izolasyon sağlamak zordur
- Uygulamanın genişletme ve bakım maliyetleri artmaya devam eder

Bu noktada kullanıcılar, sistemin sürdürülebilirliğini ve ölçeklenebilirliğini artırmak için farklı iş kollarını birden fazla uygulamaya bölmek isteyeceklerdir.

## Paylaşımlı Bellek Çoklu Uygulama

Kullanıcılar işlerini bölmek istediklerinde ancak karmaşık dağıtım ve işletim mimarileri getirmek istemediklerinde, paylaşımlı bellek çoklu uygulama moduna yükseltebilirler.

Bu modda, bir NocoBase örneği içinde aynı anda birden fazla uygulama çalışabilir. Her uygulama bağımsızdır, bağımsız veritabanlarına bağlanabilir, ayrı ayrı oluşturulabilir, başlatılabilir ve durdurulabilir; ancak aynı süreci ve bellek alanını paylaşırlar, bu nedenle kullanıcıların hala yalnızca bir NocoBase örneği yönetmesi gerekir.

![](https://static-docs.nocobase.com/202512231055907.png)

Bu yöntem belirgin iyileştirmeler sağlar:

- İşler uygulama boyutuna göre bölünebilir
- Uygulamalar arasındaki işlevler ve yapılandırmalar daha nettir
- Çoklu süreç veya çoklu konteyner çözümlerine kıyasla kaynak kullanımı daha düşüktür

Ancak, tüm uygulamalar aynı süreçte çalıştığı için CPU ve bellek gibi kaynakları paylaşırlar; tek bir uygulamanın anomali göstermesi veya yüksek yük altında olması, diğer uygulamaların kararlılığını etkileyebilir.

Uygulama sayısı artmaya devam ettiğinde veya izolasyon ve kararlılık için daha yüksek gereksinimler ortaya çıktığında, mimarinin daha da yükseltilmesi gerekir.

## Çok Ortamlı Hibrit Dağıtım

İş ölçeği ve karmaşıklığı belirli bir seviyeye ulaştığında ve uygulama sayısının ölçekli bir şekilde genişletilmesi gerektiğinde, paylaşımlı bellek çoklu uygulama modu kaynak çekişmesi, kararlılık ve güvenlik gibi zorluklarla karşılaşacaktır. Ölçeklendirme aşamasında kullanıcılar, daha karmaşık iş senaryolarını desteklemek için çok ortamlı hibrit dağıtım yöntemini benimsemeyi düşünebilirler.

Bu mimarinin çekirdeği, bir giriş uygulaması (yani birleşik bir yönetim merkezi olarak bir NocoBase dağıtmak) ve aynı zamanda iş uygulamalarını fiilen çalıştırmak için uygulama çalışma ortamları olarak birden fazla NocoBase dağıtmaktır.

Giriş uygulaması şunlardan sorumludur:

- Uygulama oluşturma, yapılandırma ve yaşam döngüsü yönetimi
- Yönetim komutlarının gönderilmesi ve durum özeti

Örnek uygulama ortamı şunlardan sorumludur:

- Paylaşımlı bellek çoklu uygulama modu aracılığıyla iş uygulamalarını fiilen barındırmak ve çalıştırmak

Kullanıcılar için, birden fazla uygulama hala tek bir giriş noktasından oluşturulabilir ve yönetilebilir, ancak dahili olarak:

- Farklı uygulamalar farklı düğümlerde veya kümelerde çalışabilir
- Her uygulama bağımsız veritabanları ve ara katman yazılımları kullanabilir
- Yüksek yüklü uygulamalar ihtiyaca göre genişletilebilir veya izole edilebilir

![](https://static-docs.nocobase.com/202512231215186.png)

Bu yöntem, esnekliği sağlarken sistemin kararlılığını ve işletilebilirliğini de artıran SaaS platformları, çok sayıda demo ortamı veya çok kiracılı senaryolar için uygundur.