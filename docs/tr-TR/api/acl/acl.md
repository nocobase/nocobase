# Erişim Kontrol Listesi

Erişim Kontrol Listesi, Nocobase'deki izin kontrol modülüdür. Erişim Kontrol Listesinde rolleri, kaynakları kaydettikten ve karşılık gelen izinleri yapılandırdıktan sonra, rollerin izinlerini değerlendirebilirsiniz.

## Kavram Açıklaması

* rol (`ACLRole`): izin kararının nesnesi
* Kaynak (`ACLResource`): Nocobase Erişim Kontrol Listesinde, kaynak genellikle Restful API'deki Resource'a kavramsal olarak benzer olabilen bir veritabanı tablosuna karşılık gelir.
* İşlem: "Oluştur", "oku", "güncelle", "sil" vb. gibi kaynaklar üzerindeki işlemler.
* Strateji (`ACLAvailableStrategy`): Genellikle her rolün varsayılan kullanıcı izinlerini tanımlayan kendi izin stratejisi vardır.
* Grant: `Action`a rol erişimi vermek için `ACLRole` örneğinde `grantAction` işlevini çağırın.
* Kimlik Doğrulama: `ACL` örneğinde `can` işlevi çağrılır ve işlev tarafından döndürülen sonuç, kullanıcının kimlik doğrulama sonucudur.


## sınıf yöntemi

### `constructor()`

Bir `ACL` örneği oluşturan oluşturucu.

```typescript
import { ACL } from '@nocobase/database';

const acl = new ACL();
```

### `define()`

Bir ACL rolü tanımlayın

**Kullanım**
* `define(options: DefineOptions): ACLRole`

**Tip**

```typescript
interface DefineOptions {
  role: string;
  allowConfigure?: boolean;
  strategy?: string | AvailableStrategyOptions;
  actions?: ResourceActionsOptions;
  routes?: any;
}
```

**Detaylar**

* `role` - 角色名称

```typescript
// Yönetici adında bir rol tanımlayın
acl.define({
  role: 'admin',
});
```

* `allowConfigure` - Yapılandırma izinlerine izin verilip verilmeyeceği
* `strategy` - Rol İzin Politikası
  * Tanımlanan stratejinin kullanılacağını belirten, kullanılacak stratejinin adı olan bir `string` olabilir.
  * `AvailableStrategyOptions` için bu rol için yeni bir strateji tanımlanabilir, bkz. [`setAvailableActions()`](#setavailableactions).
* `işlemler` - Bir rol tanımlarken, rol için erişilebilir bir `işlemler` nesnesi iletebilirsiniz.
  Bundan sonra, kaynak izinlerini vermek için sırayla `aclRole.grantAction` çağrılır. Bkz. [`aclRole.grantAction`](./acl-role.md#grantaction)

```typescript
acl.define({
  role: 'admin',
  actions: {
    'posts:edit': {}
  },
});
// Diğer kullanım şekli
const role = acl.define({
  role: 'admin',
});

role.grantAction('posts:edit', {});
```

### `getRole()`

Rol adına göre kayıtlı rol nesnesini döndürür

**Kullanım**
* `getRole(name: string): ACLRole`

### `removeRole()`

Rol adına göre rolleri kaldırın

**Kullanım**
* `removeRole(name: string)`

### `can()`
Kimlik doğrulama işlevi

**Kullanım**
* `can(options: CanArgs): CanResult | null`

**Tip**

```typescript
interface CanArgs {
  role: string; // Rol ismi
  resource: string; // Kaynak Adı
  action: string; // İşlem adı
}

interface CanResult {
  role: string; // Rol ismi
  resource: string; // Kaynak Adı
  action: string; // İşlem adı
  params?: any; // İzinler kaydedilirken gönderilen parametreler 
}

```

**Detaylar**

`can` yöntemi öncelikle rolün kayıt için ilgili `Action` iznine sahip olup olmadığını belirleyecek ve değilse, rolün `strategy` eşleşip eşleşmediğini belirleyecektir.
Çağrı `null` döndürdüğünde, rolün izni olmadığını belirtir, aksi takdirde, rolün izne sahip olduğunu belirten bir `CanResult` nesnesi döndürür.

**Örnek**
```typescript
// Rolleri tanımlayın, izinleri kaydedin
acl.define({
  role: 'admin',
  actions: {
    'posts:edit': {
      fields: ['title', 'content'],
    },
  },
});

const canResult = acl.can({
  role: 'admin',
  resource: 'posts',
  action: 'edit',
});
/**
 * canResult = {
 *   role: 'admin',
 *   resource: 'posts',
 *   action: 'edit',
 *   params: {
 *     fields: ['title', 'content'],
 *   }
 * }
 */

acl.can({
  role: 'admin',
  resource: 'posts',
  action: 'destroy',
}); // null
```
### `use()`

**Kullanım**
* `use(fn: any)`
Ara katman yazılımlarına ara katman işlevleri ekleyin.

### `middleware()`

`@nocobase/server` içinde kullanım için bir ara katman işlevi döndürür. Bu `ara yazılımı` kullandıktan sonra, `@nocobase/server`, her istek işlenmeden önce izin kararı verecektir.

### `allow()`

Kaynağı herkese açık hale getirin

**Kullanım**
* `allow(resourceName: string, actionNames: string[] | string, condition?: string | ConditionFunc)`

**Tip**
```typescript
type ConditionFunc = (ctx: any) => Promise<boolean> | boolean;
```

**Detaylar**

* resourceName - Kaynak Adı
* actionNames - kaynak işlem adı
* condition? - Konfigürasyon Etkili Koşullar
  * `string` iletmek, tanımlanan koşulun kullanıldığını ve kayıt koşulunun `acl.allowManager.registerCondition` yöntemini kullandığını gösterir.
    ```typescript
    acl.allowManager.registerAllowCondition('superUser', async () => {
      return ctx.state.user?.id === 1;
    });
    
    // superUser durumu için users:list yetkilerini açar
    acl.allow('users', 'list', 'superUser');
    ```
  * ConditionFunc'u ctx parametresiyle iletir ve sonucunu `boolean` olarak döndürür.
    ```typescript
    // Kullanıcı kimliği 1 olduğunda, user:list'e erişebilirsiniz.
    acl.allow('users', 'list', (ctx) => {
      return ctx.state.user?.id === 1;
    });
    ```

**Örnek**

```typescript
// users:login erişim yetkisi olanlar erişebilir.
acl.allow('users', 'login');
```

### `setAvailableActions()`

**Kullanım**

* `setAvailableStrategy(name: string, options: AvailableStrategyOptions)`

Kullanılabilir bir izin politikası kaydedin

**Tip**

```typescript
interface AvailableStrategyOptions {
  displayName?: string;
  actions?: false | string | string[];
  allowConfigure?: boolean;
  resource?: '*';
}
```

**Detaylar**

* displayName - Politika Adı
* allowConfigure - Bu politikanın **config source** izni olup olmadığına bakılmaksızın, bunu `true` olarak ayarladıktan sonra, `ACL`de bir `configResources` kaynağı olarak kaydolma iznini belirleme isteği bir geçiş döndürür.
* actions - Politika içindeki işlemler listesi joker karakteri `*` destekler
* resource - Politika içindeki kaynak tanımı joker karakteri `*` destekler

