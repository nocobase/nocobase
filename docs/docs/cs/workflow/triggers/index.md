:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled

Spouštěč je vstupním bodem pro pracovní postup. Když během běhu aplikace nastane událost, která splňuje podmínky spouštěče, pracovní postup se spustí a provede. Typ spouštěče je zároveň typem pracovního postupu. Volí se při vytváření pracovního postupu a po jeho vytvoření jej nelze změnit. Aktuálně jsou podporovány následující typy spouštěčů:

- [Události kolekce](./collection) (Vestavěné)
- [Plánované úlohy](./schedule) (Vestavěné)
- [Před akcí](./pre-action) (Poskytováno pluginem @nocobase/plugin-workflow-request-interceptor)
- [Po akci](./post-action) (Poskytováno pluginem @nocobase/plugin-workflow-action-trigger)
- [Vlastní akce](./custom-action) (Poskytováno pluginem @nocobase/plugin-workflow-custom-action-trigger)
- [Schválení](./approval) (Poskytováno pluginem @nocobase/plugin-workflow-approval)
- [Webhook](./webhook) (Poskytováno pluginem @nocobase/plugin-workflow-webhook)

Načasování spuštění jednotlivých událostí je znázorněno na obrázku níže:

![Události pracovního postupu](https://static-docs.nocobase.com/20251029221709.png)

Například, když uživatel odešle formulář, nebo se data v kolekci změní v důsledku akce uživatele či volání programu, nebo když plánovaná úloha dosáhne svého času spuštění, může být spuštěn nakonfigurovaný pracovní postup.

Spouštěče související s daty (například akce, události kolekce) obvykle nesou kontextová data spouštěče. Tato data fungují jako proměnné a mohou být použita uzly v pracovním postupu jako parametry pro zpracování, čímž se dosáhne automatizovaného zpracování dat. Například, když uživatel odešle formulář, a tlačítko pro odeslání je navázáno na pracovní postup, tento pracovní postup se spustí a provede. Odeslaná data budou vložena do kontextového prostředí plánu spuštění, aby je následné uzly mohly použít jako proměnné.

Po vytvoření pracovního postupu se na stránce zobrazení pracovního postupu spouštěč zobrazí jako vstupní uzel na začátku procesu. Kliknutím na tuto kartu otevřete konfigurační panel. V závislosti na typu spouštěče můžete konfigurovat jeho relevantní podmínky.

![Spouštěč_Vstupní uzel](https://static-docs.nocobase.com/20251029222231.png)