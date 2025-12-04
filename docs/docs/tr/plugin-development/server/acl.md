:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# ACL İzin Kontrolü

ACL (Erişim Kontrol Listesi), kaynak işlemlerine yönelik izinleri kontrol etmek için kullanılır. İzinleri rollere atayabilir veya rol kısıtlamalarını atlayarak doğrudan izinleri belirleyebilirsiniz. ACL sistemi, izin parçacıkları (snippet), ara yazılımlar (middleware), koşullu değerlendirme gibi çeşitli yöntemleri destekleyen esnek bir izin yönetimi mekanizması sunar.

:::tip Not

ACL nesneleri veri kaynaklarına (`dataSource.acl`) aittir. Ana veri kaynağının ACL'sine `app.acl` üzerinden hızlıca erişebilirsiniz. Diğer veri kaynaklarının ACL kullanım detayları için [Veri Kaynağı Yönetimi](./data-source-manager.md) bölümüne bakınız.

:::

## İzin Parçacıklarını (Snippet) Kaydetme

İzin parçacıkları (Snippet), sık kullanılan izin kombinasyonlarını yeniden kullanılabilir izin birimleri olarak kaydetmenizi sağlar. Bir rol bir parçacığa bağlandığında, ilgili izin setini elde eder. Bu sayede tekrarlayan yapılandırmalar azalır ve izin yönetimi verimliliği artar.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // ui.* öneki, arayüzde yapılandırılabilen izinleri belirtir
  actions: ['customRequests:*'], // İlgili kaynak işlemleri, joker karakterleri destekler
});
```

## Rol Kısıtlamalarını Atlayan İzinler (allow)

`acl.allow()`, belirli işlemlerin rol kısıtlamalarını atlamasına izin vermek için kullanılır. Bu, herkese açık API'ler, dinamik izin değerlendirmesi gerektiren senaryolar veya izin değerlendirmesinin istek bağlamına göre yapılması gereken durumlar için uygundur.

```ts
// Herkese açık erişim, oturum açma gerekmez
acl.allow('app', 'getLang', 'public');

// Oturum açmış kullanıcılar erişebilir
acl.allow('app', 'getInfo', 'loggedIn');

// Özel bir koşula dayalı
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**`condition` parametresi açıklaması:**

- `'public'`: Herhangi bir kullanıcı (giriş yapmamış kullanıcılar dahil) erişebilir, herhangi bir kimlik doğrulaması gerekmez.
- `'loggedIn'`: Yalnızca giriş yapmış kullanıcılar erişebilir, geçerli bir kullanıcı kimliği gereklidir.
- `(ctx) => Promise<boolean>` veya `(ctx) => boolean`: İstek bağlamına göre erişime izin verilip verilmediğini dinamik olarak belirleyen özel bir fonksiyon; karmaşık izin mantıkları uygulayabilir.

## İzin Ara Yazılımlarını (use) Kaydetme

`acl.use()`, özel izin ara yazılımlarını kaydetmek için kullanılır ve izin kontrol sürecine özel mantık eklemenizi sağlar. Genellikle `ctx.permission` ile birlikte, özel izin kuralları tanımlamak için kullanılır. Herkese açık formların özel parola doğrulaması gerektirmesi, istek parametrelerine dayalı dinamik izin değerlendirmesi gibi alışılmadık izin kontrolü gerektiren senaryolar için uygundur.

**Tipik Uygulama Senaryoları:**

- Herkese açık form senaryoları: Kullanıcı veya rol olmasa da, izinlerin özel bir parola ile kısıtlanması gerektiğinde.
- İstek parametreleri, IP adresi gibi koşullara dayalı izin kontrolü.
- Varsayılan izin kontrol sürecini atlayan veya değiştiren özel izin kuralları.

**`ctx.permission` aracılığıyla izinleri kontrol etme:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Örnek: Herkese açık formun, izin kontrolünü atlamak için parola doğrulaması yapması gerekir
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Doğrulama başarılı, izin kontrolünü atla
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // İzin kontrolünü gerçekleştir (ACL akışına devam et)
  await next();
});
```

**`ctx.permission` özellik açıklaması:**

- `skip: true`: Sonraki ACL izin kontrollerini atlayarak doğrudan erişime izin verir.
- Ara yazılımda özel mantığa göre dinamik olarak ayarlanabilir, esnek izin kontrolü sağlar.

## Belirli İşlemler İçin Sabit Veri Kısıtlamaları Ekleme (addFixedParams)

`addFixedParams`, belirli kaynak işlemlerine sabit veri kapsamı (filtre) kısıtlamaları ekleyebilir. Bu kısıtlamalar rol sınırlamalarını atlayarak doğrudan uygulanır ve genellikle sistemin kritik verilerini korumak için kullanılır.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Kullanıcı rol silme iznine sahip olsa bile, root, admin, member gibi sistem rollerini silemez.
```

> **İpucu:** `addFixedParams`, sistemde yerleşik roller, yönetici hesapları gibi hassas verilerin yanlışlıkla silinmesini veya değiştirilmesini önlemek için kullanılabilir. Bu kısıtlamalar, rol izinleriyle birlikte geçerli olur ve izinlere sahip olsanız bile korunan verilerin manipüle edilememesini sağlar.

## İzinleri Kontrol Etme (can)

`acl.can()`, belirli bir rolün belirtilen işlemi gerçekleştirme iznine sahip olup olmadığını kontrol etmek için kullanılır ve bir izin sonuç nesnesi veya `null` döndürür. İş mantığında izinleri dinamik olarak değerlendirmek için sıkça kullanılır; örneğin, bir ara yazılımda veya işlem işleyicisinde (handler) rol bazında belirli işlemlerin yapılmasına izin verilip verilmeyeceğine karar vermek gibi.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Tek bir rol veya rol dizisi geçirebilirsiniz
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Rol ${result.role}, ${result.action} işlemini gerçekleştirebilir.`);
  // result.params, addFixedParams aracılığıyla ayarlanan sabit parametreleri içerir
  console.log('Sabit parametreler:', result.params);
} else {
  console.log('Bu işlemi gerçekleştirmek için izniniz yok.');
}
```

> **İpucu:** Birden fazla rol geçirilirse, her rol sırayla kontrol edilir ve izinli olan ilk rolün sonucu döndürülür.

**Tip Tanımları:**

```ts
interface CanArgs {
  role?: string;      // Tek bir rol
  roles?: string[];   // Birden fazla rol (sırayla kontrol edilir, izinli olan ilk rolü döndürür)
  resource: string;   // Kaynak adı
  action: string;    // İşlem adı
}

interface CanResult {
  role: string;       // İzinli rol
  resource: string;   // Kaynak adı
  action: string;    // İşlem adı
  params?: any;       // Sabit parametre bilgisi (addFixedParams aracılığıyla ayarlanmışsa)
}
```

## Yapılandırılabilir İşlemleri Kaydetme (setAvailableAction)

Özel işlemlerinizin arayüzde (örneğin rol yönetimi sayfasında) izinlerinin yapılandırılabilir olmasını istiyorsanız, bunları `setAvailableAction` kullanarak kaydetmeniz gerekir. Kaydedilen işlemler izin yapılandırma arayüzünde görünür ve yöneticiler arayüz üzerinden farklı roller için işlem izinlerini yapılandırabilir.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Arayüzde gösterilen ad, uluslararasılaştırmayı destekler
  type: 'new-data',               // İşlem türü
  onNewRecord: true,              // Yeni kayıt oluşturulurken geçerli olup olmadığı
});
```

**Parametre Açıklamaları:**

- **displayName**: İzin yapılandırma arayüzünde gösterilen ad, uluslararasılaştırmayı destekler (`{{t("key")}}` formatını kullanır).
- **type**: İşlem türü, bu işlemin izin yapılandırmasındaki kategorisini belirler.
  - `'new-data'`: Yeni veri oluşturan işlemler (örneğin içe aktarma, ekleme vb.).
  - `'existing-data'`: Mevcut verileri değiştiren işlemler (örneğin güncelleme, silme vb.).
- **onNewRecord**: Yeni kayıt oluşturulurken geçerli olup olmadığı, yalnızca `'new-data'` türü için geçerlidir.

Kayıt yapıldıktan sonra, bu işlem izin yapılandırma arayüzünde görünür ve yöneticiler rol yönetimi sayfasında bu işlemin izinlerini yapılandırabilir.