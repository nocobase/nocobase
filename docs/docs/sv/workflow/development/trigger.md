:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utöka triggertyper

Varje arbetsflöde måste konfigureras med en specifik trigger, som fungerar som startpunkt för processens exekvering.

En triggertyp representerar vanligtvis en specifik systemhändelse. Under applikationens livscykel kan alla delar som erbjuder prenumererbara händelser användas för att definiera en triggertyp. Till exempel att ta emot förfrågningar, samlingsoperationer, schemalagda uppgifter med mera.

Triggertyper registreras i pluginets triggertabell baserat på en strängidentifierare. Arbetsflödes-pluginet har flera inbyggda triggers:

- `'collection'`: Utlöses av samlingsoperationer;
- `'schedule'`: Utlöses av schemalagda uppgifter;
- `'action'`: Utlöses av händelser efter en åtgärd;


Utökade triggertyper måste ha unika identifierare. Implementeringen för att prenumerera på/avprenumerera från triggern registreras på serversidan, och implementeringen för konfigurationsgränssnittet registreras på klientsidan.

## Serversidan

Alla triggers måste ärva från basklassen `Trigger` och implementera metoderna `on`/`off`, som används för att prenumerera på respektive avprenumerera från specifika miljöhändelser. I `on`-metoden behöver ni anropa `this.workflow.trigger()` inom den specifika händelseåteruppringningsfunktionen för att slutligen utlösa händelsen. I `off`-metoden behöver ni utföra relevant städarbete för avprenumerationen.

Där `this.workflow` är arbetsflödes-plugininstansen som skickas in i `Trigger`-basklassens konstruktor.

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

Därefter, i pluginet som utökar arbetsflödet, registrerar ni triggerinstansen med arbetsflödesmotorn:

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

När servern har startat och laddats kan triggern av typen `'interval'` läggas till och exekveras.

## Klientsidan

Klientsidan tillhandahåller huvudsakligen ett konfigurationsgränssnitt baserat på de konfigurationsalternativ som triggertypen kräver. Varje triggertyp behöver också registrera sin motsvarande typkonfiguration hos arbetsflödes-pluginet.

Till exempel, för den schemalagda exekveringstriggern som nämns ovan, definierar ni det nödvändiga konfigurationsalternativet för intervalltid (`interval`) i konfigurationsgränssnittsformuläret:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Intervalltimer-trigger';
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

Därefter registrerar ni denna triggertyp med arbetsflödes-plugininstansen inom det utökade pluginet:

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

Därefter kommer den nya triggertypen att synas i arbetsflödets konfigurationsgränssnitt.

:::info{title=Obs}
Identifieraren för triggertypen som registreras på klientsidan måste vara konsekvent med den på serversidan, annars uppstår fel.
:::

För ytterligare detaljer om att definiera triggertyper, se avsnittet [Arbetsflödes API-referens](./api#pluginregisterTrigger).