:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/ai-employees/features/llm-service)을 참조하세요.
:::

# LLM 서비스 설정

AI 직원을 사용하기 전에 먼저 사용 가능한 LLM 서비스를 설정해야 합니다.

현재 OpenAI, Gemini, Claude, DeepSeek, Qwen, Kimi 및 Ollama 로컬 모델을 지원합니다.

## 서비스 생성

`시스템 설정 -> AI 직원 -> LLM 서비스(LLM service)`로 이동합니다.

1. `Add New`를 클릭하여 생성 팝업을 엽니다.
2. `Provider`를 선택합니다.
3. `Title`, `API Key`, `Base URL`(선택 사항)을 입력합니다.
4. `Enabled Models`를 설정합니다:
   - `Recommended models`: 공식 추천 모델을 사용합니다.
   - `Select models`: Provider에서 반환된 목록에서 선택합니다.
   - `Manual input`: 모델 ID와 표시 이름을 수동으로 입력합니다.
5. `Submit`을 클릭하여 저장합니다.

![llm-service-create-provider-enabled-models.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-create-provider-enabled-models.png)

## 서비스 활성화 및 정렬

LLM 서비스 목록에서 다음 작업을 직접 수행할 수 있습니다:

- `Enabled` 스위치를 사용하여 서비스를 활성화하거나 비활성화합니다.
- 드래그 앤 드롭으로 서비스 순서를 정렬합니다(모델 표시 순서에 영향을 줍니다).

![llm-service-list-enabled-and-sort.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

## 가용성 테스트

서비스 설정 팝업 하단의 `Test flight`를 사용하여 서비스 및 모델의 가용성을 테스트합니다.

실제 업무에 사용하기 전에 먼저 테스트할 것을 권장합니다.