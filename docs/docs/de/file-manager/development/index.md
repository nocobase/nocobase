:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweiterungsentwicklung

## Speicher-Engines erweitern

### Serverseitig

1.  **`StorageType` implementieren**
    
    Erstellen Sie eine neue Klasse und implementieren Sie die Methoden `make()` und `delete()`. Überschreiben Sie bei Bedarf Hooks wie `getFileURL()`, `getFileStream()` und `getFileData()`.

Beispiel:

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

4.  **Neuen Typ registrieren**  
    Fügen Sie die neue Speicherimplementierung im `beforeLoad`- oder `load`-Lebenszyklus des Plugins ein:

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

Nach der Registrierung erscheint die Speicherkonfiguration in der `storages`-Ressource, genau wie die integrierten Typen. Die von `StorageType.defaults()` bereitgestellte Konfiguration kann verwendet werden, um Formulare automatisch auszufüllen oder Standarddatensätze zu initialisieren.

### Clientseitige Konfiguration und Verwaltungsoberfläche
Clientseitig müssen Sie dem Dateimanager mitteilen, wie das Konfigurationsformular gerendert werden soll und ob eine benutzerdefinierte Upload-Logik vorhanden ist. Jedes Speicherobjekt enthält die folgenden Eigenschaften:

## Frontend-Dateitypen erweitern

Für hochgeladene Dateien können Sie auf der Frontend-Oberfläche je nach Dateityp unterschiedliche Vorschauinhalte anzeigen. Das Anhangsfeld des Dateimanagers verfügt über eine integrierte browserbasierte Dateivorschau (eingebettet in ein Iframe), die die direkte Vorschau der meisten Dateiformate (wie Bilder, Videos, Audio und PDFs) im Browser unterstützt. Wenn ein Dateiformat vom Browser nicht unterstützt wird oder spezielle Vorschauinteraktionen erforderlich sind, können Sie dies durch die Erweiterung der dateitypbasierten Vorschaukomponente realisieren.

### Beispiel

Wenn Sie beispielsweise einen Bilddateityp um eine Karussell-Komponente erweitern möchten, können Sie den folgenden Code verwenden:

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

Dabei ist `attachmentFileTypes` das im `@nocobase/client`-Paket bereitgestellte Einstiegsobjekt zur Erweiterung von Dateitypen. Verwenden Sie dessen `add`-Methode, um ein Dateityp-Beschreibungsobjekt zu erweitern.

Jeder Dateityp muss eine `match()`-Methode implementieren, um zu prüfen, ob der Dateityp die Anforderungen erfüllt. Im Beispiel wird die vom `mime-match`-Paket bereitgestellte Methode verwendet, um das `mimetype`-Attribut der Datei zu überprüfen. Wenn es dem Typ `image/*` entspricht, wird es als der zu verarbeitende Dateityp angesehen. Wenn keine Übereinstimmung gefunden wird, wird auf die integrierte Typbehandlung zurückgegriffen.

Die `Previewer`-Eigenschaft des Typ-Beschreibungsobjekts ist die Komponente, die für die Vorschau verwendet wird. Wenn der Dateityp übereinstimmt, wird diese Komponente zur Vorschau gerendert. Es wird generell empfohlen, eine Dialog-Komponente (wie `<Modal />` usw.) als Basiscontainer zu verwenden und dann den Vorschau- und interaktiven Inhalt in diese Komponente zu platzieren, um die Vorschaufunktion zu implementieren.

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

`attachmentFileTypes` ist eine globale Instanz, die aus `@nocobase/client` importiert wird:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registriert ein neues Dateityp-Beschreibungsobjekt beim Dateityp-Registrierungszentrum. Der Typ des Beschreibungsobjekts ist `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Methode zur Dateiformat-Übereinstimmung.

Der Eingabeparameter `file` ist das Datenobjekt einer hochgeladenen Datei, das relevante Eigenschaften zur Typbestimmung enthält:

*   `mimetype`: mimetype Beschreibung
*   `extname`: Dateierweiterung, einschließlich des "."
*   `path`: relativer Speicherpfad der Datei
*   `url`: Datei-URL

Der Rückgabewert ist vom Typ `boolean` und gibt an, ob eine Übereinstimmung vorliegt.

##### `Previewer`

Eine React-Komponente zur Dateivorschau.

Die übergebenen Props-Parameter sind:

*   `index`: Index der Datei in der Anhangsliste
*   `list`: Anhangsliste
*   `onSwitchIndex`: Eine Methode zum Wechseln des Indexes

`onSwitchIndex` kann einen beliebigen Index aus der Liste übergeben werden, um zu einer anderen Datei zu wechseln. Wenn `null` als Argument übergeben wird, wird die Vorschaukomponente direkt geschlossen.

```ts
onSwitchIndex(null);
```