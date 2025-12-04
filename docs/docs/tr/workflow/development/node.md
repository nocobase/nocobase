:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Düğüm Türlerini Genişletme

Bir düğümün türü aslında bir işlem talimatıdır. Farklı talimatlar, iş akışı içinde yürütülen farklı işlemleri temsil eder.

Tetikleyicilere benzer şekilde, düğüm türlerini genişletme de iki bölümden oluşur: sunucu tarafı ve istemci tarafı. Sunucu tarafı, kaydedilen talimatlar için mantığı uygulamalıdır; istemci tarafı ise talimatın bulunduğu düğümün ilgili parametreleri için arayüz yapılandırmasını sağlamalıdır.

## Sunucu Tarafı

### En Basit Düğüm Talimatı

Bir talimatın temel içeriği bir fonksiyondur; yani, talimatın mantığını yürütmek için talimat sınıfındaki `run` metodunun uygulanması zorunludur. Fonksiyon içinde veritabanı işlemleri, dosya işlemleri, üçüncü taraf API'leri çağırma gibi gerekli tüm operasyonları gerçekleştirebilirsiniz.

Tüm talimatlar `Instruction` temel sınıfından türetilmelidir. En basit talimatın yalnızca bir `run` fonksiyonu uygulaması yeterlidir:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

Ve bu talimatı iş akışı eklentisine kaydedin:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

Talimatın dönüş nesnesindeki durum değeri (`status`) zorunludur ve `JOB_STATUS` sabitindeki bir değer olmalıdır. Bu değer, düğümün iş akışındaki sonraki işleme akışını belirler. Genellikle `JOB_STATUS.RESOVLED` kullanılır; bu, düğümün başarıyla yürütüldüğünü ve sonraki düğümlerin yürütülmeye devam edeceğini gösterir. Eğer önceden kaydedilmesi gereken bir sonuç değeri varsa, `processor.saveJob` metodunu çağırabilir ve bu metodun dönüş nesnesini döndürebilirsiniz. Yürütücü (executor), bu nesneye göre bir yürütme sonuç kaydı oluşturacaktır.

### Düğüm Sonuç Değeri

Belirli bir yürütme sonucu varsa, özellikle sonraki düğümler tarafından kullanılmak üzere hazırlanan veriler, `result` özelliği aracılığıyla döndürülebilir ve düğümün iş nesnesine kaydedilebilir:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

Burada, `node.config` düğümün yapılandırma öğesidir ve gerekli herhangi bir değer olabilir. Bu değer, veritabanındaki ilgili düğüm kaydına bir `JSON` tipi alan olarak kaydedilecektir.

### Talimat Hata Yönetimi

Yürütme sırasında istisnalar oluşabilecekse, bunları önceden yakalayabilir ve başarısız bir durum döndürebilirsiniz:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

Öngörülebilir istisnalar yakalanmazsa, iş akışı motoru bunları otomatik olarak yakalayacak ve yakalanmayan istisnaların programın çökmesini önlemek için bir hata durumu döndürecektir.

### Asenkron Düğümler

Akış kontrolü veya asenkron (zaman alıcı) G/Ç işlemleri gerektiğinde, `run` metodu `status` değeri `JOB_STATUS.PENDING` olan bir nesne döndürebilir. Bu, yürütücüye (executor) beklemesini (askıya almasını) söyler ve bazı harici asenkron işlemler tamamlandıktan sonra iş akışı motoruna yürütmeye devam etmesi için bildirimde bulunur. Eğer `run` fonksiyonunda askıda kalma durumu değeri döndürülürse, bu talimatın `resume` metodunu uygulaması zorunludur; aksi takdirde iş akışı yürütmesi devam ettirilemez:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

Burada `paymentService`, bir ödeme hizmetini ifade eder. Hizmetin geri çağrısında, ilgili görevin yürütme akışını devam ettirmek için iş akışı tetiklenir ve mevcut akış önce sonlandırılır. Daha sonra, iş akışı motoru yeni bir işlemci (processor) oluşturur ve bunu düğümün `resume` metoduna aktararak daha önce askıya alınmış düğümün yürütülmesine devam eder.

:::info{title=İpucu}
Burada bahsedilen "asenkron işlem", JavaScript'teki `async` fonksiyonlarını değil, harici sistemlerle etkileşimde bulunurken anında geri dönüş sağlamayan bazı işlemleri ifade eder. Örneğin, bir ödeme hizmeti sonucu öğrenmek için başka bir bildirimi beklemek zorunda kalabilir.
:::

### Düğüm Sonuç Durumu

Bir düğümün yürütme durumu, tüm iş akışının başarısını veya başarısızlığını etkiler. Genellikle, dallanma (branching) olmadığında, bir düğümün başarısızlığı doğrudan tüm iş akışının başarısız olmasına neden olur. En yaygın senaryo, bir düğümün başarıyla yürütülmesi durumunda düğüm tablosundaki bir sonraki düğüme geçilmesi ve başka düğüm kalmayana kadar bu şekilde devam etmesidir; bu durumda tüm iş akışı başarılı bir durumla tamamlanır.

Yürütme sırasında bir düğüm başarısız bir yürütme durumu döndürürse, motor aşağıdaki iki duruma göre farklı şekilde işlem yapacaktır:

1.  Başarısız durum döndüren düğüm ana iş akışındaysa, yani yukarı akış (upstream) bir düğüm tarafından açılan herhangi bir dal iş akışında değilse, tüm ana iş akışı başarısız olarak kabul edilir ve süreç sonlandırılır.

2.  Başarısız durum döndüren düğüm bir dal iş akışının içindeyse, bu durumda iş akışının bir sonraki durumunu belirleme sorumluluğu dalı açan düğüme devredilir. Bu düğümün dahili mantığı, sonraki iş akışının durumuna karar verir ve bu karar ana iş akışına doğru özyinelemeli olarak yayılır.

Sonuç olarak, tüm iş akışının bir sonraki durumu ana iş akışının düğümlerinde belirlenir. Eğer ana iş akışındaki bir düğüm başarısızlık döndürürse, tüm iş akışı başarısız bir durumla sona erer.

Herhangi bir düğüm yürütüldükten sonra "beklemede" (pending) durumu döndürürse, tüm yürütme süreci geçici olarak kesintiye uğrar ve askıya alınır; ilgili düğüm tarafından tanımlanan bir olayın tetiklenmesini bekleyerek iş akışının yürütülmesine devam edilir. Örneğin, Manuel Düğüm, bu düğüme gelindiğinde "beklemede" durumuyla duraklar ve manuel müdahale ile onaylanıp onaylanmayacağına karar verilmesini bekler. Eğer manuel olarak girilen durum onay ise, sonraki iş akışı düğümleri devam eder; aksi takdirde daha önceki başarısızlık mantığına göre işlem yapılır.

Daha fazla talimat dönüş durumu için lütfen İş Akışı API Referansı bölümüne bakınız.

### Erken Çıkış

Bazı özel iş akışlarında, bir düğüm içinde iş akışını doğrudan sonlandırmak gerekebilir. Bu durumda `null` döndürerek mevcut iş akışından çıkıldığını ve sonraki düğümlerin yürütülmeyeceğini belirtebilirsiniz.

Bu durum, Paralel Dal Düğümü ([kod referansı](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)) gibi akış kontrol tipi düğümlerde yaygındır. Burada mevcut düğümün iş akışı sonlanır, ancak her alt dal için yeni iş akışları başlatılır ve yürütülmeye devam edilir.

:::warn{title=Uyarı}
Genişletilmiş düğümlerle dal iş akışlarını planlamak belirli bir karmaşıklığa sahiptir ve dikkatli bir şekilde ele alınmalı ve kapsamlı testler yapılmalıdır.
:::

### Daha Fazla Bilgi Edinin

Düğüm türlerini tanımlamak için çeşitli parametrelerin tanımları için İş Akışı API Referansı bölümüne bakınız.

## İstemci Tarafı

Tetikleyicilere benzer şekilde, bir talimatın (düğüm türü) yapılandırma formu istemci tarafında uygulanmalıdır.

### En Basit Düğüm Talimatı

Tüm talimatlar `Instruction` temel sınıfından türetilmelidir. İlgili özellikler ve metotlar, düğümün yapılandırılması ve kullanılması için kullanılır.

Örneğin, yukarıda sunucu tarafında tanımladığımız rastgele sayı dizisi (`randomString`) tipi düğüm için bir yapılandırma arayüzü sağlamamız gerekiyorsa, rastgele sayının basamak sayısını temsil eden `digit` adında bir yapılandırma öğesi bulunur. Yapılandırma formunda kullanıcı girişini almak için bir sayı giriş kutusu kullanırız.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=İpucu}
İstemci tarafında kaydedilen düğüm tipi tanımlayıcısı, sunucu tarafındaki ile tutarlı olmalıdır; aksi takdirde hatalara yol açacaktır.
:::

### Düğüm Sonuçlarını Değişken Olarak Sağlama

Yukarıdaki örnekteki `useVariables` metodunu fark etmiş olabilirsiniz. Eğer düğümün sonucunu (`result` kısmı) sonraki düğümler tarafından kullanılmak üzere bir değişken olarak sağlamanız gerekiyorsa, bu metodu miras alınan talimat sınıfında uygulamanız ve `VariableOption` tipine uygun bir nesne döndürmeniz gerekir. Bu nesne, düğümün yürütme sonucunun yapısal bir açıklamasını sunar ve sonraki düğümlerde seçim ve kullanım için değişken adı eşlemesi sağlar.

`VariableOption` tipi aşağıdaki gibi tanımlanmıştır:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

Temel nokta `value` özelliğidir; bu, değişken adının bölümlenmiş yol değerini temsil eder. `label` arayüzde görüntülemek için kullanılır ve `children` ise çok seviyeli bir değişken yapısını temsil etmek için kullanılır; düğümün sonucu derinlemesine iç içe geçmiş bir nesne olduğunda kullanılır.

Kullanılabilir bir değişken, sistem içinde `.` ile ayrılmış bir yol şablonu dizesi olarak temsil edilir, örneğin `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Burada, `jobsMapByNodeKey` tüm düğümlerin sonuç kümesini temsil eder (dahili olarak tanımlanmıştır, işlem yapmaya gerek yoktur), `2dw92cdf` düğümün `key`'idir ve `abc` düğümün sonuç nesnesindeki özel bir özelliktir.

Ek olarak, bir düğümün sonucu basit bir değer de olabileceğinden, düğüm değişkenleri sağlanırken ilk seviye **mutlaka** düğümün kendisinin açıklaması olmalıdır:

```ts
{
  value: node.key,
  label: node.title,
}
```

Yani, ilk seviye düğümün `key`'i ve başlığıdır. Örneğin, hesaplama düğümünün [kod referansında](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77) olduğu gibi, hesaplama düğümünün sonucunu kullanırken arayüz seçenekleri şunlardır:

![运算节点的结果](https://static-docs.nocobase.com/20240514230014.png)

Düğümün sonucu karmaşık bir nesne olduğunda, iç içe geçmiş özellikleri tanımlamaya devam etmek için `children` kullanabilirsiniz. Örneğin, özel bir talimat aşağıdaki JSON verilerini döndürebilir:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Bu durumda, aşağıdaki `useVariables` metodu aracılığıyla döndürebilirsiniz:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

Bu sayede, sonraki düğümlerde aşağıdaki arayüzü kullanarak değişkenleri seçebilirsiniz:

![映射后的结果变量](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="İpucu"}
Sonuçtaki bir yapı derinlemesine iç içe geçmiş nesne dizisi olduğunda, yolu tanımlamak için yine `children` kullanabilirsiniz, ancak dizi indekslerini içeremez. Çünkü NocoBase iş akışının değişken işleme mekanizmasında, nesne dizileri için değişken yolu açıklaması, kullanıldığında otomatik olarak derin değerlerin bir dizisine düzleştirilir ve belirli bir değere indeks aracılığıyla erişilemez.
:::

### Düğüm Kullanılabilirliği

Varsayılan olarak, iş akışına herhangi bir düğüm eklenebilir. Ancak, bazı durumlarda bir düğüm belirli iş akışı türlerinde veya dallarda uygun olmayabilir. Bu gibi durumlarda, düğümün kullanılabilirliğini `isAvailable` kullanarak yapılandırabilirsiniz:

```ts
// Tip tanımı
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // İş akışı eklentisi örneği
  engine: WorkflowPlugin;
  // İş akışı örneği
  workflow: object;
  // Yukarı akış düğümü
  upstream: object;
  // Bir dal düğümü olup olmadığı (dal numarası)
  branchIndex: number;
};
```

`isAvailable` metodu `true` döndürdüğünde düğümün kullanılabilir olduğunu, `false` döndürdüğünde ise kullanılamaz olduğunu belirtir. `ctx` parametresi, mevcut düğümün bağlam bilgilerini içerir ve bu bilgilere göre düğümün kullanılabilir olup olmadığını belirleyebilirsiniz.

Özel bir gereksiniminiz yoksa, `isAvailable` metodunu uygulamanıza gerek yoktur, düğümler varsayılan olarak kullanılabilir durumdadır. Yapılandırma gerektiren en yaygın senaryo, bir düğümün zaman alıcı bir işlem olabileceği ve senkron bir iş akışında yürütülmeye uygun olmadığı durumlardır. Bu durumda, `isAvailable` metodunu kullanarak düğümün kullanımını kısıtlayabilirsiniz. Örneğin:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Daha Fazla Bilgi Edinin

Düğüm türlerini tanımlamak için çeşitli parametrelerin tanımları için İş Akışı API Referansı bölümüne bakınız.