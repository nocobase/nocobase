:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/window)을 참조하세요.
:::

# window

다음 속성들은 `window`를 통해 직접 접근할 수 있습니다:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (`http:`, `https:`, `about:blank`만 허용됩니다)
* `location` (읽기 전용, 안전한 탐색 지원)
* `navigator`

기본적이고 안전한 DOM 쿼리 및 생성 기능만 지원됩니다:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`