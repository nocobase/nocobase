:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# AuthManager

## Genel Bakış

`AuthManager`, NocoBase'de farklı kullanıcı kimlik doğrulama türlerini kaydetmek için kullanılan kullanıcı kimlik doğrulama yönetim modülüdür.

### Temel Kullanım

```ts
const authManager = new AuthManager({
  // İstek başlığından (request header) mevcut kimlik doğrulayıcı tanımlayıcısını almak için kullanılır.
  authKey: 'X-Authenticator',
});

// AuthManager'ın kimlik doğrulayıcıları depolama ve alma yöntemlerini ayarlar.
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Bir kimlik doğrulama türü kaydeder.
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Kimlik doğrulama ara yazılımını (middleware) kullanır.
app.resourceManager.use(authManager.middleware());
```

### Kavramlar

- **`AuthType`**: Parola, SMS, OIDC, SAML gibi farklı kullanıcı kimlik doğrulama yöntemleridir.
- **`Authenticator`**: Bir kimlik doğrulama yönteminin varlığıdır. Gerçekte bir **koleksiyon** içinde saklanır ve belirli bir `AuthType`'ın yapılandırma kaydına karşılık gelir. Bir kimlik doğrulama yöntemi, birden fazla yapılandırmaya karşılık gelen ve farklı kullanıcı kimlik doğrulama yöntemleri sağlayan birden fazla kimlik doğrulayıcıya sahip olabilir.
- **`Authenticator name`**: Bir kimlik doğrulayıcının benzersiz tanımlayıcısıdır ve mevcut istek için kullanılacak kimlik doğrulama yöntemini belirlemek amacıyla kullanılır.

## Sınıf Metotları

### `constructor()`

`constructor`, bir `AuthManager` örneği oluşturur.

#### İmza

- `constructor(options: AuthManagerOptions)`

#### Tipler

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### Detaylar

##### AuthManagerOptions

| Özellik   | Tip                         | Açıklama                                                              | Varsayılan        |
| --------- | --------------------------- | --------------------------------------------------------------------- | ----------------- |
| `authKey` | `string`                    | İsteğe bağlıdır. İstek başlığında (request header) mevcut kimlik doğrulayıcı tanımlayıcısını tutan anahtardır. | `X-Authenticator` |
| `default` | `string`                    | İsteğe bağlıdır. Varsayılan kimlik doğrulayıcı tanımlayıcısıdır.      | `basic`           |
| `jwt`     | [`JwtOptions`](#jwtoptions) | İsteğe bağlıdır. JWT ile kimlik doğrulama yapılıyorsa yapılandırılabilir. | -                 |

##### JwtOptions

| Özellik     | Tip      | Açıklama                               | Varsayılan        |
| ----------- | -------- | -------------------------------------- | ----------------- |
| `secret`    | `string` | Token sırrı                            | `X-Authenticator` |
| `expiresIn` | `string` | İsteğe bağlıdır. Token'ın geçerlilik süresidir. | `7d`              |

### `setStorer()`

Kimlik doğrulayıcı verilerini depolama ve alma yöntemlerini ayarlar.

#### İmza

- `setStorer(storer: Storer)`

#### Tipler

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### Detaylar

##### Authenticator

| Özellik    | Tip                   | Açıklama                               |
| ---------- | --------------------- | -------------------------------------- |
| `authType` | `string`              | Kimlik doğrulama türü                  |
| `options`  | `Record<string, any>` | Kimlik doğrulayıcı ile ilgili yapılandırma |

##### Storer

`Storer`, kimlik doğrulayıcı depolaması için bir arayüzdür ve tek bir metot içerir.

- `get(name: string): Promise<Authenticator>` - Tanımlayıcısına göre bir kimlik doğrulayıcıyı alır. NocoBase'de, gerçekte dönen tip [AuthModel](/auth-verification/auth/dev/api#authmodel) şeklindedir.

### `registerTypes()`

Bir kimlik doğrulama türü kaydeder.

#### İmza

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Tipler

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // Kimlik doğrulama sınıfı.
  title?: string; // Kimlik doğrulama türünün görünen adı.
};
```

#### Detaylar

| Özellik | Tip                | Açıklama                                                              |
| ------- | ------------------ | --------------------------------------------------------------------- |
| `auth`  | `AuthExtend<Auth>` | Kimlik doğrulama türü uygulaması, [Auth](./auth) bölümüne bakınız.    |
| `title` | `string`           | İsteğe bağlıdır. Bu kimlik doğrulama türünün ön yüzde (frontend) gösterilecek başlığıdır. |

### `listTypes()`

Kayıtlı kimlik doğrulama türlerinin listesini alır.

#### İmza

- `listTypes(): { name: string; title: string }[]`

#### Detaylar

| Özellik | Tip      | Açıklama                     |
| ------- | -------- | ---------------------------- |
| `name`  | `string` | Kimlik doğrulama türü tanımlayıcısı |
| `title` | `string` | Kimlik doğrulama türü başlığı |

### `get()`

Bir kimlik doğrulayıcıyı alır.

#### İmza

- `get(name: string, ctx: Context)`

#### Detaylar

| Özellik | Tip       | Açıklama           |
| ------- | --------- | ------------------ |
| `name`  | `string`  | Kimlik doğrulayıcı tanımlayıcısı |
| `ctx`   | `Context` | İstek bağlamı      |

### `middleware()`

Kimlik doğrulama ara yazılımıdır (middleware). Mevcut kimlik doğrulayıcıyı alır ve kullanıcı kimlik doğrulamasını gerçekleştirir.