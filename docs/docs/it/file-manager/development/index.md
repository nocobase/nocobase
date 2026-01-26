:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Sviluppo di Estensioni

## Estensione dei motori di archiviazione

### Lato server

1. **Ereditare `StorageType`**
   
   Crea una nuova classe e implementa i metodi `make()` e `delete()`. Se necessario, sovrascrivi hook come `getFileURL()`, `getFileStream()` e `getFileData()`.

Esempio:

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

4. **Registrare il nuovo tipo**  
   Inserisci la nuova implementazione di archiviazione nel ciclo di vita `beforeLoad` o `load` del plugin:

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

Dopo la registrazione, la configurazione di archiviazione apparirà nella risorsa `storages`, proprio come i tipi integrati. La configurazione fornita da `StorageType.defaults()` può essere usata per compilare automaticamente i moduli o inizializzare i record predefiniti.

<!--
### Configurazione lato client e interfaccia di gestione
Sul lato client, devi informare il file manager su come renderizzare il modulo di configurazione e se esiste una logica di upload personalizzata. Ogni oggetto di tipo storage contiene le seguenti proprietà:
-->

## Estendere i tipi di file nel frontend

Per i file già caricati, è possibile mostrare contenuti di anteprima diversi nell'interfaccia frontend in base al tipo di file. Il campo allegati del file manager include una anteprima basata sul browser (integrata in un iframe), che supporta la visualizzazione della maggior parte dei formati (come immagini, video, audio e PDF) direttamente nel browser. Quando un formato non è supportato dal browser o sono necessarie interazioni di anteprima speciali, è possibile estendere il componente di anteprima basato sul tipo di file.

### Esempio

Ad esempio, se vuoi integrare una anteprima online personalizzata per file Office, puoi usare il seguente codice:

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

Qui `filePreviewTypes` è l'oggetto di ingresso fornito da `@nocobase/plugin-file-manager/client` per estendere le anteprime dei file. Usa il suo metodo `add` per aggiungere un descrittore di tipo file.

Ogni tipo di file deve implementare un metodo `match()` per verificare se il tipo soddisfa i requisiti. Nell'esempio, `matchMimetype` è usato per controllare l'attributo `mimetype` del file. Se corrisponde al tipo `docx`, viene considerato il tipo da gestire. Se non corrisponde, verrà usata la gestione integrata.

La proprietà `Previewer` del descrittore di tipo è il componente usato per l'anteprima. Quando il tipo di file corrisponde, il componente verrà renderizzato nella finestra di anteprima. Puoi restituire qualsiasi vista React (ad esempio un iframe, un player o un grafico).

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

`filePreviewTypes` è un'istanza globale importata da `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Registra un nuovo descrittore di tipo file nel registro. Il tipo del descrittore è `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Metodo di corrispondenza del formato del file.

Il parametro di input `file` è l'oggetto dati di un file caricato, contenente proprietà rilevanti per il controllo del tipo:

* `mimetype`: descrizione del mimetype
* `extname`: estensione del file, inclusa la "."
* `path`: percorso di archiviazione relativo del file
* `url`: URL del file

Restituisce un valore `boolean` che indica se c'è corrispondenza.

##### `getThumbnailURL`

Restituisce l'URL della miniatura usata nell'elenco dei file. Se il valore restituito è vuoto, verrà utilizzata l'immagine segnaposto integrata.

##### `Previewer`

Un componente React per l'anteprima dei file.

Le props in ingresso sono:

* `file`: oggetto file corrente (può essere una URL stringa o un oggetto che contiene `url`/`preview`)
* `index`: indice del file nell'elenco
* `list`: elenco dei file

