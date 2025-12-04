:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Tetikleyici Türlerini Genişletme

Her iş akışı, sürecin yürütülmesini başlatan bir giriş noktası görevi gören belirli bir tetikleyici ile yapılandırılmalıdır.

Bir tetikleyici türü genellikle belirli bir sistem ortamı olayını temsil eder. Uygulamanın çalışma zamanı yaşam döngüsü boyunca, abone olunabilir olaylar sağlayan herhangi bir bölüm, bir tetikleyici türü tanımlamak için kullanılabilir. Örneğin, istek alma, koleksiyon işlemleri, zamanlanmış görevler vb.

Tetikleyici türleri, bir dize tanımlayıcıya göre eklentinin tetikleyici tablosuna kaydedilir. İş akışı eklentisi, birkaç yerleşik tetikleyiciye sahiptir:

- `'collection'`: Koleksiyon işlemleri tarafından tetiklenir;
- `'schedule'`: Zamanlanmış görevler tarafından tetiklenir;
- `'action'`: İşlem sonrası olaylar tarafından tetiklenir;

Genişletilmiş tetikleyici türlerinin tanımlayıcılarının benzersiz olması gerekir. Tetikleyiciye abone olma/abonelikten çıkma uygulaması sunucu tarafında, yapılandırma arayüzü uygulaması ise istemci tarafında kaydedilir.

## Sunucu Tarafı

Herhangi bir tetikleyicinin `Trigger` temel sınıfından miras alması ve belirli ortam olaylarına abone olmak ve abonelikten çıkmak için sırasıyla `on`/`off` metotlarını uygulaması gerekir. `on` metodu içinde, olayı nihayetinde tetiklemek için belirli olay geri çağırma fonksiyonunda `this.workflow.trigger()` çağrısı yapmanız gerekir. Ayrıca `off` metodunda, abonelikten çıkma ile ilgili temizlik işlemlerini yapmanız gerekmektedir.

Burada `this.workflow`, `Trigger` temel sınıfının yapıcı metoduna (constructor) geçirilen iş akışı eklentisi örneğidir.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

Ardından, iş akışını genişleten eklentide, tetikleyici örneğini iş akışı motoruna kaydedin:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

Sunucu başlatılıp yüklendikten sonra, `'interval'` türündeki tetikleyici eklenebilir ve çalıştırılabilir.

## İstemci Tarafı

İstemci tarafı, temel olarak tetikleyici türünün gerektirdiği yapılandırma öğelerine göre bir yapılandırma arayüzü sağlar. Her tetikleyici türünün, ilgili tür yapılandırmasını İş akışı eklentisine kaydetmesi de gerekir.

Örneğin, yukarıda bahsedilen zamanlanmış yürütme tetikleyicisi için, yapılandırma arayüzü formunda gerekli aralık süresi yapılandırma öğesini (`interval`) tanımlayın:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

Ardından, genişletilmiş eklenti içinde bu tetikleyici türünü iş akışı eklentisi örneğine kaydedin:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

Bundan sonra, yeni tetikleyici türünü iş akışının yapılandırma arayüzünde görebilirsiniz.

:::info{title=İpucu}
İstemci tarafında kaydedilen tetikleyici türü tanımlayıcısı, sunucu tarafındakiyle tutarlı olmalıdır, aksi takdirde hatalara yol açacaktır.
:::

Tetikleyici türlerini tanımlamaya ilişkin diğer ayrıntılar için lütfen [İş Akışı API Referansı](./api#pluginregisterTrigger) bölümüne bakın.