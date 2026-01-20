:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Разработка расширений

## Расширение движков хранения

### Серверная часть

1.  **Наследование `StorageType`**

    Создайте новый класс и реализуйте методы `make()` и `delete()`. При необходимости переопределите хуки, такие как `getFileURL()`, `getFileStream()` и `getFileData()`.

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

4.  **Регистрация нового типа**
    Внедрите новую реализацию хранилища в жизненном цикле `beforeLoad` или `load` вашего плагина:

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

После регистрации конфигурация хранилища появится в ресурсе `storages`, так же как и для встроенных типов. Конфигурация, предоставляемая `StorageType.defaults()`, может быть использована для автоматического заполнения форм или инициализации записей по умолчанию.

### Конфигурация на стороне клиента и интерфейс управления
На стороне клиента необходимо сообщить файловому менеджеру, как отображать форму конфигурации и есть ли пользовательская логика загрузки. Каждый объект типа хранилища содержит следующие свойства:

## Расширение типов файлов на фронтенде

Для уже загруженных файлов вы можете отображать различное содержимое предварительного просмотра в пользовательском интерфейсе в зависимости от их типа. Поле вложений файлового менеджера имеет встроенный предварительный просмотр файлов на основе браузера (встроенный в iframe), который поддерживает большинство форматов файлов (таких как изображения, видео, аудио и PDF) непосредственно в браузере. Если формат файла не поддерживается для предварительного просмотра в браузере или требуются специальные интерактивные возможности предварительного просмотра, вы можете расширить компонент предварительного просмотра на основе типа файла.

### Пример

Например, если вы хотите расширить тип файла изображения компонентом карусели, вы можете использовать следующий код:

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

Здесь `attachmentFileTypes` — это объект-точка входа, предоставляемый в пакете `@nocobase/client` для расширения типов файлов. Используйте его метод `add` для расширения объекта описания типа файла.

Каждый тип файла должен реализовать метод `match()`, чтобы проверить, соответствует ли тип файла требованиям. В примере метод, предоставляемый пакетом `mime-match`, используется для проверки атрибута `mimetype` файла. Если он соответствует типу `image/*`, то считается, что это тип файла, который необходимо обработать. Если совпадение не найдено, будет использоваться встроенная обработка типа.

Свойство `Previewer` в объекте описания типа — это компонент, используемый для предварительного просмотра. Когда тип файла совпадает, этот компонент будет отображен для предварительного просмотра. Обычно рекомендуется использовать компонент типа диалогового окна (например, `<Modal />`) в качестве базового контейнера, а затем помещать в него содержимое предварительного просмотра и интерактивные элементы для реализации функции предварительного просмотра.

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

`attachmentFileTypes` — это глобальный экземпляр, импортируемый из `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Регистрирует новый объект описания типа файла в реестре типов файлов. Тип объекта описания — `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Метод сопоставления формата файла.

Входной параметр `file` — это объект данных загруженного файла, содержащий соответствующие свойства, которые можно использовать для определения типа:

*   `mimetype`: описание mimetype
*   `extname`: расширение файла, включая "."
*   `path`: относительный путь хранения файла
*   `url`: URL файла

Возвращает значение типа `boolean`, указывающее на результат совпадения.

##### `Previewer`

React-компонент для предварительного просмотра файлов.

Входящие параметры Props:

*   `index`: индекс файла в списке вложений
*   `list`: список вложений
*   `onSwitchIndex`: метод для переключения индекса

В `onSwitchIndex` можно передать любой индекс из списка для переключения на другой файл. Если в качестве аргумента передается `null`, компонент предварительного просмотра будет закрыт.

```ts
onSwitchIndex(null);
```