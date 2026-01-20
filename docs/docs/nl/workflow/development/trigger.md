:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Uitbreiden van triggertypen

Elke workflow moet worden geconfigureerd met een specifieke trigger, die dient als het startpunt voor de uitvoering van het proces.

Een triggertype vertegenwoordigt meestal een specifieke systeemgebeurtenis. Tijdens de levenscyclus van de applicatie kan elk onderdeel dat abonneerbare gebeurtenissen aanbiedt, worden gebruikt om een triggertype te definiëren. Denk hierbij aan het ontvangen van verzoeken, bewerkingen op een collectie, of geplande taken.

Triggertypen worden geregistreerd in de triggertabel van de plugin op basis van een string-identificatie. De workflow plugin heeft verschillende ingebouwde triggers:

- `'collection'`: Getriggerd door collectie-bewerkingen;
- `'schedule'`: Getriggerd door geplande taken;
- `'action'`: Getriggerd door gebeurtenissen na een actie;

Uitgebreide triggertypen moeten een unieke identificatie hebben. De implementatie voor het abonneren/afmelden van de trigger wordt aan de serverzijde geregistreerd, en de implementatie voor de configuratie-interface wordt aan de clientzijde geregistreerd.

## Serverzijde

Elke trigger moet overerven van de `Trigger` basisklasse en de `on`/`off` methoden implementeren. Deze methoden worden respectievelijk gebruikt voor het abonneren op en afmelden van specifieke omgevingsgebeurtenissen. Binnen de `on` methode moet u `this.workflow.trigger()` aanroepen in de specifieke event-callbackfunctie om de gebeurtenis uiteindelijk te triggeren. In de `off` methode moet u de relevante opschoonwerkzaamheden voor het afmelden uitvoeren.

`this.workflow` is de workflow plugin-instantie die in de constructor van de `Trigger` basisklasse wordt doorgegeven.

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

Vervolgens registreert u in de plugin die de workflow uitbreidt, de trigger-instantie bij de workflow-engine:

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

Nadat de server is gestart en geladen, kan de trigger van het type `'interval'` worden toegevoegd en uitgevoerd.

## Clientzijde

Het clientzijde-gedeelte biedt voornamelijk een configuratie-interface op basis van de configuratie-items die nodig zijn voor het triggertype. Elk triggertype moet ook de bijbehorende typeconfiguratie registreren bij de workflow plugin.

Voor de hierboven genoemde trigger voor geplande uitvoering definieert u bijvoorbeeld het benodigde configuratie-item voor de intervaltijd (`interval`) in het configuratieformulier:

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

Registreer vervolgens dit triggertype bij de workflow plugin-instantie binnen de uitgebreide plugin:

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

Daarna zal het nieuwe triggertype zichtbaar zijn in de configuratie-interface van de workflow.

:::info{title=Tip}
De identificatie van het triggertype dat aan de clientzijde is geregistreerd, moet overeenkomen met die aan de serverzijde, anders leidt dit tot fouten.
:::

Voor andere details over het definiëren van triggertypen, verwijzen wij u naar het gedeelte [Workflow API Referentie](./api#pluginregisterTrigger).