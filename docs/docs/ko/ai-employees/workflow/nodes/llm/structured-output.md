---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



# 구조화된 출력

## 소개

일부 애플리케이션 시나리오에서는 LLM 모델이 JSON 형식의 구조화된 콘텐츠로 응답하기를 원할 수 있습니다. 이때 "구조화된 출력"을 설정하여 이를 구현할 수 있습니다.

![](https://static-docs.nocobase.com/202503041306405.png)

## 설정 설명

-   **JSON Schema** - 사용자는 [JSON Schema](https://json-schema.org/)를 설정하여 모델 응답의 예상 구조를 지정할 수 있습니다.
-   **이름 (Name)** - _선택 사항_이며, JSON Schema가 나타내는 객체를 모델이 더 잘 이해하도록 돕는 데 사용됩니다.
-   **설명 (Description)** - _선택 사항_이며, JSON Schema의 용도를 모델이 더 잘 이해하도록 돕는 데 사용됩니다.
-   **Strict** - 모델이 JSON Schema 구조에 따라 엄격하게 응답을 생성하도록 요구합니다. 현재 OpenAI의 일부 새 모델만 이 매개변수를 지원하므로, 선택하기 전에 모델 호환성을 확인해 주십시오.

## 구조화된 콘텐츠 생성 방식

모델의 구조화된 콘텐츠 생성 방식은 사용되는 **모델**과 해당 **Response format** 설정에 따라 달라집니다.

1.  Response format이 `text`만 지원하는 모델

    -   호출 시, 노드는 JSON Schema를 기반으로 JSON 형식 콘텐츠를 생성하는 도구(Tool)를 바인딩하여, 모델이 이 도구를 호출하여 구조화된 응답을 생성하도록 안내합니다.

2.  Response format이 JSON 모드(`json_object`)를 지원하는 모델

    -   호출 시 JSON 모드를 선택하는 경우, 사용자는 프롬프트(Prompt)에서 모델에게 JSON 형식으로 반환하도록 명시적으로 지시하고 응답 필드 설명을 제공해야 합니다.
    -   이 모드에서 JSON Schema는 모델이 반환한 JSON 문자열을 구문 분석하여 대상 JSON 객체로 변환하는 데만 사용됩니다.

3.  Response format이 JSON Schema(`json_schema`)를 지원하는 모델

    -   JSON Schema는 모델의 대상 응답 구조를 직접 지정하는 데 사용됩니다.
    -   선택 사항인 **Strict** 매개변수는 모델이 JSON Schema를 엄격하게 준수하여 응답을 생성하도록 요구합니다.

4.  Ollama 로컬 모델
    -   JSON Schema가 설정된 경우, 호출 시 노드는 이를 `format` 매개변수로 모델에 전달합니다.

## 구조화된 출력 결과 사용

모델 응답의 구조화된 콘텐츠는 노드의 Structured content 필드에 JSON 객체 형태로 저장되며, 이후 노드에서 사용할 수 있습니다.

![](https://static-docs.nocobase.com/202503041330291.png)

![](https://static-docs.nocobase.com/202503041331279.png)