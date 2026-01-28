:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweiterungsentwicklung

## Speicher-Engines erweitern

### Serverseitig

1. **`StorageType` implementieren**
   
   Erstellen Sie eine neue Klasse und implementieren Sie die Methoden `make()` und `delete()`. Überschreiben Sie bei Bedarf Hooks wie `getFileURL()`, `getFileStream()` oder `getFileData()`.

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

4. **Neuen Typ registrieren**  
   Fügen Sie die neue Speicher-Implementierung im `beforeLoad`- oder `load`-Lifecycle des Plugins ein:

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

Nach der Registrierung erscheint die Speicher-Konfiguration in der Ressource `storages`, genau wie die integrierten Typen. Die von `StorageType.defaults()` bereitgestellte Konfiguration kann zum automatischen Ausfüllen von Formularen oder zum Initialisieren von Standarddatensätzen verwendet werden.

<!--
### Client-seitige Konfiguration und Verwaltungsoberfläche
Auf der Client-Seite müssen Sie dem Dateimanager mitteilen, wie das Konfigurationsformular gerendert wird und ob es eine benutzerdefinierte Upload-Logik gibt. Jedes Storage-Typ-Objekt enthält die folgenden Eigenschaften:
-->

## Frontend-Dateitypen erweitern

Für hochgeladene Dateien können in der Frontend-Oberfläche je nach Dateityp unterschiedliche Vorschauinhalte angezeigt werden. Das Anhangsfeld des Dateimanagers verfügt über eine integrierte browserbasierte Dateivorschau (in einem iframe), die die Vorschau der meisten Formate (z. B. Bilder, Videos, Audio und PDFs) direkt im Browser unterstützt. Wenn ein Dateiformat vom Browser nicht unterstützt wird oder spezielle Vorschau-Interaktionen erforderlich sind, können Sie die Vorschaukomponente basierend auf dem Dateityp erweitern.

### Beispiel

Wenn Sie beispielsweise eine benutzerdefinierte Online-Vorschau für Office-Dateien integrieren möchten, können Sie den folgenden Code verwenden:

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

Hier ist `filePreviewTypes` das Einstiegsobjekt aus `@nocobase/plugin-file-manager/client` zum Erweitern von Dateivorschauen. Verwenden Sie die Methode `add`, um ein Dateityp-Descriptor-Objekt hinzuzufügen.

Jeder Dateityp muss eine `match()`-Methode implementieren, um zu prüfen, ob der Dateityp die Anforderungen erfüllt. Im Beispiel wird `matchMimetype` verwendet, um das `mimetype`-Attribut der Datei zu prüfen. Wenn es dem `docx`-Typ entspricht, wird der Dateityp verarbeitet. Wenn keine Übereinstimmung gefunden wird, wird auf die integrierte Typbehandlung zurückgegriffen.

Die `Previewer`-Eigenschaft des Typ-Descriptors ist die Komponente für die Vorschau. Wenn der Dateityp übereinstimmt, wird diese Komponente im Vorschaudialog gerendert. Sie können jede React-Ansicht zurückgeben (z. B. ein iframe, einen Player oder ein Diagramm).

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

`filePreviewTypes` ist eine globale Instanz, importiert aus `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Registriert ein neues Dateityp-Descriptor-Objekt im Dateityp-Register. Der Typ des Descriptor-Objekts ist `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Methode zur Zuordnung des Dateiformats.

Der Eingabeparameter `file` ist das Datenobjekt einer hochgeladenen Datei und enthält relevante Eigenschaften zur Typprüfung:

* `mimetype`: Beschreibung des mimetype
* `extname`: Dateiendung einschließlich "."
* `path`: relativer Speicherpfad der Datei
* `url`: Datei-URL

Gibt einen `boolean`-Wert zurück, der angibt, ob es übereinstimmt.

##### `getThumbnailURL`

Gibt die Thumbnail-URL in der Dateiliste zurück. Wenn der Rückgabewert leer ist, wird das integrierte Platzhalterbild verwendet.

##### `Previewer`

Eine React-Komponente zur Vorschau von Dateien.

Die eingehenden Props sind:

* `file`: aktuelles Dateiobjekt (kann eine String-URL oder ein Objekt mit `url`/`preview` sein)
* `index`: Index der Datei in der Liste
* `list`: Dateiliste

