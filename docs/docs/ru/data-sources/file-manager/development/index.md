# Разработка расширения

## Расширение типов файлов во фронтенде

Для загруженных файлов клиентский интерфейс может отображать разные превью в зависимости от типа файла. Поле вложений файлового менеджера использует встроенный предпросмотр в браузере (iframe), поддерживающий большинство типов файлов (например, изображения, видео, аудио и PDF) для прямого просмотра в браузере. Если тип файла не поддерживается для предпросмотра в браузере или требует особого взаимодействия, дополнительные компоненты предпросмотра можно расширять в зависимости от типа файла.

### Пример

Например, если вы хотите расширить компонент карусели для изображений, можно использовать следующий код:

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

Переменная `attachmentFileTypes` — это объект-запись, предоставляемый пакетом `@nocobase/client` для расширения типов файлов. Используйте ее метод `add`, чтобы расширить дескриптор типа файла.

Каждый тип файла должен реализовать метод `match()`, чтобы проверить, соответствует ли тип файла требованиям. В примере пакет `mime-match` используется для проверки атрибута `mimetype` файла. Если он соответствует `image/*`, этот тип считается подходящим для обработки. Если не соответствует, будет использован встроенный тип.

Свойство `Previewer` в дескрипторе типа — это компонент, используемый для предпросмотра. Когда тип файла совпадает, этот компонент будет отображен для предпросмотра. Обычно рекомендуется использовать модальное окно (например, `<Modal />`) как базовый контейнер и размещать внутри него предпросмотр и интерактивный контент, чтобы реализовать функциональность предпросмотра.

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

`attachmentFileTypes` — глобальный экземпляр, импортируемый из пакета `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Регистрирует новый дескриптор типа файла в реестре типов файлов. Тип дескриптора — `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Метод для сопоставления форматов файлов.

Параметр `file` — это объект данных загруженного файла, содержащий свойства, которые можно использовать для проверки типа:

*   `mimetype`: MIME-тип файла.
*   `extname`: Расширение файла, включая `.`.
*   `path`: Относительный путь хранения файла.
*   `url`: URL файла.

Возвращает `boolean`, указывающий, соответствует ли файл.

##### `Previewer`

React-компонент для предпросмотра файла.

Свойства:

*   `index`: Индекс файла в списке вложений.
*   `list`: Список вложений.
*   `onSwitchIndex`: Функция для переключения предпросмотренного файла по его индексу.

Функцию `onSwitchIndex` можно вызывать с любым индексом из `list`, чтобы переключиться на другой файл. Вызов с `null` закрывает компонент предпросмотра.

```ts
onSwitchIndex(null);
```