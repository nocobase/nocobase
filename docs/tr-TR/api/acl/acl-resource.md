# Erişim Kontrol Listesi Kaynağı(ACL)

Erişim Kontrol Listesi Kaynağı, Erişim Kontrol Listesi sistemindeki kaynak sınıfıdır. Erişim Kontrol Listesi sisteminde, kullanıcılara izinler verildiğinde ilgili kaynaklar otomatik olarak oluşturulur.


## Sınıf yönetimi

### `constructor()`
Yapıcı Metod

**Kullanım**
* `constructor(options: AclResourceOptions)`

**Tür**
```typescript
type ResourceActions = { [key: string]: RoleActionParams };

interface AclResourceOptions {
  name: string; // Kaynak adı
  role: ACLRole; // Kaynağın Rolü
  actions?: ResourceActions;
}
```

**Detaylar**

`RoleActionParams` için [`aclRole.grantAction`](./acl-role.md#grantaction) adresine bakın

### `getActions()`

Kaynağın tüm eylemlerini alın ve sonucu bir `ResourceActions` nesnesi olarak döndürün.

### `getAction()`
Adına göre Action'ın parametre yapılandırmasını döndürür ve döndürülen sonuç bir `RoleActionParams` nesnesidir.

**Detaylar**

`RoleActionParams` için [`aclRole.grantAction`](./acl-role.md#grantaction) adresine bakın

### `setAction()`

Kaynağın içinde bir Action parametresi yapılandırması ayarlayın ve sonucu bir `RoleActionParams` nesnesi olarak döndürün.

**Kullanım**
* `setAction(name: string, params: RoleActionParams)`

**Detaylar**

* name - ayarlanacak eylem adı
* `RoleActionParams` için [`aclRole.grantAction`](./acl-role.md#grantaction) adresine bakın

### `setActions()`

**Kullanım**
* `setActions(actions: ResourceActions)`

"setAction" toplu çağrısı için kolaylık yöntemi
