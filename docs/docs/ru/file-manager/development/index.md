# Разработка расширений

## Расширение движков хранения

### Серверная часть

1. **Унаследоваться от `StorageType`**
   
   Создайте новый класс и реализуйте методы `make()` и `delete()`, а при необходимости переопределите хуки вроде `getFileURL()`, `getFileStream()`, `getFileData()`.

Пример:

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

4. **Зарегистрировать новый тип**  
   Подключите новую реализацию хранилища в жизненном цикле `beforeLoad` или `load` плагина:

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

После регистрации конфигурация хранилища появится в ресурсе `storages`, как и встроенные типы. Конфигурацию, предоставляемую `StorageType.defaults()`, можно использовать для автозаполнения форм или инициализации записей по умолчанию.

<!--
### Клиентская конфигурация и интерфейс управления
На стороне клиента нужно указать файловому менеджеру, как отрисовывать форму конфигурации и есть ли пользовательская логика загрузки. Каждый объект типа хранилища содержит следующие свойства:
-->

## Расширение типов файлов на фронтенде

Для загруженных файлов вы можете показывать разный предпросмотр на фронтенде в зависимости от типа файла. Поле вложений менеджера файлов имеет встроенный предпросмотр в браузере (встраивается в iframe), который поддерживает предпросмотр большинства форматов (например, изображений, видео, аудио и PDF) прямо в браузере. Если формат не поддерживается браузером для предпросмотра или требуется особое взаимодействие, можно расширить компонент предпросмотра по типу файла.

### Пример

Например, если вы хотите подключить пользовательский онлайн-предпросмотр Office-файлов, используйте следующий код:

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

Здесь `filePreviewTypes` — это объект входа, который предоставляет `@nocobase/plugin-file-manager/client` для расширения предпросмотра файлов. Используйте метод `add`, чтобы добавить дескриптор типа файла.

Каждый тип файла должен реализовать метод `match()`, который проверяет, подходит ли файл. В примере используется `matchMimetype` для проверки свойства `mimetype`. Если MIME совпадает с типом `docx`, считается, что этот тип нужно обработать; если нет — будет использована встроенная обработка.

Свойство `Previewer` в дескрипторе — это компонент предпросмотра. Когда файл соответствует типу, этот компонент будет отрисован в диалоге предпросмотра. Вы можете вернуть любой React-вид (например, iframe, плеер или график).

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

`filePreviewTypes` — глобальный экземпляр, импортируется из `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Регистрирует новый дескриптор типа файла в реестре типов. Тип дескриптора — `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Метод сопоставления формата файла.

Входной параметр `file` — объект данных загруженного файла, содержащий свойства, которые можно использовать для проверки типа:

* `mimetype`: описание mime-типа
* `extname`: расширение файла, включая "."
* `path`: относительный путь хранения файла
* `url`: URL файла

Возвращает `boolean`, указывающий, соответствует ли файл.

##### `getThumbnailURL`

Возвращает URL миниатюры для списка файлов. Если возвращаемое значение пустое, будет использовано встроенное изображение-заполнитель.

##### `Previewer`

React-компонент для предпросмотра файлов.

Входящие Props:

* `file`: текущий объект файла (может быть строкой URL или объектом с `url`/`preview`)
* `index`: индекс файла в списке
* `list`: список файлов