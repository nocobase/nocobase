:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozwój rozszerzeń

## Rozszerzanie silników przechowywania danych

### Strona serwera

1.  **Dziedziczenie po `StorageType`**

    Proszę utworzyć nową klasę i zaimplementować metody `make()` oraz `delete()`. W razie potrzeby proszę nadpisać haki (hooks) takie jak `getFileURL()`, `getFileStream()` czy `getFileData()`.

Przykład:

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

4.  **Rejestracja nowego typu**
    Proszę wstrzyknąć nową implementację przechowywania danych w cyklu życia wtyczki (`plugin`) `beforeLoad` lub `load`:

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

Po rejestracji konfiguracja przechowywania danych pojawi się w zasobie `storages`, podobnie jak w przypadku wbudowanych typów. Konfiguracja dostarczona przez `StorageType.defaults()` może być użyta do automatycznego wypełniania formularzy lub inicjalizacji domyślnych rekordów.

### Konfiguracja po stronie klienta i interfejs zarządzania
Po stronie klienta należy poinformować menedżera plików, jak renderować formularz konfiguracyjny oraz czy istnieje niestandardowa logika przesyłania plików. Każdy obiekt typu przechowywania danych zawiera następujące właściwości:

## Rozszerzanie typów plików front-endowych

Dla już przesłanych plików, w interfejsie front-endowym można wyświetlać różne treści podglądu w zależności od ich typu. Pole załączników menedżera plików ma wbudowany podgląd plików oparty na przeglądarce (osadzony w `iframe`), który obsługuje podgląd większości formatów plików (takich jak obrazy, wideo, audio i PDF) bezpośrednio w przeglądarce. Gdy format pliku nie jest obsługiwany przez przeglądarkę do podglądu, lub gdy wymagane są specjalne interakcje podglądu, można to osiągnąć poprzez rozszerzenie komponentu podglądu opartego na typie pliku.

### Przykład

Na przykład, jeśli chcieliby Państwo rozszerzyć typ pliku obrazu o komponent karuzeli, można to zrobić za pomocą poniższego kodu:

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

`attachmentFileTypes` to obiekt wejściowy dostarczony w pakiecie `@nocobase/client`, służący do rozszerzania typów plików. Proszę użyć jego metody `add`, aby rozszerzyć obiekt opisu typu pliku.

Każdy typ pliku musi implementować metodę `match()`, która sprawdza, czy typ pliku spełnia wymagania. W przykładzie, metoda dostarczona przez pakiet `mime-match` jest używana do sprawdzania atrybutu `mimetype` pliku. Jeśli pasuje do typu `image/*`, jest to uznawane za typ pliku do przetworzenia. Jeśli nie zostanie znalezione dopasowanie, system powróci do wbudowanej obsługi typu.

Właściwość `Previewer` w obiekcie opisu typu to komponent używany do podglądu. Gdy typ pliku pasuje, ten komponent zostanie wyrenderowany w celu podglądu. Zazwyczaj zaleca się użycie komponentu typu okna dialogowego (np. `<Modal />`) jako podstawowego kontenera, a następnie umieszczenie w nim podglądu i treści wymagającej interakcji, aby zaimplementować funkcjonalność podglądu.

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

`attachmentFileTypes` to globalna instancja, którą importuje się z `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Rejestruje nowy obiekt opisu typu pliku w rejestrze typów plików. Typ obiektu opisu to `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Metoda dopasowywania formatu pliku.

Parametr wejściowy `file` to obiekt danych przesłanego pliku, zawierający odpowiednie właściwości, które mogą być użyte do sprawdzenia typu:

*   `mimetype`: opis typu MIME
*   `extname`: rozszerzenie pliku, zawierające „.”
*   `path`: względna ścieżka przechowywania pliku
*   `url`: adres URL pliku

Zwraca wartość typu `boolean`, wskazującą, czy nastąpiło dopasowanie.

##### `Previewer`

Komponent React służący do podglądu plików.

Przekazywane parametry Props to:

*   `index`: indeks pliku na liście załączników
*   `list`: lista załączników
*   `onSwitchIndex`: metoda do przełączania indeksu

Metoda `onSwitchIndex` może przyjąć dowolny indeks z listy, aby przełączyć się na inny plik. Jeśli jako argument zostanie przekazane `null`, komponent podglądu zostanie bezpośrednio zamknięty.

```ts
onSwitchIndex(null);
```