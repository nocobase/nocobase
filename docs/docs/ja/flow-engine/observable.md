:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# リアクティビティメカニズム：Observable

:::info
NocoBase の Observable リアクティビティメカニズムは、本質的に [MobX](https://mobx.js.org/README.html) と似ています。現在の基盤となる実装には [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive) が採用されており、その構文と概念は [MobX](https://mobx.js.org/README.html) と高い互換性があります。歴史的な理由から、直接 [MobX](https://mobx.js.org/README.html) を使用していません。
:::

NocoBase 2.0 では、`Observable` リアクティブオブジェクトが至るところで使われています。これは基盤となるデータフローと UI の応答性の核であり、FlowContext、FlowModel、FlowStep といった様々な場面で広く利用されています。

## Observable を選ぶ理由

NocoBase が Redux、Recoil、Zustand、Jotai といった他の状態管理ソリューションではなく Observable を選んだ主な理由は以下の通りです。

- **究極の柔軟性**：Observable は、あらゆるオブジェクト、配列、Map、Set などをリアクティブにすることができます。深いネストや動的な構造を自然にサポートしており、複雑なビジネスモデルに非常に適しています。
- **非侵襲性**：アクション、リデューサー、または追加のストアを定義することなく、元のオブジェクトを直接操作できるため、開発体験が非常に優れています。
- **自動依存関係追跡**：コンポーネントを `observer` でラップするだけで、コンポーネントは使用されている Observable プロパティを自動的に追跡します。データが変更されると、手動で依存関係を管理することなく、UI が自動的に更新されます。
- **React 以外のシナリオにも対応**：Observable リアクティビティメカニズムは React だけでなく、他のフレームワークと組み合わせることもでき、より広範なリアクティブデータ要件を満たします。

## observer を使う理由

`observer` は Observable オブジェクトの変更をリッスンし、データが変動した際に React コンポーネントの更新を自動的にトリガーします。これにより、`setState` やその他の更新メソッドを手動で呼び出すことなく、UI をデータと同期させることができます。

## 基本的な使い方

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

リアクティブな使い方の詳細については、[@formily/reactive](https://reactive.formilyjs.org/) のドキュメントをご参照ください。