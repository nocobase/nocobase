---
title: "Plugin External Knowledge Base"
description: "Phát triển plugin cơ sở tri thức NocoBase: đăng ký Provider bên ngoài, triển khai VectorStoreService, trả về kết quả RAG và cấu hình tham số."
keywords: "plugin cơ sở tri thức,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# Plugin External Knowledge Base

Trong NocoBase, **plugin cơ sở tri thức (External Knowledge Base Plugin)** dùng để mở rộng nguồn truy xuất RAG cho AI employees. Với phần lớn trường hợp, Local knowledge base là đủ. Chỉ khi tài liệu, dữ liệu vector hoặc logic truy xuất đã được hệ thống bên ngoài duy trì, bạn mới cần phát triển plugin cơ sở tri thức bên ngoài.

Plugin cơ sở tri thức bên ngoài không tham gia quy trình tải tài liệu, chia đoạn, vector hóa hoặc xóa tài liệu trong NocoBase. Plugin chỉ nhận yêu cầu truy xuất khi AI employee hội thoại và trả về các đoạn tài liệu phù hợp.

:::tip Đọc trước

- [Tổng quan cơ sở tri thức](../knowledge-base/) - Hiểu ranh giới của Local, Readonly và External
- [Plugin](../../../plugin-development/server/plugin.md) - Hiểu lifecycle plugin server và `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - Chuẩn bị bản dịch nếu plugin cung cấp form cấu hình

:::

## Trường hợp sử dụng

Cơ sở tri thức bên ngoài phù hợp với các tình huống sau:

- Đã có dịch vụ RAG độc lập, chẳng hạn dịch vụ cơ sở tri thức nội bộ hoặc API truy xuất của bên thứ ba
- Cần kết nối tới cơ sở dữ liệu vector mà NocoBase chưa hỗ trợ sẵn
- Cần xử lý quy tắc nghiệp vụ trước hoặc sau truy xuất, chẳng hạn lọc quyền, cô lập tenant, reranking hoặc loại trùng
- Vòng đời tài liệu hoàn toàn do hệ thống bên ngoài quản lý, NocoBase chỉ đọc kết quả truy xuất khi hội thoại

Nếu chỉ muốn tải file trong NocoBase, tự động chia tài liệu và tạo chỉ mục vector, mặc định hãy dùng Local knowledge base.

## Điểm mở rộng

Cơ sở tri thức bên ngoài được đăng ký qua điểm mở rộng `vectorStoreProvider` do `@nocobase/plugin-ai` cung cấp. Phía server cần triển khai hai đối tượng:

| Đối tượng | Vai trò |
| --- | --- |
| `VectorStoreProvider` | Khai báo định danh provider bên ngoài và tạo service truy xuất |
| `VectorStoreService` | Thực hiện truy xuất và trả về đoạn tài liệu cho AI employees |

`providerName` là định danh duy nhất của provider. Provider được chọn hoặc nhập khi tạo knowledge base External phải khớp với `providerName` đã đăng ký trên server.

## Đăng ký Provider

Trong `src/server/plugin.ts`, lấy instance plugin AI rồi đăng ký `VectorStoreProvider`:

```ts
import { Plugin } from '@nocobase/server';
import PluginAIServer from '@nocobase/plugin-ai';
import { MyExternalKnowledgeBaseProvider } from './vector-store/provider';

export class PluginMyKnowledgeBaseServer extends Plugin {
  async load() {
    const aiPlugin = this.app.pm.get('ai') as PluginAIServer;

    aiPlugin.features.vectorStoreProvider.register(new MyExternalKnowledgeBaseProvider());
  }
}

export default PluginMyKnowledgeBaseServer;
```

Giai đoạn `load()` phù hợp để đăng ký điểm mở rộng. Không cần kết nối cơ sở dữ liệu vector bên ngoài ở đây, cũng không nên chạy truy vấn truy xuất ở đây. Logic kết nối và truy vấn thực tế nên đặt trong `VectorStoreService`.

Plugin cơ sở tri thức bên ngoài luôn phụ thuộc `@nocobase/plugin-ai-knowledge-base`. Nên kiểm tra phụ thuộc này trong `beforeEnable()`:

```ts
import { Plugin } from '@nocobase/server';

export class PluginMyKnowledgeBaseServer extends Plugin {
  async beforeEnable() {
    const knowledgeBasePlugin = this.app.pm.get('ai-knowledge-base');

    if (!knowledgeBasePlugin) {
      throw new Error('Please enable @nocobase/plugin-ai-knowledge-base first.');
    }
  }
}
```

Như vậy, nếu plugin phụ thuộc chưa được bật, người dùng sẽ nhận được thông báo rõ ràng.

## Triển khai Provider

Provider chỉ cần cung cấp `providerName` và tạo service dựa trên cấu hình knowledge base.

```ts
import type { VectorStoreProp, VectorStoreProvider, VectorStoreService } from '@nocobase/plugin-ai';
import { MyExternalKnowledgeBaseService } from './service';

export class MyExternalKnowledgeBaseProvider implements VectorStoreProvider {
  get providerName() {
    return 'MyExternalKnowledgeBase';
  }

  async createVectorStoreService(vectorStoreProps?: VectorStoreProp[]): Promise<VectorStoreService> {
    return new MyExternalKnowledgeBaseService(vectorStoreProps);
  }
}
```

`vectorStoreProps` đến từ form cấu hình knowledge base bên ngoài, ví dụ API endpoint, API key, Embedding model hoặc tenant identifier. NocoBase sẽ truyền các giá trị này cho Provider khi thực hiện truy xuất.

## Triển khai Service

Service là phần lõi của logic truy xuất. Với knowledge base External, thường chỉ cần chuyển kết quả truy xuất bên ngoài thành định dạng `DocumentSegmentedWithScore[]` mà NocoBase cần.

```ts
import type {
  DocumentSegmentedWithScore,
  VectorStoreProp,
  VectorStoreSearchOptions,
  VectorStoreService,
} from '@nocobase/plugin-ai';

export class MyExternalKnowledgeBaseService implements VectorStoreService<unknown> {
  constructor(private readonly vectorStoreProps?: VectorStoreProp[]) {}

  async getVectorStore(): Promise<unknown> {
    throw new Error('External knowledge base does not expose a NocoBase-managed vector store. Use search() instead.');
  }

  async search(query: string, options?: VectorStoreSearchOptions): Promise<DocumentSegmentedWithScore[]> {
    const { topK, score } = options ?? {};
    const endpoint = this.getPropValue('endpoint');
    const apiKey = this.getPropValue('apiKey');

    // Tại đây có thể kết nối trực tiếp cơ sở dữ liệu vector hoặc gọi dịch vụ RAG bên ngoài.
    const result = await this.searchExternalService({
      query,
      topK,
      score,
      endpoint,
      apiKey,
    });

    return result.map((item) => ({
      id: item.id,
      content: item.content,
      metadata: item.metadata,
      score: item.score,
    }));
  }

  private getPropValue(key: string): unknown {
    return this.vectorStoreProps?.find((prop) => prop.key === key)?.value;
  }

  private async searchExternalService(params: {
    query: string;
    topK?: number;
    score?: string;
    endpoint: unknown;
    apiKey: unknown;
  }): Promise<DocumentSegmentedWithScore[]> {
    // Thay bằng logic gọi dịch vụ bên ngoài của bạn.
    return [];
  }
}
```

Các điểm chính:

- **`query`** - Câu hỏi AI employee cần truy xuất
- **`topK`** - Số đoạn mong muốn trả về
- **`score`** - Ngưỡng điểm trong cấu hình knowledge base của AI employee
- **`vectorStoreProps`** - Tham số người dùng điền trong form cấu hình knowledge base bên ngoài

:::tip Về `getVectorStore()`

Interface `VectorStoreService` có `getVectorStore()`. Knowledge base External chỉ phụ trách truy xuất, không để NocoBase quản lý vector store bên dưới, nên ví dụ ném lỗi trực tiếp.

:::

## Trả về kết quả truy xuất

`search()` phải trả về `DocumentSegmentedWithScore[]`:

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

Trong đó:

- `content` là nội dung đoạn tài liệu sẽ đưa cho mô hình
- `metadata` lưu nguồn, tiêu đề tài liệu, URL, thông tin quyền và metadata khác
- `score` là điểm truy xuất. Nên chuẩn hóa để giá trị càng lớn càng liên quan
- `id` dùng để định danh đoạn tài liệu bên ngoài, hỗ trợ kiểm tra và loại trùng

Nếu dịch vụ bên ngoài dùng ý nghĩa điểm khác, ví dụ khoảng cách càng nhỏ càng liên quan, hãy chuyển đổi sang điểm liên quan thống nhất trước khi trả về NocoBase.

## Cấu hình tham số knowledge base bên ngoài

Server có thể đọc trực tiếp `vectorStoreProps`, nhưng các tham số này thường cần người dùng điền khi tạo knowledge base External. Vì vậy, form cấu hình cần được đăng ký ở entry frontend của plugin. Sau khi đăng ký, NocoBase sẽ hiển thị các field tương ứng trong form tạo knowledge base và truyền giá trị cho server khi truy xuất.

:::tip Ghi chú

Cấu hình form frontend không bắt buộc. Nếu knowledge base bên ngoài không cần người dùng điền tham số tùy chỉnh, bạn không cần đăng ký `vectorStorePropForm`.

:::

Với trường hợp đơn giản, mặc định dùng `defaultVectorStorePropForm()`. Hàm này nhận một mảng field, tạo một form item cho mỗi field và dùng input hỗ trợ chọn biến NocoBase:

| Tham số | Vai trò |
| --- | --- |
| `key` | Tên field dùng khi lưu tham số và truyền cho server |
| `label` | Nhãn form item |
| `tooltip` | Tooltip của form item |
| `required` | Có bắt buộc hay không; nếu bật sẽ tạo kiểm tra required |
| `password` | Có hiển thị dạng password hay không, phù hợp với API key và secret |

Đăng ký form cấu hình trong entry frontend của plugin:

```tsx
import { Plugin } from '@nocobase/client';
import PluginAIClient, { defaultVectorStorePropForm } from '@nocobase/plugin-ai/client';

export class PluginMyKnowledgeBaseClient extends Plugin {
  async load() {
    const aiPlugin = this.app.pm.get('ai') as PluginAIClient;

    aiPlugin.features.vectorStoreProvider.register({
      name: 'MyExternalKnowledgeBase',
      title: String(this.t('My external knowledge base')),
      components: {
        vectorStorePropForm: defaultVectorStorePropForm([
          {
            key: 'endpoint',
            label: String(this.t('Endpoint')),
            required: true,
          },
          {
            key: 'apiKey',
            label: String(this.t('API key')),
            required: true,
            password: true,
          },
        ]),
      },
    });
  }
}
```

`name` phải khớp với `providerName` ở server. `key` là tên field dùng khi lưu tham số và truyền cho server; server có thể đọc giá trị từ `vectorStoreProps` bằng cùng key.

### Form cấu hình tùy chỉnh

Ngoài `defaultVectorStorePropForm()`, bạn cũng có thể truyền một React component tùy chỉnh cho `vectorStorePropForm`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import type { VectorStorePropFormValues } from '@nocobase/plugin-ai/client';
import { Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';

const MyVectorStorePropForm = ({ form }: { form: FormInstance<VectorStorePropFormValues> }) => {
  const ctx = useFlowContext();

  return (
    <Form form={form} layout="vertical" validateMessages={{ required: ctx.t('defaults.form.required') }}>
      <Form.Item name="endpoint" label={String(ctx.t('Endpoint'))} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="namespace" label={String(ctx.t('Namespace'))}>
        <Input />
      </Form.Item>
      <Form.Item name="metric" label={String(ctx.t('Metric'))} initialValue="cosine">
        <Select
          options={[
            { label: String(ctx.t('Cosine')), value: 'cosine' },
            { label: String(ctx.t('L2')), value: 'l2' },
          ]}
        />
      </Form.Item>
    </Form>
  );
};

aiPlugin.features.vectorStoreProvider.register({
  name: 'MyExternalKnowledgeBase',
  components: {
    vectorStorePropForm: MyVectorStorePropForm,
  },
});
```

## Cấu trúc plugin ví dụ

Một plugin knowledge base bên ngoài có thể tổ chức như sau:

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

Trong đó:

- `plugin.ts` đăng ký `VectorStoreProvider`
- `provider.ts` khai báo `providerName` và tạo service
- `service.ts` triển khai `search()` và chuyển kết quả truy xuất bên ngoài thành `DocumentSegmentedWithScore[]`
- `client/index.tsx` đăng ký form cấu hình knowledge base bên ngoài

Đến đây, plugin knowledge base bên ngoài đã có thể được AI employees gọi. Sau khi người dùng tạo knowledge base External và chọn Provider tương ứng, hội thoại AI employee sẽ truy xuất đoạn tài liệu qua `search()` của bạn.

## Liên kết liên quan

- [Tổng quan cơ sở tri thức](../knowledge-base/) - Ranh giới của Local, Readonly và External
- [Plugin](../../../plugin-development/server/plugin.md) - Lifecycle plugin server và `this.app.pm`
- [i18n](../../../plugin-development/server/i18n.md) - Bản dịch frontend và server của plugin
- [Tổng quan phát triển client](../../../plugin-development/client/index.md) - Entry client, component và năng lực context
