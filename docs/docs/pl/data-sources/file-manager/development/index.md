:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozwój rozszerzeń

## Rozszerzanie typów plików frontendowych

Dla przesłanych plików, interfejs użytkownika (UI) może wyświetlać różne podglądy w zależności od ich typu. Pole załączników w menedżerze plików ma wbudowaną funkcję podglądu plików w przeglądarce (osadzoną w iframe), która obsługuje większość formatów (takich jak obrazy, filmy, audio i PDF), umożliwiając ich bezpośrednie przeglądanie. Jeśli dany format pliku nie jest obsługiwany przez przeglądarkę lub wymaga specjalnych interakcji, można rozszerzyć komponenty podglądu w oparciu o typ pliku.

### Przykład

Na przykład, jeśli chcieliby Państwo rozszerzyć komponent karuzeli dla plików graficznych, mogą Państwo użyć następującego kodu:

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

`attachmentFileTypes` to obiekt wejściowy dostarczany przez pakiet `@nocobase/client`, służący do rozszerzania typów plików. Mogą Państwo użyć jego metody `add`, aby dodać deskryptor typu pliku.

Każdy typ pliku musi implementować metodę `match()`, która sprawdza, czy typ pliku spełnia określone wymagania. W przykładzie użyto pakietu `mime-match` do sprawdzenia atrybutu `mimetype` pliku. Jeśli pasuje on do typu `image/*`, jest traktowany jako typ pliku wymagający przetworzenia. W przypadku braku dopasowania, system powróci do wbudowanej obsługi typu.

Właściwość `Previewer` w deskryptorze typu to komponent używany do podglądu. Gdy typ pliku pasuje, ten komponent zostanie wyrenderowany w celu wyświetlenia podglądu. Zazwyczaj zaleca się używanie komponentu modalnego (takiego jak `<Modal />`) jako podstawowego kontenera, a następnie umieszczenie w nim podglądu i interaktywnej zawartości, aby zaimplementować funkcję podglądu.

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

`attachmentFileTypes` to globalna instancja importowana z pakietu `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Rejestruje nowy deskryptor typu pliku w rejestrze typów plików. Typ deskryptora to `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metoda do dopasowywania formatów plików.

Parametr `file` to obiekt danych dla przesłanego pliku, zawierający właściwości, które mogą być użyte do sprawdzenia typu:

*   `mimetype`: Typ MIME pliku.
*   `extname`: Rozszerzenie pliku, włącznie z kropką.
*   `path`: Względna ścieżka przechowywania pliku.
*   `url`: Adres URL pliku.

Zwraca wartość typu `boolean`, wskazującą, czy plik pasuje.

##### `Previewer`

Komponent React do podglądu pliku.

Parametry Props:

*   `index`: Indeks pliku na liście załączników.
*   `list`: Lista załączników.
*   `onSwitchIndex`: Funkcja do przełączania podglądu pliku za pomocą jego indeksu.

Funkcja `onSwitchIndex` może być wywołana z dowolnym indeksem z `listy`, aby przełączyć się na inny plik. Wywołanie jej z `null` jako parametrem spowoduje zamknięcie komponentu podglądu.

```ts
onSwitchIndex(null);
```