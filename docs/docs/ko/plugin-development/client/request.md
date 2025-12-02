:::tip AI 번역 안내
이 문서는 AI로 자동 번역되었습니다.
:::


# 요청

NocoBase는 [Axios](https://axios-http.com/)를 기반으로 래핑된 `APIClient`를 제공하여, `Context`를 얻을 수 있는 모든 곳에서 HTTP 요청을 보낼 수 있도록 합니다.

`Context`를 얻을 수 있는 일반적인 위치는 다음과 같습니다:

- `app.context`
- `engine.context`
- `plugin.context`
- `model.context`

## ctx.api.request()

`ctx.api.request()`는 요청을 보내는 가장 일반적인 메서드입니다. 매개변수와 반환 값은 [axios.request()](https://axios-http.com/docs/req_config)와 완전히 동일합니다.

```ts
request<T = any, R = AxiosResponse<T>, D = any>(
  config: AxiosRequestConfig<D>,
): Promise<R>;
```

기본 사용법

```ts
await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
```

표준 Axios 요청 설정을 직접 사용할 수 있습니다:

```ts
await ctx.api.request({
  url: 'users:create',
  method: 'post',
  data: {
    name: 'Tao Tao',
  },
});
```

## ctx.api.axios

`ctx.api.axios`는 `AxiosInstance` 인스턴스로, 이를 통해 전역 기본 설정을 수정하거나 요청 인터셉터를 추가할 수 있습니다.

기본 설정 수정

```ts
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
```

더 많은 사용 가능한 설정은 [Axios 기본 설정](https://axios-http.com/docs/config_defaults)을 참조하세요.

## 요청 및 응답 인터셉터

인터셉터를 사용하면 요청이 전송되기 전이나 응답이 반환된 후에 처리할 수 있습니다. 예를 들어, 요청 헤더를 일관되게 추가하거나, 매개변수를 직렬화하거나, 통일된 오류 메시지를 표시할 수 있습니다.

### 요청 인터셉터 예시

```ts
// qs를 사용하여 params 매개변수 직렬화
axios.interceptors.request.use((config) => {
  config.paramsSerializer = (params) =>
    qs.stringify(params, {
      strictNullHandling: true,
      arrayFormat: 'brackets',
    });
  return config;
});

// 사용자 정의 요청 헤더
axios.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer token123`;
  config.headers['X-Hostname'] = 'localhost';
  config.headers['X-Timezone'] = '+08:00';
  config.headers['X-Locale'] = 'zh-CN';
  config.headers['X-Role'] = 'admin';
  config.headers['X-Authenticator'] = 'basic';
  config.headers['X-App'] = 'sub1';
  return config;
});
```

### 응답 인터셉터 예시

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 요청 실패 시, 통일된 알림 메시지 표시
    ctx.notification.error({
      message: '요청 응답 오류',
    });
    return Promise.reject(error);
  },
);
```

## NocoBase 서버 사용자 정의 요청 헤더

다음은 NocoBase 서버에서 지원하는 사용자 정의 요청 헤더로, 다중 애플리케이션, 국제화, 다중 역할 또는 다중 인증 시나리오에 사용될 수 있습니다.

| 헤더 | 설명 |
|--------|------|
| `X-App` | 다중 애플리케이션 시나리오에서 현재 접근하는 애플리케이션을 지정합니다. |
| `X-Locale` | 현재 언어 (예: `zh-CN`, `en-US`) |
| `X-Hostname` | 클라이언트 호스트 이름 |
| `X-Timezone` | 클라이언트 시간대 (예: `+08:00`) |
| `X-Role` | 현재 역할 |
| `X-Authenticator` | 현재 사용자 인증 방식 |

> 💡 **팁**  
> 이러한 요청 헤더는 일반적으로 인터셉터에 의해 자동으로 주입되므로 수동으로 설정할 필요가 없습니다. 특정 시나리오(예: 테스트 환경 또는 다중 인스턴스 시나리오)에서만 수동으로 추가해야 합니다.

## 컴포넌트에서 사용

React 컴포넌트에서 `useFlowContext()`를 통해 컨텍스트 객체를 얻은 다음 `ctx.api`를 호출하여 요청을 보낼 수 있습니다.

```ts
import { useFlowContext } from '@nocobase/client';

const MyComponent = () => {
  const ctx = useFlowContext();

  const fetchData = async () => {
    const response = await ctx.api.request({
      url: '/api/posts',
      method: 'get',
    });
    console.log(response.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>로딩 중...</div>;
};
```

### ahooks의 useRequest와 함께 사용

실제 개발에서는 [ahooks](https://ahooks.js.org/hooks/use-request/index)에서 제공하는 `useRequest` Hook을 사용하여 요청의 생명 주기와 상태를 더 편리하게 처리할 수 있습니다.

```ts
import { useFlowContext } from '@nocobase/client';
import { useRequest } from 'ahooks';

const MyComponent = () => {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>요청 오류: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>새로고침</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
};
```

이 방식은 요청 로직을 더욱 선언적으로 만들고, 로딩 상태, 오류 처리 및 새로고침 로직을 자동으로 관리하여 컴포넌트에서 사용하기에 매우 적합합니다.