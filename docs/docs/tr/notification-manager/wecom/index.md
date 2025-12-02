---
pkg: '@nocobase/plugin-auth-wecom'
---

:::tip AI Çeviri Uyarısı
Bu dokümantasyon yapay zeka tarafından otomatik olarak çevrilmiştir.
:::



# Bildirim: WeCom

## Giriş

**WeCom** eklentisi, uygulamanın WeCom kullanıcılarına bildirim mesajları göndermesini sağlar.

## WeCom Kimlik Doğrulayıcıyı Ekleme ve Yapılandırma

Öncelikle NocoBase üzerinde bir WeCom kimlik doğrulayıcı eklemeniz ve yapılandırmanız gerekir. Bunun için [Kullanıcı Kimlik Doğrulaması - WeCom](/auth-verification/auth-wecom) bölümüne bakabilirsiniz. Yalnızca WeCom aracılığıyla giriş yapmış sistem kullanıcıları, sistem bildirimlerini WeCom üzerinden alabilir.

## WeCom Bildirim Kanalı Ekleme

![](https://static-docs.nocobase.com/202412041522365.png)

## WeCom Bildirim Kanalını Yapılandırma

Az önce yapılandırdığınız kimlik doğrulayıcıyı seçin.

![](https://static-docs.nocobase.com/202412041525284.png)

## İş Akışı Bildirim Düğümü Yapılandırması

Yapılandırılmış WeCom bildirim kanalını seçin. Üç farklı mesaj türünü destekler: Metin Kartı, Markdown ve Şablon Kartı.

![](https://static-docs.nocobase.com/202412041529319.png)