:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Kimlik Doğrulama Türlerini Genişletme

## Genel Bakış

NocoBase, kullanıcı kimlik doğrulama türlerini ihtiyaca göre genişletmenizi destekler. Kullanıcı kimlik doğrulaması genellikle iki ana türe ayrılır: Birincisi, NocoBase uygulaması içinde kullanıcı kimliğinin belirlenmesidir; örneğin şifreyle giriş veya SMS ile giriş. İkincisi ise, üçüncü taraf hizmetlerin kullanıcı kimliğini belirleyip sonucu bir geri çağırma (callback) aracılığıyla NocoBase uygulamasına bildirmesidir; OIDC, SAML gibi kimlik doğrulama yöntemleri bu kategoriye girer. NocoBase'deki bu iki farklı kimlik doğrulama türünün temel süreci aşağıdaki gibidir:

### Üçüncü Taraf Geri Çağırmalarına Bağımlı Olmayan

1.  İstemci, NocoBase SDK'sını kullanarak `api.auth.signIn()` giriş arayüzünü çağırır ve `auth:signIn` giriş arayüzünü talep eder. Bu sırada, kullanılan kimlik doğrulayıcı (authenticator) tanımlayıcısını `X-Authenticator` istek başlığı aracılığıyla arka uca iletir.
2.  `auth:signIn` arayüzü, istek başlığındaki kimlik doğrulayıcı tanımlayıcısına göre ilgili kimlik doğrulama türüne yönlendirme yapar ve bu kimlik doğrulama türünde kayıtlı kimlik doğrulama sınıfının `validate` metodu gerekli mantıksal işlemleri gerçekleştirir.
3.  İstemci, `auth:signIn` arayüz yanıtından kullanıcı bilgilerini ve kimlik doğrulama `token`'ını alır, `token`'ı Yerel Depolama'ya (Local Storage) kaydeder ve giriş işlemini tamamlar. Bu adım, SDK içinde otomatik olarak işlenir.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Üçüncü Taraf Geri Çağırmalarına Bağımlı

1.  İstemci, kendi kaydettiği bir arayüz (örneğin `auth:getAuthUrl`) aracılığıyla üçüncü taraf giriş URL'sini alır ve protokole uygun olarak uygulama adı, kimlik doğrulayıcı tanımlayıcısı gibi bilgileri taşır.
2.  Üçüncü taraf URL'sine yönlendirilerek giriş tamamlanır. Üçüncü taraf hizmet, NocoBase uygulamasının geri çağırma arayüzünü (kendi tarafınızdan kaydedilmesi gerekir, örneğin `auth:redirect`) çağırır, kimlik doğrulama sonucunu ve aynı zamanda uygulama adı, kimlik doğrulayıcı tanımlayıcısı gibi bilgileri döndürür.
3.  Geri çağırma arayüz metodu, parametreleri ayrıştırarak kimlik doğrulayıcı tanımlayıcısını elde eder, `AuthManager` aracılığıyla ilgili kimlik doğrulama sınıfını alır ve `auth.signIn()` metodunu aktif olarak çağırır. `auth.signIn()` metodu, yetkilendirme mantığını işlemek için `validate()` metodunu çağırır.
4.  Geri çağırma metodu kimlik doğrulama `token`'ını aldıktan sonra, 302 durum koduyla ön uç sayfasına geri yönlendirir ve URL parametrelerinde `token` ile kimlik doğrulayıcı tanımlayıcısını (`?authenticator=xxx&token=yyy`) taşır.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Şimdi, sunucu tarafı arayüzlerini ve istemci tarafı kullanıcı arayüzlerini nasıl kaydedeceğinizi inceleyelim.

## Sunucu Tarafı

### Kimlik Doğrulama Arayüzü

NocoBase çekirdeği, kimlik doğrulama türlerini genişletmek için kayıt ve yönetim imkanı sunar. Giriş **eklentisini** genişletmenin temel mantık işlemleri için, çekirdeğin `Auth` soyut sınıfından miras almanız ve ilgili standart arayüzleri uygulamanız gerekir.  
Tüm API referansı için [Auth](/api/auth/auth) bölümüne bakınız.

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Çekirdek ayrıca, kullanıcı kimlik doğrulamasıyla ilgili temel kaynak işlemlerini de kaydeder.

| API            | Açıklama                                 |
| -------------- | ---------------------------------------- |
| `auth:check`   | Kullanıcının giriş yapıp yapmadığını kontrol eder |
| `auth:signIn`  | Giriş yap                                |
| `auth:signUp`  | Kaydol                                   |
| `auth:signOut` | Çıkış yap                                |

Çoğu durumda, genişletilmiş kullanıcı kimlik doğrulama türleri, kullanıcıların API'ye erişim kimlik bilgilerini oluşturmak için mevcut JWT yetkilendirme mantığını da kullanabilir. Çekirdekteki `BaseAuth` sınıfı, `Auth` soyut sınıfının temel bir uygulamasını sunar, [BaseAuth](../../../api/auth/base-auth.md) bölümüne bakınız. **Eklentiler**, bazı mantık kodlarını yeniden kullanmak ve geliştirme maliyetlerini düşürmek için doğrudan `BaseAuth` sınıfından miras alabilir.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Kullanıcı koleksiyonunu ayarlayın
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Kullanıcı kimlik doğrulama mantığını uygulayın
  async validate() {}
}
```

### Kullanıcı Verileri

Kullanıcı kimlik doğrulama mantığını uygularken, genellikle kullanıcı verilerinin işlenmesi gerekir. NocoBase uygulamasında, ilgili **koleksiyonlar** varsayılan olarak şu şekilde tanımlanmıştır:

| Koleksiyon            | Açıklama                                                              | Eklenti                                                               |
| --------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `users`               | Kullanıcı bilgilerini (e-posta, takma ad ve şifre gibi) saklar        | [Kullanıcı Eklentisi (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Kimlik doğrulayıcı (kimlik doğrulama türü varlığı) bilgilerini, ilgili kimlik doğrulama türünü ve yapılandırmasını saklar | Kullanıcı Kimlik Doğrulama Eklentisi (`@nocobase/plugin-auth`)        |
| `usersAuthenticators` | Kullanıcıları ve kimlik doğrulayıcıları ilişkilendirir, kullanıcının ilgili kimlik doğrulayıcı altındaki bilgilerini kaydeder | Kullanıcı Kimlik Doğrulama Eklentisi (`@nocobase/plugin-auth`)        |

Genellikle, genişletilmiş giriş yöntemleri ilgili kullanıcı verilerini depolamak için `users` ve `usersAuthenticators` **koleksiyonlarını** kullanır. Yalnızca özel durumlarda kendiniz yeni bir **koleksiyon** eklemeniz gerekebilir.

`usersAuthenticators` **koleksiyonunun** ana alanları şunlardır:

| Alan            | Açıklama                                                                |
| --------------- | ----------------------------------------------------------------------- |
| `uuid`          | Bu kimlik doğrulama türü için kullanıcının benzersiz tanımlayıcısı (örn. telefon numarası, WeChat openid gibi) |
| `meta`          | JSON alanı, kaydedilmesi gereken diğer bilgiler                         |
| `userId`        | Kullanıcı ID'si                                                         |
| `authenticator` | Kimlik doğrulayıcı adı (benzersiz tanımlayıcı)                          |

Kullanıcı sorgulama ve oluşturma işlemleri için, `authenticators` **koleksiyonunun** veri modeli olan `AuthModel`, `CustomAuth` sınıfında `this.authenticator[metotAdı]` aracılığıyla kullanılabilecek birkaç metot da kapsüller. Tüm API referansı için [AuthModel](./api#authmodel) bölümüne bakınız.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Kullanıcıyı sorgula
    this.authenticator.newUser(); // Yeni kullanıcı oluştur
    this.authenticator.findOrCreateUser(); // Kullanıcıyı sorgula veya oluştur
    // ...
  }
}
```

### Kimlik Doğrulama Türü Kaydı

Genişletilmiş kimlik doğrulama yönteminin, kimlik doğrulama yönetim modülüne kaydedilmesi gerekir.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## İstemci Tarafı

İstemci kullanıcı arayüzü, kullanıcı kimlik doğrulama **eklentisi** istemcisi tarafından sağlanan `registerType` arayüzü aracılığıyla kaydedilir:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Giriş formu
        SignInButton, // Giriş (üçüncü taraf) butonu, giriş formu ile alternatif olarak kullanılabilir
        SignUpForm, // Kayıt formu
        AdminSettingsForm, // Yönetici ayarları formu
      },
    });
  }
}
```

### Giriş Formu

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Birden fazla kimlik doğrulayıcının ilgili kimlik doğrulama türü için giriş formları kaydettirmesi durumunda, bunlar Sekmeler (Tab) şeklinde görüntülenecektir. Sekme başlığı, arka uçta yapılandırılan kimlik doğrulayıcının başlığı olacaktır.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Giriş Butonu

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Genellikle üçüncü taraf giriş butonları için kullanılır, ancak aslında herhangi bir bileşen olabilir.

### Kayıt Formu

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Giriş sayfasından kayıt sayfasına geçiş yapmanız gerekiyorsa, bunu giriş bileşeninde kendiniz yönetmeniz gerekir.

### Yönetici Ayarları Formu

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

Üst kısım genel kimlik doğrulayıcı yapılandırmasıdır, alt kısım ise kaydedilebilen özel yapılandırma formu bölümüdür.

### API İstekleri

İstemci tarafında kullanıcı kimlik doğrulamasıyla ilgili arayüz isteklerini başlatmak için NocoBase tarafından sağlanan SDK'yı kullanabilirsiniz.

```ts
import { useAPIClient } from '@nocobase/client';

// Bileşen içinde kullanın
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Detaylı API referansları için [@nocobase/sdk - Auth](/api/sdk/auth) bölümüne bakınız.