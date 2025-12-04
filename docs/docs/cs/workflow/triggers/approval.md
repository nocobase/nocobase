---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Schvalování

## Úvod

Schvalování je typ **pracovního postupu** speciálně navržený pro úkoly, které jsou iniciovány a zpracovávány lidmi za účelem rozhodnutí o stavu souvisejících dat. Běžně se používá pro automatizaci kancelářských procesů nebo jiné procesy řízení manuálních rozhodnutí, například pro vytváření a správu manuálních **pracovních postupů** pro scénáře jako „žádosti o dovolenou“, „schvalování náhrad výdajů“ a „schvalování nákupu surovin“.

**Plugin** Schvalování poskytuje specializovaný typ **pracovního postupu** (spouštěč) „Schvalování (událost)“ a dedikovaný uzel „Schvalování“ pro tento proces. V kombinaci s unikátními vlastními **kolekcemi** a vlastními bloky NocoBase můžete rychle a flexibilně vytvářet a spravovat různé scénáře schvalování.

## Vytvoření pracovního postupu

Při vytváření **pracovního postupu** vyberte typ „Schvalování“ a vytvoříte tak schvalovací **pracovní postup**:

![Spouštěč schvalování_Vytvoření schvalovacího pracovního postupu](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Poté v konfiguračním rozhraní **pracovního postupu** klikněte na spouštěč, čímž otevřete dialogové okno pro další konfiguraci.

## Konfigurace spouštěče

### Propojení s kolekcí

**Plugin** Schvalování v NocoBase je navržen s ohledem na flexibilitu a lze jej použít s jakoukoli vlastní **kolekcí**. To znamená, že konfigurace schvalování nevyžaduje opětovnou konfiguraci datového modelu, ale přímo využívá již existující **kolekci**. Proto po vstupu do konfigurace spouštěče musíte nejprve vybrat **kolekci**, abyste určili, při vytvoření nebo aktualizaci dat které **kolekce** se tento **pracovní postup** spustí:

![Spouštěč schvalování_Konfigurace spouštěče_Výběr kolekce](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

Poté ve formuláři pro vytváření (nebo úpravu) dat pro příslušnou **kolekci** propojte tento **pracovní postup** s tlačítkem pro odeslání:

![Zahájení schvalování_Propojení pracovního postupu](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Poté, co uživatel odešle tento formulář, spustí se odpovídající schvalovací **pracovní postup**. Odeslaná data se nejen uloží do příslušné **kolekce**, ale také se zaznamenají do schvalovacího toku pro pozdější kontrolu a použití schvalovateli.

### Zrušení

Pokud schvalovací **pracovní postup** umožňuje iniciátorovi zrušit žádost, je třeba v konfiguraci rozhraní iniciátora povolit tlačítko „Zrušit“:

![Spouštěč schvalování_Konfigurace spouštěče_Povolit zrušení](https://static-docs.nocobase.com/20251029232544.png)

Po povolení může být schválení iniciované tímto **pracovním postupem** zrušeno iniciátorem předtím, než jej zpracuje jakýkoli schvalovatel. Nicméně, jakmile jej zpracuje jakýkoli schvalovatel v následném schvalovacím uzlu, již jej nebude možné zrušit.

:::info{title=Poznámka}
Po povolení nebo odstranění tlačítka pro zrušení je nutné v dialogovém okně konfigurace spouštěče kliknout na „Uložit a odeslat“, aby se změny projevily.
:::

### Konfigurace formulářového rozhraní pro zahájení schvalování

Nakonec je třeba nakonfigurovat formulářové rozhraní iniciátora. Toto rozhraní bude použito pro odesílání akcí při zahájení z bloku centra schvalování a při opětovném zahájení po zrušení. Klikněte na tlačítko „Konfigurovat“ pro otevření dialogového okna:

![Spouštěč schvalování_Konfigurace spouštěče_Formulář iniciátora](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Do rozhraní iniciátora můžete přidat formulář pro vyplnění na základě propojené **kolekce** nebo popisný text (Markdown) pro nápovědu a navádění. Formulář je povinný; v opačném případě nebude iniciátor po vstupu do tohoto rozhraní schopen provádět žádné akce.

Po přidání bloku formuláře můžete, stejně jako v běžném konfiguračním rozhraní formuláře, přidávat komponenty polí z odpovídající **kolekce** a libovolně je uspořádat tak, aby se organizoval obsah, který je třeba ve formuláři vyplnit:

![Spouštěč schvalování_Konfigurace spouštěče_Formulář iniciátora_Konfigurace polí](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Kromě tlačítka pro přímé odeslání můžete také přidat akční tlačítko „Uložit jako koncept“, které podporuje proces dočasného uložení:

![Spouštěč schvalování_Konfigurace spouštěče_Formulář iniciátora_Konfigurace akcí](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Uzel schvalování

Ve schvalovacím **pracovním postupu** je třeba použít dedikovaný uzel „Schvalování“ pro konfiguraci operační logiky pro schvalovatele, aby mohli zpracovat (schválit, zamítnout nebo vrátit) zahájené schválení. Uzel „Schvalování“ lze použít pouze ve schvalovacích **pracovních postupech**. Podrobnosti naleznete v [Uzlu schvalování](../nodes/approval.md).

## Konfigurace zahájení schvalování

Po nakonfigurování a povolení schvalovacího **pracovního postupu** jej můžete propojit s tlačítkem pro odeslání formuláře příslušné **kolekce**, což uživatelům umožní zahájit schvalování při odeslání:

![Zahájení schvalování_Propojení pracovního postupu](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Po propojení **pracovního postupu** uživatel zahájí schvalování odesláním aktuálního formuláře.

:::info{title=Poznámka}
Tlačítko pro zahájení schvalování v současné době podporuje pouze tlačítko „Odeslat“ (nebo „Uložit“) ve formuláři pro vytvoření nebo aktualizaci. Nepodporuje tlačítko „Odeslat do **pracovního postupu**“ (které lze propojit pouze s „Událostí po akci“).
:::

## Centrum úkolů

Centrum úkolů poskytuje jednotný vstupní bod pro uživatele k prohlížení a zpracování jejich úkolů. Schválení iniciovaná aktuálním uživatelem a jeho čekající úkoly jsou přístupné přes Centrum úkolů v horním panelu nástrojů a různé typy úkolů lze prohlížet pomocí levé navigační lišty.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Moje podání

#### Zobrazení odeslaných schválení

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Přímé zahájení nového schvalování

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Moje úkoly

#### Seznam úkolů

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Podrobnosti úkolu

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Iniciátor

#### Zahájení z kolekce

Pro zahájení z datového bloku můžete provést volání takto (například s použitím tlačítka pro vytvoření **kolekce** `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Zde je parametr URL `triggerWorkflows` klíčem **pracovního postupu**; více klíčů **pracovních postupů** je odděleno čárkami. Tento klíč lze získat najetím myši na název **pracovního postupu** v horní části plátna **pracovního postupu**:

![Pracovní postup_klíč_Způsob zobrazení](https://static-docs.nocobase.com/20240426135108.png)

Po úspěšném volání se spustí schvalovací **pracovní postup** pro odpovídající **kolekci** `posts`.

:::info{title="Poznámka"}
Jelikož externí volání také vyžadují ověření identity uživatele, při volání přes HTTP API je nutné, stejně jako u požadavků odesílaných z běžného rozhraní, poskytnout ověřovací informace, včetně hlavičky požadavku `Authorization` nebo parametru `token` (token získaný po přihlášení) a hlavičky požadavku `X-Role` (aktuální název role uživatele).
:::

Pokud potřebujete spustit událost pro data s vazbou jedna k jedné (vazba jedna k mnoha zatím není podporována) v této akci, můžete v parametru použít `!` k určení spouštěcích dat pro pole vazby:

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

Po úspěšném volání se spustí událost schvalování pro odpovídající **kolekci** `categories`.

:::info{title="Poznámka"}
Při spouštění události po akci prostřednictvím HTTP API je také třeba věnovat pozornost stavu povolení **pracovního postupu** a tomu, zda konfigurace **kolekce** odpovídá; v opačném případě volání nemusí být úspěšné nebo může dojít k chybě.
:::

#### Zahájení z Centra schvalování

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

*   `collectionName`: Název cílové **kolekce** pro zahájení schvalování. Povinné.
*   `workflowId`: ID **pracovního postupu** použitého k zahájení schvalování. Povinné.
*   `data`: Pole záznamu **kolekce** vytvořeného při zahájení schvalování. Povinné.
*   `status`: Stav záznamu vytvořeného při zahájení schvalování. Povinné. Možné hodnoty zahrnují:
    *   `0`: Koncept, znamená uložení bez odeslání ke schválení.
    *   `1`: Odeslat ke schválení, znamená, že iniciátor odešle žádost o schválení, čímž vstoupí do schvalovacího procesu.

#### Uložení a odeslání

Pokud je zahájené (nebo zrušené) schválení ve stavu konceptu, můžete jej znovu uložit nebo odeslat pomocí následujícího API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Získání seznamu odeslaných schválení

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Zrušení

Iniciátor může zrušit záznam, který je aktuálně ve schvalovacím procesu, pomocí následujícího API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametry**

*   `<approval id>`: ID záznamu schválení, který má být zrušen. Povinné.

### Schvalovatel

Poté, co schvalovací **pracovní postup** vstoupí do schvalovacího uzlu, je pro aktuálního schvalovatele vytvořen úkol. Schvalovatel může dokončit úkol prostřednictvím rozhraní nebo voláním HTTP API.

#### Získání záznamů o zpracování schválení

Úkoly jsou záznamy o zpracování schválení. Všechny záznamy o zpracování schválení aktuálního uživatele můžete získat pomocí následujícího API:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Zde je `approvalRecords` **kolekce** zdrojů, takže můžete použít běžné podmínky dotazu, jako jsou `filter`, `sort`, `pageSize` a `page`.

#### Získání jednoho záznamu o zpracování schválení

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

*   `<record id>`: ID záznamu, který má být schválen. Povinné.
*   `status`: Stav procesu schvalování. `2` znamená „Schválit“, `-1` znamená „Zamítnout“. Povinné.
*   `comment`: Poznámky k procesu schvalování. Volitelné.
*   `data`: Úpravy záznamu **kolekce** v aktuálním schvalovacím uzlu po schválení. Volitelné (účinné pouze při schválení).

#### Vrácení <Badge>v1.9.0+</Badge>

Před verzí v1.9.0 se pro vrácení používalo stejné API jako pro „Schválit“ a „Zamítnout“, přičemž `"status": 1` představovalo vrácení.

Od verze v1.9.0 má vrácení samostatné API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametry**

*   `<record id>`: ID záznamu, který má být schválen. Povinné.
*   `returnToNodeKey`: Klíč cílového uzlu, na který se má vrátit. Volitelné. Pokud je v uzlu nakonfigurován rozsah vratných uzlů, lze tento parametr použít k určení, na který uzel se má vrátit. Pokud není nakonfigurován, tento parametr není třeba předávat a ve výchozím nastavení se vrátí na počáteční bod, aby jej iniciátor mohl znovu odeslat.

#### Delegování

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametry**

*   `<record id>`: ID záznamu, který má být schválen. Povinné.
*   `assignee`: ID uživatele, na kterého se má delegovat. Povinné.

#### Přidání schvalovatele

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametry**

*   `<record id>`: ID záznamu, který má být schválen. Povinné.
*   `assignees`: Seznam ID uživatelů, kteří mají být přidáni jako schvalovatelé. Povinné.
*   `order`: Pořadí přidaného schvalovatele. `-1` znamená před „mnou“, `1` znamená po „mně“.