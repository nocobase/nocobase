---
title: "Entwicklung von Erweiterungen für den Dateimanager"
description: "Erweiterung von Vorschaukomponenten für Dateitypen, benutzerdefinierten Anhangsfeldern und der Upload-Logik auf Basis der APIs attachmentFileTypes, mime-match usw."
keywords: "Dateimanager-Erweiterung, Erweiterung von Anhangsfeldern, Dateivorschau-Erweiterung, attachmentFileTypes,NocoBase"
---

# Entwicklung von Erweiterungen

## Dateitypen im Erweiterungs-Frontend

Für bereits vollständig hochgeladene Dateien können im Frontend je nach Dateityp unterschiedliche Vorschauinhalte angezeigt werden. Das Anhangsfeld des Dateimanagers verfügt standardmäßig über eine browserbasierte Dateivorschau (eingebettet in einem iframe). Diese Methode unterstützt die direkte Vorschau der meisten Dateiformate (Bilder, Videos, Audio und PDFs usw.) im Browser. Wenn ein Dateiformat von der Browservorschau nicht unterstützt wird oder eine spezielle Interaktion für die Vorschau erforderlich ist, kann dies durch die Erweiterung von Vorschaukomponenten auf Basis des Dateityps umgesetzt werden.

### Beispiel

Wenn beispielsweise für Dateien des Typs Bild eine erweiterte Komponente zur Darstellung einer Bildergalerie gewünscht ist, kann dies mit folgendem Code umgesetzt werden:

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

Dabei ist `attachmentFileTypes` das im Paket `@nocobase/client` bereitgestellte Einstiegsobjekt zur Erweiterung von Dateitypen. Mit der bereitgestellten Methode `add` kann ein Beschreibungsobjekt für einen Dateityp erweitert werden.

Jeder Dateityp muss eine Methode `match()` implementieren, um zu prüfen, ob der Dateityp die Anforderungen erfüllt. Im Beispiel wird mit einer vom Paket `mime-match` bereitgestellten Methode die Eigenschaft `mimetype` der Datei geprüft. Wenn sie dem Typ `image/*` entspricht, wird die Datei als zu verarbeitender Dateityp betrachtet. Bei einer fehlenden Übereinstimmung wird auf die integrierte Verarbeitung des Dateityps zurückgegriffen.

Die Eigenschaft `Previewer` des Typbeschreibungsobjekts ist die für die Vorschau verwendete Komponente. Wenn der Dateityp übereinstimmt, wird diese Komponente für die Vorschau gerendert. In der Regel wird empfohlen, eine Komponente vom Typ Dialog als Basiskomponente zu verwenden (z. B. `<Modal />`) und anschließend die Vorschau sowie die erforderlichen interaktiven Inhalte in diese Komponente einzubetten, um die Vorschaufunktion zu implementieren.

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

`attachmentFileTypes` ist eine globale Instanz und wird über `@nocobase/client` importiert:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Registriert ein neues Beschreibungsobjekt für einen Dateityp in der Registrierungsstelle für Dateitypen. Der Typ des Beschreibungsobjekts ist `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Methode zum Abgleichen von Dateiformaten.

Der Parameter `file` enthält das Datenobjekt der hochgeladenen Datei und umfasst relevante Eigenschaften, die zur Typbestimmung verwendet werden können:

* `mimetype`: Beschreibung des MIME-Typs
* `extname`: Dateierweiterung einschließlich „.“
* `path`: Relativer Pfad, unter dem die Datei gespeichert ist
* `url`: URL der Datei

Der Rückgabewert ist vom Typ `boolean` und gibt an, ob eine Übereinstimmung vorliegt.

##### `Previewer`

React-Komponente zur Vorschau von Dateien.

Die übergebenen Props-Parameter sind:

* `index`: Index der Datei in der Anhangsliste
* `list`: Anhangsliste
* `onSwitchIndex`: Methode zum Wechseln des Index

Für `onSwitchIndex` kann ein beliebiger Index in einer Liste übergeben werden, um zu einer anderen Datei zu wechseln. Wenn zum Wechseln `null` als Parameter verwendet wird, wird die Vorschaukomponente direkt geschlossen.

```ts
onSwitchIndex(null);
```
