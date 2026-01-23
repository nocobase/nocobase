:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Extensieontwikkeling

## Frontend bestandstypen uitbreiden

Voor geüploade bestanden kan de frontend-interface verschillende voorbeelden weergeven, afhankelijk van het bestandstype. Het bijlageveld van de bestandsbeheerder heeft een ingebouwde, browsergebaseerde (ingebed in een iframe) bestandsvoorbeeldweergave. Deze methode ondersteunt de meeste bestandsformaten (zoals afbeeldingen, video's, audio en PDF's) voor directe weergave in de browser. Wanneer een bestandsformaat niet wordt ondersteund voor browserweergave, of wanneer er speciale interactie nodig is, kunt u dit realiseren door preview-componenten uit te breiden op basis van het bestandstype.

### Voorbeeld

Als u bijvoorbeeld een carrouselcomponent wilt toevoegen voor afbeeldingsbestanden, kunt u dit doen met de volgende code:

```ts
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

`attachmentFileTypes` is een ingangsobject dat wordt aangeboden door het `@nocobase/client` pakket voor het uitbreiden van bestandstypen. U kunt de `add`-methode gebruiken om een bestandstypebeschrijvingsobject uit te breiden.

Elk bestandstype moet een `match()`-methode implementeren om te controleren of het bestandstype aan de vereisten voldoet. In het voorbeeld wordt de `mimetype`-eigenschap van het bestand gecontroleerd met behulp van de methode die wordt aangeboden door het `mime-match` pakket. Als het overeenkomt met het type `image/*`, wordt het beschouwd als een bestandstype dat verwerkt moet worden. Als er geen overeenkomst is, wordt teruggevallen op de ingebouwde typeverwerking.

De `Previewer`-eigenschap op het typebeschrijvingsobject is de component die wordt gebruikt voor de preview. Wanneer het bestandstype overeenkomt, wordt deze component gerenderd voor de weergave. Het wordt doorgaans aanbevolen om een modaal component (zoals `<Modal />`) als basiscontainer te gebruiken en vervolgens de preview en de interactieve inhoud in die component te plaatsen om de preview-functionaliteit te realiseren.

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

`attachmentFileTypes` is een globale instantie die u importeert vanuit het `@nocobase/client` pakket:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registreert een nieuw bestandstypebeschrijvingsobject bij het register voor bestandstypen. Het type van het beschrijvingsobject is `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Een methode voor het matchen van bestandsformaten.

De `file`-parameter is een data-object voor het geüploade bestand, dat relevante eigenschappen bevat die kunnen worden gebruikt voor typecontrole:

*   `mimetype`: De mimetype van het bestand.
*   `extname`: De bestandsextensie, inclusief de '.'.
*   `path`: Het relatieve opslagpad van het bestand.
*   `url`: De URL van het bestand.

Retourneert een `boolean` die aangeeft of het bestand overeenkomt.

##### `Previewer`

Een React-component voor het previewen van het bestand.

Props:

*   `index`: De index van het bestand in de bijlagelijst.
*   `list`: De lijst met bijlagen.
*   `onSwitchIndex`: Een functie om het gepreviewde bestand te wisselen op basis van de index.

De `onSwitchIndex`-functie kan worden aangeroepen met elke index uit de `list` om naar een ander bestand te schakelen. Als u `null` als parameter gebruikt, wordt de preview-component direct gesloten.

```ts
onSwitchIndex(null);
```