:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled

Pracovní postup se obvykle skládá z několika propojených operačních kroků. Každý uzel představuje jeden z těchto kroků a slouží jako základní logická jednotka v procesu. Stejně jako v programovacím jazyce, různé typy uzlů reprezentují různé instrukce, které určují chování uzlu. Když se pracovní postup spustí, systém postupně vstupuje do každého uzlu a provádí jeho instrukce.

:::info{title=Poznámka}
Spouštěč pracovního postupu není uzel. Zobrazuje se pouze jako vstupní bod ve vývojovém diagramu, ale jedná se o odlišný koncept než uzel. Podrobnosti naleznete v obsahu [Spouštěče](../triggers/index.md).
:::

Z funkčního hlediska lze aktuálně implementované uzly rozdělit do několika hlavních kategorií (celkem 29 typů uzlů):

- Umělá inteligence
  - [Velký jazykový model](../../ai-employees/workflow/nodes/llm/chat.md) (poskytuje plugin @nocobase/plugin-workflow-llm)
- Řízení toku
  - [Podmínka](./condition.md)
  - [Více podmínek](./multi-conditions.md)
  - [Smyčka](./loop.md) (poskytuje plugin @nocobase/plugin-workflow-loop)
  - [Proměnná](./variable.md) (poskytuje plugin @nocobase/plugin-workflow-variable)
  - [Paralelní větev](./parallel.md) (poskytuje plugin @nocobase/plugin-workflow-parallel)
  - [Vyvolání pracovního postupu](./subflow.md) (poskytuje plugin @nocobase/plugin-workflow-subflow)
  - [Výstup pracovního postupu](./output.md) (poskytuje plugin @nocobase/plugin-workflow-subflow)
  - [Mapování JSON proměnných](./json-variable-mapping.md) (poskytuje plugin @nocobase/plugin-workflow-json-variable-mapping)
  - [Zpoždění](./delay.md) (poskytuje plugin @nocobase/plugin-workflow-delay)
  - [Ukončení pracovního postupu](./end.md)
- Výpočet
  - [Výpočet](./calculation.md)
  - [Výpočet data](./date-calculation.md) (poskytuje plugin @nocobase/plugin-workflow-date-calculation)
  - [Výpočet JSON](./json-query.md) (poskytuje plugin @nocobase/plugin-workflow-json-query)
- Akce s kolekcí
  - [Vytvoření dat](./create.md)
  - [Aktualizace dat](./update.md)
  - [Smazání dat](./destroy.md)
  - [Dotazování dat](./query.md)
  - [Agregační dotaz](./aggregate.md) (poskytuje plugin @nocobase/plugin-workflow-aggregate)
  - [SQL akce](./sql.md) (poskytuje plugin @nocobase/plugin-workflow-sql)
- Manuální zpracování
  - [Manuální zpracování](./manual.md) (poskytuje plugin @nocobase/plugin-workflow-manual)
  - [Schválení](./approval.md) (poskytuje plugin @nocobase/plugin-workflow-approval)
  - [Kopie (CC)](./cc.md) (poskytuje plugin @nocobase/plugin-workflow-cc)
- Další rozšíření
  - [HTTP požadavek](./request.md) (poskytuje plugin @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (poskytuje plugin @nocobase/plugin-workflow-javascript)
  - [Odeslání e-mailu](./mailer.md) (poskytuje plugin @nocobase/plugin-workflow-mailer)
  - [Oznámení](../../notification-manager/index.md#工作流通知节点) (poskytuje plugin @nocobase/plugin-workflow-notification)
  - [Odpověď](./response.md) (poskytuje plugin @nocobase/plugin-workflow-webhook)
  - [Zpráva odpovědi](./response-message.md) (poskytuje plugin @nocobase/plugin-workflow-response-message)