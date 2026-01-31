:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Разработка расширений

## Расширение движков хранения

### Серверная часть

1. **Наследование `StorageType`**
   
   Создайте новый класс и реализуйте методы `make()` и `delete()`. При необходимости переопределите хуки `getFileURL()`, `getFileStream()` и `getFileData()`.

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
   Внедрите новую реализацию хранилища в жизненный цикл `beforeLoad` или `load` плагина:

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

После регистрации конфигурация хранилища появится в ресурсе `storages` так же, как и встроенные типы. Конфигурацию, предоставляемую `StorageType.defaults()`, можно использовать для автозаполнения форм или инициализации записей по умолчанию.

<!--
### Настройка на стороне клиента и интерфейс управления
На стороне клиента необходимо сообщить менеджеру файлов, как отрисовывать форму настройки и есть ли пользовательская логика загрузки. Каждый объект типа хранилища содержит следующие свойства:
-->

## Расширение типов файлов на фронтенде

Для загруженных файлов можно показывать разные варианты предпросмотра в интерфейсе в зависимости от типа файла. Поле вложений файлового менеджера имеет встроенный предпросмотр в браузере (внутри iframe), который поддерживает большинство форматов (изображения, видео, аудио и PDF) напрямую в браузере. Если формат не поддерживается браузером или требуется особое взаимодействие, можно расширить компонент предпросмотра по типу файла.

### Пример

Например, если вы хотите интегрировать пользовательский онлайн-предпросмотр для файлов Office, можно использовать следующий код:

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

Здесь `filePreviewTypes` — это объект входа из `@nocobase/plugin-file-manager/client` для расширения предпросмотра файлов. Используйте метод `add`, чтобы добавить объект описания типа файла.

Каждый тип файла должен реализовать метод `match()` для проверки соответствия. В примере используется `matchMimetype` для проверки атрибута `mimetype` файла. Если он соответствует типу `docx`, файл считается подходящим. Если нет, будет использован встроенный механизм обработки типов.

Свойство `Previewer` в объекте описания типа — это компонент для предпросмотра. Когда тип файла совпадает, этот компонент рендерится в диалоге предпросмотра. Можно вернуть любой React-вид (например, iframe, плеер или график).

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

`filePreviewTypes` — это глобальный экземпляр, импортируемый из `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Регистрирует новый объект описания типа файла в реестре типов файлов. Тип описания — `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Метод сопоставления формата файла.

Входной параметр `file` — это объект данных загруженного файла, содержащий свойства, полезные для проверки типа:

* `mimetype`: описание mimetype
* `extname`: расширение файла, включая "."
* `path`: относительный путь хранения файла
* `url`: URL файла

Возвращает `boolean`, указывающий на совпадение.

##### `getThumbnailURL`

Возвращает URL миниатюры для списка файлов. Если возвращаемое значение пустое, используется встроенное изображение-заполнитель.

##### `Previewer`

React-компонент для предпросмотра файлов.

Входные Props:

* `file`: текущий объект файла (может быть строковым URL или объектом с `url`/`preview`)
* `index`: индекс файла в списке
* `list`: список файлов

