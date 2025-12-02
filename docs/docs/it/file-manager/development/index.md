:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Sviluppo di Estensioni

## Estensione dei Motori di Archiviazione

### Lato Server

1.  **Ereditare `StorageType`**

    Creare una nuova classe e implementare i metodi `make()` e `delete()`, e, se necessario, sovrascrivere i hook come `getFileURL()`, `getFileStream()`, `getFileData()`.

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

4.  **Registrare il nuovo tipo**
    Iniettare la nuova implementazione di archiviazione nel ciclo di vita `beforeLoad` o `load` del plugin:

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

Dopo la registrazione, la configurazione di archiviazione apparirà nella risorsa `storages`, proprio come i tipi integrati. La configurazione fornita da `StorageType.defaults()` può essere utilizzata per compilare automaticamente i moduli o inizializzare i record predefiniti.

### Configurazione lato client e interfaccia di gestione
Sul lato client, è necessario informare il gestore di file su come renderizzare il modulo di configurazione e se esiste una logica di caricamento personalizzata. Ogni oggetto tipo di archiviazione contiene le seguenti proprietà:

## Estensione dei Tipi di File Frontend

Per i file già caricati, l'interfaccia frontend può mostrare contenuti di anteprima diversi in base al tipo di file. Il campo allegato del gestore di file include un'anteprima di file basata su browser (incorporata in un iframe), che supporta la visualizzazione diretta nella maggior parte dei formati (come immagini, video, audio e PDF). Quando un formato di file non è supportato per l'anteprima dal browser, o quando sono richieste interazioni di anteprima speciali, è possibile estendere il componente di anteprima basato sul tipo di file.

### Esempio

Ad esempio, per estendere un tipo di file immagine con un componente di scorrimento (carousel), è possibile utilizzare il seguente codice:

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

Qui, `attachmentFileTypes` è l'oggetto di ingresso fornito nel pacchetto `@nocobase/client` per estendere i tipi di file. Utilizzi il suo metodo `add` per estendere un oggetto di descrizione del tipo di file.

Ogni tipo di file deve implementare un metodo `match()` per verificare se il tipo di file soddisfa i requisiti. Nell'esempio, il metodo fornito dal pacchetto `mime-match` viene utilizzato per controllare l'attributo `mimetype` del file. Se corrisponde al tipo `image/*`, viene considerato il tipo di file da elaborare. Se non viene trovata alcuna corrispondenza, si ripiegherà sulla gestione del tipo integrata.

La proprietà `Previewer` sull'oggetto di descrizione del tipo è il componente utilizzato per l'anteprima. Quando il tipo di file corrisponde, questo componente verrà renderizzato per la visualizzazione. Si consiglia generalmente di utilizzare un componente di tipo finestra di dialogo (come `<Modal />`) come contenitore di base, e quindi inserire l'anteprima e il contenuto interattivo all'interno di tale componente per implementare la funzionalità di anteprima.

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

`attachmentFileTypes` è un'istanza globale, importata da `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registra un nuovo oggetto di descrizione del tipo di file nel registro dei tipi di file. Il tipo dell'oggetto di descrizione è `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metodo di corrispondenza del formato file.

Il parametro di input `file` è l'oggetto dati di un file caricato, contenente proprietà rilevanti che possono essere utilizzate per il controllo del tipo:

*   `mimetype`: descrizione del mimetype
*   `extname`: estensione del file, incluso il "."
*   `path`: percorso di archiviazione relativo del file
*   `url`: URL del file

Restituisce un valore `boolean` che indica se c'è una corrispondenza.

##### `Previewer`

Un componente React per l'anteprima dei file.

I Props in ingresso sono:

*   `index`: L'indice del file nell'elenco degli allegati
*   `list`: L'elenco degli allegati
*   `onSwitchIndex`: Un metodo per cambiare l'indice

`onSwitchIndex` può accettare qualsiasi valore di indice dalla lista per passare a un altro file. Se `null` viene passato come argomento, il componente di anteprima verrà chiuso direttamente.

```ts
onSwitchIndex(null);
```