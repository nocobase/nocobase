:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utveckling av tillägg

## Utöka lagringsmotorer

### Serversidan

1.  **Ärv `StorageType`**
    
    Skapa en ny klass och implementera metoderna `make()` och `delete()`. Vid behov kan ni även åsidosätta krokar som `getFileURL()`, `getFileStream()` och `getFileData()`.

Exempel:

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

4.  **Registrera den nya typen**  
    Injicera den nya lagringsimplementeringen under pluginets `beforeLoad`- eller `load`-livscykel:

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

Efter registreringen kommer lagringskonfigurationen att visas i `storages`-resursen, precis som de inbyggda typerna. Konfigurationen som tillhandahålls av `StorageType.defaults()` kan användas för att automatiskt fylla i formulär eller initiera standardposter.

### Klientkonfiguration och administrationsgränssnitt
På klientsidan behöver ni informera filhanteraren om hur konfigurationsformuläret ska renderas och om det finns anpassad uppladdningslogik. Varje lagringstypobjekt innehåller följande egenskaper:

## Utöka filtyper på frontend

För uppladdade filer kan ni visa olika förhandsgranskningsinnehåll på frontend-gränssnittet baserat på olika filtyper. Filhanterarens bilagefält har en inbyggd webbläsarbaserad filförhandsgranskning (inbäddad i en iframe), vilket stöder förhandsgranskning av de flesta filformat (som bilder, videor, ljud och PDF-filer) direkt i webbläsaren. När ett filformat inte stöds för förhandsgranskning i webbläsaren, eller när speciella förhandsgranskningsinteraktioner krävs, kan ni utöka den filtypsbaserade förhandsgranskningskomponenten.

### Exempel

Om ni till exempel vill utöka en bildfilstyp med en karusellkomponent kan ni använda följande kod:

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

Här är `attachmentFileTypes` ett ingångsobjekt som tillhandahålls i paketet `@nocobase/client` för att utöka filtyper. Använd dess `add`-metod för att utöka ett beskrivningsobjekt för filtyper.

Varje filtyp måste implementera en `match()`-metod för att kontrollera om filtypen uppfyller kraven. I exemplet används metoden från paketet `mime-match` för att kontrollera filens `mimetype`-attribut. Om den matchar typen `image/*` anses det vara den filtyp som ska behandlas. Om ingen matchning hittas, kommer den att falla tillbaka till den inbyggda typbehandlingen.

Egenskapen `Previewer` på typbeskrivningsobjektet är komponenten som används för förhandsgranskning. När filtypen matchar, kommer denna komponent att renderas för förhandsgranskning. Det rekommenderas generellt att använda en dialogruta-liknande komponent (som `<Modal />`) som baskontainer, och sedan placera förhandsgranskningen och det interaktiva innehållet i denna komponent för att implementera förhandsgranskningsfunktionen.

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

`attachmentFileTypes` är en global instans som importeras från `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registrerar ett nytt beskrivningsobjekt för filtyper i filtypsregistret. Beskrivningsobjektets typ är `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metod för att matcha filformat.

Indataparametern `file` är dataobjektet för en uppladdad fil, som innehåller relevanta egenskaper som kan användas för typkontroll:

*   `mimetype`: beskrivning av mimetype
*   `extname`: filändelse, inklusive "."
*   `path`: relativ lagringssökväg för filen
*   `url`: filens URL

Returnerar ett `boolean`-värde som indikerar om det matchar.

##### `Previewer`

En React-komponent för förhandsgranskning av filer.

De inkommande Props-parametrarna är:

*   `index`: Filens index i bilagelistan
*   `list`: Bilagelistan
*   `onSwitchIndex`: En metod för att växla index

`onSwitchIndex` kan skickas vilket index som helst från listan för att växla till en annan fil. Om `null` skickas som argument stängs förhandsgranskningskomponenten direkt.

```ts
onSwitchIndex(null);
```