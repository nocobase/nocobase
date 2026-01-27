:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Kimlik Doğrulama (Auth)

## Genel Bakış

`Auth` sınıfı, temel olarak istemci tarafında kullanıcı bilgilerine erişmek ve kullanıcı kimlik doğrulamasıyla ilgili API'leri çağırmak için kullanılır.

## Örnek Özellikleri

### `locale`

Mevcut kullanıcının kullandığı dil.

### `role`

Mevcut kullanıcının kullandığı rol.

### `token`

API `token`'ı.

### `authenticator`

Mevcut kullanıcının kimlik doğrulaması için kullanılan doğrulayıcı. [Kullanıcı Kimlik Doğrulaması](/auth-verification/auth/) bölümüne bakın.

## Sınıf Metotları

### `signIn()`

Kullanıcı girişi.

#### İmza

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detaylar

| Parametre Adı   | Tip      | Açıklama                                           |
| --------------- | -------- | -------------------------------------------------- |
| `values`        | `any`    | Giriş API'si için istek parametreleri              |
| `authenticator` | `string` | Giriş için kullanılan doğrulayıcının tanımlayıcısı |

### `signUp()`

Kullanıcı kaydı.

#### İmza

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detaylar

| Parametre Adı   | Tip      | Açıklama                                          |
| --------------- | -------- | ------------------------------------------------- |
| `values`        | `any`    | Kayıt API'si için istek parametreleri             |
| `authenticator` | `string` | Kayıt için kullanılan doğrulayıcının tanımlayıcısı |

### `signOut()`

Oturumu kapatma.

#### İmza

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detaylar

| Parametre Adı   | Tip      | Açıklama                                                 |
| --------------- | -------- | -------------------------------------------------------- |
| `values`        | `any`    | Oturumu kapatma API'si için istek parametreleri          |
| `authenticator` | `string` | Oturumu kapatma için kullanılan doğrulayıcının tanımlayıcısı |