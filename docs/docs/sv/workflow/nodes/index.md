:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

Ett arbetsflöde består vanligtvis av flera sammankopplade operationssteg. Varje nod representerar ett sådant steg och fungerar som en grundläggande logisk enhet i processen. Precis som i ett programmeringsspråk representerar olika typer av noder olika instruktioner som bestämmer nodens beteende. När arbetsflödet körs går systemet igenom varje nod sekventiellt och utför dess instruktioner.

:::info{title=Tips}
Ett arbetsflödes utlösare är inte en nod. Den visas endast som en ingångspunkt i flödesschemat, men är ett annat koncept än en nod. För mer information, se innehållet om [Utlösare](../triggers/index.md).
:::

Ur ett funktionellt perspektiv kan de för närvarande implementerade noderna delas in i flera huvudkategorier (totalt 29 typer av noder):

- Artificiell intelligens
  - [Stor språkmodell](../../ai-employees/workflow/nodes/llm/chat.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-llm)
- Flödeskontroll
  - [Villkor](./condition.md)
  - [Flera villkor](./multi-conditions.md)
  - [Loop](./loop.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-loop)
  - [Variabel](./variable.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-variable)
  - [Parallell gren](./parallel.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-parallel)
  - [Anropa arbetsflöde](./subflow.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-subflow)
  - [Arbetsflödesutdata](./output.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-subflow)
  - [JSON-variabelmappning](./json-variable-mapping.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-json-variable-mapping)
  - [Fördröjning](./delay.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-delay)
  - [Avsluta arbetsflöde](./end.md)
- Beräkning
  - [Beräkning](./calculation.md)
  - [Datumberäkning](./date-calculation.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-date-calculation)
  - [JSON-beräkning](./json-query.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-json-query)
- Samlingsåtgärder
  - [Skapa data](./create.md)
  - [Uppdatera data](./update.md)
  - [Ta bort data](./destroy.md)
  - [Fråga data](./query.md)
  - [Aggregerad fråga](./aggregate.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-aggregate)
  - [SQL-åtgärd](./sql.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-sql)
- Manuell hantering
  - [Manuell hantering](./manual.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-manual)
  - [Godkännande](./approval.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-approval)
  - [Kopia (CC)](./cc.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-cc)
- Övriga tillägg
  - [HTTP-förfrågan](./request.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-javascript)
  - [Skicka e-post](./mailer.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-mailer)
  - [Meddelande](../../notification-manager/index.md#工作流通知节点) (tillhandahålls av pluginet @nocobase/plugin-workflow-notification)
  - [Svar](./response.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-webhook)
  - [Svarmeddelande](./response-message.md) (tillhandahålls av pluginet @nocobase/plugin-workflow-response-message)