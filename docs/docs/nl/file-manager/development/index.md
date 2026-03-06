:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/file-manager/development/index) voor nauwkeurige informatie.
:::

# Extensie-ontwikkeling

## Opslag-engines uitbreiden

### Serverzijde

1. **Overerven van `StorageType`**
   
   Maak een nieuwe klasse aan en implementeer de methoden `make()` en `delete()`, en overschrijf indien nodig hooks zoals `getFileURL()`, `getFileStream()` en `getFileData()`.

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
   Injecteer de nieuwe opslagimplementatie in de `beforeLoad`- of `load`-levenscyclus van de plugin:

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

Na voltooiing van de registratie verschijnt de opslagconfiguratie in de `storages`-resource, net als de ingebouwde typen. De configuratie geleverd door `StorageType.defaults()` kan worden gebruikt voor het automatisch invullen van formulieren of het initialiseren van standaardrecords.

<!--
### Client-side configuratie en beheerinterface
Aan de clientzijde moet u de bestandsbeheerder informeren hoe het configuratieformulier moet worden gerenderd en of er aangepaste uploadlogica is. Elk opslagtype-object bevat de volgende eigenschappen:
-->

## Frontend-bestandstypen uitbreiden

Voor geüploade bestanden kan op de frontend-interface verschillende preview-inhoud worden getoond op basis van verschillende bestandstypen. Het bijlageveld van de bestandsbeheerder heeft een ingebouwde browsergebaseerde bestandspreview (ingebed in een iframe), die het direct previewen van de meeste bestandsformaten (zoals afbeeldingen, video's, audio en PDF's) in de browser ondersteunt. Wanneer een bestandsformaat geen browserpreview ondersteunt, of wanneer er speciale preview-interacties nodig zijn, kunt u dit realiseren door de op bestandstype gebaseerde preview-component uit te breiden.

### Voorbeeld

Als u bijvoorbeeld een aangepaste online preview voor Office-bestanden wilt integreren, kunt u de volgende code gebruiken:

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

Hierbij is `filePreviewTypes` het toegangsobject geleverd door `@nocobase/plugin-file-manager/client` voor het uitbreiden van bestandspreviews. Gebruik de `add`-methode om een bestandstype-beschrijvingsobject uit te breiden.

Elk bestandstype moet een `match()`-methode implementeren om te controleren of het bestandstype aan de vereisten voldoet. In het voorbeeld wordt `matchMimetype` gebruikt om het `mimetype`-attribuut van het bestand te controleren. Als het overeenkomt met het `docx`-type, wordt het beschouwd als het te verwerken bestandstype. Als er geen match is, wordt er teruggevallen op de ingebouwde typeverwerking.

De eigenschap `Previewer` op het type-beschrijvingsobject is de component die wordt gebruikt voor de preview. Wanneer het bestandstype overeenkomt, wordt deze component gerenderd voor de preview. Deze component wordt gerenderd in de pop-up voor bestandspreview; u kunt elke React-view retourneren (zoals een iframe, speler, grafiek, enz.).

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

`filePreviewTypes` is een globale instantie, geïmporteerd via `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Registreert een nieuw bestandstype-beschrijvingsobject bij het bestandstype-register. Het type van het beschrijvingsobject is `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Methode voor bestandsformaat-matching.

De invoerparameter `file` is het gegevensobject van het geüploade bestand, dat relevante eigenschappen bevat die kunnen worden gebruikt voor typebepaling:

* `mimetype`: mimetype-beschrijving
* `extname`: bestandsextensie, inclusief "."
* `path`: relatief opslagpad van het bestand
* `url`: bestand-URL

De retourwaarde is van het type `boolean`, wat het resultaat van de match aangeeft.

##### `getThumbnailURL`

Wordt gebruikt om het miniatuuradres in de bestandslijst te retourneren. Wanneer de retourwaarde leeg is, wordt de ingebouwde placeholder-afbeelding gebruikt.

##### `Previewer`

React-component voor het previewen van bestanden.

De doorgegeven Props-parameters zijn:

* `file`: het huidige bestandsobject (kan een string-URL zijn of een object dat `url`/`preview` bevat)
* `index`: index van het bestand in de lijst
* `list`: bestandslijst