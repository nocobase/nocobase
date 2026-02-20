:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozwój rozszerzeń

## Rozszerzanie silników przechowywania danych

### Po stronie serwera

1. **Dziedziczenie `StorageType`**
   
   Utwórz nową klasę i zaimplementuj metody `make()` oraz `delete()`. W razie potrzeby nadpisz hooki takie jak `getFileURL()`, `getFileStream()` i `getFileData()`.

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

4. **Zarejestruj nowy typ**  
   Wstrzyknij nową implementację magazynu w cyklu życia `beforeLoad` lub `load` wtyczki:

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

Po rejestracji konfiguracja magazynu pojawi się w zasobie `storages`, tak jak typy wbudowane. Konfiguracja dostarczona przez `StorageType.defaults()` może być użyta do automatycznego wypełniania formularzy lub inicjalizacji domyślnych rekordów.

<!--
### Konfiguracja po stronie klienta i interfejs zarządzania
Po stronie klienta należy poinformować menedżera plików, jak renderować formularz konfiguracji i czy istnieje niestandardowa logika przesyłania. Każdy obiekt typu magazynu zawiera następujące właściwości:
-->

## Rozszerzanie typów plików w frontendzie

Dla już przesłanych plików możesz wyświetlać różne treści podglądu w interfejsie frontendowym w zależności od typu pliku. Pole załączników menedżera plików ma wbudowany podgląd oparty na przeglądarce (osadzony w iframe), który pozwala podglądać większość formatów (np. obrazy, wideo, audio i PDF) bezpośrednio w przeglądarce. Gdy format pliku nie jest obsługiwany przez przeglądarkę lub wymagane są specjalne interakcje podglądu, możesz rozszerzyć komponent podglądu oparty na typie pliku.

### Przykład

Na przykład jeśli chcesz zintegrować niestandardowy podgląd online dla plików Office, możesz użyć następującego kodu:

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

Tutaj `filePreviewTypes` to obiekt wejściowy udostępniany przez `@nocobase/plugin-file-manager/client` do rozszerzania podglądów plików. Użyj metody `add`, aby dodać obiekt opisu typu pliku.

Każdy typ pliku musi implementować metodę `match()`, aby sprawdzić, czy spełnia wymagania. W przykładzie `matchMimetype` sprawdza atrybut `mimetype` pliku. Jeśli pasuje do typu `docx`, uznaje się go za typ do obsługi. Jeśli nie pasuje, zostanie użyta wbudowana obsługa typów.

Właściwość `Previewer` w obiekcie opisu typu to komponent podglądu. Gdy typ pliku pasuje, komponent zostanie wyrenderowany w oknie podglądu. Możesz zwrócić dowolny widok React (np. iframe, odtwarzacz lub wykres).

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

`filePreviewTypes` to globalna instancja importowana z `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Rejestruje nowy obiekt opisu typu pliku w rejestrze typów plików. Typ obiektu opisu to `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Metoda dopasowania formatu pliku.

Parametr wejściowy `file` to obiekt danych przesłanego pliku, zawierający właściwości potrzebne do sprawdzenia typu:

* `mimetype`: opis mimetype
* `extname`: rozszerzenie pliku, w tym "."
* `path`: względna ścieżka przechowywania pliku
* `url`: URL pliku

Zwraca wartość `boolean`, która wskazuje, czy nastąpiło dopasowanie.

##### `getThumbnailURL`

Zwraca URL miniatury używanej w liście plików. Jeśli wartość jest pusta, zostanie użyty wbudowany obraz zastępczy.

##### `Previewer`

Komponent React do podglądu plików.

Przekazywane propsy:

* `file`: aktualny obiekt pliku (może być string URL lub obiekt zawierający `url`/`preview`)
* `index`: indeks pliku na liście
* `list`: lista plików

