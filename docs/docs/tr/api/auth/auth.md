:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Kimlik Doğrulama

## Genel Bakış

`Auth`, kullanıcı kimlik doğrulama türleri için soyut bir sınıftır. Kullanıcı kimlik doğrulamasını tamamlamak için gereken arayüzleri tanımlar. Yeni bir kullanıcı kimlik doğrulama türü genişletmek isterseniz, `Auth` sınıfından miras almanız ve metotlarını uygulamanız gerekir. Temel bir uygulama için şuraya göz atabilirsiniz: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: authentication
  async check() {
    // ...
  }
}
```

## Örnek Özellikleri

### `user`

Kimliği doğrulanmış kullanıcı bilgisi.

#### İmza

- `abstract user: Model`

## Sınıf Metotları

### `constructor()`

Yapıcı metot, bir `Auth` örneği oluşturur.

#### İmza

- `constructor(config: AuthConfig)`

#### Tür

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Detaylar

##### AuthConfig

| Özellik         | Tür                                             | Açıklama                                                                                                      |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Kimlik doğrulayıcı veri modeli. Bir NocoBase uygulamasındaki gerçek türü [AuthModel](/auth-verification/auth/dev/api#authmodel)'dir. |
| `options`       | `Record<string, any>`                           | Kimlik doğrulayıcı ile ilgili yapılandırma.                                                                   |
| `ctx`           | `Context`                                       | İstek bağlamı.                                                                                                |

### `check()`

Kullanıcı kimlik doğrulaması yapar. Kullanıcı bilgisini döndürür. Bu, tüm kimlik doğrulama türlerinin uygulaması gereken soyut bir metottur.

#### İmza

- `abstract check(): Promise<Model>`

### `signIn()`

Kullanıcı girişi yapar.

#### İmza

- `signIn(): Promise<any>`

### `signUp()`

Kullanıcı kaydı yapar.

#### İmza

- `signUp(): Promise<any>`

### `signOut()`

Kullanıcı çıkışı yapar.

#### İmza

- `signOut(): Promise<any>`