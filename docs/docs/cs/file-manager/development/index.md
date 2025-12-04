:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vývoj rozšíření

## Rozšíření úložných mechanismů

### Na straně serveru

1.  **Dědění z `StorageType`**

    Vytvořte novou třídu a implementujte metody `make()` a `delete()`. V případě potřeby přepište hooky jako `getFileURL()`, `getFileStream()` nebo `getFileData()`.

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

4.  **Registrace nového typu**  
    Novou implementaci úložiště vložte do životního cyklu pluginu `beforeLoad` nebo `load`:

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

Po registraci se konfigurace úložiště objeví v rámci zdroje `storages` stejně jako vestavěné typy. Konfigurace poskytnutá metodou `StorageType.defaults()` může být použita pro automatické vyplňování formulářů nebo inicializaci výchozích záznamů.

### Konfigurace na straně klienta a rozhraní pro správu
Na straně klienta je potřeba informovat správce souborů, jak má vykreslit konfigurační formulář a zda existuje vlastní logika nahrávání. Každý objekt typu úložiště obsahuje následující vlastnosti:

## Rozšíření typů souborů na frontendu

Pro již nahrané soubory můžete na frontendu zobrazovat různý obsah náhledu v závislosti na jejich typu. Pole příloh správce souborů má vestavěný náhled souborů založený na prohlížeči (vložený do iframe), který podporuje přímé prohlížení většiny formátů souborů (jako jsou obrázky, videa, audio a PDF) přímo v prohlížeči. Pokud formát souboru není podporován pro náhled v prohlížeči, nebo pokud jsou vyžadovány speciální interakce s náhledem, můžete toho dosáhnout rozšířením komponenty náhledu založené na typu souboru.

### Příklad

Pokud například chcete rozšířit typ souboru obrázku o komponentu pro přepínání karuselu, můžete použít následující kód:

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

Zde je `attachmentFileTypes` vstupní objekt poskytovaný v balíčku `@nocobase/client` pro rozšíření typů souborů. Použijte jeho metodu `add` k rozšíření objektu popisu typu souboru.

Každý typ souboru musí implementovat metodu `match()`, která kontroluje, zda typ souboru splňuje požadavky. V příkladu je použita metoda z balíčku `mime-match` pro kontrolu atributu `mimetype` souboru. Pokud se shoduje s typem `image/*`, je považován za typ souboru, který má být zpracován. Pokud shoda nenastane, dojde k návratu na vestavěné zpracování typu.

Vlastnost `Previewer` na objektu popisu typu je komponenta použitá pro náhled. Když se typ souboru shoduje, tato komponenta se vykreslí pro zobrazení náhledu. Obecně se doporučuje použít komponentu typu dialogu (například `<Modal />`) jako základní kontejner a poté do ní umístit náhled a interaktivní obsah pro implementaci funkce náhledu.

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

`attachmentFileTypes` je globální instance, kterou importujete z `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registruje nový objekt popisu typu souboru do registru typů souborů. Typ popisného objektu je `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metoda pro shodu formátu souboru.

Vstupní parametr `file` je datový objekt nahraného souboru, který obsahuje relevantní vlastnosti použitelné pro určení typu:

*   `mimetype`: popis mimetype
*   `extname`: přípona souboru, včetně „.“
*   `path`: relativní cesta k úložišti souboru
*   `url`: URL souboru

Vrací hodnotu typu `boolean`, která indikuje výsledek shody.

##### `Previewer`

React komponenta pro náhled souborů.

Příchozí parametry Props jsou:

*   `index`: index souboru v seznamu příloh
*   `list`: seznam příloh
*   `onSwitchIndex`: metoda pro přepínání indexu

Metodě `onSwitchIndex` můžete předat libovolný index ze seznamu `list` pro přepnutí na jiný soubor. Pokud jako argument předáte `null`, komponenta náhledu se přímo zavře.

```ts
onSwitchIndex(null);
```