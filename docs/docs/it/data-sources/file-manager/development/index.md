:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Sviluppo di Estensioni

## Estensione dei Tipi di File Frontend

Per i file caricati, l'interfaccia utente (UI) frontend può mostrare diverse anteprime in base al tipo di file. Il campo allegato del gestore file include una funzione di anteprima basata sul browser (integrata in un iframe), che supporta la maggior parte dei tipi di file (come immagini, video, audio e PDF) per una visualizzazione diretta nel browser. Quando un tipo di file non è supportato per l'anteprima nel browser o richiede un'interazione speciale, è possibile estendere i componenti di anteprima in base al tipo di file.

### Esempio

Ad esempio, se desidera estendere un componente carosello per i file immagine, può utilizzare il seguente codice:

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

`attachmentFileTypes` è un oggetto di ingresso fornito dal pacchetto `@nocobase/client` per estendere i tipi di file. Può utilizzare il suo metodo `add` per estendere un descrittore di tipo di file.

Ogni tipo di file deve implementare un metodo `match()` per verificare se il tipo di file soddisfa i requisiti. Nell'esempio, il pacchetto `mime-match` viene utilizzato per controllare l'attributo `mimetype` del file. Se corrisponde a `image/*`, viene considerato un tipo di file che necessita di elaborazione. Se non corrisponde, verrà utilizzato il gestore di tipo predefinito.

La proprietà `Previewer` sull'oggetto descrittore del tipo è il componente utilizzato per l'anteprima. Quando il tipo di file corrisponde, questo componente verrà renderizzato per la visualizzazione. Si consiglia generalmente di utilizzare un componente modale (come `<Modal />`) come contenitore di base e di inserire l'anteprima e il contenuto interattivo all'interno di tale componente per implementare la funzionalità di anteprima.

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

`attachmentFileTypes` è un'istanza globale importata dal pacchetto `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registra un nuovo descrittore di tipo di file nel registro dei tipi di file. Il tipo del descrittore è `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Un metodo per la corrispondenza dei formati di file.

Il parametro `file` è un oggetto dati per il file caricato, contenente proprietà che possono essere utilizzate per il controllo del tipo:

*   `mimetype`: Il mimetype del file.
*   `extname`: L'estensione del file, incluso il ".".
*   `path`: Il percorso di archiviazione relativo del file.
*   `url`: L'URL del file.

Restituisce un valore di tipo `boolean` che indica se il file corrisponde.

##### `Previewer`

Un componente React per l'anteprima del file.

Parametri Props:

*   `index`: L'indice del file nell'elenco degli allegati.
*   `list`: L'elenco degli allegati.
*   `onSwitchIndex`: Una funzione per cambiare il file visualizzato tramite il suo indice.

La funzione `onSwitchIndex` può essere chiamata con qualsiasi indice della `list` per passare a un altro file. Chiamandola con `null` si chiude il componente di anteprima.

```ts
onSwitchIndex(null);
```