:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Розробка розширень

## Розширення механізмів зберігання

### На стороні сервера

1.  **Успадкування `StorageType`**

    Створіть новий клас та реалізуйте методи `make()` і `delete()`, а за потреби перевизначте хуки, такі як `getFileURL()`, `getFileStream()`, `getFileData()`.

Приклад:

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

4.  **Реєстрація нового типу**
    Впровадьте нову реалізацію сховища в життєвому циклі плагіна `beforeLoad` або `load`:

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

Після реєстрації конфігурація сховища з'явиться в ресурсі `storages`, так само як і вбудовані типи. Конфігурація, що надається `StorageType.defaults()`, може бути використана для автоматичного заповнення форм або ініціалізації записів за замовчуванням.

### Конфігурація на стороні клієнта та інтерфейс управління

На стороні клієнта необхідно повідомити файловому менеджеру, як відображати форму конфігурації та чи існує спеціальна логіка завантаження. Кожен об'єкт типу сховища містить такі властивості:

## Розширення типів файлів на фронтенді

Для вже завантажених файлів на фронтенді можна відображати різний вміст попереднього перегляду залежно від їхнього типу. Поле вкладень файлового менеджера має вбудований попередній перегляд файлів на основі браузера (вбудований в iframe), який підтримує прямий перегляд більшості форматів файлів (таких як зображення, відео, аудіо та PDF) безпосередньо в браузері. Якщо формат файлу не підтримується для попереднього перегляду в браузері, або якщо потрібні спеціальні інтерактивні можливості попереднього перегляду, ви можете розширити компонент попереднього перегляду на основі типу файлу.

### Приклад

Наприклад, якщо ви бажаєте розширити тип файлів зображень компонентом для перемикання каруселі, ви можете використати наступний код:

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

Тут `attachmentFileTypes` — це об'єкт входу, що надається в пакеті `@nocobase/client` для розширення типів файлів. Використовуйте його метод `add` для розширення об'єкта опису типу файлу.

Кожен тип файлу повинен реалізовувати метод `match()`, який перевіряє, чи відповідає тип файлу вимогам. У прикладі метод, наданий пакетом `mime-match`, використовується для перевірки атрибута `mimetype` файлу. Якщо він відповідає типу `image/*`, то вважається, що це тип файлу, який потрібно обробити. Якщо збігу не знайдено, буде використана вбудована обробка типу.

Властивість `Previewer` в об'єкті опису типу є компонентом, що використовується для попереднього перегляду. Коли тип файлу збігається, цей компонент буде відрендерено для попереднього перегляду. Зазвичай рекомендується використовувати компонент типу діалогового вікна (наприклад, `<Modal />`) як базовий контейнер, а потім розміщувати вміст попереднього перегляду та інтерактивні елементи всередині цього компонента для реалізації функції попереднього перегляду.

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

`attachmentFileTypes` — це глобальний екземпляр, який імпортується з `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Реєструє новий об'єкт опису типу файлу в реєстрі типів файлів. Тип об'єкта опису — `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Метод зіставлення формату файлу.

Вхідний параметр `file` — це об'єкт даних завантаженого файлу, що містить відповідні властивості, які можна використовувати для визначення типу:

*   `mimetype`: опис mimetype
*   `extname`: розширення файлу, включаючи "."
*   `path`: відносний шлях зберігання файлу
*   `url`: URL файлу

Повертає значення типу `boolean`, що вказує на результат збігу.

##### `Previewer`

Компонент React для попереднього перегляду файлів.

Вхідні параметри Props:

*   `index`: індекс файлу в списку вкладень
*   `list`: список вкладень
*   `onSwitchIndex`: метод для перемикання індексу

Метод `onSwitchIndex` може приймати будь-який індекс зі списку для перемикання на інший файл. Якщо як аргумент передано `null`, компонент попереднього перегляду буде закрито безпосередньо.

```ts
onSwitchIndex(null);
```