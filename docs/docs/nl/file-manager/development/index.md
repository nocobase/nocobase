:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Uitbreidingen ontwikkelen

## Opslag-engines uitbreiden

### Serverzijde

1. **`StorageType` erven**
   
   Maak een nieuwe klasse aan en implementeer de methoden `make()` en `delete()`. Overschrijf indien nodig hooks zoals `getFileURL()`, `getFileStream()` en `getFileData()`.

Voorbeeld:

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

4. **Nieuw type registreren**  
   Voeg de nieuwe opslagimplementatie in het `beforeLoad`- of `load`-levenscyclus van de plugin in:

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

Na registratie verschijnt de opslagconfiguratie in de `storages`-resource, net als de ingebouwde typen. De configuratie die `StorageType.defaults()` levert, kan worden gebruikt om formulieren automatisch te vullen of standaardrecords te initialiseren.

<!--
### Client-side configuratie en beheerinterface
Aan de clientzijde moet je de bestandsbeheerder informeren hoe het configuratieformulier moet worden gerenderd en of er aangepaste uploadlogica is. Elk storage-type object bevat de volgende eigenschappen:
-->

## Frontend-bestandstypen uitbreiden

Voor geüploade bestanden kun je op de frontend verschillende preview-inhoud tonen op basis van het bestandstype. Het bijlagenveld van de bestandsbeheerder heeft een ingebouwde browserpreview (ingesloten in een iframe) die de meeste bestandsformaten (zoals afbeeldingen, video, audio en PDF) direct in de browser kan tonen. Als een bestandsformaat niet door de browser wordt ondersteund of er speciale preview-interacties nodig zijn, kun je de previewcomponent per bestandstype uitbreiden.

### Voorbeeld

Als je bijvoorbeeld een aangepaste online preview voor Office-bestanden wilt integreren, kun je de volgende code gebruiken:

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

Hier is `filePreviewTypes` het instapobject dat door `@nocobase/plugin-file-manager/client` wordt geleverd om bestandspreviews uit te breiden. Gebruik de `add`-methode om een bestandstype-omschrijving toe te voegen.

Elk bestandstype moet een `match()`-methode implementeren om te controleren of het bestandstype voldoet. In het voorbeeld wordt `matchMimetype` gebruikt om het `mimetype`-attribuut van het bestand te controleren. Als het overeenkomt met het `docx`-type, wordt dit beschouwd als het type dat verwerkt moet worden. Als er geen match is, valt het terug op de ingebouwde typeverwerking.

De `Previewer`-eigenschap op de type-omschrijving is de component voor de preview. Wanneer het bestandstype overeenkomt, wordt deze component in de previewdialoog weergegeven. Je kunt elke React-weergave retourneren (zoals een iframe, speler of grafiek).

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

`filePreviewTypes` is een globale instantie die wordt geïmporteerd vanuit `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Registreert een nieuwe bestandstype-omschrijving in het bestandstype-register. Het type van de omschrijving is `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Methode voor bestandsformaatmatching.

De invoerparameter `file` is het dataobject van een geüpload bestand en bevat relevante eigenschappen voor typecontrole:

* `mimetype`: mimetype-beschrijving
* `extname`: bestandsextensie, inclusief "."
* `path`: relatieve opslagpad van het bestand
* `url`: bestand-URL

Retourneert een `boolean` die aangeeft of er een match is.

##### `getThumbnailURL`

Retourneert de miniatuur-URL die in de bestandslijst wordt gebruikt. Als de retourwaarde leeg is, wordt de ingebouwde placeholder-afbeelding gebruikt.

##### `Previewer`

Een React-component voor het previewen van bestanden.

De binnenkomende props zijn:

* `file`: het huidige bestandsobject (kan een string-URL zijn of een object met `url`/`preview`)
* `index`: index van het bestand in de lijst
* `list`: bestandslijst

