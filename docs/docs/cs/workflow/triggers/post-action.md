---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Událost po akci

## Úvod

Všechny změny dat, které uživatelé provádějí v systému, se obvykle dokončují prostřednictvím nějaké akce. Konkrétní forma je často kliknutí na tlačítko, které může být buď tlačítko pro odeslání ve formuláři, nebo akční tlačítko v datovém bloku. Událost po akci slouží k navázání souvisejících pracovních postupů na akce těchto tlačítek, aby se po úspěšném dokončení uživatelské akce spustil konkrétní proces.

Například při přidávání nebo aktualizaci dat mohou uživatelé nakonfigurovat možnost „Navázat pracovní postup“ pro tlačítko. Po dokončení akce se spustí navázaný pracovní postup.

Na úrovni implementace, jelikož zpracování událostí po akci probíhá ve vrstvě middleware (middleware Koa), mohou definované události po akci spustit i volání HTTP API do NocoBase.

## Instalace

Jedná se o vestavěný plugin, instalace není nutná.

## Konfigurace spouštěče

### Vytvoření pracovního postupu

Při vytváření pracovního postupu vyberte jako typ „Událost po akci“:

![Create Workflow_Post-Action Event Trigger](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Režim spuštění

Pro události po akci můžete při vytváření zvolit také režim spuštění jako „Synchronní“ nebo „Asynchronní“:

![Create Workflow_Select Synchronous or Asynchronous](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Pokud je potřeba, aby se proces spustil a vrátil ihned po akci uživatele, můžete použít synchronní režim; jinak je výchozí asynchronní režim. V asynchronním režimu je akce dokončena ihned po spuštění pracovního postupu a pracovní postup se bude postupně provádět v aplikační frontě na pozadí.

### Konfigurace kolekce

Vstupte do plátna pracovního postupu, klikněte na spouštěč pro otevření konfiguračního vyskakovacího okna a nejprve vyberte kolekci, kterou chcete navázat:

![Workflow Configuration_Select Collection](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Výběr režimu spuštění

Poté vyberte režim spuštění, který může být buď lokální, nebo globální:

![Workflow Configuration_Select Trigger Mode](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Kde:

*   Lokální režim se spouští pouze na akčních tlačítkách, ke kterým je tento pracovní postup navázán. Kliknutí na tlačítka bez navázaného pracovního postupu jej nespustí. Můžete se rozhodnout, zda tento pracovní postup navážete, na základě toho, zda by formuláře s různými účely měly spouštět stejný proces.
*   Globální režim se spouští na všech nakonfigurovaných akčních tlačítkách kolekce, bez ohledu na to, ze kterého formuláře pocházejí, a není potřeba navazovat odpovídající pracovní postup.

V lokálním režimu jsou aktuálně podporována následující akční tlačítka pro navázání:

*   Tlačítka „Odeslat“ a „Uložit“ ve formuláři pro přidání.
*   Tlačítka „Odeslat“ a „Uložit“ ve formuláři pro aktualizaci.
*   Tlačítko „Aktualizovat data“ v řádcích dat (tabulka, seznam, kanban atd.).

### Výběr typu akce

Pokud zvolíte globální režim, musíte také vybrat typ akce. Aktuálně jsou podporovány „Akce vytvoření dat“ a „Akce aktualizace dat“. Obě akce spouštějí pracovní postup po úspěšném dokončení operace.

### Výběr přednačtených relačních dat

Pokud potřebujete v následných procesech použít související data spouštěcích dat, můžete vybrat relační pole, která mají být přednačtena:

![Workflow Configuration_Preload Association](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Po spuštění pak můžete tato související data přímo použít v procesu.

## Konfigurace akce

Pro akce v lokálním režimu spouštění se po konfiguraci pracovního postupu musíte vrátit do uživatelského rozhraní a navázat pracovní postup na akční tlačítko formuláře odpovídajícího datového bloku.

Pracovní postupy nakonfigurované pro tlačítko „Odeslat“ (včetně tlačítka „Uložit data“) se spustí poté, co uživatel odešle odpovídající formulář a dokončí se datová operace.

![Post-Action Event_Submit Button](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Z nabídky konfigurace tlačítka vyberte „Navázat pracovní postup“ a otevře se vyskakovací okno pro konfiguraci navázání. V tomto okně můžete nakonfigurovat libovolný počet pracovních postupů, které se mají spustit; pokud nenakonfigurujete žádný, znamená to, že spuštění není potřeba. Pro každý pracovní postup je nejprve nutné omezit, zda spouštěná data jsou data celého formuláře, nebo data určitého relačního pole ve formuláři. Poté, na základě vybraného datového modelu odpovídajícího kolekci, vyberte formulářový pracovní postup, který byl nakonfigurován tak, aby odpovídal tomuto modelu kolekce.

![Post-Action Event_Bind Workflow Configuration_Context Selection](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Post-Action Event_Bind Workflow Configuration_Workflow Selection](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Tip"}
Pracovní postup musí být povolen, aby jej bylo možné vybrat ve výše uvedeném rozhraní.
:::

## Příklad

Zde si ukážeme demonstraci pomocí akce vytvoření.

Představte si scénář „Žádosti o proplacení nákladů“. Potřebujeme, aby po odeslání žádosti o proplacení zaměstnancem proběhla automatická kontrola částky a ruční kontrola částek přesahujících limit. Pouze žádosti, které projdou kontrolou, jsou schváleny a poté předány finančnímu oddělení ke zpracování.

Nejprve můžeme vytvořit kolekci „Proplacení nákladů“ s následujícími poli:

*   Název projektu: Jednořádkový text
*   Žadatel: Mnoho k jednomu (Uživatel)
*   Částka: Číslo
*   Stav: Jednoduchý výběr („Schváleno“, „Zpracováno“)

Poté vytvořte pracovní postup typu „Událost po akci“ a nakonfigurujte model kolekce ve spouštěči tak, aby odpovídal kolekci „Proplacení nákladů“:

![Example_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Po nastavení pracovního postupu do povoleného stavu se k detailní konfiguraci uzlů zpracování procesu vrátíme později.

Poté v rozhraní vytvoříme blok tabulky pro kolekci „Proplacení nákladů“, přidáme tlačítko „Přidat“ na panel nástrojů a nakonfigurujeme odpovídající pole formuláře. V konfiguračních možnostech tlačítka „Odeslat“ formuláře otevřeme dialogové okno „Navázat pracovní postup“, vybereme celá data formuláře jako kontext a jako pracovní postup vybereme ten, který jsme vytvořili dříve:

![Example_Form Button Configuration_Bind Workflow](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Po dokončení konfigurace formuláře se vrátíme k orchestraci logiky pracovního postupu. Například, pokud je částka vyšší než 500 Kč, požadujeme ruční kontrolu administrátorem, jinak je přímo schválena. Až po schválení se vytvoří záznam o proplacení a dále se zpracuje finančním oddělením (vynecháno).

![Example_Processing Flow](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Pokud pomineme následné zpracování finančním oddělením, je konfigurace procesu žádosti o proplacení nyní dokončena. Když zaměstnanec vyplní a odešle žádost o proplacení, spustí se odpovídající pracovní postup. Pokud je částka nákladů menší než 500 Kč, záznam se automaticky vytvoří a bude čekat na další zpracování finančním oddělením. V opačném případě bude zkontrolován nadřízeným a po schválení se záznam také vytvoří a předá finančnímu oddělení.

Proces v tomto příkladu lze také nakonfigurovat na běžném tlačítku „Odeslat“. Můžete se rozhodnout, zda nejprve vytvořit záznam a teprve poté provést následné procesy, a to na základě konkrétního obchodního scénáře.

## Externí volání

Spouštění událostí po akci se neomezuje pouze na operace uživatelského rozhraní; lze je spustit také prostřednictvím volání HTTP API.

:::info{title="Tip"}
Při spouštění události po akci prostřednictvím volání HTTP API je také potřeba věnovat pozornost povolenému stavu pracovního postupu a tomu, zda konfigurace kolekce odpovídá, jinak volání nemusí být úspěšné nebo se může vyskytnout chyba.
:::

Pro pracovní postupy lokálně navázané na akční tlačítko můžete volat takto (například s tlačítkem pro vytvoření kolekce `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Kde parametr URL `triggerWorkflows` je klíč pracovního postupu, přičemž více pracovních postupů je odděleno čárkami. Tento klíč lze získat najetím myši na název pracovního postupu v horní části plátna pracovního postupu:

![Workflow_Key_View Method](https://static-docs.nocobase.com/20240426135108.png)

Po úspěšném volání výše se spustí událost po akci odpovídající kolekce `posts`.

:::info{title="Tip"}
Jelikož externí volání také vyžadují ověření uživatelské identity, při volání prostřednictvím HTTP API, stejně jako u požadavků odesílaných z běžného rozhraní, je nutné poskytnout autentizační informace, včetně hlavičky požadavku `Authorization` nebo parametru `token` (token získaný po přihlášení) a hlavičky požadavku `X-Role` (aktuální název role uživatele).
:::

Pokud potřebujete spustit událost pro data vztahu jedna k jedné (vztah jedna k mnoha zatím není podporován) v této akci, můžete v parametru použít `!` k určení spouštěcích dat relačního pole:

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

Po úspěšném volání výše se spustí událost po akci odpovídající kolekce `categories`.

:::info{title="Tip"}
Pokud je událost nakonfigurována v globálním režimu, nemusíte používat parametr URL `triggerWorkflows` k určení odpovídajícího pracovního postupu. Spustí se jednoduše voláním odpovídající akce kolekce.
:::

## Často kladené otázky

### Rozdíl oproti události před akcí

*   Událost před akcí: Spustí se před provedením akce (např. přidání, aktualizace atd.). Před provedením akce lze v pracovním postupu ověřit nebo zpracovat požadovaná data. Pokud je pracovní postup ukončen (požadavek je zachycen), tato akce (přidání, aktualizace atd.) nebude provedena.
*   Událost po akci: Spustí se po úspěšném dokončení uživatelské akce. V tomto okamžiku byla data úspěšně odeslána a uložena do databáze a související procesy mohou pokračovat ve zpracování na základě úspěšného výsledku.

Jak je znázorněno na obrázku níže:

![Action Execution Order](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Rozdíl oproti události kolekce

Události po akci a události kolekce mají podobnosti v tom, že obě spouštějí procesy po změně dat. Jejich úrovně implementace se však liší: události po akci jsou na úrovni API, zatímco události kolekce se týkají změn dat v kolekci.

Události kolekce jsou blíže k základní vrstvě systému. V některých případech může změna dat způsobená jednou událostí spustit jinou událost, což vytváří řetězovou reakci. Zejména pokud se data v některých souvisejících kolekcích také změní během operace s aktuální kolekcí, mohou být spuštěny i události související s těmito souvisejícími kolekcemi.

Spouštění událostí kolekce neobsahuje informace související s uživatelem. Naproti tomu události po akci jsou blíže uživatelskému rozhraní a jsou výsledkem uživatelských akcí. Kontext pracovního postupu bude také obsahovat informace související s uživatelem, což je činí vhodnými pro zpracování procesů souvisejících s uživatelskými akcemi. V budoucím designu NocoBase se může rozšířit počet událostí po akci, které lze použít ke spouštění, proto **se důrazně doporučuje používat události po akci** pro zpracování procesů, kde změny dat jsou způsobeny uživatelskými akcemi.

Dalším rozdílem je, že události po akci lze lokálně navázat na konkrétní tlačítka formuláře. Pokud existuje více formulářů, odeslání některých formulářů může tuto událost spustit, zatímco jiné ne. Události kolekce se naopak týkají změn dat v celé kolekci a nelze je lokálně navázat.