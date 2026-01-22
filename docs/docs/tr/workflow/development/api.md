:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# API Referansı

## Sunucu Tarafı

Sunucu tarafı paket yapısında kullanabileceğiniz API'lar aşağıdaki kodda gösterilmiştir:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

İş akışı eklenti sınıfı.

Genellikle uygulamanın çalışma zamanında, `app` uygulama örneğine erişebildiğiniz herhangi bir yerde `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` çağrısı yaparak iş akışı eklenti örneğini (aşağıda `plugin` olarak anılacaktır) alabilirsiniz.

#### `registerTrigger()`

Yeni bir tetikleyici türü kaydetmek için kullanılır.

**İmza**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parametreler**

| Parametre | Tip                         | Açıklama                 |
| --------- | --------------------------- | ------------------------ |
| `type`    | `string`                    | Tetikleyici türü tanımlayıcısı |
| `trigger` | `typeof Trigger \| Trigger` | Tetikleyici türü veya örneği |

**Örnek**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Yeni bir düğüm türü kaydetmek için kullanılır.

**İmza**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parametreler**

| Parametre   | Tip                                 | Açıklama               |
| ----------- | ----------------------------------- | ---------------------- |
| `type`      | `string`                            | Talimat türü tanımlayıcısı |
| `instruction` | `typeof Instruction \| Instruction` | Talimat türü veya örneği |

**Örnek**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Belirli bir iş akışını tetikler. Esas olarak özel tetikleyicilerde, belirli bir özel olay dinlendiğinde ilgili iş akışını tetiklemek için kullanılır.

**İmza**

`trigger(workflow: Workflow, context: any)`

**Parametreler**
| Parametre | Tip           | Açıklama                 |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | Tetiklenecek iş akışı nesnesi |
| `context` | `object` | Tetikleme anında sağlanan bağlam verisi |

:::info{title=İpucu}
`context` şu anda zorunlu bir öğedir. Sağlanmazsa, iş akışı tetiklenmez.
:::

**Örnek**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Bekleyen bir iş akışını belirli bir düğüm göreviyle yürütmeye devam eder.

- Yalnızca bekleyen durumda (`EXECUTION_STATUS.STARTED`) olan iş akışları yürütmeye devam edebilir.
- Yalnızca bekleyen durumda (`JOB_STATUS.PENDING`) olan düğüm görevleri yürütmeye devam edebilir.

**İmza**

`resume(job: JobModel)`

**Parametreler**

| Parametre | Tip        | Açıklama               |
| --------- | ---------- | ---------------------- |
| `job`     | `JobModel` | Güncellenmiş görev nesnesi |

:::info{title=İpucu}
Aktarılan görev nesnesi genellikle güncellenmiş bir nesnedir ve `status` değeri genellikle `JOB_STATUS.PENDING` dışında bir değere güncellenir, aksi takdirde beklemeye devam edecektir.
:::

**Örnek**

Detaylar için [kaynak koduna](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99) bakınız.

### `Trigger`

Özel tetikleyici türlerini genişletmek için kullanılan tetikleyici temel sınıfıdır.

| Parametre     | Tip                                                         | Açıklama                   |
| ------------- | ----------------------------------------------------------- | -------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Yapıcı fonksiyon           |
| `on?`         | `(workflow: WorkflowModel): void`                           | Bir iş akışı etkinleştirildikten sonraki olay işleyicisi |
| `off?`        | `(workflow: WorkflowModel): void`                           | Bir iş akışı devre dışı bırakıldıktan sonraki olay işleyicisi |

`on` ve `off` metotları, bir iş akışı etkinleştirildiğinde/devre dışı bırakıldığında olay dinleyicilerini kaydetmek/kaydını silmek için kullanılır. Aktarılan parametre, ilgili tetikleyicinin iş akışı örneğidir ve ilgili yapılandırmaya göre işlenebilir. Bazı tetikleyici türleri, olayları zaten global olarak dinliyorsa bu iki metodu uygulamak zorunda kalmayabilir. Örneğin, zamanlanmış bir tetikleyicide, `on` metodunda bir zamanlayıcı kaydedebilir ve `off` metodunda zamanlayıcının kaydını silebilirsiniz.

### `Instruction`

Özel talimat türlerini genişletmek için kullanılan talimat temel sınıfıdır.

| Parametre     | Tip                                                             | Açıklama                                   |
| ------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Yapıcı fonksiyon                           |
| `run`         | `Runner`                                                        | Düğüme ilk girişteki yürütme mantığı       |
| `resume?`     | `Runner`                                                        | Kesintiden sonra düğüme girişteki yürütme mantığı |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | İlgili düğüm tarafından oluşturulan dal için yerel değişken içeriği sağlar |

**İlgili Tipler**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

`getScope` metodu için, dallar için yerel değişken içeriği sağlamak amacıyla [döngü düğümünün uygulamasını](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83) inceleyebilirsiniz.

### `EXECUTION_STATUS`

İş akışı yürütme planı durumları için bir sabitler tablosudur ve ilgili yürütme planının mevcut durumunu tanımlamak için kullanılır.

| Sabit Adı                       | Anlamı                 |
| ------------------------------- | ---------------------- |
| `EXECUTION_STATUS.QUEUEING`     | Kuyrukta               |
| `EXECUTION_STATUS.STARTED`      | Başlatıldı             |
| `EXECUTION_STATUS.RESOLVED`     | Başarıyla Tamamlandı   |
| `EXECUTION_STATUS.FAILED`       | Başarısız              |
| `EXECUTION_STATUS.ERROR`        | Yürütme Hatası         |
| `EXECUTION_STATUS.ABORTED`      | İptal Edildi           |
| `EXECUTION_STATUS.CANCELED`     | İptal Edildi           |
| `EXECUTION_STATUS.REJECTED`     | Reddedildi             |
| `EXECUTION_STATUS.RETRY_NEEDED` | Başarısız, Tekrar Deneme Gerekiyor |

İlk üçü dışındaki tüm durumlar başarısız bir durumu temsil eder, ancak farklı başarısızlık nedenlerini açıklamak için kullanılabilir.

### `JOB_STATUS`

İş akışı düğüm görevi durumları için bir sabitler tablosudur ve ilgili düğüm görevinin mevcut durumunu tanımlamak için kullanılır. Düğüm tarafından üretilen durum, aynı zamanda tüm yürütme planının durumunu da etkiler.

| Sabit Adı                 | Anlamı                                     |
| ------------------------- | ------------------------------------------ |
| `JOB_STATUS.PENDING`      | Beklemede: Yürütme bu düğüme ulaştı, ancak talimat askıya almayı ve beklemeyi gerektiriyor |
| `JOB_STATUS.RESOLVED`     | Başarıyla Tamamlandı                       |
| `JOB_STATUS.FAILED`       | Başarısız: Bu düğümün yürütülmesi yapılandırılmış koşulları karşılayamadı |
| `JOB_STATUS.ERROR`        | Hata: Bu düğümün yürütülmesi sırasında yakalanmamış bir hata oluştu |
| `JOB_STATUS.ABORTED`      | İptal Edildi: Bu düğümün yürütülmesi, bekleme durumundayken başka bir mantık tarafından sonlandırıldı |
| `JOB_STATUS.CANCELED`     | İptal Edildi: Bu düğümün yürütülmesi, bekleme durumundayken manuel olarak iptal edildi |
| `JOB_STATUS.REJECTED`     | Reddedildi: Bu düğümün devamı, bekleme durumundayken manuel olarak reddedildi |
| `JOB_STATUS.RETRY_NEEDED` | Başarısız, Tekrar Deneme Gerekiyor         |

## İstemci Tarafı

İstemci tarafı paket yapısında kullanabileceğiniz API'lar aşağıdaki kodda gösterilmiştir:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Tetikleyici türüne karşılık gelen yapılandırma panelini kaydeder.

**İmza**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parametreler**

| Parametre | Tip                         | Açıklama                                 |
| --------- | --------------------------- | ---------------------------------------- |
| `type`    | `string`                    | Tetikleyici türü tanımlayıcısı, kayıt için kullanılan tanımlayıcı ile tutarlı olmalıdır |
| `trigger` | `typeof Trigger \| Trigger` | Tetikleyici türü veya örneği             |

#### `registerInstruction()`

Düğüm türüne karşılık gelen yapılandırma panelini kaydeder.

**İmza**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parametreler**

| Parametre   | Tip                                 | Açıklama                               |
| ----------- | ----------------------------------- | -------------------------------------- |
| `type`      | `string`                            | Düğüm türü tanımlayıcısı, kayıt için kullanılan tanımlayıcı ile tutarlı olmalıdır |
| `instruction` | `typeof Instruction \| Instruction` | Düğüm türü veya örneği                 |

#### `registerInstructionGroup()`

Düğüm türü gruplarını kaydeder. NocoBase varsayılan olarak 4 düğüm türü grubu sunar:

* `'control'`: Kontrol
* `'collection'`: Koleksiyon işlemleri
* `'manual'`: Manuel işlem
* `'extended'`: Diğer uzantılar

Başka grupları genişletmeniz gerekirse, bunları kaydetmek için bu metodu kullanabilirsiniz.

**İmza**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parametreler**

| Parametre | Tip               | Açıklama                               |
| --------- | ----------------- | -------------------------------------- |
| `type`    | `string`          | Düğüm grubu tanımlayıcısı, kayıt için kullanılan tanımlayıcı ile tutarlı olmalıdır |
| `group`   | `{ label: string }` | Grup bilgisi, şu anda sadece başlığı içerir |

**Örnek**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Özel tetikleyici türlerini genişletmek için kullanılan tetikleyici temel sınıfıdır.

| Parametre       | Tip                                                             | Açıklama                               |
| --------------- | --------------------------------------------------------------- | -------------------------------------- |
| `title`         | `string`                                                        | Tetikleyici türü adı                   |
| `fieldset`      | `{ [key: string]: ISchema }`                                    | Tetikleyici yapılandırma öğeleri koleksiyonu |
| `scope?`        | `{ [key: string]: any }`                                        | Yapılandırma öğesi Şemasında kullanılabilecek nesneler koleksiyonu |
| `components?`   | `{ [key: string]: React.FC }`                                   | Yapılandırma öğesi Şemasında kullanılabilecek bileşenler koleksiyonu |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Tetikleyici bağlam verisi için değer erişimcisi |

- `useVariables` ayarlanmamışsa, bu tetikleyici türünün değer alma işlevi sağlamadığı ve iş akışı düğümlerinde tetikleyicinin bağlam verilerinin seçilemeyeceği anlamına gelir.

### `Instruction`

Özel düğüm türlerini genişletmek için kullanılan talimat temel sınıfıdır.

| Parametre            | Tip                                                     | Açıklama                                                                           |
| -------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `group`              | `string`                                                | Düğüm türü grubu tanımlayıcısı, şu anda mevcut seçenekler: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | Düğüm yapılandırma öğeleri koleksiyonu                                             |
| `scope?`             | `Record<string, Function>`                              | Yapılandırma öğesi Şemasında kullanılabilecek nesneler koleksiyonu                 |
| `components?`        | `Record<string, React.FC>`                              | Yapılandırma öğesi Şemasında kullanılabilecek bileşenler koleksiyonu               |
| `Component?`         | `React.FC`                                              | Düğüm için özel render bileşeni                                                    |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | Düğümün düğüm değişkeni seçeneklerini sağlama metodu                               |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Düğümün dal yerel değişkeni seçeneklerini sağlama metodu                           |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | Düğümün başlatıcı seçeneklerini sağlama metodu                                     |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | Düğümün kullanılabilir olup olmadığını belirleme metodu                            |

**İlgili Tipler**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- `useVariables` ayarlanmamışsa, bu düğüm türünün değer alma işlevi sağlamadığı ve iş akışı düğümlerinde bu tür düğümün sonuç verilerinin seçilemeyeceği anlamına gelir. Sonuç değeri tekil (seçilemez) ise, ilgili bilgiyi ifade eden statik bir içerik döndürebilirsiniz (bakınız: [hesaplama düğümü kaynak kodu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Seçilebilir olması gerekiyorsa (örneğin, bir Nesnenin bir özelliği), ilgili seçim bileşeni çıktısını özelleştirebilirsiniz (bakınız: [veri oluşturma düğümü kaynak kodu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component`, düğüm için özel bir render bileşenidir. Varsayılan düğüm render'ı yeterli olmadığında, özel düğüm görünümü render'ı için tamamen geçersiz kılınabilir. Örneğin, bir dal türünün başlangıç düğümü için daha fazla eylem düğmesi veya başka etkileşimler sağlamanız gerekiyorsa, bu metodu kullanmanız gerekir (bakınız: [paralel dal kaynak kodu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers`, blokları başlatmak için bir metod sağlamak amacıyla kullanılır. Örneğin, manuel bir düğümde, yukarı akış düğümlerine göre ilgili kullanıcı bloklarını başlatabilirsiniz. Bu metod sağlanırsa, manuel düğümün arayüz yapılandırmasında blokları başlatırken kullanılabilir olacaktır (bakınız: [veri oluşturma düğümü kaynak kodu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable`, bir düğümün mevcut ortamda kullanılıp kullanılamayacağını (eklenip eklenemeyeceğini) belirlemek için kullanılır. Mevcut ortam, mevcut iş akışını, yukarı akış düğümlerini ve mevcut dal indeksini içerir.