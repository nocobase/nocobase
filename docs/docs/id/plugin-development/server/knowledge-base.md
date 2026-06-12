---
title: "Plugin KnowledgeBase"
description: "Pengembangan plugin knowledge base NocoBase: mendaftarkan Provider eksternal, mengimplementasikan VectorStoreService, mengembalikan hasil retrieval RAG, dan mengonfigurasi parameter."
keywords: "plugin knowledge base,External Knowledge Base,VectorStoreProvider,VectorStoreService,RAG,AI employees,NocoBase"
---

# Plugin KnowledgeBase

Di NocoBase, **plugin knowledge base (KnowledgeBase Plugin)** digunakan untuk memperluas sumber retrieval RAG bagi AI employees. Untuk sebagian besar kebutuhan, Local knowledge base sudah cukup. Plugin external knowledge base hanya diperlukan ketika dokumen, data vektor, atau logika retrieval sudah dikelola oleh sistem eksternal.

Plugin external knowledge base tidak ikut dalam proses upload dokumen, segmentasi, vektorisasi, atau penghapusan di NocoBase. Plugin ini hanya menerima request retrieval saat percakapan AI employee dan mengembalikan segmen dokumen yang cocok.

:::tip Bacaan awal

- [Ikhtisar knowledge base](../../ai-employees/knowledge-base/knowledge-base/) - Memahami batas kemampuan Local, Readonly, dan External
- [Plugin](./plugin.md) - Memahami lifecycle plugin server dan `this.app.pm`
- [i18n](./i18n.md) - Menyiapkan terjemahan jika plugin menyediakan form konfigurasi

:::

## Skenario penggunaan

External knowledge base cocok untuk kondisi berikut:

- Sudah ada layanan RAG mandiri, seperti layanan knowledge base internal atau API retrieval pihak ketiga
- Perlu terhubung ke database vektor yang belum didukung langsung oleh NocoBase
- Perlu memproses aturan bisnis sebelum atau setelah retrieval, seperti pemeriksaan izin, isolasi tenant, reranking, atau deduplikasi
- Siklus hidup dokumen sepenuhnya dikelola sistem eksternal, dan NocoBase hanya membaca hasil retrieval saat percakapan

Jika hanya ingin mengunggah file di NocoBase, memecah dokumen otomatis, dan membuat indeks vektor, gunakan Local knowledge base secara default.

## Titik ekstensi

External knowledge base didaftarkan melalui titik ekstensi `vectorStoreProvider` dari `@nocobase/plugin-ai`. Sisi server perlu mengimplementasikan dua objek:

| Objek | Fungsi |
| --- | --- |
| `VectorStoreProvider` | Mendeklarasikan nama provider external knowledge base dan membuat service retrieval |
| `VectorStoreService` | Menjalankan retrieval dan mengembalikan segmen dokumen untuk AI employees |

`providerName` adalah identitas unik provider external knowledge base. Provider yang dipilih atau diisi saat membuat knowledge base External harus sama dengan `providerName` yang didaftarkan di server.

## Mendaftarkan Provider

Di `src/server/plugin.ts`, ambil instance plugin AI lalu daftarkan `VectorStoreProvider`:

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

Tahap `load()` cocok untuk mendaftarkan titik ekstensi. Tidak perlu membuat koneksi ke database vektor eksternal di tahap ini, dan request retrieval juga tidak perlu dijalankan di sini. Letakkan koneksi dan query sebenarnya di `VectorStoreService`.

Plugin external knowledge base selalu bergantung pada `@nocobase/plugin-ai-knowledge-base`. Disarankan melakukan pengecekan di `beforeEnable()`:

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

Dengan begitu, pengguna akan mendapat pesan yang jelas jika plugin dependensi belum diaktifkan.

## Mengimplementasikan Provider

Provider hanya bertanggung jawab menyediakan `providerName` dan membuat service berdasarkan konfigurasi knowledge base.

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

`vectorStoreProps` berasal dari form konfigurasi external knowledge base, misalnya endpoint API, API key, model Embedding, atau identitas tenant. NocoBase meneruskan nilai ini ke Provider saat retrieval dijalankan.

## Mengimplementasikan Service

Service adalah inti logika retrieval. Untuk knowledge base External, biasanya cukup mengubah hasil retrieval eksternal menjadi format `DocumentSegmentedWithScore[]` yang dibutuhkan NocoBase.

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

    // Di sini kamu bisa terhubung langsung ke database vektor atau memanggil layanan RAG eksternal.
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
    // Ganti dengan pemanggilan layanan eksternal kamu.
    return [];
  }
}
```

Poin penting:

- **`query`** - Pertanyaan yang perlu diretrieve oleh AI employee
- **`topK`** - Jumlah segmen yang diharapkan
- **`score`** - Ambang skor di pengaturan knowledge base AI employee
- **`vectorStoreProps`** - Parameter yang diisi melalui form konfigurasi external knowledge base

:::tip Tentang `getVectorStore()`

Interface `VectorStoreService` memiliki `getVectorStore()`. Knowledge base External hanya bertanggung jawab untuk retrieval dan tidak membuat NocoBase mengelola vector store di bawahnya, sehingga contoh ini langsung melempar error.

:::

## Mengembalikan hasil retrieval

`search()` harus mengembalikan `DocumentSegmentedWithScore[]`:

```ts
type DocumentSegmentedWithScore = {
  id?: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};
```

Keterangan:

- `content` adalah isi segmen dokumen yang diberikan ke model
- `metadata` menyimpan sumber, judul dokumen, URL, informasi izin, dan metadata lain
- `score` adalah skor retrieval. Disarankan menormalkannya agar nilai lebih besar berarti lebih relevan
- `id` digunakan untuk mengidentifikasi segmen dokumen eksternal dan membantu debugging atau deduplikasi

Jika layanan eksternal menggunakan makna skor yang berbeda, misalnya jarak lebih kecil berarti lebih relevan, ubah dulu menjadi skor relevansi yang konsisten sebelum dikembalikan ke NocoBase.

## Mengonfigurasi parameter external knowledge base

Server dapat membaca `vectorStoreProps` secara langsung, tetapi parameter ini biasanya perlu diisi pengguna saat membuat knowledge base External. Karena itu, form konfigurasi perlu didaftarkan di entry frontend plugin. Setelah terdaftar, NocoBase akan menampilkan field terkait di form pembuatan knowledge base dan meneruskan nilainya ke server saat retrieval.

:::tip Catatan

Konfigurasi form frontend tidak wajib. Jika external knowledge base tidak membutuhkan parameter kustom dari pengguna, kamu tidak perlu mendaftarkan `vectorStorePropForm`.

:::

Untuk kasus sederhana, gunakan `defaultVectorStorePropForm()` secara default. Fungsi ini menerima array field, membuat satu item form untuk setiap field, dan menggunakan input yang mendukung pemilihan variabel NocoBase:

| Parameter | Fungsi |
| --- | --- |
| `key` | Nama field saat menyimpan parameter dan meneruskannya ke server |
| `label` | Label item form |
| `tooltip` | Tooltip item form |
| `required` | Apakah wajib diisi; jika aktif akan membuat validasi required |
| `password` | Apakah ditampilkan sebagai input password, cocok untuk API key dan secret |

Daftarkan form konfigurasi di entry frontend plugin:

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

`name` harus sama dengan `providerName` di server. `key` adalah nama field saat parameter disimpan dan diteruskan ke server; server dapat membacanya dari `vectorStoreProps` menggunakan key yang sama.

### Form konfigurasi kustom

Selain memakai `defaultVectorStorePropForm()`, kamu juga dapat memberikan komponen React kustom ke `vectorStorePropForm`:

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

## Struktur plugin contoh

Plugin external knowledge base dapat disusun seperti berikut:

```text
src/server/plugin.ts
src/server/vector-store/provider.ts
src/server/vector-store/service.ts
src/client/index.tsx
```

Keterangan:

- `plugin.ts` mendaftarkan `VectorStoreProvider`
- `provider.ts` mendeklarasikan `providerName` dan membuat service
- `service.ts` mengimplementasikan `search()` dan mengubah hasil retrieval eksternal menjadi `DocumentSegmentedWithScore[]`
- `client/index.tsx` mendaftarkan form konfigurasi external knowledge base

Sampai di sini, plugin external knowledge base sudah dapat dipanggil oleh AI employees. Setelah pengguna membuat knowledge base External dan memilih Provider terkait, percakapan AI employee dapat mengambil segmen dokumen melalui `search()` kamu.

## Tautan terkait

- [Ikhtisar knowledge base](../../ai-employees/knowledge-base/knowledge-base/) - Batas kemampuan Local, Readonly, dan External
- [Plugin](./plugin.md) - Lifecycle plugin server dan `this.app.pm`
- [i18n](./i18n.md) - Terjemahan frontend dan server plugin
- [Ikhtisar pengembangan client](../client/index.md) - Entry client, komponen, dan kemampuan context
