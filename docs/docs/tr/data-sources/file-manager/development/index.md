:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Eklenti Geliştirme

## Ön Uç Dosya Türlerini Genişletme

Yüklenmiş dosyalar için, ön uç arayüzü dosya türlerine göre farklı önizleme içerikleri gösterebilir. Dosya yöneticisinin ek alanı, tarayıcı tabanlı (iframe içine yerleştirilmiş) bir dosya önizleme özelliğine sahiptir ve bu yöntem, çoğu dosya formatının (resimler, videolar, sesler ve PDF'ler gibi) doğrudan tarayıcıda önizlenmesini destekler. Bir dosya formatı tarayıcı önizlemesini desteklemediğinde veya özel bir önizleme etkileşimi gerektiğinde, dosya türüne dayalı önizleme bileşenlerini genişleterek bu işlevi sağlayabilirsiniz.

### Örnek

Örneğin, resim dosyaları için bir döngüsel geçiş (carousel) bileşeni eklemek isterseniz, aşağıdaki kodu kullanabilirsiniz:

```ts
import match from 'mime-match';
import { Plugin, attachmentFileTypes } from '@nocobase/client';

class MyPlugin extends Plugin {
  load() {
    attachmentFileTypes.add({
      match(file) {
        return match(file.mimetype, 'image/*');
      },
      Previewer({ index, list, onSwitchIndex }) {
        const onDownload = useCallback(
          (e) => {
            e.preventDefault();
            const file = list[index];
            saveAs(file.url, `${file.title}${file.extname}`);
          },
          [index, list],
        );
        return (
          <LightBox
            // discourageDownloads={true}
            mainSrc={list[index]?.url}
            nextSrc={list[(index + 1) % list.length]?.url}
            prevSrc={list[(index + list.length - 1) % list.length]?.url}
            onCloseRequest={() => onSwitchIndex(null)}
            onMovePrevRequest={() => onSwitchIndex((index + list.length - 1) % list.length)}
            onMoveNextRequest={() => onSwitchIndex((index + 1) % list.length)}
            imageTitle={list[index]?.title}
            toolbarButtons={[
              <button
                key={'preview-img'}
                style={{ fontSize: 22, background: 'none', lineHeight: 1 }}
                type="button"
                aria-label="Download"
                title="Download"
                className="ril-zoom-in ril__toolbarItemChild ril__builtinButton"
                onClick={onDownload}
              >
                <DownloadOutlined />
              </button>,
            ]}
          />
        );
      },
    });
  }
}
```

Buradaki `attachmentFileTypes`, `@nocobase/client` paketinde dosya türlerini genişletmek için sağlanan bir giriş nesnesidir. Bu nesnenin `add` yöntemini kullanarak bir dosya türü tanımlayıcı nesnesi ekleyebilirsiniz.

Her dosya türü, dosya türünün gereksinimleri karşılayıp karşılamadığını kontrol etmek için bir `match()` yöntemi uygulamalıdır. Örnekte, `mime-match` paketi tarafından sağlanan yöntem, dosyanın `mimetype` özelliğini kontrol etmek için kullanılır. Eğer `image/*` türüyle eşleşirse, işlenmesi gereken bir dosya türü olarak kabul edilir. Eşleşme başarısız olursa, yerleşik tür işleme yöntemine geri dönülür.

Tür tanımlayıcı nesnesindeki `Previewer` özelliği, önizleme için kullanılan bileşendir. Dosya türü eşleştiğinde, bu bileşen önizleme için render edilir. Genellikle, temel kapsayıcı olarak bir modal (açılır pencere) bileşeni (örneğin `<Modal />` gibi) kullanmanız ve ardından önizleme ile etkileşimli içeriği bu bileşenin içine yerleştirerek önizleme işlevini gerçekleştirmeniz önerilir.

### API

```ts
export interface FileModel {
  id: number;
  filename: string;
  path: string;
  title: string;
  url: string;
  extname: string;
  size: number;
  mimetype: string;
}

export interface PreviewerProps {
  index: number;
  list: FileModel[];
  onSwitchIndex(index): void;
}

export interface AttachmentFileType {
  match(file: any): boolean;
  Previewer?: React.ComponentType<PreviewerProps>;
}

export class AttachmentFileTypes {
  add(type: AttachmentFileType): void;
}
```

#### `attachmentFileTypes`

`attachmentFileTypes`, `@nocobase/client` paketinden içe aktarılan global bir örnektir:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Dosya türü kayıt merkezine yeni bir dosya türü tanımlayıcı nesnesi kaydeder. Tanımlayıcı nesnenin türü `AttachmentFileType`'tır.

#### `AttachmentFileType`

##### `match()`

Dosya formatlarını eşleştirmek için bir yöntem.

`file` parametresi, yüklenmiş dosyanın bir veri nesnesidir ve tür kontrolü için kullanılabilecek ilgili özellikleri içerir:

*   `mimetype`: Dosyanın mimetype'ı.
*   `extname`: Dosya uzantısı, "." dahil.
*   `path`: Dosyanın göreceli depolama yolu.
*   `url`: Dosyanın URL'si.

Dönüş değeri `boolean` türündedir ve eşleşme sonucunu belirtir.

##### `Previewer`

Dosyayı önizlemek için bir React bileşeni.

Props parametreleri şunlardır:

*   `index`: Dosyanın ek listesindeki indeksi.
*   `list`: Eklerin listesi.
*   `onSwitchIndex`: İndeksi değiştirmek için kullanılan bir yöntem.

`onSwitchIndex` işlevi, başka bir dosyaya geçmek için `list` içindeki herhangi bir indeks değeriyle çağrılabilir. Eğer `null` parametresiyle çağrılırsa, önizleme bileşeni doğrudan kapatılır.

```ts
onSwitchIndex(null);
```