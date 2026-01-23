:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht

Een workflow bestaat doorgaans uit verschillende met elkaar verbonden stappen. Elk knooppunt vertegenwoordigt één van deze stappen en is een fundamentele logische eenheid binnen het proces. Net als in een programmeertaal vertegenwoordigen verschillende typen knooppunten verschillende instructies, die het gedrag van het knooppunt bepalen. Wanneer de workflow wordt uitgevoerd, doorloopt het systeem elk knooppunt achtereenvolgens en voert het de instructies ervan uit.

:::info{title=Tip}
De trigger van een workflow is geen knooppunt. Deze wordt alleen weergegeven als een ingangspunt in het stroomschema, maar is een ander concept dan een knooppunt. Voor meer details verwijzen wij u naar de inhoud van [Triggers](../triggers/index.md).
:::

Vanuit een functioneel oogpunt kunnen de momenteel geïmplementeerde knooppunten worden onderverdeeld in verschillende hoofdcategorieën (in totaal 29 typen knooppunten):

- Kunstmatige intelligentie
  - [Groot Taalmodel](../../ai-employees/workflow/nodes/llm/chat.md) (aangeboden door de @nocobase/plugin-workflow-llm plugin)
- Procesbeheer
  - [Conditie](./condition.md)
  - [Meerdere condities](./multi-conditions.md)
  - [Lus](./loop.md) (aangeboden door de @nocobase/plugin-workflow-loop plugin)
  - [Variabele](./variable.md) (aangeboden door de @nocobase/plugin-workflow-variable plugin)
  - [Parallelle tak](./parallel.md) (aangeboden door de @nocobase/plugin-workflow-parallel plugin)
  - [Workflow aanroepen](./subflow.md) (aangeboden door de @nocobase/plugin-workflow-subflow plugin)
  - [Workflow uitvoer](./output.md) (aangeboden door de @nocobase/plugin-workflow-subflow plugin)
  - [JSON Variabele mapping](./json-variable-mapping.md) (aangeboden door de @nocobase/plugin-workflow-json-variable-mapping plugin)
  - [Vertraging](./delay.md) (aangeboden door de @nocobase/plugin-workflow-delay plugin)
  - [Workflow beëindigen](./end.md)
- Berekening
  - [Berekening](./calculation.md)
  - [Datumberekening](./date-calculation.md) (aangeboden door de @nocobase/plugin-workflow-date-calculation plugin)
  - [JSON Query](./json-query.md) (aangeboden door de @nocobase/plugin-workflow-json-query plugin)
- Collectie acties
  - [Gegevens aanmaken](./create.md)
  - [Gegevens bijwerken](./update.md)
  - [Gegevens verwijderen](./destroy.md)
  - [Gegevens opvragen](./query.md)
  - [Geaggregeerde query](./aggregate.md) (aangeboden door de @nocobase/plugin-workflow-aggregate plugin)
  - [SQL actie](./sql.md) (aangeboden door de @nocobase/plugin-workflow-sql plugin)
- Handmatige verwerking
  - [Handmatige verwerking](./manual.md) (aangeboden door de @nocobase/plugin-workflow-manual plugin)
  - [Goedkeuring](./approval.md) (aangeboden door de @nocobase/plugin-workflow-approval plugin)
  - [CC](./cc.md) (aangeboden door de @nocobase/plugin-workflow-cc plugin)
- Overige extensies
  - [HTTP-verzoek](./request.md) (aangeboden door de @nocobase/plugin-workflow-request plugin)
  - [JavaScript](./javascript.md) (aangeboden door de @nocobase/plugin-workflow-javascript plugin)
  - [E-mail verzenden](./mailer.md) (aangeboden door de @nocobase/plugin-workflow-mailer plugin)
  - [Notificatie](../../notification-manager/index.md#工作流通知节点) (aangeboden door de @nocobase/plugin-workflow-notification plugin)
  - [Respons](./response.md) (aangeboden door de @nocobase/plugin-workflow-webhook plugin)
  - [Responsbericht](./response-message.md) (aangeboden door de @nocobase/plugin-workflow-response-message plugin)