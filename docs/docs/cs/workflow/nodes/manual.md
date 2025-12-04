---
pkg: '@nocobase/plugin-workflow-manual'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Manuální zpracování

## Úvod

Pokud obchodní proces nelze plně automatizovat v rozhodování, je možné využít manuální uzel a předat část rozhodovacích pravomocí lidskému zpracování.

Když je manuální uzel spuštěn, nejprve přeruší provádění celého **pracovního postupu** a vygeneruje úkol k vyřízení pro příslušného uživatele. Poté, co uživatel úkol odešle, **pracovní postup** buď pokračuje, zůstane v režimu čekání, nebo bude ukončen na základě zvoleného stavu. To je velmi užitečné ve scénářích, jako jsou schvalovací procesy.

## Instalace

Jedná se o vestavěný **plugin**, který nevyžaduje instalaci.

## Vytvoření uzlu

V konfiguračním rozhraní **pracovního postupu** klikněte na tlačítko plus („+“) v rámci **pracovního postupu** a přidejte uzel „Ruční zpracování“:

![Create Manual Node](https://static-docs.nocobase.com/4dd259f1aceeaf9b825abb4b257df909.png)

## Konfigurace uzlu

### Zodpovědná osoba

Manuální uzel vyžaduje určení uživatele jako vykonavatele úkolu k vyřízení. Seznam úkolů k vyřízení můžete přidat jako blok na stránku a obsah vyskakovacího okna úkolu pro každý uzel je třeba nakonfigurovat v nastavení rozhraní daného uzlu.

Vyberte uživatele, nebo pomocí proměnné vyberte primární či cizí klíč uživatelských dat z kontextu.

![Manual Node_Configure_Assignee_Select Variable](https://static-docs.nocobase.com/22fbca3b8e21fda3a825abb4b257df909.png)

:::info{title=Poznámka}
V současné době možnost zodpovědné osoby pro manuální uzly nepodporuje zpracování více uživateli. Tato funkce bude přidána v budoucí verzi.
:::

### Konfigurace uživatelského rozhraní

Konfigurace rozhraní pro úkol k vyřízení je klíčovou součástí manuálního uzlu. Kliknutím na tlačítko „Konfigurovat uživatelské rozhraní“ můžete otevřít samostatné vyskakovací okno pro konfiguraci, které lze nastavit metodou WYSIWYG (co vidíte, to dostanete), stejně jako běžnou stránku:

![Manual Node_Node Configuration_Interface Configuration](https://static-docs.nocobase.com/fd360168c879743cf22d57440cd2590f.png)

#### Záložky

Záložky lze použít k rozlišení různého obsahu. Například jedna záložka může sloužit pro odeslání schvalovacího formuláře, jiná pro odeslání zamítacího formuláře, nebo pro zobrazení podrobností souvisejících dat. Lze je volně konfigurovat.

#### Bloky

Podporované typy bloků se dělí hlavně do dvou kategorií: datové bloky a formulářové bloky. Kromě toho se Markdown používá především pro statický obsah, například pro informační zprávy.

##### Datový blok

Datové bloky mohou zobrazovat data spouštěče nebo výsledky zpracování libovolného uzlu, čímž poskytují relevantní kontextové informace zodpovědné osobě úkolu. Například, pokud je **pracovní postup** spuštěn událostí formuláře, můžete vytvořit blok podrobností pro data spouštěče. To je v souladu s konfigurací podrobností běžné stránky, což vám umožňuje vybrat libovolné pole z dat spouštěče pro zobrazení:

![Manual Node_Node Configuration_Interface Configuration_Data Block_Trigger](https://static-docs.nocobase.com/675c3e58a1a4f45db310a72c2d0a404c.png)

Bloky dat uzlů jsou podobné; můžete vybrat datový výsledek z předchozího uzlu pro zobrazení jako podrobnosti. Například výsledek předchozího výpočetního uzlu může sloužit jako kontextová referenční informace pro úkol zodpovědné osoby.

![Manual Node_Node Configuration_Interface Configuration_Data Block_Node Data](https://static-docs.nocobase.com/a53e258a1a4f45db310a72c2d0a404c.png)

:::info{title=Poznámka}
Vzhledem k tomu, že **pracovní postup** není během konfigurace rozhraní ve spuštěném stavu, v datových blocích se nezobrazují žádná konkrétní data. Relevantní data pro konkrétní instanci **pracovního postupu** uvidíte pouze v rozhraní vyskakovacího okna úkolu k vyřízení poté, co byl **pracovní postup** spuštěn a proveden.
:::

##### Formulářový blok

V rozhraní úkolu k vyřízení musí být nakonfigurován alespoň jeden formulářový blok, který slouží k finálnímu rozhodnutí o tom, zda má **pracovní postup** pokračovat. Nekonfigurace formuláře zabrání pokračování **pracovního postupu** po jeho přerušení. Existují tři typy formulářových bloků:

- Vlastní formulář
- Formulář pro vytvoření záznamu
- Formulář pro aktualizaci záznamu

![Manual Node_Node Configuration_Interface Configuration_Form Types](https://static-docs.nocobase.com/2d068f3012ab07e32a265405492104a8.png)

Formuláře pro vytvoření záznamu a formuláře pro aktualizaci záznamu vyžadují výběr základní **kolekce**. Poté, co uživatel úkolu k vyřízení odešle formulář, budou hodnoty v něm použity k vytvoření nebo aktualizaci dat v zadané **kolekci**. Vlastní formulář vám umožňuje volně definovat dočasný formulář, který není vázán na **kolekci**. Hodnoty polí odeslané uživatelem úkolu k vyřízení lze použít v následných uzlech.

Tlačítka pro odeslání formuláře lze konfigurovat do tří typů:

- Odeslat a pokračovat v pracovním postupu
- Odeslat a ukončit pracovní postup
- Pouze uložit hodnoty formuláře

![Manual Node_Node Configuration_Interface Configuration_Form Buttons](https://static-docs.nocobase.com/6b45995b14152e85a821dff6f6e3189a.png)

Tři tlačítka představují tři stavy uzlů v procesu **pracovního postupu**. Po odeslání se stav uzlu změní na „Dokončeno“, „Odmítnuto“ nebo zůstane ve stavu „Čeká“. Formulář musí mít nakonfigurován alespoň jeden z prvních dvou, aby určil následný tok celého **pracovního postupu**.

Na tlačítku „Pokračovat v **pracovním postupu**“ můžete konfigurovat přiřazení pro pole formuláře:

![Manual Node_Node Configuration_Interface Configuration_Form Button_Set Form Values](https://static-docs.nocobase.com/2cec2d4e2957f068877e616dec3b56dd.png)

![Manual Node_Node Configuration_Interface Configuration_Form Button_Set Form Values Popup](https://static-docs.nocobase.com/5ff51b60c76cdb76e6f1cc95dc3d8640.png)

Po otevření vyskakovacího okna můžete přiřadit hodnoty libovolnému poli formuláře. Po odeslání formuláře bude tato hodnota konečnou hodnotou pole. To je obzvláště užitečné při revizi dat. Ve formuláři můžete použít více různých tlačítek „Pokračovat v **pracovním postupu**“, přičemž každé tlačítko nastaví různé výčtové hodnoty pro pole, jako je stav, čímž se dosáhne efektu pokračování následného provádění **pracovního postupu** s různými datovými hodnotami.

## Blok úkolů k vyřízení

Pro ruční zpracování je také třeba přidat na stránku seznam úkolů k vyřízení, který slouží k zobrazení úkolů. To umožňuje příslušnému personálu přistupovat a zpracovávat konkrétní úkoly manuálního uzlu prostřednictvím tohoto seznamu.

### Přidání bloku

Můžete vybrat „**Pracovní postup** k vyřízení“ z dostupných bloků na stránce a přidat tak blok seznamu úkolů k vyřízení:

![Manual Node_Add To-do Block](https://static-docs.nocobase.com/198b41754cd73b704267bf30fe5e647.png)

Příklad bloku seznamu úkolů k vyřízení:

![Manual Node_To-do List](https://static-docs.nocobase.com/cfefb033deebff6b3f6ef4408066e688.png)

### Podrobnosti úkolu k vyřízení

Poté mohou příslušní pracovníci kliknout na odpovídající úkol k vyřízení, otevřít vyskakovací okno s úkolem a provést ruční zpracování:

![Manual Node_To-do Details](https://static-docs.nocobase.com/ccfd0533deebff6b3f6ef4408066e688.png)

## Příklad

### Revize článku

Předpokládejme, že článek odeslaný běžným uživatelem musí být schválen administrátorem, než může být aktualizován na stav „zveřejněno“. Pokud je **pracovní postup** zamítnut, článek zůstane ve stavu „koncept“ (nezveřejněno). Tento proces lze implementovat pomocí formuláře pro aktualizaci záznamu v manuálním uzlu.

Vytvořte **pracovní postup** spuštěný událostí „Vytvořit článek“ a přidejte manuální uzel:

<figure>
  <img alt="Manual Node_Example_Post Review_Workflow Orchestration" src="https://github.com/nocobase/nocobase/assets/525658/2021bf42-f372-4f69-9c84-5a786c061e0e" width="360" />
</figure>

V manuálním uzlu nakonfigurujte zodpovědnou osobu jako administrátora. V konfiguraci rozhraní přidejte blok založený na datech spouštěče, který zobrazí podrobnosti nového článku:

<figure>
  <img alt="Manual Node_Example_Post Review_Node Configuration_Details Block" src="https://github.com/nocobase/nocobase/assets/525658/c61d0aac-23cb-4387-b60e-ce3cc7bf1c24" width="680" />
</figure>

V konfiguračním rozhraní přidejte blok založený na formuláři pro aktualizaci záznamu, vyberte **kolekci** článků, aby administrátor mohl rozhodnout, zda schválí. Po schválení bude odpovídající článek aktualizován na základě dalších následných konfigurací. Po přidání formuláře bude ve výchozím nastavení tlačítko „Pokračovat v **pracovním postupu**“, které lze považovat za „Schválit“. Poté přidejte tlačítko „Ukončit **pracovní postup**“, které se použije pro zamítnutí:

<figure>
  <img alt="Manual Node_Example_Post Review_Node Configuration_Form and Actions" src="https://github.com/nocobase/nocobase/assets/525658/4baaf41e-3d81-4ee8-a038-29db05e0d99f" width="673" />
</figure>

Při pokračování v **pracovním postupu** musíme aktualizovat stav článku. Existují dva způsoby konfigurace. Jedním je zobrazení pole stavu článku přímo ve formuláři pro výběr operátorem. Tato metoda je vhodnější pro situace, které vyžadují aktivní vyplňování formuláře, jako je poskytování zpětné vazby:

<figure>
  <img alt="Manual Node_Example_Post Review_Node Configuration_Form Fields" src="https://github.com/nocobase/nocobase/assets/525658/82ea4e0e-25fc-4921-841e-e1a2782a87d1" width="668" />
</figure>

Pro zjednodušení úkolu operátora je dalším způsobem konfigurace přiřazení hodnot formuláře na tlačítku „Pokračovat v **pracovním postupu**“. V přiřazení přidejte pole „Stav“ s hodnotou „Zveřejněno“. To znamená, že když operátor klikne na tlačítko, článek bude aktualizován na stav „zveřejněno“:

<figure>
  <img alt="Manual Node_Example_Post Review_Node Configuration_Form Assignment" src="https://github.com/nocobase/nocobase/assets/525658/0340bd9f-8323-4e4f-bc5a-8f81be3d6736" width="711" />
</figure>

Poté z konfiguračního menu v pravém horním rohu formulářového bloku vyberte podmínku filtru pro data, která mají být aktualizována. Zde vyberte **kolekci** „Články“ a podmínka filtru je „ID `rovná se` Proměnná spouštěče / Data spouštěče / ID“:

<figure>
  <img alt="Manual Node_Example_Post Review_Node Configuration_Form Condition" src="https://github.com/nocobase/nocobase/assets/525658/da004055-0262-49ae-88dd-3844f3c92e28" width="1020" />
</figure>

Nakonec můžete upravit názvy jednotlivých bloků, text souvisejících tlačítek a text nápovědy polí formuláře, aby bylo rozhraní uživatelsky přívětivější:

<figure>
  <img alt="Manual Node_Example_Post Review_Node Configuration_Final Form" src="https://github.com/nocobase/nocobase/assets/525658/21db5f6b-690b-49c1-8259-4f7b8874620d" width="678" />
</figure>

Zavřete konfigurační panel a kliknutím na tlačítko odeslat uložte konfiguraci uzlu. **Pracovní postup** je nyní nakonfigurován. Po povolení tohoto **pracovního postupu** bude automaticky spuštěn při vytvoření nového článku. Administrátor může ze seznamu úkolů k vyřízení vidět, že tento **pracovní postup** vyžaduje zpracování. Kliknutím na zobrazení se zobrazí podrobnosti úkolu k vyřízení:

<figure>
  <img alt="Manual Node_Example_Post Review_To-do List" src="https://github.com/nocobase/nocobase/assets/525658/4e1748cd-6a07-4045-82e5-286826607826" width="1363" />
</figure>

<figure>
  <img alt="Manual Node_Example_Post Review_To-do Details" src="https://github.com/nocobase/nocobase/assets/525658/65f01fb1-8cb0-45f8-ac21-ec8ab59be449" width="680" />
</figure>

Administrátor může na základě podrobností článku ručně posoudit, zda může být článek zveřejněn. Pokud ano, kliknutím na tlačítko „Schválit“ se článek aktualizuje na stav „zveřejněno“. Pokud ne, kliknutím na tlačítko „Odmítnout“ zůstane článek ve stavu „koncept“.

## Schvalování dovolené

Předpokládejme, že zaměstnanec potřebuje požádat o dovolenou, která musí být schválena nadřízeným, aby nabyla účinnosti, a data o dovolené příslušného zaměstnance musí být odečtena. Bez ohledu na schválení nebo zamítnutí bude prostřednictvím uzlu požadavku HTTP voláno rozhraní API pro SMS, aby se zaměstnanci odeslala související oznamovací SMS zpráva (viz část [HTTP požadavek](#_HTTP_请求)). Tento scénář lze implementovat pomocí vlastního formuláře v manuálním uzlu.

Vytvořte **pracovní postup** spuštěný událostí „Vytvořit žádost o dovolenou“ a přidejte manuální uzel. To je podobné předchozímu procesu revize článku, ale zde je zodpovědnou osobou nadřízený. V konfiguraci rozhraní přidejte blok založený na datech spouštěče, který zobrazí podrobnosti nové žádosti o dovolenou. Poté přidejte další blok založený na vlastním formuláři, aby nadřízený mohl rozhodnout, zda schválí. Do vlastního formuláře přidejte pole pro stav schválení a pole pro důvod zamítnutí:

<figure>
  <img alt="Manual Node_Example_Leave Approval_Node Configuration" src="https://github.com/nocobase/nocobase/assets/525658/ef3bc7b8-56e8-4a4e-826e-ffd0b547d1b6" width="675" />
</figure>

Na rozdíl od procesu revize článku, jelikož potřebujeme pokračovat v následném **pracovním postupu** na základě výsledku schválení nadřízeným, konfigurujeme zde pouze tlačítko „Pokračovat v **pracovním postupu**“ pro odeslání, aniž bychom použili tlačítko „Ukončit **pracovní postup**“.

Současně, po manuálním uzlu, můžeme použít uzel podmíněného rozhodování k určení, zda nadřízený schválil žádost o dovolenou. Ve schvalovací větvi přidejte zpracování dat pro odečtení dovolené a po sloučení větví přidejte uzel požadavku pro odeslání SMS oznámení zaměstnanci. Tím získáte následující kompletní **pracovní postup**:

<figure>
  <img alt="Manual Node_Example_Leave Approval_Workflow Orchestration" src="https://github.com/nocobase/nocobase/assets/525658/733f68da-e44f-4172-9772-a287ac2724f2" width="593" />
</figure>

Podmínka v uzlu podmíněného rozhodování je nakonfigurována jako „Manuální uzel / Vlastní data formuláře / Hodnota pole schválení je ‚Schváleno‘“:

<figure>
  <img alt="Manual Node_Example_Leave Approval_Condition" src="https://github.com/nocobase/nocobase/assets/525658/57b972f0-a3ce-4f33-8d40-4272ad205c20" width="678" />
</figure>

Data v uzlu odeslání požadavku mohou také použít odpovídající proměnné formuláře z manuálního uzlu k rozlišení obsahu SMS pro schválení a zamítnutí. Tím je dokončena celá konfigurace **pracovního postupu**. Po povolení **pracovního postupu**, když zaměstnanec odešle formulář žádosti o dovolenou, může nadřízený provést schvalovací proces v úkolech k vyřízení. Operace je v podstatě podobná procesu revize článku.