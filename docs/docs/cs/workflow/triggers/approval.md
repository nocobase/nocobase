---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/workflow/triggers/approval).
:::

# Schvalování

## Představení

Schvalování je forma procesu určená speciálně pro úkoly iniciované a zpracovávané lidmi za účelem rozhodnutí o stavu souvisejících dat. Obvykle se používá pro automatizaci kancelářských procesů (OA) nebo jiné záležitosti vyžadující lidské rozhodování. Lze jej využít například k vytváření a správě manuálních procesů pro scénáře jako „žádost o dovolenou“, „schvalování výdajů“ nebo „schvalování nákupu surovin“.

Plugin Schvalování poskytuje specializovaný typ pracovního postupu (spouštěč) „Schvalování (událost)“ a uzel „Schvalování“ určený pro tento proces. V kombinaci s unikátními vlastními kolekcemi a vlastními bloky NocoBase můžete rychle a flexibilně vytvářet a spravovat různé scénáře schvalování.

## Vytvoření procesu

Při vytváření pracovního postupu vyberte typ „Schvalování“, čímž vytvoříte schvalovací proces:

![Spouštěč schvalování_Vytvoření schvalovacího procesu](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Poté v konfiguračním rozhraní pracovního postupu klikněte na spouštěč, čímž otevřete vyskakovací okno pro další konfiguraci.

## Konfigurace spouštěče

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Vazba na kolekci

Plugin Schvalování NocoBase je navržen s ohledem na flexibilitu a lze jej použít s jakoukoli vlastní kolekcí. Konfigurace schvalování tedy nevyžaduje opakované nastavování datového modelu, ale přímo využívá již vytvořené kolekce. Po vstupu do konfigurace spouštěče je proto nejprve nutné vybrat kolekci, aby se určilo, pro která data bude tento proces určen:

![Spouštěč schvalování_Konfigurace spouštěče_Výběr kolekce](https://static-docs.nocobase.com/20251226103223.png)

### Způsob spuštění

Při zahájení schvalování pro obchodní data můžete zvolit jeden ze dvou následujících způsobů spuštění:

*   **Před uložením dat**

    Schvalování se spustí před uložením odeslaných dat. To je vhodné pro scénáře, kde mají být data uložena až po schválení. V tomto režimu jsou data při zahájení schvalování pouze dočasná a do příslušné kolekce budou oficiálně uložena až po schválení.

*   **Po uložení dat**

    Schvalování se spustí po uložení odeslaných dat. To je vhodné pro scénáře, kde lze data nejprve uložit a poté schválit. V tomto režimu jsou data při zahájení schvalování již uložena v příslušné kolekci a veškeré změny provedené během schvalovacího procesu budou rovněž uloženy.

### Místo zahájení schvalování

Můžete si vybrat, kde v systému lze schvalování zahájit:

*   **Pouze v datových blocích**

    K tomuto pracovnímu postupu můžete připojit akci libovolného formulářového bloku dané kolekce pro zahájení schvalování. Proces schvalování pak lze zpracovávat a sledovat v bloku schvalování u jednotlivých záznamů. To je obvykle vhodné pro obchodní data.

*   **V datových blocích i v centru úkolů**

    Kromě datových bloků lze schvalování zahajovat a zpracovávat také v globálním centru úkolů. To je obvykle vhodné pro administrativní data.

### Kdo může zahájit schvalování

Můžete nakonfigurovat oprávnění na základě rozsahu uživatelů a určit, kteří uživatelé mohou toto schvalování zahájit:

*   **Všichni uživatelé**

    Schvalování mohou zahájit všichni uživatelé v systému.

*   **Pouze vybraní uživatelé**

    Schvalování mohou zahájit pouze uživatelé v určeném rozsahu. Lze vybrat více uživatelů.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Konfigurace rozhraní formuláře iniciátora

Nakonec je třeba nakonfigurovat rozhraní formuláře pro iniciátora. Toto rozhraní bude použito pro odesílání při zahájení z bloku centra schvalování a pro opětovné odeslání poté, co iniciátor schvalování stáhne zpět. Kliknutím na tlačítko konfigurace otevřete vyskakovací okno:

![Spouštěč schvalování_Konfigurace spouštěče_Formulář iniciátora](https://static-docs.nocobase.com/20251226130239.png)

Do rozhraní iniciátora můžete přidat formulář pro vyplnění založený na propojené kolekci nebo popisný text (Markdown) pro nápovědu a instrukce. Přidání bloku formuláře je povinné, jinak iniciátor nebude moci po vstupu do tohoto rozhraní provádět žádné operace.

Po přidání bloku formuláře můžete, stejně jako v běžném konfiguračním rozhraní formuláře, přidávat komponenty polí z odpovídající kolekce a libovolně je uspořádat, abyste zorganizovali obsah, který je třeba vyplnit:

![Spouštěč schvalování_Konfigurace spouštěče_Formulář iniciátora_Konfigurace polí](https://static-docs.nocobase.com/20251226130339.png)

Kromě tlačítka pro přímé odeslání můžete přidat také tlačítko „Uložit koncept“ pro podporu procesů dočasného uložení:

![Spouštěč schvalování_Konfigurace spouštěče_Formulář iniciátora_Konfigurace akcí_Uložit](https://static-docs.nocobase.com/20251226130512.png)

Pokud schvalovací proces umožňuje iniciátorovi vzít žádost zpět, musíte v konfiguraci rozhraní iniciátora povolit tlačítko „Stáhnout zpět“:

![Spouštěč schvalování_Konfigurace spouštěče_Povolit stažení zpět](https://static-docs.nocobase.com/20251226130637.png)

Po povolení může iniciátor vzít schvalování zahájené tímto procesem zpět, dokud jej nezpracuje žádný ze schvalovatelů. Jakmile však dojde ke zpracování v jakémkoli následném schvalovacím uzlu, stažení zpět již nebude možné.

:::info{title=Tip}
Po povolení nebo odstranění tlačítka pro stažení zpět je nutné ve vyskakovacím okně konfigurace spouštěče kliknout na tlačítko uložit, aby se změny projevily.
:::

### Karta „Moje žádosti“ <Badge>2.0+</Badge>

Slouží ke konfiguraci karet úkolů v seznamu „Moje žádosti“ v centru úkolů.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Na kartě můžete libovolně konfigurovat obchodní pole (kromě polí vazeb), která chcete zobrazit, nebo informace související se schvalováním.

Po vytvoření žádosti o schválení uvidíte v seznamu centra úkolů vlastní kartu úkolu:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Režim zobrazení záznamu v procesu

*   **Snímek (Snapshot)**

    V průběhu schvalování vidí žadatel a schvalovatelé stav záznamu v momentě vstupu do procesu. Po odeslání uvidí pouze záznamy, které sami upravili – neuvidí aktualizace provedené ostatními později.

*   **Nejnovější (Latest)**

    Žadatel a schvalovatelé vidí v průběhu celého procesu vždy nejnovější verzi záznamu bez ohledu na to, v jakém stavu byl záznam před jejich operací. Po skončení procesu uvidí finální verzi záznamu.

## Uzel schvalování

V pracovním postupu schvalování je nutné použít specializovaný uzel „Schvalování“ ke konfiguraci operační logiky pro schvalovatele (schválení, zamítnutí nebo vrácení). Uzel „Schvalování“ lze použít pouze v procesech typu schvalování. Podrobnosti naleznete v části [Uzel schvalování](../nodes/approval.md).

:::info{title=Tip}
Pokud schvalovací proces neobsahuje žádný uzel „Schvalování“, bude proces automaticky schválen.
:::

## Konfigurace zahájení schvalování

Po nakonfigurování a povolení schvalovacího pracovního postupu jej můžete propojit s tlačítkem pro odeslání formuláře příslušné kolekce, aby uživatelé mohli při odesílání zahájit schvalování:

![Zahájení schvalování_Vazba na pracovní postup](https://static-docs.nocobase.com/20251226110710.png)

Poté odeslání tohoto formuláře uživatelem spustí odpovídající schvalovací pracovní postup. Odeslaná data budou kromě uložení do příslušné kolekce také zaznamenána jako snímek do schvalovacího toku pro potřeby následných schvalovatelů.

:::info{title=Tip}
Tlačítko pro zahájení schvalování aktuálně podporuje pouze tlačítko „Odeslat“ (nebo „Uložit“) ve formulářích pro vytvoření nebo aktualizaci. Nepodporuje tlačítko „Spustit pracovní postup“ (toto tlačítko lze propojit pouze s „vlastními událostmi akcí“).
:::

## Centrum úkolů

Centrum úkolů poskytuje jednotný vstupní bod, který uživatelům usnadňuje prohlížení a zpracování úkolů. K schvalováním zahájeným aktuálním uživatelem i k čekajícím úkolům lze přistupovat přes centrum úkolů v horním panelu nástrojů a pomocí navigace vlevo lze prohlížet různé typy úkolů.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Moje žádosti

#### Zobrazení zahájených schvalování

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Přímé zahájení nového schvalování

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Moje úkoly

#### Seznam úkolů

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Detail úkolu

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Iniciátor

#### Zahájení z kolekce

Při zahájení z datového bloku můžete volat rozhraní následovně (příklad pro tlačítko vytvoření v kolekci `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Parametr URL `triggerWorkflows` je klíč pracovního postupu, více klíčů se odděluje čárkou. Klíč získáte najetím myši na název pracovního postupu v horní části plátna editoru:

![Pracovní postup_klíč_způsob zobrazení](https://static-docs.nocobase.com/20240426135108.png)

Po úspěšném volání se spustí schvalovací pracovní postup pro odpovídající kolekci `posts`.

:::info{title="Tip"}
Protože externí volání musí být také založena na identitě uživatele, musí požadavky přes HTTP API obsahovat autentizační informace, stejně jako požadavky z běžného rozhraní. To zahrnuje hlavičku `Authorization` nebo parametr `token` a hlavičku `X-Role` (název aktuální role uživatele).
:::

Pokud potřebujete v rámci této akce spustit událost pro data ve vztahu 1:1 (vztahy 1:N nejsou zatím podporovány), můžete v parametrech použít `!` k určení spouštěcích dat pole vazby:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Po úspěšném volání se spustí událost schvalování pro odpovídající kolekci `categories`.

:::info{title="Tip"}
Při spouštění událostí po akci přes HTTP API dbejte na to, aby byl pracovní postup povolen a konfigurace kolekce odpovídala, jinak volání nemusí být úspěšné nebo může dojít k chybě.
:::

#### Zahájení z centra schvalování

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parametry**

* `collectionName`: Název cílové kolekce pro zahájení schvalování, povinné.
* `workflowId`: ID pracovního postupu použitého pro zahájení, povinné.
* `data`: Pole záznamu kolekce vytvořeného při zahájení, povinné.
* `status`: Stav vytvořeného záznamu při zahájení, povinné. Možné hodnoty:
  * `0`: Koncept, znamená uložení bez odeslání ke schválení.
  * `2`: Odeslání ke schválení, znamená, že iniciátor odesílá žádost a vstupuje do procesu.

#### Uložení a odeslání

Pokud je zahájené (nebo stažené) schvalování ve stavu konceptu, můžete jej znovu uložit nebo odeslat přes následující rozhraní:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Získání seznamu vlastních zahájených schvalování

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Stažení zpět

Iniciátor může stáhnout záznam aktuálně v procesu schvalování zpět přes následující rozhraní:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametry**

* `<approval id>`: ID záznamu schvalování ke stažení, povinné.

### Schvalovatel

Jakmile proces vstoupí do uzlu schvalování, vytvoří se pro aktuálního schvalovatele úkol. Schvalovatel může úkol dokončit přes rozhraní nebo pomocí HTTP API.

#### Získání záznamů o zpracování schvalování

Úkoly jsou záznamy o zpracování schvalování. Všechny záznamy o zpracování aktuálního uživatele lze získat přes:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Jelikož `approvalRecords` funguje jako zdroj kolekce, lze použít běžné parametry dotazů jako `filter`, `sort`, `pageSize` a `page`.

#### Získání jednoho záznamu o zpracování schvalování

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Schválení a zamítnutí

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parametry**

* `<record id>`: ID záznamu ke zpracování, povinné.
* `status`: Stav zpracování, `2` znamená „Schválit“, `-1` znamená „Zamítnout“, povinné.
* `comment`: Poznámka ke zpracování, volitelné.
* `data`: Změny provedené v záznamu kolekce v aktuálním uzlu po schválení, volitelné (platí pouze při schválení).

#### Vrácení <Badge>v1.9.0+</Badge>

Před verzí v1.9.0 se pro vrácení používalo stejné rozhraní jako pro schválení/zamítnutí s hodnotou `"status": 1`.

Od verze v1.9.0 má vrácení samostatné rozhraní:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametry**

* `<record id>`: ID záznamu ke zpracování, povinné.
* `returnToNodeKey`: Klíč cílového uzlu pro vrácení, volitelné. Pokud je v uzlu nakonfigurován rozsah uzlů pro vrácení, lze tímto parametrem určit konkrétní uzel. Pokud není nakonfigurováno, parametr není nutný a systém se vrátí na začátek k iniciátorovi pro opětovné odeslání.

#### Delegování (předání)

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametry**

* `<record id>`: ID záznamu ke zpracování, povinné.
* `assignee`: ID uživatele, kterému se úkol deleguje, povinné.

#### Přidání schvalovatele (připodepsání)

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametry**

* `<record id>`: ID záznamu ke zpracování, povinné.
* `assignees`: Seznam ID uživatelů k přidání, povinné.
* `order`: Pořadí přidání, `-1` znamená před „mnou“, `1` znamená po „mně“.