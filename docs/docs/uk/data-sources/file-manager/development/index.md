:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Розробка розширень

## Розширення типів файлів у фронтенді

Для завантажених файлів інтерфейс користувача може відображати різні попередні перегляди залежно від їх типів. Поле вкладень файлового менеджера має вбудовану функцію попереднього перегляду файлів на основі браузера (вбудовану в iframe). Цей спосіб підтримує більшість форматів файлів (таких як зображення, відео, аудіо та PDF) для прямого перегляду в браузері. Якщо тип файлу не підтримується для попереднього перегляду в браузері, або потрібна особлива інтерактивна взаємодія, ви можете розширити компоненти попереднього перегляду на основі типу файлу.

### Приклад

Наприклад, якщо ви хочете розширити компонент каруселі для файлів зображень, ви можете використати наступний код:

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

Змінна `attachmentFileTypes` — це об'єкт входу, що надається пакетом `@nocobase/client` для розширення типів файлів. Ви можете використовувати його метод `add` для розширення об'єкта-дескриптора типу файлу.

Кожен тип файлу повинен реалізовувати метод `match()`, який перевіряє, чи відповідає тип файлу вимогам. У прикладі для перевірки атрибута `mimetype` файлу використовується метод, наданий пакетом `mime-match`. Якщо він відповідає типу `image/*`, то вважається, що це тип файлу, який потребує обробки. Якщо збігу не знайдено, буде використана вбудована обробка типу.

Властивість `Previewer` в об'єкті-дескрипторі типу є компонентом, що використовується для попереднього перегляду. Коли тип файлу збігається, цей компонент буде відрендерений для попереднього перегляду. Зазвичай рекомендується використовувати компоненти типу модального вікна (наприклад, `<Modal />`) як базовий контейнер, а потім розміщувати вміст для попереднього перегляду та інтерактивні елементи всередині цього компонента для реалізації функції попереднього перегляду.

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

`attachmentFileTypes` — це глобальний екземпляр, який імпортується з пакета `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Реєструє новий об'єкт-дескриптор типу файлу в реєстрі типів файлів. Тип дескриптора — `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Метод для зіставлення форматів файлів.

Параметр `file` — це об'єкт даних для завантаженого файлу, що містить відповідні властивості, які можна використовувати для визначення типу:

*   `mimetype`: Опис mimetype
*   `extname`: Розширення файлу, включаючи "."
*   `path`: Відносний шлях зберігання файлу
*   `url`: URL файлу

Повертає значення типу `boolean`, що вказує на результат збігу.

##### `Previewer`

React-компонент для попереднього перегляду файлу.

Параметри Props:

*   `index`: Індекс файлу у списку вкладень
*   `list`: Список вкладень
*   `onSwitchIndex`: Функція для перемикання індексу

Функція `onSwitchIndex` може приймати будь-який індекс зі списку `list` для перемикання на інший файл. Якщо ви передасте `null` як параметр, компонент попереднього перегляду буде закрито.

```ts
onSwitchIndex(null);
```