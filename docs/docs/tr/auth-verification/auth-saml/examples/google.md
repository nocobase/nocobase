:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Google Workspace

## Google'ı IdP Olarak Ayarlayın

[Google Yönetici Konsolu](https://admin.google.com/) - Uygulamalar - Web ve mobil uygulamalar

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Uygulama kurulumunu tamamladıktan sonra, **SSO URL'si**, **Varlık Kimliği (Entity ID)** ve **Sertifika** bilgilerini kopyalayın.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## NocoBase'e Yeni Bir Kimlik Doğrulayıcı Ekleme

Eklenti Ayarları - Kullanıcı Kimlik Doğrulaması - Ekle - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Kopyaladığınız bilgileri sırasıyla girin:

- SSO URL: SSO URL
- Genel Sertifika: Sertifika
- IdP Veren: Varlık Kimliği (Entity ID)
- http: Yerel olarak http ile test ediyorsanız bu seçeneği işaretleyin.

Ardından, Kullanım (Usage) bölümünden SP Veren/Varlık Kimliği (SP Issuer/EntityID) ve ACS URL'sini kopyalayın.

## Google'da SP Bilgilerini Doldurun

Google Konsolu'na geri dönün, **Hizmet Sağlayıcı Detayları** sayfasında, daha önce kopyaladığınız ACS URL'sini ve Varlık Kimliğini (Entity ID) girin ve **İmzalı Yanıt (Signed Response)** seçeneğini işaretleyin.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

**Özellik Eşleme (Attribute Mapping)** bölümünde, ilgili özellikler için eşlemeler ekleyin.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)