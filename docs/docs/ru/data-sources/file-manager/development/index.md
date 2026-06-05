:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Разработка расширений

## Расширение типов файлов для фронтенда

Для загруженных файлов пользовательский интерфейс может отображать различные предварительные просмотры в зависимости от их типа. Поле вложений файлового менеджера имеет встроенную функцию предварительного просмотра файлов на основе браузера (встроенную в iframe), которая поддерживает большинство форматов (таких как изображения, видео, аудио и PDF) для прямого просмотра в браузере. Если формат файла не поддерживается для предварительного просмотра в браузере или требуется особая интерактивность, вы можете расширить компоненты предварительного просмотра на основе типа файла.

### Пример

Например, если вы хотите расширить компонент карусели для файлов изображений, вы можете использовать следующий код:

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

Объект `attachmentFileTypes` — это точка входа, предоставляемая пакетом `@nocobase/client` для расширения типов файлов. Вы можете использовать его метод `add` для добавления дескриптора типа файла.

Каждый тип файла должен реализовывать метод `match()`, который проверяет, соответствует ли тип файла требованиям. В примере для проверки атрибута `mimetype` файла используется метод, предоставляемый пакетом `mime-match`. Если он соответствует типу `image/*`, то считается, что этот тип файла требует обработки. Если совпадение не найдено, будет использоваться встроенная обработка типа.

Свойство `Previewer` в объекте дескриптора типа — это компонент, используемый для предварительного просмотра. Когда тип файла совпадает, этот компонент будет отображен для предварительного просмотра. Обычно рекомендуется использовать модальный компонент (например, `<Modal />`) в качестве базового контейнера, а затем помещать содержимое для предварительного просмотра и интерактивности внутрь этого компонента для реализации функции предварительного просмотра.

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

`attachmentFileTypes` — это глобальный экземпляр, импортируемый из пакета `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Регистрирует новый дескриптор типа файла в реестре типов файлов. Тип дескриптора — `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Метод для сопоставления форматов файлов.

Параметр `file` — это объект данных для загруженного файла, содержащий свойства, которые можно использовать для проверки типа:

*   `mimetype`: MIME-тип файла.
*   `extname`: Расширение файла, включая точку.
*   `path`: Относительный путь хранения файла.
*   `url`: URL-адрес файла.

Возвращает значение типа `boolean`, указывающее, соответствует ли файл.

##### `Previewer`

React-компонент для предварительного просмотра файла.

Параметры Props:

*   `index`: Индекс файла в списке вложений.
*   `list`: Список вложений.
*   `onSwitchIndex`: Функция для переключения файла по его индексу.

Функцию `onSwitchIndex` можно вызвать с любым индексом из `list`, чтобы переключиться на другой файл. Вызов с `null` в качестве параметра закрывает компонент предварительного просмотра.

```ts
onSwitchIndex(null);
```