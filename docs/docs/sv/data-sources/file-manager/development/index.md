:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utveckling av tillägg

## Utöka filtyper för frontend

För uppladdade filer kan användargränssnittet visa olika förhandsgranskningar beroende på filtyp. Bilagefältet i filhanteraren har en inbyggd webbläsarbaserad (iframe) förhandsgranskning som stöder de flesta filtyper (som bilder, videor, ljud och PDF-filer) för direkt visning i webbläsaren. Om en filtyp inte stöds för webbläsarförhandsgranskning, eller om särskild interaktion krävs, kan ni utöka förhandsgranskningskomponenter baserat på filtypen.

### Exempel

Om ni till exempel vill utöka en karusellkomponent för bildfiler kan ni använda följande kod:

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

`attachmentFileTypes` är ett ingångsobjekt som tillhandahålls av paketet `@nocobase/client` för att utöka filtyper. Ni kan använda dess `add`-metod för att utöka ett filtypsbeskrivningsobjekt.

Varje filtyp måste implementera en `match()`-metod för att kontrollera om filtypen uppfyller kraven. I exemplet används metoden från paketet `mime-match` för att kontrollera filens `mimetype`-attribut. Om den matchar `image/*` anses det vara en filtyp som behöver bearbetas. Om den inte matchar, kommer den att falla tillbaka till den inbyggda typen.

Egenskapen `Previewer` på filtypsbeskrivningsobjektet är komponenten som används för förhandsgranskning. När filtypen matchar, kommer denna komponent att renderas för förhandsgranskning. Det rekommenderas generellt att använda en modal komponent (som `<Modal />`) som baskontainer och placera förhandsgranskningen samt interaktivt innehåll inuti den komponenten för att implementera förhandsgranskningsfunktionen.

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

`attachmentFileTypes` är en global instans som importeras från paketet `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registrerar ett nytt filtypsbeskrivningsobjekt i filtypsregistret. Beskrivningsobjektets typ är `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

En metod för att matcha filformat.

Parametern `file` är ett dataobjekt för den uppladdade filen, som innehåller egenskaper som kan användas för typkontroll:

*   `mimetype`: Filens mimetype.
*   `extname`: Filändelsen, inklusive ".".
*   `path`: Filens relativa lagringssökväg.
*   `url`: Filens URL.

Returnerar ett `boolean`-värde som indikerar om filen matchar.

##### `Previewer`

En React-komponent för att förhandsgranska filen.

Props:

*   `index`: Filens index i bilagelistan.
*   `list`: Bilagelistan.
*   `onSwitchIndex`: En funktion för att växla den förhandsgranskade filen med dess index.

Funktionen `onSwitchIndex` kan anropas med vilket index som helst från `list` för att växla till en annan fil. Om ni anropar den med `null` som parameter stängs förhandsgranskningskomponenten.

```ts
onSwitchIndex(null);
```