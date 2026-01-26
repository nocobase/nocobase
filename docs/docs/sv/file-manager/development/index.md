:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utveckling av tillägg

## Utöka lagringsmotorer

### Serversida

1. **Ärv `StorageType`**
   
   Skapa en ny klass och implementera metoderna `make()` och `delete()`. Vid behov, åsidosätt hooks som `getFileURL()`, `getFileStream()` och `getFileData()`.

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

4. **Registrera den nya typen**  
   Injicera den nya lagringsimplementeringen i pluginens `beforeLoad`- eller `load`-livscykel:

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

Efter registreringen visas lagringskonfigurationen i resursen `storages`, precis som de inbyggda typerna. Konfigurationen från `StorageType.defaults()` kan användas för att autofylla formulär eller initiera standardposter.

<!--
### Klientsidekonfiguration och hanteringsgränssnitt
På klientsidan behöver du tala om för filhanteraren hur konfigurationsformuläret ska renderas och om det finns anpassad uppladdningslogik. Varje lagringstyp-objekt innehåller följande egenskaper:
-->

## Utöka filtyper i frontend

För uppladdade filer kan du visa olika förhandsvisningar i frontend beroende på filtyp. Filhanterarens bilagefält har en inbyggd webbläsarbaserad förhandsvisning (inbäddad i en iframe), som stödjer de flesta format (som bilder, video, ljud och PDF) direkt i webbläsaren. När ett filformat inte stöds av webbläsaren eller när särskilda förhandsvisningsinteraktioner krävs kan du utöka förhandsvisningskomponenten baserad på filtyp.

### Exempel

Om du till exempel vill integrera en anpassad onlineförhandsvisning för Office-filer kan du använda följande kod:

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

Här är `filePreviewTypes` instegsobjektet som tillhandahålls av `@nocobase/plugin-file-manager/client` för att utöka filförhandsvisningar. Använd metoden `add` för att lägga till en filtypbeskrivare.

Varje filtyp måste implementera en `match()`-metod för att kontrollera om filtypen uppfyller kraven. I exemplet används `matchMimetype` för att kontrollera filens `mimetype`-attribut. Om det matchar `docx`-typen betraktas den som den typ som ska hanteras. Om den inte matchar används den inbyggda typhanteringen.

Egenskapen `Previewer` på typbeskrivaren är komponenten som används för förhandsvisning. När filtypen matchar renderas komponenten i förhandsvisningsdialogen. Du kan returnera valfri React-vy (t.ex. en iframe, spelare eller diagram).

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

`filePreviewTypes` är en global instans som importeras från `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Registrerar ett nytt filtypbeskrivningsobjekt i filtypregistret. Typen på beskrivningsobjektet är `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Metod för matchning av filformat.

Indataparametern `file` är dataobjektet för en uppladdad fil och innehåller relevanta egenskaper för typkontroll:

* `mimetype`: beskrivning av mimetype
* `extname`: filändelse, inklusive "."
* `path`: relativ lagringssökväg för filen
* `url`: filens URL

Returnerar ett `boolean` som anger om det matchar.

##### `getThumbnailURL`

Returnerar miniatyr-URL som används i fillistan. Om returvärdet är tomt används den inbyggda platshållarbilden.

##### `Previewer`

En React-komponent för att förhandsgranska filer.

Inkommande props är:

* `file`: aktuellt filobjekt (kan vara en sträng-URL eller ett objekt med `url`/`preview`)
* `index`: index för filen i listan
* `list`: fillista

