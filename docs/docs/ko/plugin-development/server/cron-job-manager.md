:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# CronJobManager: 정기 작업 관리

`CronJobManager`는 NocoBase에서 제공하는 [cron](https://www.npmjs.com/package/cron) 기반의 정기 작업 관리자입니다. 플러그인은 이 관리자를 사용하여 서버에 정기 작업을 등록하고 특정 로직을 주기적으로 실행할 수 있습니다.

## 기본 사용법

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // 매일 00:00에 실행
      onTick: async () => {
        console.log('일일 작업: 임시 데이터 정리');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // 자동 시작
    });
  }

  async cleanTemporaryData() {
    // 여기에 정리 로직을 구현합니다.
  }
}
```

## 매개변수 설명

`CronJobParameters` 타입 정의는 다음과 같습니다 ([cron](https://www.npmjs.com/package/cron)에서 가져옴):

```ts
export declare interface CronJobParameters {
  cronTime: string | Date | DateTime;
  onTick: CronCommand;
  onComplete?: CronCommand | null;
  start?: boolean;
  timeZone?: string;
  context?: any;
  runOnInit?: boolean;
  utcOffset?: string | number;
  unrefTimeout?: boolean;
}
```

| 매개변수         | 타입                       | 설명                                                                                             |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| **cronTime**     | `string \| Date \| DateTime` | 정기 작업의 시간 표현식입니다. 표준 cron 표현식을 지원하며, 예를 들어 `0 0 * * *`는 매일 00:00에 실행됨을 의미합니다. |
| **onTick**       | `function`                 | 작업의 주요 함수입니다. 지정된 시간에 트리거됩니다.                                              |
| **onComplete**   | `function`                 | 작업이 `job.stop()`으로 중지되거나 `onTick` 함수가 완료된 후에 실행됩니다.                       |
| **start**        | `boolean`                  | 초기화 시 자동으로 시작할지 여부입니다.                                                          |
| **timeZone**     | `string`                   | 실행할 시간대를 지정합니다 (예: `Asia/Shanghai`).                                                |
| **context**      | `any`                      | `onTick` 실행 시의 컨텍스트입니다.                                                               |
| **runOnInit**    | `boolean`                  | 초기화 시 한 번 즉시 실행할지 여부입니다.                                                        |
| **utcOffset**    | `string \| number`         | 시간대 오프셋을 지정합니다.                                                                      |
| **unrefTimeout** | `boolean`                  | 이벤트 루프가 활성 상태를 유지할지 여부를 제어합니다.                                            |

## Cron 표현식 예시

| 표현식           | 의미           |
| -------------- | ------------ |
| `* * * * *`    | 매분 실행      |
| `0 * * * *`    | 매시간 실행      |
| `0 0 * * *`    | 매일 00:00에 실행  |
| `0 9 * * 1`    | 매주 월요일 09:00에 실행 |
| `*/10 * * * *` | 매 10분마다 실행  |

> 💡 [crontab.guru](https://crontab.guru/)를 사용하여 표현식을 생성하는 데 도움을 받을 수 있습니다.

## 작업 시작 및 중지 제어

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // 작업 시작
job.stop();  // 작업 중지
```

:::tip

정기 작업은 애플리케이션이 시작될 때 함께 시작되고 중지될 때 함께 중지됩니다. 따라서 특별한 경우가 아니라면 수동으로 시작하거나 중지할 필요는 없습니다.

:::