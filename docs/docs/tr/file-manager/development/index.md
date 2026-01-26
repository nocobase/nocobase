:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Uzantı Geliştirme

## Depolama motorlarını genişletme

### Sunucu tarafı

1. **`StorageType`'ı miras alma**
   
   Yeni bir sınıf oluşturun ve `make()` ile `delete()` metodlarını uygulayın. Gerekirse `getFileURL()`, `getFileStream()` ve `getFileData()` gibi hook'ları override edin.

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

4. **Yeni türü kaydetme**  
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

Kayıt tamamlandıktan sonra depolama yapılandırması, yerleşik türler gibi `storages` kaynağında görünür. `StorageType.defaults()` tarafından sağlanan yapılandırma, formları otomatik doldurmak veya varsayılan kayıtları başlatmak için kullanılabilir.

<!--
### İstemci tarafı yapılandırma ve yönetim arayüzü
İstemci tarafında dosya yöneticisine yapılandırma formunun nasıl oluşturulacağını ve özel yükleme mantığı olup olmadığını bildirmeniz gerekir. Her depolama türü nesnesi aşağıdaki özellikleri içerir:
-->

## Ön uçta dosya türlerini genişletme

Yüklenmiş dosyalar için, dosya türüne göre ön uç arayüzünde farklı önizleme içerikleri gösterebilirsiniz. Dosya yöneticisinin ek alanı, tarayıcı tabanlı (iframe içinde) yerleşik bir dosya önizlemesi içerir ve çoğu formatı (resimler, videolar, sesler ve PDF'ler gibi) doğrudan tarayıcıda önizlemeyi destekler. Bir format tarayıcı tarafından desteklenmiyorsa veya özel önizleme etkileşimleri gerekiyorsa, dosya türüne dayalı önizleme bileşenini genişletebilirsiniz.

### Örnek

Örneğin Office dosyaları için özel bir çevrimiçi önizleme entegre etmek istiyorsanız aşağıdaki kodu kullanabilirsiniz:

```tsx
import React, { useMemo } from 'react';
import { Plugin, matchMimetype } from '@nocobase/client';
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';

class MyPlugin extends Plugin {
  load() {
    filePreviewTypes.add({
      match(file) {
        return matchMimetype(file, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      },
      Previewer({ file }) {
        const url = useMemo(() => {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
          u.searchParams.set('src', src);
          return u.href;
        }, [file.url]);
        return <iframe src={url} width="100%" height="600px" style={{ border: 'none' }} />;
      },
    });
  }
}
```

Burada `filePreviewTypes`, dosya önizlemelerini genişletmek için `@nocobase/plugin-file-manager/client` tarafından sağlanan giriş nesnesidir. Bir dosya türü tanım nesnesi eklemek için `add` yöntemini kullanın.

Her dosya türü, türün gereksinimleri karşılayıp karşılamadığını kontrol etmek için bir `match()` yöntemi uygulamalıdır. Örnekte `matchMimetype`, dosyanın `mimetype` özelliğini kontrol etmek için kullanılır. `docx` türüyle eşleşirse işlenecek tür olarak kabul edilir. Eşleşmezse yerleşik tür işleme kullanılır.

Tip tanım nesnesindeki `Previewer` özelliği, önizleme için kullanılan bileşendir. Dosya türü eşleştiğinde bu bileşen önizleme diyalogunda render edilir. Herhangi bir React görünümü döndürebilirsiniz (örneğin iframe, oynatıcı veya grafik).

### API

```ts
export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  add(type: FilePreviewType): void;
}
```

#### `filePreviewTypes`

`filePreviewTypes`, `@nocobase/plugin-file-manager/client` içinden içe aktarılan global bir örnektir:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Dosya türleri kaydına yeni bir dosya türü tanım nesnesi kaydeder. Tanım nesnesinin türü `FilePreviewType`'dır.

#### `FilePreviewType`

##### `match()`

Dosya biçimi eşleştirme yöntemi.

Giriş parametresi `file`, yüklenen dosyanın veri nesnesidir ve tür kontrolü için kullanılabilecek özellikler içerir:

* `mimetype`: mimetype açıklaması
* `extname`: dosya uzantısı, "." dahil
* `path`: dosyanın göreli depolama yolu
* `url`: dosya URL'si

Eşleşme olup olmadığını belirten bir `boolean` döndürür.

##### `getThumbnailURL`

Dosya listesindeki küçük resim URL'sini döndürür. Dönüş değeri boşsa yerleşik yer tutucu görüntü kullanılır.

##### `Previewer`

Dosyaları önizlemek için bir React bileşeni.

Gelen Props:

* `file`: mevcut dosya nesnesi (string URL veya `url`/`preview` içeren bir nesne olabilir)
* `index`: listedeki dosyanın indeksi
* `list`: dosya listesi

