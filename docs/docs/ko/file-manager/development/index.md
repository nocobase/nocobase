:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 확장 개발

## 스토리지 엔진 확장하기

### 서버 측

1.  **`StorageType` 상속하기**

    새로운 클래스를 생성하고 `make()` 및 `delete()` 메서드를 구현합니다. 필요한 경우 `getFileURL()`, `getFileStream()`, `getFileData()`와 같은 훅을 오버라이드할 수 있습니다.

예시:

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

4.  **새로운 타입 등록하기**
    플러그인의 `beforeLoad` 또는 `load` 라이프사이클에서 새로운 스토리지 구현을 주입합니다:

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

등록이 완료되면, 스토리지 설정은 내장 타입과 마찬가지로 `storages` 리소스에 나타납니다. `StorageType.defaults()`에서 제공하는 설정은 폼을 자동으로 채우거나 기본 레코드를 초기화하는 데 사용될 수 있습니다.

### 클라이언트 측 설정 및 관리 인터페이스
클라이언트 측에서는 파일 관리자에게 설정 폼을 어떻게 렌더링할지, 그리고 커스텀 업로드 로직이 있는지 알려줘야 합니다. 각 스토리지 타입 객체는 다음 속성을 포함합니다:

## 프런트엔드 파일 타입 확장하기

업로드된 파일의 경우, 프런트엔드 인터페이스에서 파일 타입에 따라 다른 미리보기 콘텐츠를 표시할 수 있습니다. 파일 관리자의 첨부 파일 필드는 브라우저 기반(iframe에 내장) 파일 미리보기를 내장하고 있으며, 이 방식은 대부분의 파일 형식(이미지, 비디오, 오디오, PDF 등)을 브라우저에서 직접 미리 볼 수 있도록 지원합니다. 파일 형식이 브라우저 미리보기를 지원하지 않거나 특별한 미리보기 상호작용이 필요한 경우, 파일 타입 기반 미리보기 컴포넌트를 확장하여 구현할 수 있습니다.

### 예시

예를 들어, 이미지 타입 파일에 캐러셀 전환 컴포넌트를 확장하고 싶다면 다음 코드 방식을 사용할 수 있습니다:

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

여기서 `attachmentFileTypes`는 `@nocobase/client` 패키지에서 제공하는 파일 타입을 확장하기 위한 진입점 객체입니다. 이 객체가 제공하는 `add` 메서드를 사용하여 파일 타입 설명 객체를 확장할 수 있습니다.

각 파일 타입은 파일 타입이 요구 사항을 충족하는지 확인하는 `match()` 메서드를 구현해야 합니다. 예시에서는 `mime-match` 패키지에서 제공하는 메서드를 통해 파일의 `mimetype` 속성을 검사하며, `image/*` 타입과 일치하면 처리해야 할 파일 타입으로 간주합니다. 일치하지 않으면 내장 타입 처리로 폴백(fallback)됩니다.

타입 설명 객체의 `Previewer` 속성은 미리보기에 사용되는 컴포넌트입니다. 파일 타입이 일치할 때 이 컴포넌트가 렌더링되어 미리보기를 제공합니다. 일반적으로 `<Modal />` 등과 같은 팝업 타입 컴포넌트를 기본 컨테이너로 사용하고, 미리보기 및 상호작용이 필요한 콘텐츠를 해당 컴포넌트 안에 넣어 미리보기 기능을 구현하는 것을 권장합니다.

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

`attachmentFileTypes`는 `@nocobase/client`에서 임포트되는 전역 인스턴스입니다:

```ts
import { attachmentFileTypes } from '@nocobase/client';
```

#### `attachmentFileTypes.add()`

파일 타입 레지스트리에 새로운 파일 타입 설명 객체를 등록합니다. 설명 객체의 타입은 `AttachmentFileType`입니다.

#### `AttachmentFileType`

##### `match()`

파일 형식 매칭 메서드입니다.

입력 매개변수 `file`은 업로드된 파일의 데이터 객체이며, 타입 판단에 사용될 수 있는 관련 속성을 포함합니다:

*   `mimetype`: mimetype 설명
*   `extname`: 파일 확장자 (점을 포함)
*   `path`: 파일 저장의 상대 경로
*   `url`: 파일 URL

반환 값은 `boolean` 타입이며, 매칭 여부를 나타냅니다.

##### `Previewer`

파일 미리보기에 사용되는 React 컴포넌트입니다.

입력 Props 매개변수는 다음과 같습니다:

*   `index`: 첨부 파일 목록에서 파일의 인덱스
*   `list`: 첨부 파일 목록
*   `onSwitchIndex`: 인덱스를 전환하는 메서드

`onSwitchIndex`는 `list`의 임의 인덱스 값을 전달하여 다른 파일로 전환하는 데 사용될 수 있습니다. 만약 `null`을 인수로 전달하여 전환하면, 미리보기 컴포넌트가 직접 닫힙니다.

```ts
onSwitchIndex(null);
```