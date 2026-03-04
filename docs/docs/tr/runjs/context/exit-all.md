:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/exit-all) bakın.
:::

# ctx.exitAll()

Mevcut olay akışını ve aynı olay dağıtımı (dispatch) içinde tetiklenen tüm sonraki olay akışlarını sonlandırır. Genellikle küresel bir hata veya yetki doğrulaması nedeniyle mevcut olay altındaki tüm olay akışlarının derhal durdurulması gerektiğinde kullanılır.

## Kullanım Senaryoları

`ctx.exitAll()` genellikle JS yürütülebilir bağlamlarda, **mevcut olay akışını ve bu olay tarafından tetiklenen sonraki olay akışlarını aynı anda durdurmak** gerektiğinde kullanılır:

| Senaryo | Açıklama |
|------|------|
| **Olay Akışı** | Ana olay akışı doğrulaması başarısız olduğunda (örneğin, yetersiz yetki), ana akışın ve aynı olay altında henüz yürütülmemiş olan sonraki akışların sonlandırılması gerekir. |
| **Bağlantı Kuralları** | Bağlantı (linkage) doğrulaması başarısız olduğunda, mevcut bağlantı ve aynı olay tarafından tetiklenen sonraki bağlantılar sonlandırılmalıdır. |
| **İşlem Olayları** | İşlem öncesi doğrulama başarısız olduğunda (örneğin, silme öncesi yetki kontrolü), ana işlemin ve sonraki adımların engellenmesi gerekir. |

> `ctx.exit()` ile farkı: `ctx.exit()` sadece mevcut olay akışını sonlandırır; `ctx.exitAll()` ise mevcut olay akışını ve aynı olay dağıtımındaki **henüz yürütülmemiş** sonraki olay akışlarını sonlandırır.

## Tür Tanımı

```ts
exitAll(): never;
```

`ctx.exitAll()` çağrıldığında, dahili bir `FlowExitAllException` fırlatılır; bu istisna olay akışı motoru tarafından yakalanarak mevcut olay akışı örneğini ve aynı olay altındaki sonraki olay akışlarını durdurur. Çağrıldıktan sonra, mevcut JS kodundaki kalan ifadeler yürütülmez.

## ctx.exit() ile Karşılaştırma

| Yöntem | Etki Alanı |
|------|----------|
| `ctx.exit()` | Sadece mevcut olay akışını sonlandırır; sonraki olay akışları etkilenmez. |
| `ctx.exitAll()` | Mevcut olay akışını sonlandırır ve aynı olay altında **sıralı olarak yürütülen** sonraki olay akışlarını durdurur. |

## Yürütme Modu Açıklaması

- **Sıralı Yürütme (sequential)**: Aynı olay altındaki olay akışları sırayla yürütülür. Herhangi bir olay akışı `ctx.exitAll()` çağırdığında, sonraki olay akışları yürütülmez.
- **Paralel Yürütme (parallel)**: Aynı olay altındaki olay akışları paralel olarak yürütülür. Bir olay akışında `ctx.exitAll()` çağrılması, halihazırda eşzamanlı olarak çalışan diğer olay akışlarını kesintiye uğratmaz (her biri bağımsızdır).

## Örnekler

### Yetki doğrulaması başarısız olduğunda tüm olay akışlarını sonlandırma

```ts
// Yetki yetersiz olduğunda ana olay akışını ve sonraki olay akışlarını durdurun
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'İşlem yetkisi yok' });
  ctx.exitAll();
}
```

### Küresel ön doğrulama geçilemediğinde sonlandırma

```ts
// Örnek: Silme işleminden önce ilişkili verilerin silinemez olduğu belirlenirse, ana olay akışını ve sonraki işlemleri engelleyin
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('İlişkili veriler mevcut, silinemez');
  ctx.exitAll();
}
```

### ctx.exit() ve ctx.exitAll() seçimi

```ts
// Sadece mevcut olay akışından çıkılması gerekiyorsa -> ctx.exit() kullanın
if (!params.valid) {
  ctx.message.error('Geçersiz parametreler');
  ctx.exit();  // Sonraki olay akışları etkilenmez
}

// Mevcut olay altındaki tüm sonraki olay akışlarının sonlandırılması gerekiyorsa -> ctx.exitAll() kullanın
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Yetersiz yetki' });
  ctx.exitAll();  // Hem ana olay akışı hem de aynı olay altındaki sonraki olay akışları sonlandırılır
}
```

### Sonlandırmadan önce uyarı verme

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Lütfen önce formdaki hataları düzeltin');
  ctx.exitAll();
}
```

## Notlar

- `ctx.exitAll()` çağrıldıktan sonra, mevcut JS içindeki sonraki kodlar yürütülmez. Çağırmadan önce `ctx.message`, `ctx.notification` veya bir modal aracılığıyla kullanıcıya nedenini açıklamanız önerilir.
- İş mantığı kodunda genellikle `FlowExitAllException` hatasını yakalamanıza gerek yoktur; bunu olay akışı motoruna bırakın.
- Sonraki olay akışlarını etkilemeden sadece mevcut olay akışını durdurmanız gerekiyorsa `ctx.exit()` kullanın.
- Paralel modda, `ctx.exitAll()` sadece mevcut olay akışını sonlandırır ve diğer eşzamanlı olay akışlarını kesintiye uğratmaz.

## İlgili

- [ctx.exit()](./exit.md): Sadece mevcut olay akışını sonlandırır
- [ctx.message](./message.md): Mesaj ipuçları
- [ctx.modal](./modal.md): Onay penceresi