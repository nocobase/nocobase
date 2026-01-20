:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Rozszerzanie typów wyzwalaczy

Każdy przepływ pracy musi być skonfigurowany z określonym wyzwalaczem, który stanowi punkt wejścia do rozpoczęcia jego wykonania.

Typ wyzwalacza zazwyczaj reprezentuje konkretne zdarzenie w środowisku systemowym. W cyklu życia aplikacji, każda część, która udostępnia zdarzenia możliwe do subskrybowania, może być użyta do zdefiniowania typu wyzwalacza. Na przykład: odbieranie żądań, operacje na kolekcjach, zadania cykliczne itp.

Typy wyzwalaczy są rejestrowane w tabeli wyzwalaczy wtyczki na podstawie identyfikatora ciągu znaków. Wtyczka przepływu pracy zawiera kilka wbudowanych wyzwalaczy:

- `'collection'`: Wyzwalany przez operacje na kolekcjach;
- `'schedule'`: Wyzwalany przez zadania cykliczne;
- `'action'`: Wyzwalany po zdarzeniach akcji;


Rozszerzone typy wyzwalaczy muszą mieć unikalne identyfikatory. Implementacja subskrypcji/anulowania subskrypcji wyzwalacza jest rejestrowana po stronie serwera, natomiast implementacja interfejsu konfiguracji – po stronie klienta.

## Po stronie serwera

Każdy wyzwalacz musi dziedziczyć z klasy bazowej `Trigger` i implementować metody `on`/`off`, które służą odpowiednio do subskrybowania i anulowania subskrypcji konkretnych zdarzeń środowiskowych. W metodzie `on` należy wywołać `this.workflow.trigger()` w funkcji zwrotnej konkretnego zdarzenia, aby ostatecznie wyzwolić zdarzenie. Natomiast w metodzie `off` należy wykonać odpowiednie prace porządkowe związane z anulowaniem subskrypcji.

`this.workflow` to instancja wtyczki przepływu pracy przekazana do konstruktora klasy bazowej `Trigger`.

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

Następnie, we wtyczce rozszerzającej przepływ pracy, należy zarejestrować instancję wyzwalacza w silniku przepływu pracy:

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

Po uruchomieniu i załadowaniu serwera, wyzwalacz typu `'interval'` będzie mógł być dodawany i wykonywany.

## Po stronie klienta

Część kliencka głównie udostępnia interfejs konfiguracji, oparty na elementach konfiguracyjnych wymaganych przez dany typ wyzwalacza. Każdy typ wyzwalacza musi również zarejestrować swoją odpowiednią konfigurację typu we wtyczce przepływu pracy.

Na przykład, dla wspomnianego wyżej wyzwalacza cyklicznego wykonania, należy zdefiniować wymagany element konfiguracji czasu interwału (`interval`) w formularzu interfejsu konfiguracji:

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

Następnie, w rozszerzonej wtyczce, należy zarejestrować ten typ wyzwalacza w instancji wtyczki przepływu pracy:

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

Następnie, nowy typ wyzwalacza będzie widoczny w interfejsie konfiguracji przepływu pracy.

:::info{title=Wskazówka}
Identyfikator typu wyzwalacza zarejestrowany po stronie klienta musi być zgodny z identyfikatorem po stronie serwera, w przeciwnym razie wystąpią błędy.
:::

Inne szczegóły dotyczące definiowania typów wyzwalaczy znajdą Państwo w sekcji [Referencje API przepływu pracy](./api#pluginregisterTrigger).