:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 빌드

## 사용자 정의 빌드 설정

빌드 설정을 사용자 정의하고 싶다면, 플러그인 루트 디렉터리에 `build.config.ts` 파일을 다음 내용으로 생성할 수 있습니다:

```js
import { defineConfig } from '@nocobase/build';

export default defineConfig({
  modifyViteConfig: (config) => {
    // vite는 `src/client` 측 코드를 번들링하는 데 사용됩니다.

    // Vite 설정을 수정합니다. 자세한 내용은 다음 링크를 참조하세요: https://vitejs.dev/guide/
    return config
  },
  modifyTsupConfig: (config) => {
    // tsup은 `src/server` 측 코드를 번들링하는 데 사용됩니다.

    // tsup 설정을 수정합니다. 자세한 내용은 다음 링크를 참조하세요: https://tsup.egoist.dev/#using-custom-configuration
    return config
  },
  beforeBuild: (log) => {
    // 빌드 시작 전에 실행되는 콜백 함수입니다. 빌드 시작 전에 특정 작업을 수행할 수 있습니다.
  },
  afterBuild: (log: PkgLog) => {
    // 빌드 완료 후에 실행되는 콜백 함수입니다. 빌드 완료 후에 특정 작업을 수행할 수 있습니다.
  };
});
```