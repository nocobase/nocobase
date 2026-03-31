:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 첫 번째 블록 플러그인 작성하기

시작하기 전에, [첫 번째 플러그인 작성하기](../plugin-development/write-your-first-plugin.md) 문서를 먼저 읽고 기본적인 플러그인을 빠르게 만드는 방법을 알아보시는 것을 권장합니다. 이 문서에서는 해당 내용을 바탕으로 간단한 블록 기능을 확장하는 방법을 설명합니다.

## 1단계: 블록 모델 파일 생성하기

플러그인 디렉터리에 다음 파일을 생성합니다: `client/models/SimpleBlockModel.tsx`

## 2단계: 모델 내용 작성하기

파일에 렌더링 로직을 포함한 기본적인 블록 모델을 정의하고 구현합니다:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## 3단계: 블록 모델 등록하기

`client/models/index.ts` 파일에서 새로 생성한 모델을 내보냅니다:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## 4단계: 블록 활성화 및 확인

플러그인을 활성화하면 '블록 추가' 드롭다운 메뉴에서 새로 추가된 **Hello block** 블록 옵션을 확인할 수 있습니다.

효과 시연:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## 5단계: 블록에 설정 기능 추가하기

다음으로, **워크플로우**를 통해 블록에 설정 가능한 기능을 추가하여 사용자가 인터페이스에서 블록 내용을 편집할 수 있도록 합니다.

`SimpleBlockModel.tsx` 파일을 계속 편집합니다:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

효과 시연:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## 요약

이 문서에서는 다음을 포함하여 간단한 블록 플러그인을 만드는 방법을 설명했습니다:

- 블록 모델을 정의하고 구현하는 방법
- 블록 모델을 등록하는 방법
- 워크플로우를 통해 블록에 설정 기능을 추가하는 방법

전체 소스 코드 참조: [간단한 블록 예제](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)