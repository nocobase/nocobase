:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# BaseAuth

## Genel Bakış

`BaseAuth`, [Auth](./auth) soyut sınıfından türetilmiştir ve JWT'yi kimlik doğrulama yöntemi olarak kullanan, kullanıcı kimlik doğrulama türleri için temel bir uygulamadır. Çoğu durumda, kullanıcı kimlik doğrulama türlerini `BaseAuth` sınıfından türeterek genişletebilirsiniz; `Auth` soyut sınıfından doğrudan türetmenize gerek kalmaz.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Kullanıcı koleksiyonunu ayarlayın
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Kullanıcı kimlik doğrulama mantığı, `auth.signIn` tarafından çağrılır
  // Kullanıcı verilerini döndürür
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Sınıf Metotları

### `constructor()`

Bir `BaseAuth` örneği oluşturan yapıcı metot.

#### İmza

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Detaylar

| Parametre        | Tip          | Açıklama                                                                                                |
| :--------------- | :----------- | :------------------------------------------------------------------------------------------------------ |
| `config`         | `AuthConfig` | [Auth - AuthConfig](./auth#authconfig) bölümüne bakın.                                                  |
| `userCollection` | `Collection` | Kullanıcı koleksiyonu, örneğin: `db.getCollection('users')`. [DataBase - Collection](../database/collection) bölümüne bakın. |

### `user()`

Kullanıcı bilgilerini ayarlayan ve alan bir erişimci (accessor). Varsayılan olarak, erişim için `ctx.state.currentUser` nesnesini kullanır.

#### İmza

- `set user()`
- `get user()`

### `check()`

İstek token'ı aracılığıyla kimlik doğrulaması yapar ve kullanıcı bilgilerini döndürür.

### `signIn()`

Kullanıcı girişi yapar ve bir token oluşturur.

### `signUp()`

Kullanıcı kaydı yapar.

### `signOut()`

Kullanıcı çıkışı yapar ve token'ı geçersiz kılar.

### `validate()` \*

Temel kimlik doğrulama mantığıdır; kullanıcının başarılı bir şekilde giriş yapıp yapamayacağını belirlemek için `signIn` arayüzü tarafından çağrılır.