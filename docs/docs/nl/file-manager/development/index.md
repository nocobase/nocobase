:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Uitbreidingen ontwikkelen

## Opslag-engines uitbreiden

### Server-side

1.  **`StorageType` overerven**
    
    Maak een nieuwe klasse aan en implementeer de methoden `make()` en `delete()`. Indien nodig, overschrijf dan hooks zoals `getFileURL()`, `getFileStream()` en `getFileData()`.

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

4.  **Het nieuwe type registreren**  
    Injecteer de nieuwe opslagimplementatie in de `beforeLoad`- of `load`-lifecycle van de plugin:

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

Na registratie verschijnt de opslagconfiguratie in de `storages`-resource, net als de ingebouwde typen. De configuratie die `StorageType.defaults()` biedt, kunt u gebruiken om formulieren automatisch in te vullen of standaardrecords te initialiseren.

### Client-side configuratie en beheerinterface
Aan de client-side moet u de bestandsbeheerder informeren hoe de configuratieformulieren moeten worden gerenderd en of er aangepaste uploadlogica aanwezig is. Elk opslagtype-object bevat de volgende eigenschappen:

## Frontend bestandstypen uitbreiden

Voor reeds geüploade bestanden kunt u op de frontend-interface verschillende preview-inhoud weergeven, afhankelijk van het bestandstype. Het bijlageveld van de bestandsbeheerder heeft een ingebouwde, browsergebaseerde bestandsvoorbeeldweergave (ingebed in een iframe). Deze methode ondersteunt de meeste bestandsformaten (zoals afbeeldingen, video's, audio en PDF's) die direct in de browser kunnen worden bekeken. Wanneer een bestandsformaat niet wordt ondersteund voor browserpreview, of wanneer er speciale interacties voor de preview nodig zijn, kunt u dit realiseren door de bestandstype-gebaseerde preview-component uit te breiden.

### Voorbeeld

Als u bijvoorbeeld een carrouselcomponent wilt toevoegen aan een afbeeldingstype, kunt u de volgende code gebruiken:

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

Hier is `attachmentFileTypes` het entry-object dat wordt geleverd in het `@nocobase/client`-pakket voor het uitbreiden van bestandstypen. Gebruik de `add`-methode om een bestandstype-beschrijvingsobject uit te breiden.

Elk bestandstype moet een `match()`-methode implementeren om te controleren of het bestandstype aan de vereisten voldoet. In het voorbeeld wordt de methode van het `mime-match`-pakket gebruikt om het `mimetype`-attribuut van het bestand te controleren. Als het overeenkomt met het `image/*`-type, wordt het beschouwd als het te verwerken bestandstype. Als er geen overeenkomst wordt gevonden, wordt teruggevallen op de ingebouwde typeverwerking.

De `Previewer`-eigenschap op het typebeschrijvingsobject is de component die wordt gebruikt voor de preview. Wanneer het bestandstype overeenkomt, wordt deze component gerenderd voor de preview. Over het algemeen wordt aangeraden om een dialoogvenster-achtige component (zoals `<Modal />`) als basiscontainer te gebruiken en vervolgens de preview en de interactieve inhoud daarin te plaatsen om de preview-functionaliteit te implementeren.

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

`attachmentFileTypes` is een globale instantie, te importeren vanuit `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registreert een nieuw bestandstype-beschrijvingsobject bij het register voor bestandstypen. Het type van het beschrijvingsobject is `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Methode voor het matchen van bestandsformaten.

De invoerparameter `file` is het data-object van een geüpload bestand, dat relevante eigenschappen bevat die kunnen worden gebruikt voor typebepaling:

*   `mimetype`: beschrijving van het mimetype
*   `extname`: bestandsextensie, inclusief de "."
*   `path`: relatief opslagpad van het bestand
*   `url`: URL van het bestand

Retourneert een `boolean`-waarde die aangeeft of er een overeenkomst is.

##### `Previewer`

Een React-component voor het previewen van bestanden.

De inkomende Props zijn:

*   `index`: De index van het bestand in de bijlagelijst
*   `list`: De bijlagelijst
*   `onSwitchIndex`: Een methode voor het wisselen van de index

U kunt `onSwitchIndex` elke willekeurige index uit de lijst meegeven om naar een ander bestand te schakelen. Als `null` als argument wordt meegegeven, wordt de preview-component direct gesloten.

```ts
onSwitchIndex(null);
```