:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Uzantı Geliştirme

## Depolama Motorlarını Genişletme

### Sunucu Tarafı

1.  **`StorageType`'ı Devralma**

    Yeni bir sınıf oluşturun ve `make()` ile `delete()` metotlarını uygulayın. Gerekirse `getFileURL()`, `getFileStream()`, `getFileData()` gibi hook'ları geçersiz kılın.

Örnek:

```ts
// packages/my-plugin/src/server/storages/custom.ts
import { AttachmentModel, StorageModel, StorageType } from '@nocobase/plugin-file-manager';
import type { StorageEngine } from 'multer';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export class CustomStorageType extends StorageType {
  make(): StorageEngine {
    return multer.diskStorage({
      destination: path.resolve('custom-uploads'),
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    });
  }

  async delete(records: AttachmentModel[]) {
    let deleted = 0;
    const failures: AttachmentModel[] = [];
    for (const record of records) {
      try {
        await fs.unlink(path.resolve('custom-uploads', record.path || '', record.filename));
        deleted += 1;
      } catch (error) {
        failures.push(record);
      }
    }
    return [deleted, failures];
  }
}
```

4.  **Yeni Türü Kaydetme**
    Yeni depolama uygulamasını eklentinin `beforeLoad` veya `load` yaşam döngüsüne enjekte edin:

```ts
// packages/my-plugin/src/server/plugin.ts
import { Plugin } from '@nocobase/server';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { CustomStorageType } from './storages/custom';

export default class MyStoragePluginServer extends Plugin {
  async load() {
    const fileManager = this.app.pm.get(PluginFileManagerServer);
    fileManager.registerStorageType('custom-storage', CustomStorageType);
  }
}
```

Kaydolduktan sonra, depolama yapılandırması, yerleşik türler gibi `storages` kaynağında görünecektir. `StorageType.defaults()` tarafından sağlanan yapılandırma, formları otomatik doldurmak veya varsayılan kayıtları başlatmak için kullanılabilir.

### İstemci Tarafı Yapılandırma ve Yönetim Arayüzü
İstemci tarafında, dosya yöneticisine yapılandırma formunu nasıl oluşturacağını ve özel yükleme mantığı olup olmadığını bildirmeniz gerekir. Her depolama türü nesnesi aşağıdaki özelliklere sahiptir:

## Ön Uç Dosya Türlerini Genişletme

Yüklenmiş dosyalar için, ön uç arayüzünde farklı dosya türlerine göre farklı önizleme içerikleri gösterebilirsiniz. Dosya yöneticisinin ek alanı, çoğu dosya biçimini (resimler, videolar, sesler ve PDF'ler gibi) doğrudan tarayıcıda önizlemeyi destekleyen, tarayıcı tabanlı (bir iframe'e gömülü) yerleşik bir dosya önizlemesine sahiptir. Bir dosya biçimi tarayıcı tarafından önizleme için desteklenmediğinde veya özel önizleme etkileşimleri gerektiğinde, dosya türüne dayalı önizleme bileşenini genişleterek bunu gerçekleştirebilirsiniz.

### Örnek

Örneğin, bir resim dosya türünü bir carousel bileşeniyle genişletmek isterseniz, aşağıdaki kodu kullanabilirsiniz:

```tsx
import React, { useCallback } from 'react';
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

Burada, `attachmentFileTypes`, `@nocobase/client` paketinde dosya türlerini genişletmek için sağlanan giriş nesnesidir. Bir dosya türü açıklama nesnesini genişletmek için `add` metodunu kullanın.

Her dosya türü, dosya türünün gereksinimleri karşılayıp karşılamadığını kontrol etmek için bir `match()` metodu uygulamalıdır. Örnekte, `mime-match` paketi tarafından sağlanan metot, dosyanın `mimetype` özelliğini kontrol etmek için kullanılır. Eğer `image/*` türüyle eşleşirse, işlenmesi gereken dosya türü olarak kabul edilir. Eşleşme bulunamazsa, yerleşik tür işlemeye geri dönülür.

Tür açıklama nesnesindeki `Previewer` özelliği, önizleme için kullanılan bileşendir. Dosya türü eşleştiğinde, bu bileşen önizleme için oluşturulur. Genellikle, bir iletişim kutusu (modal) türü bileşeni (örneğin `<Modal />` gibi) temel kapsayıcı olarak kullanmanız ve ardından önizleme ile etkileşim gerektiren içeriği bu bileşenin içine yerleştirerek önizleme işlevselliğini uygulamanız önerilir.

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

`attachmentFileTypes`, `@nocobase/client`'tan içe aktarılan global bir örnektir:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Dosya türü kayıt merkezine yeni bir dosya türü açıklama nesnesi kaydeder. Açıklama nesnesinin türü `AttachmentFileType`'tır.

#### `AttachmentFileType`

##### `match()`

Dosya biçimi eşleştirme metodu.

Girdi parametresi `file`, yüklenmiş bir dosyanın veri nesnesidir ve tür kontrolü için kullanılabilecek ilgili özellikleri içerir:

*   `mimetype`: mimetype açıklaması
*   `extname`: "." içeren dosya uzantısı
*   `path`: dosyanın göreceli depolama yolu
*   `url`: dosya URL'si

Eşleşip eşleşmediğini belirten `boolean` türünde bir değer döndürür.

##### `Previewer`

Dosyaları önizlemek için kullanılan bir React bileşeni.

Gelen Props parametreleri şunlardır:

*   `index`: ek listesindeki dosyanın indeksi
*   `list`: ek listesi
*   `onSwitchIndex`: indeksi değiştirmek için bir metot

`onSwitchIndex` metoduna, başka bir dosyaya geçmek için listeden herhangi bir indeks değeri iletilebilir. Eğer parametre olarak `null` kullanılırsa, önizleme bileşeni doğrudan kapatılır.

```ts
onSwitchIndex(null);
```