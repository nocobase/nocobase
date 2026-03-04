---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/workflow/triggers/custom-action).
:::

# Událost vlastní akce

## Úvod

NocoBase obsahuje vestavěné běžné datové operace (přidávání, mazání, úpravy, prohlížení atd.). Pokud tyto operace nemohou uspokojit složité obchodní potřeby, můžete v pracovním postupu použít událost vlastní akce a navázat tuto událost na tlačítko „Spustit pracovní postup“ v bloku stránky. Po kliknutí uživatele se spustí pracovní postup vlastní akce.

## Vytvoření pracovního postupu

Při vytváření pracovního postupu vyberte „Událost vlastní akce“:

![Vytvoření pracovního postupu „Událost vlastní akce“](https://static-docs.nocobase.com/20240509091820.png)

## Konfigurace spouštěče

### Typ kontextu

> v.1.6.0+

Rozdílné typy kontextu určují, ke kterým tlačítkům v blocích lze pracovní postup navázat:

* Bez kontextu: Globální událost, kterou lze navázat na panel akcí a akční tlačítka v datových blocích;
* Jeden záznam: Lze navázat na akční tlačítka v datových blocích, jako jsou řádky tabulky, formuláře, detaily atd.;
* Více záznamů: Lze navázat na tlačítka pro hromadné operace v tabulce.

![Konfigurace spouštěče_Typ kontextu](https://static-docs.nocobase.com/20250215135808.png)

### Kolekce

Pokud je typ kontextu Jeden záznam nebo Více záznamů, musíte vybrat kolekci, ke které se má datový model navázat:

![Konfigurace spouštěče_Výběr kolekce](https://static-docs.nocobase.com/20250215135919.png)

### Související data k použití

Pokud potřebujete v pracovním postupu použít související data spouštěného datového řádku, můžete zde vybrat hluboká související pole:

![Konfigurace spouštěče_Výběr souvisejících dat k použití](https://static-docs.nocobase.com/20250215135955.png)

Tato pole se po spuštění události automaticky přednačtou do kontextu pracovního postupu, aby je bylo možné v pracovním postupu použít.

## Konfigurace akce

V závislosti na typu kontextu nakonfigurovaném v pracovním postupu se konfigurace akčních tlačítek v různých blocích liší.

### Bez kontextu

> v1.6.0+

V panelu akcí a dalších datových blocích lze přidat tlačítko „Spustit pracovní postup“:

![Přidání akčního tlačítka do bloku_Panel akcí](https://static-docs.nocobase.com/20250215221738.png)

![Přidání akčního tlačítka do bloku_Kalendář](https://static-docs.nocobase.com/20250215221942.png)

![Přidání akčního tlačítka do bloku_Ganttův diagram](https://static-docs.nocobase.com/20250215221810.png)

Po přidání tlačítka navážete dříve vytvořený pracovní postup bez kontextu, jako příklad použijeme tlačítko v panelu akcí:

![Navázání pracovního postupu na tlačítko_Panel akcí](https://static-docs.nocobase.com/20250215222120.png)

![Výběr pracovního postupu k navázání_Bez kontextu](https://static-docs.nocobase.com/20250215222234.png)

### Jeden záznam

V libovolném datovém bloku lze do sloupce akcí pro jeden záznam přidat tlačítko „Spustit pracovní postup“, například ve formulářích, řádcích tabulky, detailech atd.:

![Přidání akčního tlačítka do bloku_Formulář](https://static-docs.nocobase.com/20240509165428.png)

![Přidání akčního tlačítka do bloku_Řádek tabulky](https://static-docs.nocobase.com/20240509165340.png)

![Přidání akčního tlačítka do bloku_Detail](https://static-docs.nocobase.com/20240509165545.png)

Po přidání tlačítka navážete dříve vytvořený pracovní postup:

![Navázání pracovního postupu na tlačítko](https://static-docs.nocobase.com/20240509165631.png)

![Výběr pracovního postupu k navázání](https://static-docs.nocobase.com/20240509165658.png)

Poté kliknutím na toto tlačítko spustíte událost vlastní akce:

![Výsledek spuštění po kliknutí na tlačítko](https://static-docs.nocobase.com/20240509170453.png)

### Více záznamů

> v1.6.0+

V panelu akcí bloku tabulky se při přidávání tlačítka „Spustit pracovní postup“ zobrazí další možnost výběru typu kontextu: „Bez kontextu“ nebo „Více záznamů“:

![Přidání akčního tlačítka do bloku_Tabulka](https://static-docs.nocobase.com/20250215222507.png)

Při výběru „Bez kontextu“ se jedná o globální událost a lze navázat pouze pracovní postupy typu bez kontextu.

Při výběru „Více záznamů“ lze navázat pracovní postup typu více záznamů, který lze použít pro hromadné operace po výběru více dat (aktuálně podporováno pouze tabulkami). Rozsah dostupných pracovních postupů je v tomto případě omezen na ty, které jsou nakonfigurovány pro kolekci odpovídající aktuálnímu datovému bloku:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Při kliknutí na tlačítko pro spuštění musí být v tabulce zaškrtnuty některé datové řádky, jinak se pracovní postup nespustí:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Příklad

Například máme kolekci „Vzorky“. Pro vzorky ve stavu „Odebráno“ potřebujeme poskytnout akci „Odeslat k inspekci“. Odeslání k inspekci nejprve zkontroluje základní informace o vzorku, poté vygeneruje záznam v kolekci „Záznamy o inspekci“ a následně změní stav vzorku na „Odesláno“. Tento proces nelze provést jednoduchým kliknutím na tlačítka „přidat, smazat, upravit, zobrazit“, proto lze k jeho realizaci použít událost vlastní akce.

Nejprve vytvořte kolekci „Vzorky“ a kolekci „Záznamy o inspekci“ a do tabulky vzorků zadejte základní testovací data:

![Příklad_Kolekce Vzorky](https://static-docs.nocobase.com/20240509172234.png)

Poté vytvořte pracovní postup „Událost vlastní akce“. Pokud potřebujete včasnou zpětnou vazbu z procesu, můžete zvolit synchronní režim (v synchronním režimu nelze použít asynchronní uzly, jako je ruční zpracování):

![Příklad_Vytvoření pracovního postupu](https://static-docs.nocobase.com/20240509173106.png)

V konfiguraci spouštěče vyberte kolekci „Vzorky“:

![Příklad_Konfigurace spouštěče](https://static-docs.nocobase.com/20240509173148.png)

Uspořádejte logiku v procesu podle obchodních požadavků, například odeslání k inspekci je povoleno pouze tehdy, když je parametr indikátoru větší než `90`, jinak se zobrazí upozornění na problém:

![Příklad_Uspořádání obchodní logiky](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Tip}
Uzel „[Zpráva odpovědi](../nodes/response-message.md)“ lze použít v synchronních událostech vlastní akce k vrácení informací klientovi. V asynchronním režimu jej nelze použít.
:::

Po konfiguraci a povolení procesu se vraťte do rozhraní tabulky a přidejte tlačítko „Spustit pracovní postup“ do sloupce akcí tabulky:

![Příklad_Přidání akčního tlačítka](https://static-docs.nocobase.com/20240509174525.png)

Poté v konfiguračním menu tlačítka vyberte navázání pracovního postupu a otevřete konfigurační okno:

![Příklad_Otevření okna pro navázání pracovního postupu](https://static-docs.nocobase.com/20240509174633.png)

Přidejte dříve povolený pracovní postup:

![Příklad_Výběr pracovního postupu](https://static-docs.nocobase.com/20240509174723.png)

Po odeslání změňte text tlačítka na název akce, například „Odeslat k inspekci“, a konfigurace procesu je hotová.

Při použití vyberte v tabulce libovolný záznam vzorku a klikněte na tlačítko „Odeslat k inspekci“, čímž spustíte událost vlastní akce. Podle dříve nastavené logiky, pokud je parametr indikátoru vzorku menší než 90, zobrazí se po kliknutí následující upozornění:

![Příklad_Indikátor nesplňuje podmínky pro odeslání](https://static-docs.nocobase.com/20240509175026.png)

Pokud je parametr indikátoru větší než 90, proces se normálně provede, vygeneruje se „Záznam o inspekci“ a stav vzorku se změní na „Odesláno“:

![Příklad_Úspěšné odeslání](https://static-docs.nocobase.com/20240509175247.png)

Tímto je jednoduchá událost vlastní akce hotová. Podobně lze pro složité operace, jako je zpracování objednávek nebo odesílání zpráv, využít události vlastní akce.

## Externí volání

Spuštění události vlastní akce není omezeno pouze na operace v uživatelském rozhraní, lze ji spustit také prostřednictvím HTTP API. Konkrétně událost vlastní akce poskytuje pro všechny operace s kolekcemi nový typ operace pro spuštění pracovního postupu: `trigger`, který lze volat pomocí standardního API pro operace NocoBase.

:::info{title="Tip"}
Protože externí volání musí být také založena na identitě uživatele, musí volání přes HTTP API obsahovat stejné autentizační informace jako požadavky z běžného rozhraní, včetně hlavičky `Authorization` nebo parametru `token` (token získaný po přihlášení) a hlavičky `X-Role` (název aktuální role uživatele).
:::

### Bez kontextu

Pracovní postupy bez kontextu vyžadují spuštění operace nad prostředkem workflows:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Jeden záznam

Pracovní postup spouštěný tlačítkem, jako v příkladu, lze volat takto:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Protože je tato operace zaměřena na jeden záznam, je při volání pro existující data nutné specifikovat ID řádku a nahradit část `<:id>` v URL.

Pokud se volá pro formulář (např. přidání nebo aktualizace), u formuláře pro přidání dat nemusíte předávat ID, ale musíte předat odesílaná data jako kontext pro provedení:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

U formuláře pro aktualizaci je nutné předat ID řádku i aktualizovaná data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Pokud jsou předána ID i data, nejprve se načte datový řádek odpovídající ID a poté se vlastnosti z předaného datového objektu použijí k přepsání původního řádku, čímž se získá výsledný kontext spouštěcích dat.

:::warning{title="Pozor"}
Pokud jsou předána související data, budou také přepsána. Zejména při konfiguraci přednačítání souvisejících dat je třeba s předávanými daty zacházet opatrně, aby nedošlo k neočekávanému přepsání souvisejících dat.
:::

Parametr URL `triggerWorkflows` je klíčem pracovního postupu, více pracovních postupů se odděluje čárkou. Tento klíč lze získat najetím myši na název pracovního postupu v horní části plátna pracovního postupu:

![Zobrazení klíče pracovního postupu](https://static-docs.nocobase.com/20240426135108.png)

Po úspěšném volání se spustí událost vlastní akce pro odpovídající kolekci `samples`.

:::info{title="Tip"}
Při spouštění události po operaci prostřednictvím HTTP API je také třeba věnovat pozornost stavu povolení pracovního postupu a tomu, zda konfigurace kolekce odpovídá, jinak volání nemusí být úspěšné nebo může dojít k chybě.
:::

### Více záznamů

Podobně jako u volání pro jeden záznam, ale předávaná data vyžadují pouze parametry primárních klíčů (`filterByTk[]`) a není třeba předávat část data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Toto volání spustí událost vlastní akce v režimu více záznamů a jako data v kontextu spouštěče použije záznamy s ID 1 a 2.