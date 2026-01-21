:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Rozšíření typů spouštěčů

Každý pracovní postup musí být nakonfigurován s konkrétním spouštěčem, který slouží jako vstupní bod pro zahájení jeho provádění.

Typ spouštěče obvykle představuje specifickou událost systémového prostředí. Během životního cyklu běhu aplikace lze k definování typu spouštěče použít jakoukoli část, která poskytuje události, k nimž se lze přihlásit. Například příjem požadavků, operace s kolekcemi, plánované úlohy atd.

Typy spouštěčů jsou registrovány v tabulce spouštěčů pluginu na základě řetězcového identifikátoru. Plugin pro pracovní postupy obsahuje několik vestavěných spouštěčů:

- `'collection'`: Spouštěno operacemi s kolekcemi;
- `'schedule'`: Spouštěno plánovanými úlohami;
- `'action'`: Spouštěno událostmi po akci;

Rozšířené typy spouštěčů musí zajistit jedinečnost svých identifikátorů. Implementace pro přihlášení/odhlášení spouštěče se registruje na straně serveru a implementace pro konfigurační rozhraní se registruje na straně klienta.

## Na straně serveru

Jakýkoli spouštěč musí dědit z bázové třídy `Trigger` a implementovat metody `on`/`off`, které slouží k přihlášení a odhlášení od konkrétních událostí prostředí. V metodě `on` je potřeba v rámci konkrétní callback funkce události zavolat `this.workflow.trigger()`, aby se událost nakonec spustila. V metodě `off` je zase nutné provést příslušné úklidové práce související s odhlášením.

Přičemž `this.workflow` je instance pluginu pro pracovní postupy, která je předána do konstruktoru bázové třídy `Trigger`.

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

Poté v pluginu, který rozšiřuje pracovní postup, zaregistrujte instanci spouštěče do enginu pracovních postupů:

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

Po spuštění a načtení serveru lze spouštěč typu `'interval'` přidávat a spouštět.

## Na straně klienta

Část na straně klienta primárně poskytuje konfigurační rozhraní na základě konfiguračních položek požadovaných typem spouštěče. Každý typ spouštěče také musí zaregistrovat svou odpovídající konfiguraci typu u pluginu pro pracovní postupy.

Například pro výše zmíněný spouštěč plánovaného spuštění definujte požadovanou konfigurační položku pro interval (`interval`) ve formuláři konfiguračního rozhraní:

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

Poté v rámci rozšířeného pluginu zaregistrujte tento typ spouštěče u instance pluginu pro pracovní postupy:

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

Poté bude nový typ spouštěče viditelný v konfiguračním rozhraní pracovního postupu.

:::info{title=Tip}
Identifikátor typu spouštěče registrovaného na straně klienta musí být shodný s identifikátorem na straně serveru, jinak dojde k chybám.
:::

Další podrobnosti o definování typů spouštěčů naleznete v sekci [Referenční příručka API pro pracovní postupy](./api#pluginregisterTrigger).