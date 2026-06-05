:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 확장 개발

## 스토리지 엔진 확장하기

### 서버 측

1. **`StorageType` 상속**
   
   새 클래스를 만들고 `make()` 및 `delete()` 메서드를 구현합니다. 필요하다면 `getFileURL()`, `getFileStream()`, `getFileData()` 등의 훅을 오버라이드하세요.

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

4. **새 타입 등록**  
   플러그인의 `beforeLoad` 또는 `load` 라이프사이클에서 새 스토리지 구현을 주입합니다:

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

등록이 완료되면 스토리지 설정이 내장 타입과 동일하게 `storages` 리소스에 표시됩니다. `StorageType.defaults()`가 제공하는 설정은 폼 자동 채움 또는 기본 레코드 초기화에 사용할 수 있습니다.

<!--
### 클라이언트 측 설정 및 관리 화면
클라이언트 측에서 파일 관리자에게 설정 폼을 어떻게 렌더링할지, 그리고 사용자 정의 업로드 로직이 있는지 알려야 합니다. 각 스토리지 타입 객체에는 다음 속성이 포함됩니다:
-->

## 프런트엔드 파일 타입 확장

업로드된 파일은 파일 타입에 따라 프런트엔드에서 서로 다른 미리보기 콘텐츠를 표시할 수 있습니다. 파일 관리자의 첨부 필드에는 브라우저 기반 파일 미리보기(iframe 내장)가 있으며, 이미지, 비디오, 오디오, PDF 등 대부분의 형식을 브라우저에서 직접 미리볼 수 있습니다. 브라우저가 지원하지 않는 형식이거나 특별한 미리보기 인터랙션이 필요한 경우, 파일 타입 기반 미리보기 컴포넌트를 확장할 수 있습니다.

### 예시

예를 들어 Office 파일에 대한 사용자 지정 온라인 미리보기를 통합하려면 다음 코드를 사용할 수 있습니다:

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

여기서 `filePreviewTypes`는 `@nocobase/plugin-file-manager/client`에서 제공하는 파일 미리보기 확장용 진입 객체입니다. `add` 메서드를 사용해 파일 타입 설명 객체를 추가합니다.

각 파일 타입은 요구사항에 맞는지 확인하는 `match()` 메서드를 구현해야 합니다. 예제에서는 `matchMimetype`를 사용해 파일의 `mimetype` 속성을 검사하며, `docx` 타입과 일치하면 해당 타입으로 처리합니다. 일치하지 않으면 내장 타입 처리로 폴백됩니다.

타입 설명 객체의 `Previewer` 속성은 미리보기 컴포넌트입니다. 파일 타입이 일치하면 해당 컴포넌트가 미리보기 대화상자에 렌더링됩니다. iframe, 플레이어, 차트 등 어떤 React 뷰도 반환할 수 있습니다.

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

`filePreviewTypes`는 `@nocobase/plugin-file-manager/client`에서 가져오는 전역 인스턴스입니다:

```ts
import { filePreviewTypes } from '@nocobase/plugin-file-manager/client';
```

#### `filePreviewTypes.add()`

파일 타입 레지스트리에 새로운 파일 타입 설명 객체를 등록합니다. 설명 객체의 타입은 `FilePreviewType`입니다.

#### `FilePreviewType`

##### `match()`

파일 형식 매칭 메서드.

입력 파라미터 `file`은 업로드된 파일의 데이터 객체로, 타입 판별에 사용할 수 있는 속성을 포함합니다:

* `mimetype`: mimetype 설명
* `extname`: 파일 확장자( "." 포함)
* `path`: 파일의 상대 저장 경로
* `url`: 파일 URL

일치 여부를 나타내는 `boolean` 값을 반환합니다.

##### `getThumbnailURL`

파일 목록에서 사용하는 썸네일 URL을 반환합니다. 반환값이 비어 있으면 기본 플레이스홀더 이미지가 사용됩니다.

##### `Previewer`

파일 미리보기를 위한 React 컴포넌트.

전달되는 Props는 다음과 같습니다:

* `file`: 현재 파일 객체(문자열 URL 또는 `url`/`preview`를 포함한 객체)
* `index`: 목록에서의 파일 인덱스
* `list`: 파일 목록

