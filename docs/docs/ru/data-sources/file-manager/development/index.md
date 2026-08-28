---
title: "Разработка расширений менеджера файлов"
description: "Расширение компонентов предпросмотра типов файлов, пользовательских полей вложений и логики загрузки на основе API attachmentFileTypes, mime-match и других."
keywords: "расширение менеджера файлов, расширение поля вложений, расширение предпросмотра файлов,attachmentFileTypes,NocoBase"
---

# Разработка расширений

## Типы файлов на фронтенде

Для уже загруженных файлов в интерфейсе можно отображать разное содержимое предпросмотра в зависимости от типа файла. Поле вложений менеджера файлов включает встроенный предпросмотр в браузере (встроенный в iframe), который поддерживает просмотр непосредственно в браузере большинства форматов файлов (изображений, видео, аудио, PDF и других). Если формат файла не поддерживается браузером или требуется особое взаимодействие при предпросмотре, можно расширить компонент предпросмотра на основе типа файла.

### Пример

Например, чтобы добавить компонент переключения изображений в формате карусели, можно использовать следующий код:

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

Здесь `attachmentFileTypes` — объект входа для расширения типов файлов, предоставляемый пакетом `@nocobase/client`; с помощью его метода `add` можно расширить объект описания типа файла.

Каждый тип файла должен реализовать метод `match()` для проверки соответствия требованиям типа файла. В примере с помощью метода, предоставляемого пакетом `mime-match`, проверяется свойство файла `mimetype`. Если оно соответствует типу `image/*`, файл считается требующим обработки. Если соответствие не найдено, используется встроенная обработка типа файла.

Свойство `Previewer` объекта описания типа представляет собой компонент предпросмотра. При совпадении типа файла этот компонент будет отрисован для предпросмотра. Обычно рекомендуется использовать в качестве базового контейнера компонент в виде всплывающего окна (например, `<Modal />`), а затем помещать в него содержимое для предпросмотра и взаимодействия, реализуя функцию предпросмотра.

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

`attachmentFileTypes` — глобальный экземпляр, импортируемый через `@nocobase/client`:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

Регистрация нового объекта описания типа файла в реестре типов файлов. Тип объекта описания — `AttachmentFileType`.

#### `AttachmentFileType`

##### `match()`

Метод сопоставления формата файла.

Передаваемый параметр `file` — объект данных загруженного файла, содержащий связанные свойства, которые можно использовать для определения типа:

* `mimetype`: описание mimetype
* `extname`: расширение файла, включая «.»
* `path`: относительный путь хранения файла
* `url`: URL файла

Возвращаемое значение имеет тип `boolean` и указывает на результат сопоставления.

##### `Previewer`

React-компонент для предпросмотра файла.

Передаваемые параметры Props:

* `index`: индекс файла в списке вложений
* `list`: список вложений
* `onSwitchIndex`: метод переключения индекса

В `onSwitchIndex` можно передать любое значение индекса из list, чтобы переключиться на другой файл. Если для переключения в качестве параметра используется `null`, компонент предпросмотра будет закрыт напрямую.

```ts
onSwitchIndex(null);
```
