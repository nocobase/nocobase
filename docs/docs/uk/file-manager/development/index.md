:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::

# Розробка розширень

## Розширення механізмів зберігання

### Серверна частина

1. **Успадкувати `StorageType`**
   
   Створіть новий клас і реалізуйте методи `make()` та `delete()`. За потреби перевизначте хуки `getFileURL()`, `getFileStream()` і `getFileData()`.

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

4. **Зареєструвати новий тип**  
   Впровадьте нову реалізацію сховища в життєвий цикл `beforeLoad` або `load` плагіна:

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

Після реєстрації конфігурація сховища з’явиться у ресурсі `storages`, як і вбудовані типи. Конфігурацію, що надає `StorageType.defaults()`, можна використовувати для автозаповнення форм або ініціалізації записів за замовчуванням.

<!--
### Налаштування на стороні клієнта та інтерфейс керування
На стороні клієнта потрібно повідомити файловий менеджер, як рендерити форму налаштувань і чи є власна логіка завантаження. Кожен об’єкт типу сховища містить такі властивості:
-->

## Розширення типів файлів у фронтенді

Для вже завантажених файлів можна відображати різний вміст попереднього перегляду у фронтенд-інтерфейсі залежно від типу файлу. Поле вкладень файлового менеджера має вбудований перегляд файлів на базі браузера (всередині iframe), який підтримує перегляд більшості форматів (зображення, відео, аудіо та PDF) безпосередньо у браузері. Якщо формат не підтримується браузером або потрібні спеціальні взаємодії, можна розширити компонент попереднього перегляду за типом файлу.

### Приклад

Наприклад, якщо ви хочете інтегрувати кастомний онлайн-перегляд для файлів Office, можна використати такий код:

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

Тут `filePreviewTypes` — це вхідний об’єкт, що надається `@nocobase/plugin-file-manager/client` для розширення попереднього перегляду файлів. Використовуйте метод `add`, щоб додати об’єкт опису типу файлу.

Кожен тип файлу має реалізувати метод `match()` для перевірки відповідності. У прикладі `matchMimetype` використовується для перевірки атрибуту `mimetype` файлу. Якщо він відповідає типу `docx`, файл вважається таким, що підлягає обробці. Якщо не відповідає, використовується вбудована обробка.

Властивість `Previewer` в об’єкті опису типу — це компонент для перегляду. Коли тип файлу співпадає, цей компонент рендериться у діалозі перегляду. Можна повернути будь-який React-вид (наприклад, iframe, плеєр або діаграму).

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

`filePreviewTypes` — це глобальний екземпляр, імпортований з `@nocobase/plugin-file-manager/client`:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

Реєструє новий об’єкт опису типу файлу у реєстрі типів файлів. Тип об’єкта опису — `FilePreviewType`.

#### `FilePreviewType`

##### `match()`

Метод зіставлення формату файлу.

Вхідний параметр `file` — це об’єкт даних завантаженого файлу, що містить властивості для перевірки типу:

* `mimetype`: опис mimetype
* `extname`: розширення файлу, включно з "."
* `path`: відносний шлях зберігання файлу
* `url`: URL файлу

Повертає `boolean`, що вказує на результат зіставлення.

##### `getThumbnailURL`

Повертає URL мініатюри, яка використовується у списку файлів. Якщо значення порожнє, буде використано вбудоване зображення-заповнювач.

##### `Previewer`

React-компонент для попереднього перегляду файлів.

Передані Props:

* `file`: поточний об’єкт файлу (може бути рядком URL або об’єктом з `url`/`preview`)
* `index`: індекс файлу у списку
* `list`: список файлів

