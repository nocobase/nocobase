---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Kimlik Doğrulama: LDAP

## Giriş

Kimlik Doğrulama: LDAP eklentisi, LDAP (Lightweight Directory Access Protocol) protokol standardına uygun olarak çalışır ve kullanıcıların LDAP sunucu hesap bilgileriyle NocoBase'e giriş yapmasını sağlar.

## Eklentiyi Etkinleştirme

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## LDAP Kimlik Doğrulaması Ekleme

Kullanıcı kimlik doğrulama eklentileri yönetim sayfasına gidin.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Ekle - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Yapılandırma

### Temel Yapılandırma

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Kullanıcı mevcut değilse otomatik kaydol - Eşleşen mevcut bir kullanıcı bulunamadığında otomatik olarak yeni bir kullanıcı oluşturulup oluşturulmayacağını belirler.
- LDAP URL - LDAP sunucu adresi.
- Bind DN - Sunucu bağlantısını test etmek ve kullanıcıları aramak için kullanılan DN.
- Bind parolası - Bind DN'nin parolası.
- Bağlantıyı test et - Sunucu bağlantısını test etmek ve Bind DN'nin geçerliliğini doğrulamak için düğmeye tıklayın.

### Arama Yapılandırması

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Arama DN'si - Kullanıcıları aramak için kullanılan DN.
- Arama filtresi - Kullanıcıları aramak için kullanılan filtreleme koşulu. Giriş yaparken kullanılan kullanıcı hesabını temsil etmek için `{{account}}` kullanın.
- Kapsam - `Base`, `One level`, `Subtree`, varsayılan `Subtree`.
- Boyut sınırı - Arama sayfa boyutu.

### Özellik Eşleme

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Kullanıcıyı bağlamak için bu alanı kullanın - Mevcut kullanıcıları bağlamak için kullanılan alan. Giriş hesabı bir kullanıcı adıysa 'kullanıcı adı'nı, bir e-posta adresi ise 'e-posta'yı seçin. Varsayılan olarak kullanıcı adı seçilidir.
- Özellik eşlemesi - Kullanıcı özelliklerinin NocoBase kullanıcı tablosundaki alanlarla eşlemesi.

## Giriş Yapma

Giriş sayfasına gidin ve giriş formuna LDAP kullanıcı adı ve parolasını girerek oturum açın.

<img src="https://nocobase.com/docs/assets/202405101614300.png"/>