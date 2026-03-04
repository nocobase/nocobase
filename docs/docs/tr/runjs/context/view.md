:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/runjs/context/view) bakın.
:::

# ctx.view

Mevcut aktif görünüm denetleyicisi (iletişim kutusu, çekmece, baloncuk katmanı, gömülü alan vb.); görünüm düzeyindeki bilgilere ve işlemlere erişmek için kullanılır. `FlowViewContext` tarafından sağlanır ve yalnızca `ctx.viewer` veya `ctx.openView` aracılığıyla açılan görünüm içeriklerinde kullanılabilir.

## Uygulama Senaryoları

| Senaryo | Açıklama |
|------|------|
| **İletişim Kutusu/Çekmece İçeriği** | Mevcut görünümü kapatmak için `content` içinde `ctx.view.close()` kullanın veya başlık ve alt bilgi oluşturmak için `Header` ve `Footer` bileşenlerini kullanın. |
| **Form Gönderiminden Sonra** | Başarılı bir gönderimden sonra görünümü kapatmak ve sonucu geri göndermek için `ctx.view.close(result)` işlevini çağırın. |
| **JS Bloğu / Eylem** | Mevcut görünüm türünü `ctx.view.type` üzerinden belirleyin veya `ctx.view.inputArgs` içindeki açılış parametrelerini okuyun. |
| **İlişki Seçimi, Alt Tablolar** | Veri yükleme işlemleri için `inputArgs` içindeki `collectionName`, `filterByTk`, `parentId` gibi alanları okuyun. |

> Not: `ctx.view` yalnızca görünüm bağlamına sahip RunJS ortamlarında kullanılabilir (örneğin `ctx.viewer.dialog()` içindeki `content`, açılır formlar, ilişki seçicilerin içi gibi); normal sayfalarda veya arka uç bağlamında `undefined` değerini alır, bu nedenle kullanırken isteğe bağlı zincirleme (optional chaining) yapılması önerilir (`ctx.view?.close?.()`).

## Tür Tanımı

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // İş akışı yapılandırma görünümlerinde kullanılabilir
};
```

## Sık Kullanılan Özellikler ve Yöntemler

| Özellik/Yöntem | Tür | Açıklama |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Mevcut görünüm türü |
| `inputArgs` | `Record<string, any>` | Görünüm açılırken iletilen parametreler, aşağıya bakın |
| `Header` | `React.FC \| null` | Başlık ve işlem alanlarını işlemek için kullanılan başlık bileşeni |
| `Footer` | `React.FC \| null` | Düğmeleri vb. işlemek için kullanılan alt bilgi bileşeni |
| `close(result?, force?)` | `void` | Mevcut görünümü kapatır, `result` çağırana geri iletilebilir |
| `update(newConfig)` | `void` | Görünüm yapılandırmasını günceller (örneğin genişlik, başlık) |
| `navigation` | `ViewNavigation \| undefined` | Sekme değiştirme vb. dahil olmak üzere sayfa içi görünüm navigasyonu |

> Şu an için yalnızca `dialog` ve `drawer`, `Header` ve `Footer` bileşenlerini desteklemektedir.

## inputArgs Yaygın Alanları

Farklı açılış senaryolarına göre `inputArgs` alanları değişebilir, yaygın olanlar şunlardır:

| Alan | Açıklama |
|------|------|
| `viewUid` | Görünüm UID'si |
| `collectionName` | Koleksiyon adı |
| `filterByTk` | Birincil anahtar filtresi (tekil kayıt detayı) |
| `parentId` | Üst kimlik (ilişki senaryoları) |
| `sourceId` | Kaynak kayıt kimliği |
| `parentItem` | Üst öğe verisi |
| `scene` | Senaryo (örneğin `create`, `edit`, `select`) |
| `onChange` | Seçim/değişiklik sonrası geri çağırma |
| `tabUid` | Mevcut Sekme UID'si (sayfa içi) |

Bu alanlara `ctx.getVar('ctx.view.inputArgs.xxx')` veya `ctx.view.inputArgs.xxx` üzerinden erişebilirsiniz.

## Örnekler

### Mevcut Görünümü Kapatma

```ts
// Başarılı gönderimden sonra iletişim kutusunu kapat
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Kapat ve sonuçları geri gönder
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### İçerikte Header / Footer Kullanımı

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Düzenle" extra={<Button size="small">Yardım</Button>} />
      <div>Form içeriği...</div>
      <Footer>
        <Button onClick={() => close()}>İptal</Button>
        <Button type="primary" onClick={handleSubmit}>Tamam</Button>
      </Footer>
    </div>
  );
}
```

### Görünüm Türüne veya inputArgs'a Göre Dallanma

```ts
if (ctx.view?.type === 'embed') {
  // Gömülü görünümlerde başlığı gizle
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Kullanıcı seçici senaryosu
}
```

## ctx.viewer ve ctx.openView ile İlişkisi

| Kullanım | Önerilen Yöntem |
|------|----------|
| **Yeni bir görünüm açma** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` veya `ctx.openView()` |
| **Mevcut görünüm üzerinde işlem yapma** | `ctx.view.close()`, `ctx.view.update()` |
| **Açılış parametrelerini alma** | `ctx.view.inputArgs` |

`ctx.viewer` bir görünümü "açmaktan" sorumludur, `ctx.view` ise "mevcut" görünüm örneğini temsil eder; `ctx.openView` ise önceden yapılandırılmış iş akışı görünümlerini açmak için kullanılır.

## Notlar

- `ctx.view` yalnızca görünüm içinde kullanılabilir, normal sayfalarda `undefined` değerini alır.
- İsteğe bağlı zincirleme kullanın: Görünüm bağlamı olmadığında hata almamak için `ctx.view?.close?.()`.
- `close(result)` içindeki `result`, `ctx.viewer.open()` tarafından döndürülen Promise'e iletilir.

## İlgili

- [ctx.openView()](./open-view.md): Önceden yapılandırılmış bir iş akışı görünümünü açın
- [ctx.modal](./modal.md): Hafif sıklet açılır pencereler (bilgi, onay vb.)

> `ctx.viewer`; `dialog()`, `drawer()`, `popover()` ve `embed()` gibi görünümleri açmak için yöntemler sunar; bu yöntemlerle açılan `content` içinde `ctx.view` nesnesine erişilebilir.