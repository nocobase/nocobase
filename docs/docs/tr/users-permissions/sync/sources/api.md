:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# HTTP API Aracılığıyla Kullanıcı Verilerini Senkronize Etme

## API Anahtarı Alma

[API Anahtarları](/auth-verification/api-keys) bölümüne bakın. API anahtarınızla ilişkili rolün kullanıcı verilerini senkronize etmek için gerekli izinlere sahip olduğundan emin olun.

## API'ye Genel Bakış

### Örnek

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # İstek gövdesinin ayrıntılarını aşağıda bulabilirsiniz.
```

### Uç Nokta

```bash
POST /api/userData:push
```

### Kullanıcı Veri Formatı

#### UserData

| Parametre  | Tip                               | Açıklama                                                                 |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `dataType` | `'user' \| 'department'`           | Zorunlu. Gönderilen verinin tipidir. Kullanıcı verilerini göndermek için `user` kullanın. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | İsteğe bağlı. Belirtilen alana göre mevcut sistem kullanıcılarını eşleştirmek için kullanılır. |
| `records`  | `UserRecord[]`                     | Zorunlu. Kullanıcı veri kayıtlarının dizisidir.                          |

#### UserRecord

| Parametre     | Tip        | Açıklama                                                                                                 |
| ------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Zorunlu. Kaynak kullanıcı verileri için benzersiz tanımlayıcıdır. Kaynak verileri sistem kullanıcısıyla ilişkilendirmek için kullanılır. Bir kullanıcı için değişmezdir. |
| `nickname`    | `string`   | İsteğe bağlı. Kullanıcının takma adı.                                                                    |
| `username`    | `string`   | İsteğe bağlı. Kullanıcı adı.                                                                             |
| `email`       | `string`   | İsteğe bağlı. Kullanıcının e-posta adresi.                                                               |
| `phone`       | `string`   | İsteğe bağlı. Kullanıcının telefon numarası.                                                             |
| `departments` | `string[]` | İsteğe bağlı. Kullanıcının ait olduğu departman UID'lerinin dizisi.                                      |
| `isDeleted`   | `boolean`  | İsteğe bağlı. Kaydın silinip silinmediğini belirtir.                                                     |
| `<field>`     | `any`      | İsteğe bağlı. Kullanıcı tablosundaki özel alanlar.                                                       |

### Departman Veri Formatı

:::info
Departman verilerini göndermek için [Departmanlar](../../departments) eklentisinin kurulu ve etkinleştirilmiş olması gerekir.
:::

#### DepartmentData

| Parametre  | Tip                      | Açıklama                                                                 |
| ---------- | ------------------------ | ------------------------------------------------------------------------ |
| `dataType` | `'user' \| 'department'` | Zorunlu. Gönderilen verinin tipidir. Departman verileri için `department` kullanın. |
| `records`  | `DepartmentRecord[]`     | Zorunlu. Departman veri kayıtlarının dizisidir.                          |

#### DepartmentRecord

| Parametre   | Tip       | Açıklama                                                                                                       |
| ----------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Zorunlu. Kaynak departman verileri için benzersiz tanımlayıcıdır. Kaynak verileri sistem departmanıyla ilişkilendirmek için kullanılır. Değişmezdir. |
| `title`     | `string`  | Zorunlu. Departman başlığı.                                                                                    |
| `parentUid` | `string`  | İsteğe bağlı. Üst departmanın UID'si.                                                                          |
| `isDeleted` | `boolean` | İsteğe bağlı. Kaydın silinip silinmediğini belirtir.                                                           |
| `<field>`   | `any`     | İsteğe bağlı. Departman tablosundaki özel alanlar.                                                             |

:::info

1.  Veri gönderme işlemi idempotenttir.
2.  Departman verileri gönderilirken bir üst departman mevcut değilse, ilişkilendirme yapılamaz. Üst departman oluşturulduktan sonra verileri tekrar gönderebilirsiniz.
3.  Kullanıcı verileri gönderilirken bir departman mevcut değilse, kullanıcı bu departmanla ilişkilendirilemez. Departman verileri gönderildikten sonra kullanıcı verilerini tekrar gönderebilirsiniz.

:::