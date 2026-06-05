:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 사용자 정의 상호작용 이벤트

이벤트 편집기에서 JS 코드를 작성하여 ECharts 인스턴스 `chart`를 통해 상호작용 동작을 등록하고 연동 기능을 구현할 수 있습니다. 예를 들어, 새 페이지로 이동하거나 드릴다운 분석을 위한 팝업을 여는 등의 작업을 할 수 있습니다.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## 이벤트 등록 및 해제
- 등록: `chart.on(eventName, handler)`
- 해제: `chart.off(eventName, handler)` 또는 `chart.off(eventName)`를 사용하여 동일한 이름의 이벤트를 정리합니다.

**참고:**
안전상의 이유로, 이벤트를 등록하기 전에 먼저 해제하는 것을 강력히 권장합니다!

## 핸들러 함수 `params` 매개변수의 데이터 구조

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

주로 `params.data`, `params.name` 등이 사용됩니다.

## 예시: 클릭 시 선택 항목 강조
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // 현재 데이터 포인트 강조
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // 다른 강조 해제
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## 예시: 클릭 시 페이지 이동
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // 방법 1: 전체 페이지 새로고침 없이 애플리케이션 내부에서 이동 (권장). 상대 경로만 필요합니다.
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // 방법 2: 외부 페이지로 이동. 전체 URL이 필요합니다.
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // 방법 3: 새 탭에서 외부 페이지 열기. 전체 URL이 필요합니다.
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## 예시: 클릭 시 상세 정보 팝업 표시 (드릴다운)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // 새 팝업에서 사용할 컨텍스트 변수 등록
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

새로 열린 팝업에서는 `ctx.view.inputArgs.XXX`를 통해 차트에서 선언된 컨텍스트 변수를 사용할 수 있습니다.

## 미리보기 및 저장
- "미리보기"를 클릭하면 이벤트 코드가 로드되고 실행됩니다.
- "저장"을 클릭하면 현재 이벤트 설정 내용이 저장됩니다.
- "취소"를 클릭하면 마지막으로 저장된 상태로 돌아갑니다.

**권장 사항:**
- 중복 실행이나 메모리 증가를 방지하기 위해, 이벤트를 바인딩하기 전에 항상 `chart.off('event')`를 사용하여 해제하십시오.
- 렌더링을 방해하지 않도록 이벤트 핸들러 내에서는 가벼운 작업(예: `dispatchAction`, `setOption`)을 사용하는 것이 좋습니다.
- 이벤트에서 처리하는 필드가 현재 데이터와 일치하는지 확인하기 위해 차트 옵션 및 데이터 쿼리와 함께 검증하십시오.