---
pkg: '@nocobase/plugin-acl'
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Roller

## Yönetim Merkezi

### Rol Yönetimi

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

Uygulama, ilk kurulumda "Admin" ve "Member" olmak üzere iki yerleşik rolle gelir. Bu rollerin her birinin, işlevlerine göre özelleştirilmiş farklı varsayılan izin ayarları bulunur.

### Rol Ekleme, Silme ve Düzenleme

Rol tanımlayıcısı (sisteme özgü benzersiz bir tanımlayıcı), varsayılan rolleri özelleştirmenize olanak tanır, ancak sistemin önceden tanımlanmış rollerini silemezsiniz.

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

### Varsayılan Rolü Ayarlama

Buradaki varsayılan rol, yeni oluşturulan kullanıcılara belirli bir rol atanmadığında otomatik olarak verilen roldür.

![](https://static-docs.nocobase.com/f41bba7ff55ca28717c486dc45bc1708.png)

## Kişisel Merkez

### Rol Değiştirme

Bir kullanıcıya birden fazla rol atanabilir. Kullanıcı birden fazla role sahip olduğunda, Kişisel Merkez'de roller arasında geçiş yapabilir.

![](https://static-docs.nocobase.com/e331d11ec1ca3b8b7e0472105b167819.png)

Kullanıcının sisteme giriş yaparken varsayılan rolü, en son değiştirilen rol (bu değer her rol değiştirmede güncellenir) veya bu durum geçerli değilse ilk rol (sistem varsayılan rolü) tarafından belirlenir.