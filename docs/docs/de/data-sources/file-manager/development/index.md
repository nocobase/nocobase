:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweiterungsentwicklung

## Erweitern von Frontend-Dateitypen

Für hochgeladene Dateien kann die Frontend-Oberfläche je nach Dateityp unterschiedliche Vorschauinhalte anzeigen. Das Anhangsfeld des Dateimanagers verfügt über eine integrierte browserbasierte (iframe) Dateivorschau. Diese Methode unterstützt die direkte Vorschau der meisten Dateiformate (wie Bilder, Videos, Audio und PDFs) direkt im Browser. Wenn ein Dateityp nicht für die Browser-Vorschau unterstützt wird oder spezielle Interaktionen erforderlich sind, können Sie dies durch die Erweiterung von Vorschaukomponenten basierend auf dem Dateityp realisieren.

### Beispiel

Wenn Sie beispielsweise eine Karussell-Komponente für Bilddateien erweitern möchten, können Sie den folgenden Code verwenden:

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

`attachmentFileTypes` ist ein Einstiegsobjekt, das vom `@nocobase/client`-Paket bereitgestellt wird, um Dateitypen zu erweitern. Sie können dessen `add`-Methode verwenden, um ein Dateityp-Deskriptor-Objekt zu erweitern.

Jeder Dateityp muss eine `match()`-Methode implementieren, um zu prüfen, ob der Dateityp die Anforderungen erfüllt. Im Beispiel wird die `mimetype`-Eigenschaft der Datei mithilfe der vom `mime-match`-Paket bereitgestellten Methode überprüft. Wenn sie dem Typ `image/*` entspricht, wird sie als zu verarbeitender Dateityp betrachtet. Wenn keine Übereinstimmung gefunden wird, wird auf den integrierten Typ zurückgegriffen.

Die `Previewer`-Eigenschaft des Typdeskriptor-Objekts ist die Komponente, die für die Vorschau verwendet wird. Wenn der Dateityp übereinstimmt, wird diese Komponente für die Vorschau gerendert. Es wird generell empfohlen, eine Modal-Komponente (wie `<Modal />`) als Basis-Container zu verwenden und den Vorschau- und interaktiven Inhalt in diese Komponente zu platzieren, um die Vorschaufunktion zu implementieren.

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

`attachmentFileTypes` ist eine globale Instanz, die aus dem `@nocobase/client`-Paket importiert wird:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registriert ein neues Dateityp-Deskriptor-Objekt im Dateityp-Register. Der Typ des Deskriptor-Objekts ist `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Methode zum Abgleichen von Dateiformaten.

Der Parameter `file` ist ein Datenobjekt für die hochgeladene Datei, das relevante Eigenschaften zur Typbestimmung enthält:

*   `mimetype`: Der Mimetype der Datei.
*   `extname`: Die Dateierweiterung, einschließlich des Punkts (`.`).
*   `path`: Der relative Speicherpfad der Datei.
*   `url`: Die URL der Datei.

Der Rückgabewert ist vom Typ `boolean` und zeigt an, ob eine Übereinstimmung vorliegt.

##### `Previewer`

Eine React-Komponente zur Vorschau der Datei.

Die übergebenen Props sind:

*   `index`: Der Index der Datei in der Anhangsliste.
*   `list`: Die Liste der Anhänge.
*   `onSwitchIndex`: Eine Methode zum Wechseln des Index.

`onSwitchIndex` kann mit einem beliebigen Index aus der `list` aufgerufen werden, um zu einer anderen Datei zu wechseln. Wenn Sie `null` als Parameter übergeben, wird die Vorschaukomponente direkt geschlossen.

```ts
onSwitchIndex(null);
```