---
title: "ctx.ai"
description: "Gunakan ctx.ai di RunJS untuk memicu tugas karyawan AI di percakapan global atau AI Chat Box tertentu, baik dengan isi tugas langsung maupun dengan tugas yang dikonfigurasi pada aksi karyawan AI."
keywords: "ctx.ai,AI employee,uploadFile,attachments,triggerTask,triggerModelTask,onResponseLoadingChange,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

Di RunJS, `ctx.ai` digunakan untuk memicu **tugas karyawan AI**. API ini cocok untuk JSBlock, JSAction, dan interaksi lain ketika tombol, formulir, atau alur bisnis perlu menyerahkan pekerjaan kepada karyawan AI tertentu.

`ctx.ai` mengunggah lampiran untuk tugas AI dan memicu tugas. Unggahan file dapat ditunggu, tetapi pemicu tugas tidak mengembalikan hasil eksekusinya. Setelah dipanggil, tugas akan masuk ke alur percakapan karyawan AI.

:::warning Catatan

`ctx.ai` disediakan oleh plugin AI. Jika plugin AI belum diaktifkan, atau lingkungan RunJS saat ini belum memuat kemampuan client yang sesuai, `ctx.ai` mungkin tidak ada. Anda dapat memeriksa `ctx.ai?.uploadFile`, `ctx.ai?.triggerTask`, atau `ctx.ai?.triggerModelTask` sebelum memanggilnya.

:::

## Metode

### ctx.ai.uploadFile()

Mengunggah satu file dan mengembalikan objek lampiran yang dapat langsung diteruskan ke tugas karyawan AI.

```ts
const attachment = await ctx.ai.uploadFile(file, options);
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `file` | `File` | Objek file browser yang akan diunggah. |
| `options.onProgress` | `(percent: number) => void` | Callback progres unggahan. `percent` berada dalam rentang `0` hingga `100`. |
| `options.signal` | `AbortSignal` | Sinyal untuk membatalkan unggahan. |

Unggahan menggunakan penyimpanan file yang dikonfigurasi oleh plugin AI dan membuat record di `aiFiles`. Objek yang dikembalikan mencakup field seperti `id`, `filename`, `url`, dan `source`:

```ts
const attachment = await ctx.ai.uploadFile(file, {
  onProgress(percent) {
    console.log('upload progress', percent);
  },
});

// attachment dapat langsung ditempatkan di message.attachments
```

Promise akan ditolak jika unggahan gagal. Menghapus lampiran dari daftar lokal tidak menghapus record yang sudah dibuat di `aiFiles`, sama seperti perilaku jendela chat AI default.

### ctx.ai.triggerTask()

Memicu tugas karyawan AI secara langsung.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Karyawan AI. Jika string diberikan, NocoBase mencocokkan secara persis dengan `AIEmployee.username`, dan karyawan AI tersebut harus dapat diakses oleh pengguna saat ini. |
| `tasks` | `Task[]` | Daftar tugas yang akan dipicu. |
| `chatBoxUid` | `string` | uid FlowModel dari blok AI Chat Box yang akan menerima tugas. |
| `open` | `boolean` | Apakah panel percakapan karyawan AI dibuka. |
| `auto` | `boolean` | Apakah menggunakan semantik pemicu otomatis dari aksi karyawan AI. |
| `onResponseLoadingChange` | `(loading: boolean) => void` | Callback status pemuatan respons model. Hanya dijalankan ketika tugas ini dikirim otomatis. |

Field umum pada `Task`:

| Field | Tipe | Deskripsi |
|------|------|------|
| `title` | `string` | Judul tugas. |
| `message.system` | `string` | Pesan sistem untuk membatasi peran dan persyaratan keluaran karyawan AI. |
| `message.user` | `string` | Pesan pengguna, yaitu instruksi utama tugas ini. |
| `message.attachments` | `Attachment[]` | Lampiran yang digunakan oleh tugas, biasanya dikembalikan oleh `ctx.ai.uploadFile()`. |
| `message.workContext` | `ContextItem[]` | Konteks blok halaman yang digunakan oleh tugas. |
| `autoSend` | `boolean` | Apakah pesan tugas dikirim otomatis. |
| `webSearch` | `boolean` | Apakah tugas ini boleh menggunakan Web search. |
| `model` | `{ llmService: string; model: string } \| null` | Model yang digunakan oleh tugas ini. |
| `skillSettings` | `SkillSettings` | Konfigurasi skills / tools yang digunakan tugas ini. |

### Melacak status pemuatan respons

Berikan `onResponseLoadingChange` pada opsi tingkat atas untuk melacak status pemuatan respons model. Callback menerima `true` saat NocoBase mulai menunggu respons, lalu `false` saat respons selesai, dibatalkan, atau gagal. Jika komponen React sudah mendeklarasikan `setResponseLoading` dengan `useState`, Anda dapat menulis:

```tsx
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
      autoSend: true,
    },
  ],
  onResponseLoadingChange(loading) {
    setResponseLoading(loading);
  },
});
```

`onResponseLoadingChange` hanya melacak respons yang dimulai langsung oleh pemanggilan `triggerTask()` ini. Dengan `autoSend: false`, tugas hanya masuk ke draft chat dan callback tidak dijalankan. Jika pengguna mengirim draft tersebut secara manual nanti, pengiriman itu tidak menggunakan kembali callback ini.

Dalam komponen React pada blok JS, perubahan status ini akan memicu render ulang selama komponen masih dimuat.

### Menargetkan AI Chat Box

Atur `chatBoxUid` pada opsi tingkat atas `triggerTask()` untuk memicu tugas di blok AI Chat Box yang sudah dimuat, bukan membuka dialog global karyawan AI.

```ts
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  chatBoxUid: 'AI_CHAT_BOX_BLOCK_UID',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
    },
  ],
});
```

uid harus berasal dari blok luar AI Chat Box yang saat ini dimuat pada halaman. Jangan tempatkan nilai routing ini di dalam `tasks`. Jika blok target tidak ditemukan, NocoBase menampilkan error dan tidak kembali ke dialog global. Jika `chatBoxUid` tidak diberikan, tugas menggunakan dialog global karyawan AI.

### Mengunggah dan mengirim lampiran di JSBlock

Contoh berikut merender unggahan file, instruksi tugas, dan tombol kirim di JSBlock. File yang sudah diunggah diteruskan ke karyawan AI melalui `message.attachments`:

```tsx
if (!ctx.ai?.uploadFile || !ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const { React } = ctx.libs;
const { useState } = React;
const { Button, Card, Input, Space, Upload } = ctx.libs.antd;
const { InboxOutlined, SendOutlined } = ctx.libs.antdIcons;

const AttachmentTask = () => {
  const [prompt, setPrompt] = useState('');
  const [fileList, setFileList] = useState([]);

  const uploadAttachment = async ({ file, onError, onProgress, onSuccess }) => {
    try {
      const attachment = await ctx.ai.uploadFile(file, {
        onProgress(percent) {
          onProgress?.({ percent });
        },
      });
      onSuccess?.(attachment);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(ctx.t('File upload failed')));
    }
  };

  const sendTask = () => {
    const attachments = fileList
      .filter((file) => file.status === 'done' && file.response)
      .map((file) => file.response);

    if (!prompt.trim()) {
      ctx.message.warning(ctx.t('Enter task instructions'));
      return;
    }

    ctx.ai.triggerTask({
      aiEmployee: 'viz',
      open: true,
      tasks: [
        {
          title: ctx.t('Analyze uploaded files'),
          message: {
            user: prompt.trim(),
            attachments,
          },
          autoSend: true,
        },
      ],
    });
    setPrompt('');
    setFileList([]);
  };

  const uploading = fileList.some((file) => file.status === 'uploading');

  return (
    <Card title={ctx.t('AI file analysis')}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Upload.Dragger
          multiple
          fileList={fileList}
          customRequest={uploadAttachment}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>{ctx.t('Click or drag files here to upload')}</p>
        </Upload.Dragger>
        <Input.TextArea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={ctx.t('Describe the task for the AI employee')}
          autoSize={{ minRows: 3, maxRows: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          disabled={uploading || !prompt.trim()}
          onClick={sendTask}
        >
          {ctx.t('Send to AI')}
        </Button>
      </Space>
    </Card>
  );
};

ctx.render(<AttachmentTask />);
```

Dengan `autoSend: false`, lampiran dan instruksi tugas ditempatkan di draft chat AI dan tidak langsung dikirim.

### Menambahkan konteks blok halaman

`message.workContext` saat ini digunakan untuk meneruskan blok halaman. Masukkan uid FlowModel dari blok target:

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| Field | Deskripsi |
|------|------|
| `type` | Tetap `flow-model`, menandakan konteks blok halaman. |
| `uid` | uid FlowModel dari blok halaman, seperti blok tabel, detail, atau grafik. |

Jika ingin menggunakan JSBlock saat ini sebagai konteks, gunakan uid model saat ini:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### Menentukan model

`model` menentukan model untuk satu tugas. Jika dihilangkan, konfigurasi model default karyawan AI digunakan. Mengirim `null` berarti tidak menentukan model pada level tugas.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Mengonfigurasi skills / tools

`skillSettings` menentukan skills dan tools yang tersedia untuk satu tugas. Jika dihilangkan, konfigurasi kemampuan karyawan AI digunakan.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

Untuk menonaktifkan semua skills atau tools secara eksplisit untuk tugas ini, kirim array kosong dan pertahankan field versi:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

Contoh:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

Jika `aiEmployee` berupa string, NocoBase mencocokkan secara persis berdasarkan `username` pada karyawan AI yang dapat diakses oleh pengguna saat ini.

### ctx.ai.triggerModelTask()

Membaca tugas dari model aksi karyawan AI pada halaman dan memicunya.

Opsi publik `triggerModelTask()` tidak menerima `chatBoxUid`. Untuk menargetkan AI Chat Box, konfigurasikan `chatBoxUid` pada tugas preset dari aksi karyawan AI. `triggerModelTask()` akan tetap menggunakan nilai preset tersebut.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `uid` | `string` | uid FlowModel dari aksi karyawan AI. |
| `taskIndex` | `number` | Indeks tugas, dimulai dari `0`. |
| `options.open` | `boolean` | Apakah panel percakapan karyawan AI dibuka. |
| `options.auto` | `boolean` | Apakah menggunakan semantik pemicu otomatis dari aksi karyawan AI. |
| `options.attachments` | `Attachment[]` | Lampiran yang ditambahkan secara dinamis ke tugas yang sudah dikonfigurasi. |
| `options.onResponseLoadingChange` | `(loading: boolean) => void` | Callback status pemuatan respons model. Hanya dijalankan ketika tugas yang dikonfigurasi dikirim otomatis. |

`options.onResponseLoadingChange` berperilaku sama seperti pada `triggerTask()`. Callback dijalankan sesuai nilai `autoSend` pada tugas yang dikonfigurasi. Callback tidak dijalankan ketika tugas menggunakan `autoSend: false`.

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
  attachments,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Jika model target tidak ada, belum mengonfigurasi karyawan AI, atau indeks yang diberikan tidak memiliki tugas, tugas tidak akan dipicu dan peringatan akan dicetak di console.

## Catatan

- `triggerTask()` dan `triggerModelTask()` bersifat fire-and-forget. Keduanya tidak mengembalikan hasil eksekusi tugas.
- `uploadFile()` mengembalikan Promise. Tunggu unggahan selesai sebelum memicu tugas yang menggunakan lampiran tersebut.
- String `aiEmployee` hanya cocok secara persis dengan `AIEmployee.username`.
- `triggerModelTask()` menggunakan `taskIndex` berbasis `0`.
- `message.workContext` saat ini hanya menjelaskan konteks blok halaman.
- `triggerTask().chatBoxUid` tingkat atas harus merujuk ke blok AI Chat Box yang sedang dimuat pada halaman.
- `triggerModelTask()` tetap menggunakan `chatBoxUid` yang dikonfigurasi pada tugas preset.
- Lampiran dinamis dari `triggerModelTask()` ditambahkan ke `message.attachments` yang sudah ada pada tugas preset tanpa mengubah konfigurasi tersimpan.
- `onResponseLoadingChange` hanya melacak respons model yang dikirim otomatis oleh pemanggilan saat ini. Callback tidak melacak pesan yang dikirim manual oleh pengguna setelahnya.

## Terkait

- [ctx.message](./message.md): Menampilkan pesan ringan sebelum dan sesudah memicu tugas.
- [ctx.render](./render.md): Merender tombol atau formulir di JSBlock.
- [ctx.model](./model.md): Mengambil informasi FlowModel saat ini.
