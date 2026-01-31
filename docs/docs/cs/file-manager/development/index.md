:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Vývoj rozšíření

## Rozšíření úložných mechanismů

### Na straně serveru

1. **Zdědit `StorageType`**
   
   Vytvořte novou třídu a implementujte metody `make()` a `delete()`. Podle potřeby přepište hooky jako `getFileURL()`, `getFileStream()` a `getFileData()`.

Příklad:

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

4. **Zaregistrovat nový typ**  
   Vložte novou implementaci úložiště do životního cyklu `beforeLoad` nebo `load` pluginu:

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

Po registraci se konfigurace úložiště objeví ve zdroji `storages`, stejně jako u vestavěných typů. Konfiguraci poskytovanou `StorageType.defaults()` lze použít pro automatické vyplnění formulářů nebo inicializaci výchozích záznamů.

<!--
### Konfigurace na straně klienta a správa
Na straně klienta je potřeba říct správci souborů, jak vykreslit konfigurační formulář a zda existuje vlastní logika nahrávání. Každý objekt typu úložiště obsahuje následující vlastnosti:
-->

## Rozšíření typů souborů na frontendu

U nahraných souborů můžete v uživatelském rozhraní zobrazovat různé náhledy podle typu souboru. Pole příloh správce souborů obsahuje vestavěný náhled založený na prohlížeči (vložený v iframe), který podporuje náhled většiny formátů (např. obrázky, video, audio a PDF) přímo v prohlížeči. Pokud prohlížeč nepodporuje daný formát nebo jsou potřeba speciální interakce, můžete rozšířit komponentu náhledu podle typu souboru.

### Příklad

Pokud chcete například přidat vlastní online náhled pro soubory Office, můžete použít následující kód:

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

Zde je `filePreviewTypes` vstupní objekt poskytovaný `@nocobase/plugin-file-manager/client` pro rozšíření náhledů souborů. Použijte metodu `add` pro přidání popisu typu souboru.

Každý typ souboru musí implementovat metodu `match()`, která ověří, zda typ souboru odpovídá požadavkům. V příkladu se `matchMimetype` používá ke kontrole atributu `mimetype` souboru. Pokud odpovídá typu `docx`, je považován za typ, který se má zpracovat. Pokud neodpovídá, použije se vestavěné zpracování.

Vlastnost `Previewer` v popisu typu je komponenta pro náhled. Když typ souboru odpovídá, komponenta se vykreslí v dialogu náhledu. Můžete vrátit libovolný React view (například iframe, přehrávač nebo graf).

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

`filePreviewTypes` je globální instance importovaná z `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Registruje nový popis typu souboru v registru typů. Typ popisu je `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Metoda pro porovnání formátu souboru.

Vstupní parametr `file` je datový objekt nahraného souboru a obsahuje relevantní vlastnosti pro kontrolu typu:

* `mimetype`: popis mimetype
* `extname`: přípona souboru včetně "."
* `path`: relativní cesta uložení souboru
* `url`: URL souboru

Vrací hodnotu `boolean`, která označuje shodu.

##### `getThumbnailURL`

Vrací URL miniatury používané v seznamu souborů. Pokud je návratová hodnota prázdná, použije se vestavěný zástupný obrázek.

##### `Previewer`

React komponenta pro náhled souborů.

Předávané props jsou:

* `file`: aktuální objekt souboru (může být řetězcová URL nebo objekt obsahující `url`/`preview`)
* `index`: index souboru v seznamu
* `list`: seznam souborů

