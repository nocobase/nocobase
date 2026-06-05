:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 빠른 시작

## 소개

AI 직원 기능을 사용하기 전에 먼저 온라인 LLM 서비스에 연결해야 합니다. NocoBase는 현재 OpenAI, Gemini, Claude, DepSeek, Qwen 등 주요 온라인 LLM 서비스를 지원합니다.
온라인 LLM 서비스 외에도 NocoBase는 Ollama 로컬 모델 연결도 지원합니다.

## LLM 서비스 설정

AI 직원 플러그인 설정 페이지로 이동하여 `LLM service` 탭을 클릭하면 LLM 서비스 관리 페이지로 들어갑니다.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

LLM 서비스 목록 오른쪽 상단에 있는 `Add New` 버튼에 마우스를 올린 후, 사용하려는 LLM 서비스를 선택합니다.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

여기서는 OpenAI를 예시로 들어보겠습니다. 팝업 창에 기억하기 쉬운 `title`을 입력하고, OpenAI에서 발급받은 `API key`를 입력한 다음, `Submit`을 클릭하여 저장하면 LLM 서비스 설정이 완료됩니다.

`Base URL`은 일반적으로 비워두시면 됩니다. 만약 OpenAI API와 호환되는 타사 LLM 서비스를 사용 중이라면, 해당 Base URL을 입력해 주세요.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## 가용성 테스트

LLM 서비스 설정 페이지에서 `Test flight` 버튼을 클릭하고, 사용하려는 모델 이름을 입력한 다음 `Run` 버튼을 클릭하면 LLM 서비스와 모델의 가용성을 테스트할 수 있습니다.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)