---
pkg: "@nocobase/plugin-wecom"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# WeChat Work'ten Kullanıcı Verilerini Senkronize Etme

## Giriş

**WeChat Work** eklentisi, kullanıcı ve departman verilerini WeChat Work'ten senkronize etmenizi sağlar.

## Özel Bir WeChat Work Uygulaması Oluşturma ve Yapılandırma

Öncelikle, WeChat Work yönetim konsolunda özel bir uygulama oluşturmanız ve **Kurumsal Kimlik (Corp ID)**, **AgentId** ve **Gizli Anahtar (Secret)** bilgilerini almanız gerekir.

[Kullanıcı Kimlik Doğrulaması - WeChat Work](/auth-verification/auth-wecom/) bölümüne bakabilirsiniz.

## NocoBase'e Bir Senkronizasyon Veri Kaynağı Ekleme

Kullanıcılar ve İzinler - Senkronizasyon - Ekle yolunu izleyerek, edindiğiniz ilgili bilgileri doldurun.

![](https://static-docs.nocobase.com/202412041251867.png)

## Kişi Senkronizasyonunu Yapılandırma

WeChat Work yönetim konsolunda Güvenlik ve Yönetim - Yönetim Araçları bölümüne gidin ve Kişi Senkronizasyonu'na tıklayın.

![](https://static-docs.nocobase.com/202412041249958.png)

Şekilde gösterildiği gibi yapılandırın ve kuruluşun güvenilir IP adresini ayarlayın.

![](https://static-docs.nocobase.com/202412041250776.png)

Artık kullanıcı verisi senkronizasyonuna devam edebilirsiniz.

## Olay Alma Sunucusunu Kurma

WeChat Work tarafındaki kullanıcı ve departman verilerindeki değişikliklerin NocoBase uygulamasına zamanında senkronize edilmesini istiyorsanız, ek ayarlar yapabilirsiniz.

Önceki yapılandırma bilgilerini doldurduktan sonra, kişi geri çağırma bildirim URL'sini kopyalayabilirsiniz.

![](https://static-docs.nocobase.com/202412041256547.png)

Bu URL'yi WeChat Work ayarlarına yapıştırın, Token ve EncodingAESKey'i alın ve NocoBase kullanıcı senkronizasyon veri kaynağı yapılandırmasını tamamlayın.

![](https://static-docs.nocobase.com/202412041257947.png)