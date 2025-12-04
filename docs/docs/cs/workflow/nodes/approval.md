---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Schvalování

## Úvod

V rámci schvalovacího pracovního postupu je potřeba použít speciální uzel „Schvalování“, který konfiguruje logiku pro schvalovatele, aby mohli zpracovat (schválit, zamítnout nebo vrátit) zahájené schválení. Uzel „Schvalování“ lze použít pouze ve schvalovacích procesech.

:::info{title=Tip}
Rozdíl oproti běžnému uzlu „Ruční zpracování“: Běžný uzel „Ruční zpracování“ je určen pro obecnější scénáře, jako je ruční zadávání dat nebo ruční rozhodování o pokračování procesu v různých typech pracovních postupů. „Schvalovací uzel“ je specializovaný uzel pro zpracování, určený výhradně pro schvalovací procesy. Zpracovává pouze data zahájeného schválení a nelze jej použít v jiných pracovních postupech.
:::

## Vytvoření uzlu

Klikněte na tlačítko plus („+“) v pracovním postupu, přidejte uzel „Schvalování“ a poté vyberte jeden z režimů schválení pro vytvoření schvalovacího uzlu:

![Vytvoření schvalovacího uzlu](https://static-docs.nocobase.com/20251107000938.png)

## Konfigurace uzlu

### Režim schválení

Existují dva režimy schválení:

1.  **Přímý režim (Pass-through)**: Obvykle se používá pro jednodušší procesy. To, zda schvalovací uzel projde či nikoli, pouze rozhoduje o ukončení procesu. Pokud není schválen, proces se okamžitě ukončí.

    ![Režim schválení_Přímý režim](https://static-docs.nocobase.com/20251107001043.png)

2.  **Režim větvení (Branch)**: Obvykle se používá pro složitější datovou logiku. Poté, co schvalovací uzel vygeneruje jakýkoli výsledek, mohou být v rámci jeho výsledné větve dále spouštěny další uzly.

    ![Režim schválení_Režim větvení](https://static-docs.nocobase.com/20251107001234.png)

    Poté, co je tento uzel „schválen“, kromě spuštění větve pro schválení bude pokračovat i navazující proces. Po operaci „zamítnutí“ může ve výchozím nastavení také pokračovat navazující proces, nebo můžete v uzlu nakonfigurovat ukončení procesu po spuštění větve.

:::info{title=Tip}
Režim schválení nelze po vytvoření uzlu změnit.
:::

### Schvalovatel

Schvalovatel je množina uživatelů odpovědných za schvalovací akci tohoto uzlu. Může se jednat o jednoho nebo více uživatelů. Zdroj výběru může být statická hodnota vybraná ze seznamu uživatelů, nebo dynamická hodnota určená proměnnou:

![Schvalovací uzel_Schvalovatel](https://static-docs.nocobase.com/20251107001433.png)

Při výběru proměnné lze zvolit pouze primární nebo cizí klíč uživatelských dat z kontextu a výsledků uzlu. Pokud je vybraná proměnná během provádění polem (vztah "jeden k mnoha"), pak se každý uživatel v poli sloučí do celé množiny schvalovatelů.

Kromě přímého výběru uživatelů nebo proměnných můžete také dynamicky filtrovat vhodné uživatele jako schvalovatele na základě podmínek dotazu z kolekce uživatelů:

![Konfigurace schvalovatele_Podmínky dotazu](https://static-docs.nocobase.com/20251107001703.png)

### Režim dohody

Pokud je v okamžiku konečného provedení pouze jeden schvalovatel (včetně případu po odstranění duplicit z více proměnných), pak bez ohledu na zvolený režim dohody provede schvalovací akci pouze tento uživatel a výsledek bude určen výhradně jím.

Pokud je v množině schvalovatelů více uživatelů, výběr různých režimů dohody představuje různé způsoby zpracování:

1.  **Kdokoli (Anyone)**: Stačí, aby schválila jedna osoba, a uzel je považován za schválený. Uzel je zamítnut pouze v případě, že zamítnou všichni.
2.  **Souhlas všech (Countersign)**: Pro schválení uzlu je potřeba souhlas všech. Stačí, aby jedna osoba zamítla, a uzel je považován za zamítnutý.
3.  **Hlasování (Vote)**: Pro schválení uzlu je potřeba, aby počet schvalujících osob překročil nastavený poměr; v opačném případě je uzel zamítnut.

Co se týče operace vrácení, v jakémkoli režimu, pokud některý uživatel v množině schvalovatelů zpracuje požadavek jako vrácený, uzel okamžitě ukončí proces.

### Pořadí zpracování

Podobně, pokud je v množině schvalovatelů více uživatelů, výběr různých pořadí zpracování představuje různé způsoby zpracování:

1.  **Paralelní (Parallel)**: Všichni schvalovatelé mohou zpracovávat v libovolném pořadí; posloupnost zpracování není důležitá.
2.  **Sekvenční (Sequential)**: Schvalovatelé zpracovávají postupně podle pořadí v množině schvalovatelů. Další schvalovatel může zpracovávat až poté, co předchozí odeslal svůj požadavek.

Bez ohledu na to, zda je nastaveno „Sekvenční“ zpracování, výsledek generovaný podle skutečného pořadí zpracování se řídí pravidly uvedenými v „Režimu dohody“. Uzel dokončí své provedení, jakmile jsou splněny odpovídající podmínky.

### Ukončení pracovního postupu po skončení větve zamítnutí

Pokud je „Režim schválení“ nastaven na „Režim větvení“, můžete zvolit ukončení pracovního postupu po skončení větve zamítnutí. Po zaškrtnutí této možnosti se na konci větve zamítnutí zobrazí „✗“, což znamená, že po skončení této větve nebudou pokračovat žádné další uzly:

![Schvalovací uzel_Ukončení po zamítnutí](https://static-docs.nocobase.com/20251107001839.png)

### Konfigurace rozhraní schvalovatele

Konfigurace rozhraní schvalovatele slouží k poskytnutí operačního rozhraní pro schvalovatele v okamžiku, kdy schvalovací pracovní postup dosáhne tohoto uzlu. Klikněte na tlačítko konfigurace pro otevření vyskakovacího okna:

![Schvalovací uzel_Konfigurace rozhraní_Vyskakovací okno](https://static-docs.nocobase.com/20251107001958.png)

V konfiguračním vyskakovacím okně můžete přidávat bloky, jako jsou původní obsah podání, informace o schválení, formulář pro zpracování a vlastní text nápovědy:

![Schvalovací uzel_Konfigurace rozhraní_Přidání bloků](https://static-docs.nocobase.com/20251107002604.png)

#### Původní obsah podání

Blok detailů obsahu schválení je datový blok odeslaný iniciátorem. Podobně jako u běžného datového bloku můžete libovolně přidávat komponenty polí z datové kolekce a libovolně je uspořádat, abyste zorganizovali obsah, který schvalovatel potřebuje vidět:

![Schvalovací uzel_Konfigurace rozhraní_Blok detailů](https://static-docs.nocobase.com/20251107002925.png)

#### Formulář pro zpracování

Do bloku formuláře pro zpracování můžete přidat akční tlačítka podporovaná tímto uzlem, včetně „Schválit“, „Zamítnout“, „Vrátit“, „Přesměrovat“ a „Přidat schvalovatele“:

![Schvalovací uzel_Konfigurace rozhraní_Blok formuláře pro zpracování](https://static-docs.nocobase.com/20251107003015.png)

Dále lze do formuláře pro zpracování přidat pole, která může schvalovatel upravovat. Tato pole se zobrazí ve formuláři pro zpracování, když schvalovatel zpracovává schválení. Schvalovatel může upravit hodnoty těchto polí a po odeslání se současně aktualizují data pro schválení i snímek odpovídajících dat ve schvalovacím procesu.

![Schvalovací uzel_Konfigurace rozhraní_Formulář pro zpracování_Úprava polí obsahu schválení](https://static-docs.nocobase.com/20251107003206.png)

#### „Schválit“ a „Zamítnout“

Mezi tlačítky pro schvalovací operace jsou „Schválit“ a „Zamítnout“ rozhodující akce. Po odeslání je zpracování schvalovatele pro tento uzel dokončeno. Další pole, která je třeba vyplnit při odesílání, jako například „Komentář“, lze přidat v dialogovém okně „Konfigurace zpracování“ akčního tlačítka.

![Schvalovací uzel_Konfigurace rozhraní_Formulář pro zpracování_Konfigurace zpracování](https://static-docs.nocobase.com/20251107003314.png)

#### „Vrátit“

„Vrátit“ je také rozhodující operace. Kromě konfigurace komentáře lze také nakonfigurovat uzly, na které lze vrátit:

![Schvalovací uzel_Vrátit_Konfigurace vratných uzlů](https://static-docs.nocobase.com/20251107003555.png)

#### „Přesměrovat“ a „Přidat schvalovatele“

„Přesměrovat“ a „Přidat schvalovatele“ jsou nerozhodující akce, které slouží k dynamické úpravě schvalovatelů ve schvalovacím procesu. „Přesměrovat“ znamená předat schvalovací úkol aktuálního uživatele jinému uživateli k vyřízení. „Přidat schvalovatele“ znamená přidat schvalovatele před nebo za aktuálního schvalovatele, přičemž nově přidaný schvalovatel se bude podílet na dalším schvalování.

Po povolení akčních tlačítek „Přesměrovat“ nebo „Přidat schvalovatele“ je třeba v konfiguračním menu tlačítka vybrat „Rozsah přiřazení osob“, aby se nastavil rozsah uživatelů, kteří mohou být přiřazeni jako noví schvalovatelé:

![Schvalovací uzel_Konfigurace rozhraní_Formulář pro zpracování_Rozsah přiřazení osob](https://static-docs.nocobase.com/20241226232321.png)

Stejně jako u původní konfigurace schvalovatele uzlu, rozsah přiřazení osob může být buď přímo vybraní schvalovatelé, nebo na základě podmínek dotazu z kolekce uživatelů. Nakonec se sloučí do jedné množiny a nebude obsahovat uživatele, kteří již v množině schvalovatelů jsou.

:::warning{title=Důležité}
Pokud bylo akční tlačítko povoleno nebo zakázáno, nebo byl upraven rozsah přiřazení osob, je nutné uložit konfiguraci uzlu po zavření vyskakovacího okna konfigurace akčního rozhraní. V opačném případě se změny akčního tlačítka neprojeví.
:::

## Výsledek uzlu

Po dokončení schválení se relevantní stav a data zaznamenají do výsledku uzlu a mohou být použity jako proměnné následnými uzly.

![Výsledek uzlu](https://static-docs.nocobase.com/20250614095052.png)

### Stav schválení uzlu

Představuje stav zpracování aktuálního schvalovacího uzlu. Výsledek je výčtová hodnota.

### Data po schválení

Pokud schvalovatel upravil obsah schválení ve formuláři pro zpracování, upravená data se zaznamenají do výsledku uzlu pro použití následnými uzly. Pro použití relačních polí je nutné nakonfigurovat přednačtení pro relační pole v triggeru.

### Záznamy schválení

> v1.8.0+

Záznam o zpracování schválení je pole, které obsahuje záznamy o zpracování všech schvalovatelů v tomto uzlu. Každý záznam o zpracování obsahuje následující pole:

| Pole | Typ | Popis |
| --- | --- | --- |
| id | number | Jedinečný identifikátor záznamu zpracování |
| userId | number | ID uživatele, který zpracoval tento záznam |
| status | number | Stav zpracování |
| comment | string | Komentář v době zpracování |
| updatedAt | string | Čas aktualizace záznamu zpracování |

Tyto pole můžete podle potřeby použít jako proměnné v následných uzlech.