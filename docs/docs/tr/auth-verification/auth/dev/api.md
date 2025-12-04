:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# API Referansı

## Sunucu Tarafı

### Auth

Çekirdek API, referans: [Auth](/api/auth/auth)

### BaseAuth

Çekirdek API, referans: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Genel Bakış

`AuthModel`, NocoBase uygulamalarında kullanılan kimlik doğrulayıcı (`Authenticator`, referans: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) ve [Auth - constructor](/api/auth/auth#constructor)) veri modelidir. Kullanıcı veri koleksiyonu ile etkileşim kurmak için bazı yöntemler sunar. Bunun yanı sıra, Sequelize Model tarafından sağlanan yöntemleri de kullanabilirsiniz.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### Sınıf Yöntemleri

- `findUser(uuid: string): UserModel` - `uuid` aracılığıyla kullanıcıyı sorgular.
  - `uuid` - Mevcut kimlik doğrulama türünden gelen benzersiz kullanıcı tanımlayıcısı

- `newUser(uuid: string, userValues?: any): UserModel` - Yeni bir kullanıcı oluşturur ve `uuid` aracılığıyla kullanıcıyı mevcut kimlik doğrulayıcıya bağlar.
  - `uuid` - Mevcut kimlik doğrulama türünden gelen benzersiz kullanıcı tanımlayıcısı
  - `userValues` - İsteğe bağlı. Diğer kullanıcı bilgileri. Geçirilmediğinde, `uuid` kullanıcının takma adı olarak kullanılır.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Yeni bir kullanıcıyı bulur veya oluşturur, oluşturma kuralı yukarıdakiyle aynıdır.
  - `uuid` - Mevcut kimlik doğrulama türünden gelen benzersiz kullanıcı tanımlayıcısı
  - `userValues` - İsteğe bağlı. Diğer kullanıcı bilgileri.

## İstemci Tarafı

### `plugin.registerType()`

Kimlik doğrulama türünün istemcisini kaydeder.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### İmza

- `registerType(authType: string, options: AuthOptions)`

#### Tip

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### Detaylar

- `SignInForm` - Giriş formu
- `SignInButton` - Giriş (üçüncü taraf) butonu, giriş formu yerine kullanılabilir.
- `SignUpForm` - Kayıt formu
- `AdminSettingsForm` - Yönetici ayarları formu

### Rota

Auth eklentisi aşağıdaki ön uç rotalarını kaydeder:

- Auth Düzeni
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Giriş Sayfası
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Kayıt Sayfası
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`