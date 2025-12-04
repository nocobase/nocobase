:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 확장 개발

## 프런트엔드 파일 유형 확장하기

업로드된 파일의 경우, 프런트엔드 UI에서는 파일 유형에 따라 다양한 미리보기 콘텐츠를 표시할 수 있습니다. 파일 관리자의 첨부 파일 필드에는 브라우저 기반(iframe 내장) 파일 미리보기 기능이 내장되어 있어, 대부분의 파일 형식(예: 이미지, 비디오, 오디오, PDF 등)을 브라우저에서 직접 미리 볼 수 있습니다. 파일 형식이 브라우저 미리보기를 지원하지 않거나 특별한 미리보기 상호작용이 필요한 경우, 파일 유형 기반의 미리보기 컴포넌트를 확장하여 이 기능을 구현할 수 있습니다.

### 예시

예를 들어, 이미지 파일에 대한 캐러셀 컴포넌트를 확장하고 싶다면 다음 코드를 사용할 수 있습니다.

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

`attachmentFileTypes`는 `@nocobase/client` 패키지에서 파일 유형 확장을 위해 제공하는 진입점 객체입니다. 이 객체의 `add` 메서드를 사용하여 파일 유형 디스크립터(descriptor)를 확장할 수 있습니다.

각 파일 유형은 파일 유형이 요구 사항을 충족하는지 확인하기 위한 `match()` 메서드를 구현해야 합니다. 예시에서는 `mime-match` 패키지에서 제공하는 메서드를 사용하여 파일의 `mimetype` 속성을 검사합니다. `image/*` 유형과 일치하면 처리해야 할 파일 유형으로 간주됩니다. 일치하지 않으면 내장된 유형 처리로 폴백(fallback)됩니다.

유형 디스크립터의 `Previewer` 속성은 미리보기에 사용되는 컴포넌트입니다. 파일 유형이 일치하면 이 컴포넌트가 렌더링되어 미리보기를 제공합니다. 일반적으로 `<Modal />`과 같은 모달 유형의 컴포넌트를 기본 컨테이너로 사용하고, 미리보기 및 상호작용이 필요한 콘텐츠를 해당 컴포넌트 안에 넣어 미리보기 기능을 구현하는 것이 좋습니다.

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

`attachmentFileTypes`는 `@nocobase/client` 패키지에서 임포트(import)하여 사용하는 전역 인스턴스입니다.

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

파일 유형 등록 센터에 새로운 파일 유형 디스크립터 객체를 등록합니다. 디스크립터 객체의 유형은 `AttachmentFileType`입니다.

#### `AttachmentFileType`

##### `match()`

파일 형식을 일치시키는 메서드입니다.

전달되는 `file` 매개변수는 업로드된 파일의 데이터 객체이며, 유형 판단에 사용할 수 있는 관련 속성을 포함합니다.

*   `mimetype`: 파일의 mimetype을 설명합니다.
*   `extname`: 파일 확장자이며, "."을 포함합니다.
*   `path`: 파일이 저장된 상대 경로입니다.
*   `url`: 파일의 URL입니다.

반환 값은 `boolean` 타입이며, 일치 여부를 나타냅니다.

##### `Previewer`

파일을 미리보기 위한 React 컴포넌트입니다.

전달되는 Props 매개변수는 다음과 같습니다.

*   `index`: 첨부 파일 목록에서 파일의 인덱스입니다.
*   `list`: 첨부 파일 목록입니다.
*   `onSwitchIndex`: 인덱스를 전환하는 데 사용되는 메서드입니다.

`onSwitchIndex`는 `list` 내의 어떤 인덱스 값이든 전달받아 다른 파일로 전환하는 데 사용될 수 있습니다. `null`을 매개변수로 전달하여 전환하면 미리보기 컴포넌트가 즉시 닫힙니다.

```ts
onSwitchIndex(null);
```