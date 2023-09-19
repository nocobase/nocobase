[English](./README.md) | [中文](./README.zh-CN.md) | Türkçe

![](https://nocobase.oss-cn-beijing.aliyuncs.com/bbcedd403d31cd1ccc4e9709581f5c2f.png)  

**Note:** 📌

NocoBase, geliştirmenin ilk aşamasındadır ve sık sık değişiklik yaparak geliştiriyoruz. Lütfen üretim ortamlarında dikkatli olun.

NocoBase v0.10 has been released, see [v0.10: update instructions](http://docs.nocobase.com/welcome/release/v10-changelog) for details.

## Recent major updates

- [v0.13: New application status flow - 2023/08/24](https://docs.nocobase.com/welcome/release/v13-changelog)
- [v0.12: New plugin build tool - 2023/08/01](https://docs.nocobase.com/welcome/release/v12-changelog)
- [v0.11: New client application, plugin and router - 2023/07/08](http://docs.nocobase.com/welcome/release/v11-changelog)
- [v0.10: Update instructions - 2023/06/23](http://docs.nocobase.com/welcome/release/v10-changelog)

## Çalışma arkadaşımız olabilirsiniz

Takıma katılacak tam zamanlı, uzaktan ürün tasarımı ve geliştirme arkadaşları arıyoruz. NocoBase'e güçlü bir ilginiz varsa, lütfen bize hello@nocobase.com adresinden e-posta göndermekten çekinmeyin.

## NocoBase Nedir?

NocoBase, ölçeklenebilirlik öncelikli, açık kaynaklı, kod yazmadan geliştirme yapabileceğiniz bir platformudur. Programlama gerekmez, dakikalar içinde NocoBase ile kendi yönetim sisteminizi oluşturun.

Anasayfa:  
https://www.nocobase.com/  

Canlı Test:  
https://demo.nocobase.com/new

Dökümanlar:  
https://docs.nocobase.com/


İletişim:  
hello@nocobase.com

## NocoBase kimin içindir

Aşağıdaki ihtiyaçlarınız varsa NocoBase sizin için tasarlanmıştır.

- Bir iç yönetim sistemi geliştirmek istiyorsanız
- Kodsuz geliştirme ile iş ihtiyaçlarınızın çoğunu karşılamak istiyorsanız
- Kodsuz geliştirme, geliştirici olmayanlar için yeterince basittir; yerel gelişime yakın olacak kadar esnek
- Sisteminizi kolay bir şekilde sürekli geliştirebilirsiniz
- Tam kod ve veri kontrolü ile özel dağıtım
- Ücretsiz kullanabilirsiniz veya daha fazla teknik destek için ödeme yapabilirsiniz

## NocoBase neden farklıdır?

### 1. Ayrı "veri yapısı" ve "kullanıcı arayüzü"

Çoğu kodsuz(nocode) uygulamalar form, tablo veya süreç odaklıdır. bir tabloya yeni bir sütun eklemenin yeni bir alan eklemek anlamına geldiği Airtable gibi doğrudan kullanıcı arabiriminde veri yapıları oluşturur. Bu, kullanım kolaylığı avantajına sahiptir fakat daha karmaşık senaryoların ihtiyaçlarını karşılamak için sınırlı işlevsellik ve esneklik dezavantajına sahiptir.

NocoBase, veri yapısını kullanıcı arayüzünden ayırma tasarım fikrini benimser ve her blokta farklı tür, stil, içerik ve eylemlerle veri koleksiyonları için istediğiniz sayıda blok (veri görünümü) oluşturmanıza olanak tanır. Bu yapısal durum kodsuz işlemin basitliğini ve aynı zamanda yerel geliştirme gibi esnekliği de hesaba katar.

![2.collection-block.png](https://nocobase.oss-cn-beijing.aliyuncs.com/25506f38365436d11847b32fc8533bc9.png)

### 2. ne görüyorsanız onu alırsınız

NocoBase, karmaşık ve farklı iş sistemlerinin geliştirilmesine olanak tanır, ancak bu karmaşık ve özel operasyonların gerekli olduğu anlamına gelmez. Tek bir tıklama ile kullanım arayüzünde yapılandırma seçenekleri görüntülenebilir. Bu da sistem yapılandırma haklarına sahip yöneticilerin kullanıcı arayüzünü doğrudan WYSIWYG işlemleri ile yapılandırılabileceği anlamına gelir.

![2.user-root.gif](https://nocobase.oss-cn-beijing.aliyuncs.com/7991441ff35f05c49e0d72c2a23fa33b.gif)

### 3. Her şey bir eklenti

NocoBase eklenti mimarisini benimser, tüm yeni özellikler eklentiler geliştirip yükleyerek uygulanabilir. Gelecekte, işlevselliği genişletmenin telefonunuza bir uygulama yüklemek kadar kolay olduğu bir eklenti pazarı oluşturacağız.

![](https://www.nocobase.com/images/NocoBaseMindMapLite.png)

[Tam resmi görmek için tıklayın](https://www.nocobase.com/images/NocoBaseMindMap.png)

## Kurulum

NocoBase üç kurulum modelini destekler:

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/docker-compose">Docker kurulumu (👍Tavsiye edilen)</a>

  Kodsuz senaryolar için uygundur, yazılacak kod yoktur. Yükseltme yaparken, sadece en son görüntüyü indirin ve yeniden başlatın.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/create-nocobase-app">create-nocobase-app CLI ile kurulum</a>

  Projenin iş kodu tamamen bağımsızdır ve düşük kod geliştirmeyi destekler.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/git-clone">Git kaynak kodlarından derleme</a>

  Yayınlanmamış en son sürümü deneyimlemek veya katkıda bulunmak istiyorsanız, kaynak kodunda değişiklik yapmanız ve hata ayıklamanız gerekiyorsa, yüksek düzeyde geliştirme becerisi gerektiren bu kurulum yöntemini seçmeniz önerilir. Eğer kodlar güncellendiyse git pull ile son sürümü çekebilirsiniz.

## License

- [Core packages](https://github.com/nocobase/nocobase/tree/main/packages/core) are [Apache 2.0 licensed](./LICENSE-APACHE-2.0).
- [Plugins packages](https://github.com/nocobase/nocobase/tree/main/packages/plugins) are [AGPL 3.0 licensed](./LICENSE-AGPL).
