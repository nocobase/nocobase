---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Událost vlastní akce

## Úvod

NocoBase obsahuje vestavěné běžné datové operace (jako je přidávání, mazání, aktualizace a prohlížení). Pokud tyto operace nestačí pro složité obchodní požadavky, můžete využít události vlastní akce v rámci **pracovního postupu**. Tuto událost pak navážete na tlačítko „Spustit pracovní postup“ v bloku stránky. Po kliknutí uživatele se spustí **pracovní postup** vlastní akce.

## Vytvoření pracovního postupu

Při vytváření **pracovního postupu** vyberte „Událost vlastní akce“:

![Create "Custom Action Event" workflow](https://static-docs.nocobase.com/20240509091820.png)

## Konfigurace spouštěče

### Typ kontextu

> v.1.6.0+

Typ kontextu určuje, ke kterým tlačítkům v blocích lze **pracovní postup** navázat:

*   Bez kontextu: Jedná se o globální událost, kterou lze navázat na akční tlačítka v panelu akcí a datových blocích.
*   Jeden záznam: Lze navázat na akční tlačítka v datových blocích, jako jsou řádky tabulek, formuláře a detaily.
*   Více záznamů: Lze navázat na tlačítka pro hromadné akce v tabulce.

![Trigger Configuration_Context Type](https://static-docs.nocobase.com/20250215135808.png)

### Kolekce

Pokud je typ kontextu Jeden záznam nebo Více záznamů, musíte vybrat **kolekci**, ke které se má datový model navázat:

![Trigger Configuration_Select Collection](https://static-docs.nocobase.com/20250215135919.png)

### Související data k použití

Pokud potřebujete v **pracovním postupu** použít související data spouštěného datového řádku, můžete zde vybrat hluboká související pole:

![Trigger Configuration_Select Association Data to be Used](https://static-docs.nocobase.com/20250215135955.png)

Tato pole se po spuštění události automaticky přednačtou do kontextu **pracovního postupu**, aby je bylo možné v **pracovním postupu** použít.

## Konfigurace akce

Konfigurace akčních tlačítek v různých blocích se liší v závislosti na typu kontextu nastaveném v konfiguraci **pracovního postupu**.

### Bez kontextu

> v.1.6.0+

V panelu akcí a dalších datových blocích můžete přidat tlačítko „Spustit **pracovní postup**“:

![Add Action Button to Block_Action Bar](https://static-docs.nocobase.com/20250215221738.png)

![Add Action Button to Block_Calendar](https://static-docs.nocobase.com/20250215221942.png)

![Add Action Button to Block_Gantt Chart](https://static-docs.nocobase.com/20250215221810.png)

Po přidání tlačítka navážete dříve vytvořený **pracovní postup** bez kontextu. Zde je příklad s tlačítkem v panelu akcí:

![Bind Workflow to Button_Action Bar](https://static-docs.nocobase.com/20250215222120.png)

![Select Workflow to Bind_No Context](https://static-docs.nocobase.com/20250215222234.png)

### Jeden záznam

V libovolném datovém bloku lze do panelu akcí pro jeden záznam přidat tlačítko „Spustit **pracovní postup**“, například ve formulářích, řádcích tabulek, detailech atd.:

![Add Action Button to Block_Form](https://static-docs.nocobase.com/20240509165428.png)

![Add Action Button to Block_Table Row](https://static-docs.nocobase.com/20240509165340.png)

![Add Action Button to Block_Details](https://static-docs.nocobase.com/20240509165545.png)

Po přidání tlačítka navážete dříve vytvořený **pracovní postup**:

![Bind Workflow to Button](https://static-docs.nocobase.com/20240509165631.png)

![Select Workflow to Bind](https://static-docs.nocobase.com/20240509165658.png)

Poté kliknutím na toto tlačítko spustíte událost vlastní akce:

![Result of Clicking the Button](https://static-docs.nocobase.com/20240509170453.png)

### Více záznamů

> v.1.6.0+

V panelu akcí bloku tabulky se při přidávání tlačítka „Spustit **pracovní postup**“ zobrazí dodatečná možnost pro výběr typu kontextu: „Bez kontextu“ nebo „Více záznamů“:

![Add Action Button to Block_Table](https://static-docs.nocobase.com/20250215222507.png)

Pokud je vybráno „Bez kontextu“, jedná se o globální událost a lze ji navázat pouze na **pracovní postupy** typu bez kontextu.

Pokud je vybráno „Více záznamů“, můžete navázat **pracovní postup** typu více záznamů, který lze použít pro hromadné akce po výběru více záznamů (aktuálně podporováno pouze tabulkami). Rozsah dostupných **pracovních postupů** je omezen pouze na ty, které jsou nakonfigurovány tak, aby odpovídaly **kolekci** aktuálního datového bloku:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Při kliknutí na tlačítko pro spuštění musí být v tabulce zaškrtnuty některé datové řádky; jinak se **pracovní postup** nespustí:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Příklad

Představte si, že máme **kolekci** „Vzorky“. Pro vzorky se stavem „Odebráno“ potřebujeme zajistit akci „Odeslat k inspekci“. Tato akce nejprve zkontroluje základní informace o vzorku, poté vygeneruje „Záznam o inspekci“ a nakonec změní stav vzorku na „Odesláno k inspekci“. Jelikož tuto sérii procesů nelze provést pouhým kliknutím na standardní tlačítka pro přidávání, mazání, aktualizaci nebo prohlížení, můžeme k její realizaci použít událost vlastní akce.

Nejprve vytvořte **kolekci** „Vzorky“ a **kolekci** „Záznamy o inspekci“ a do **kolekce** „Vzorky“ zadejte základní testovací data:

![Example_Samples Collection](https://static-docs.nocobase.com/20240509172234.png)

Poté vytvořte **pracovní postup** „Událost vlastní akce“. Pokud potřebujete rychlou zpětnou vazbu z operačního procesu, můžete zvolit synchronní režim (v synchronním režimu nelze používat asynchronní uzly, jako je ruční zpracování):

![Example_Create Workflow](https://static-docs.nocobase.com/20240509173106.png)

V konfiguraci spouštěče vyberte pro **kolekci** „Vzorky“:

![Example_Trigger Configuration](https://static-docs.nocobase.com/20240509173148.png)

Uspořádejte logiku v procesu podle obchodních požadavků. Například povolte odeslání k inspekci pouze tehdy, když je parametr indikátoru větší než `90`; jinak zobrazte relevantní zprávu:

![Example_Business Logic Arrangement](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Tip}
Uzel "[Zpráva odpovědi](../nodes/response-message.md)" lze použít v synchronních událostech vlastní akce k vrácení zprávy klientovi. V asynchronním režimu jej nelze použít.
:::

Po konfiguraci a povolení **pracovního postupu** se vraťte do rozhraní tabulky a přidejte tlačítko „Spustit **pracovní postup**“ do sloupce akcí tabulky:

![Example_Add Action Button](https://static-docs.nocobase.com/20240509174525.png)

Poté v konfiguračním menu tlačítka vyberte navázání **pracovního postupu** a otevřete vyskakovací okno konfigurace:

![Example_Open Bind Workflow Pop-up](https://static-docs.nocobase.com/20240509174633.png)

Přidejte dříve povolený **pracovní postup**:

![Example_Select Workflow](https://static-docs.nocobase.com/20240509174723.png)

Po odeslání změňte text tlačítka na název akce, například „Odeslat k inspekci“. Konfigurace je nyní dokončena.

Při použití vyberte v tabulce libovolný vzorek dat a klikněte na tlačítko „Odeslat k inspekci“ pro spuštění události vlastní akce. Jak bylo dříve uspořádáno v logice, pokud je parametr indikátoru vzorku menší než 90, po kliknutí se zobrazí následující zpráva:

![Example_Indicator Does Not Meet Submission Criteria](https://static-docs.nocobase.com/20240509175026.png)

Pokud je parametr indikátoru větší než 90, proces se provede normálně, vygeneruje se „Záznam o inspekci“ a stav vzorku se změní na „Odesláno k inspekci“:

![Example_Submission Successful](https://static-docs.nocobase.com/20240509175247.png)

Tímto je jednoduchá událost vlastní akce dokončena. Podobně lze pro podnikové procesy se složitými operacemi, jako je zpracování objednávek nebo odesílání zpráv, použít události vlastní akce.

## Externí volání

Spouštění událostí vlastní akce není omezeno pouze na operace uživatelského rozhraní; lze je spustit také prostřednictvím volání HTTP API. Konkrétně události vlastní akce poskytují pro všechny akce **kolekcí** nový typ akce pro spouštění **pracovních postupů**: `trigger`, který lze volat pomocí standardního akčního API NocoBase.

**Pracovní postup** spouštěný tlačítkem, jak je uvedeno v příkladu, lze volat takto:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Jelikož tato akce je určena pro jeden záznam, při volání na existující data je nutné zadat ID datového řádku a nahradit část `<:id>` v URL.

Pokud je volána pro formulář (například pro vytvoření nebo aktualizaci), pro formulář, který vytváří nová data, můžete ID vynechat, ale musíte předat odeslaná data jako kontext pro spuštění:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Pro aktualizační formulář je nutné předat jak ID datového řádku, tak aktualizovaná data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Pokud jsou předány ID i data, nejprve se načte datový řádek odpovídající ID a poté se použijí vlastnosti z předaného datového objektu k přepsání původního datového řádku, aby se získal konečný kontext spouštěcích dat.

:::warning{title="Poznámka"}
Pokud jsou předána související data, dojde rovněž k jejich přepsání. Buďte obzvláště opatrní při zpracování příchozích dat, pokud je nakonfigurováno přednačítání položek souvisejících dat, abyste předešli neočekávanému přepsání souvisejících dat.
:::

Dále je URL parametr `triggerWorkflows` klíčem **pracovního postupu**; více klíčů **pracovních postupů** je odděleno čárkami. Tento klíč lze získat najetím myši na název **pracovního postupu** v horní části plátna **pracovního postupu**:

![Workflow_Key_View Method](https://static-docs.nocobase.com/20240426135108.png)

Po úspěšném volání se spustí událost vlastní akce pro odpovídající **kolekci** `samples`.

:::info{title="Tip"}
Jelikož externí volání také vyžadují ověření identity uživatele, při volání prostřednictvím HTTP API je nutné poskytnout ověřovací informace, stejně jako u požadavků odesílaných z běžného rozhraní. To zahrnuje hlavičku požadavku `Authorization` nebo parametr `token` (token získaný po přihlášení) a hlavičku požadavku `X-Role` (aktuální název role uživatele).
:::

Pokud potřebujete v této akci spustit událost pro související data typu „jedna k jedné“ (typ „jedna k mnoha“ aktuálně není podporován), můžete v parametru použít `!` k určení spouštěcích dat souvisejícího pole:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Po úspěšném volání se spustí událost vlastní akce pro odpovídající **kolekci** `categories`.

:::info{title="Tip"}
Při spouštění události po akci prostřednictvím volání HTTP API je také nutné věnovat pozornost stavu povolení **pracovního postupu** a tomu, zda konfigurace **kolekce** odpovídá; v opačném případě volání nemusí být úspěšné nebo může dojít k chybě.
:::