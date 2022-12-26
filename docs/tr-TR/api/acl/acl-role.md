# Erişim Kontrol Listesi Rol

Erişim Kontrol Listesi Rolü, Erişim Kontrol Listesi sistemindeki kullanıcı rolü sınıfıdır. Erişim Kontrol Listesi sisteminde roller genellikle 'acl.define' kullanılarak tanımlanır.

## Sınıf yönetimi

### `constructor()`
Yapıcı metod

**Kullanım**
* `constructor(public acl: ACL, public name: string)`

**Detaylar**
* acl - ACL Örnek
* name - Rol adı

### `grantAction()`

Role İşlemler izni ver

**Kullanım**
* `grantAction(path: string, options?: RoleActionParams)`

**Tip**
```typescript
interface RoleActionParams {
  fields?: string[];
  filter?: any;
  own?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  [key: string]: any;
}
```

**Detaylar**

* yol - kaynak Eylem yolu. Örneğin "gönderiler" kaynağının "düzenle" Eylemini temsil eden, kaynak adı ile Eylem arasında bir ":" iki nokta üst üste işaretiyle ayrılır. "gönderiler:düzenle" gibi.

RoleActionParams yetkilendirme olduğunda daha ayrıntılı izin kontrolü elde etmek için ilgili eylemin yapılandırılabilir parametreleri kullanılır.

* fields - erişilebilir alanlar
  ```typescript
  acl.define({
    role: 'admin',
    actions: {
      'posts:view': {
        // yönetici kullanıcılar gönderiler talep edebilir: işlemi görüntüleme, ancak yalnızca alanlar tarafından yapılandırılmış alan izinlerine sahip olma
        fields: ["id", "title", "content"], 
      },
    },
  });
  ```
* filter - İzin kaynağı filtreleme yapılandırması
  ```typescript
  acl.define({
    role: 'admin',
    actions: {
      'posts:view': {
        // Yönetici kullanıcı posts:view eylemini talep edebilir, ancak listelenen sonuçların filtre tarafından belirlenen koşulları karşılaması gerekir.
        filter: {
          createdById: '{{ ctx.state.currentUser.id }}', // Şablon sözdizimini destekleyen izin değerlendirildiğinde değiştirilecek olan değeri ctx cinsinden alabilirsiniz.
        },
      },
    },
  });
  ```
* Kendi - Yalnızca kendi verilerinize erişip erişemeyeceğinizi
  ```typescript
  const actionsWithOwn = {
    'posts:view': {
      "own": true // 
     }
  }
  
  // Eşittir
  const actionsWithFilter =  {
    'posts:view': {
      "filter": {
        "createdById": "{{ ctx.state.currentUser.id }}"
      }
    }
  }
  ```
* beyaz liste - beyaz liste, yalnızca beyaz listedeki alanlara erişilebilir
* kara liste - kara liste, kara listedeki alanlara erişilemez

