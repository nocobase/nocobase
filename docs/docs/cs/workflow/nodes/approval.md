---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/workflow/nodes/approval).
:::

# Schvalování

## Představení

V schvalovacím pracovním postupu je nutné použít vyhrazený uzel „Schvalování“ ke konfiguraci operační logiky pro schvalovatele k vyřízení (schválení, zamítnutí nebo vrácení) zahájeného schválení. Uzel „Schvalování“ lze použít pouze ve schvalovacích procesech.

:::info{title=Tip}
Rozdíl oproti běžnému uzlu „Ruční zpracování“: Běžný uzel „Ruční zpracování“ je určen pro obecnější scénáře, jako je ruční zadávání dat nebo ruční rozhodování o pokračování procesu v různých typech pracovních postupů. „Schvalovací uzel“ je specializovaný uzel pro zpracování určený výhradně pro schvalovací procesy, který zpracovává pouze data zahájeného schválení a nelze jej použít v jiných pracovních postupech.
:::

## Vytvoření uzlu

Kliknutím na tlačítko plus („+“) v pracovním postupu přidejte uzel „Schvalování“ a poté výběrem jednoho z režimů schválení vytvořte schvalovací uzel:

![Vytvoření schvalovacího uzlu](https://static-docs.nocobase.com/20251107000938.png)

## Konfigurace uzlu

### Režim schválení

Existují dva režimy schválení:

1.  Přímý režim: Obvykle se používá pro jednodušší procesy. To, zda schvalovací uzel projde či nikoli, pouze rozhoduje o tom, zda proces skončí. V případě neschválení se proces přímo ukončí.

    ![Režim schválení_Přímý režim](https://static-docs.nocobase.com/20251107001043.png)

2.  Režim větví: Obvykle se používá pro složitější datovou logiku. Poté, co schvalovací uzel vygeneruje jakýkoli výsledek, lze v rámci jeho výsledné větve pokračovat v provádění dalších uzlů.

    ![Režim schválení_Režim větví](https://static-docs.nocobase.com/20251107001234.png)

    Poté, co je tento uzel „schválen“, bude kromě spuštění větve pro schválení pokračovat i navazující proces. Po operaci „zamítnutí“ může ve výchozím nastavení také pokračovat navazující proces, nebo můžete v uzlu nakonfigurovat ukončení pracovního postupu po spuštění větve.

:::info{title=Tip}
Režim schválení nelze po vytvoření uzlu změnit.
:::

### Schvalovatel

Schvalovatel je množina uživatelů odpovědných za schvalovací akci tohoto uzlu. Může se jednat o jednoho nebo více uživatelů. Zdroj výběru může být statická hodnota vybraná ze seznamu uživatelů nebo dynamická hodnota určená proměnnou:

![Schvalovací uzel_Schvalovatel](https://static-docs.nocobase.com/20251107001433.png)

Při výběru proměnné lze zvolit pouze primární nebo cizí klíč uživatelských dat z kontextu a výsledků uzlu. Pokud je vybraná proměnná během provádění polem (vztah "jeden k mnoha"), pak se každý uživatel v poli sloučí do celé množiny schvalovatelů.

Kromě přímého výběru uživatelů nebo proměnných můžete také dynamicky filtrovat uživatele splňující podmínky jako schvalovatele na základě podmínek dotazu z kolekce uživatelů:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Režim dohody

Pokud je při konečném provedení pouze jeden schvalovatel (včetně případu po odstranění duplicit z více proměnných), pak bez ohledu na zvolený režim dohody provede schvalovací akci pouze tento uživatel a výsledek bude určen výhradně jím.

Pokud je v množině schvalovatelů více uživatelů, výběr různých režimů dohody představuje různé způsoby zpracování:

1. Kdokoli (Anyone): Stačí, aby schválila jedna osoba, a uzel je považován za schválený. Všichni musí zamítnout, aby byl uzel zamítnut.
2. Souhlas všech (Countersign): Všichni musí schválit, aby byl uzel schválen. Stačí, aby jedna osoba zamítla, a uzel je považován za zamítnutý.
3. Hlasování (Vote): Pro schválení uzlu je potřeba, aby počet schvalujících osob překročil nastavený poměr; v opačném případě je uzel zamítnut.

V případě operace vrácení, v jakémkoli režimu, pokud některý uživatel v množině schvalovatelů provede vrácení, uzel přímo ukončí pracovní postup.

### Pořadí zpracování

Podobně, pokud je v množině schvalovatelů více uživatelů, výběr různých pořadí zpracování představuje různé způsoby zpracování:

1. Paralelní: Všichni schvalovatelé mohou zpracovávat v libovolném pořadí; na pořadí zpracování nezáleží.
2. Sekvenční: Schvalovatelé zpracovávají postupně podle pořadí v množině schvalovatelů. Další schvalovatel může zpracovávat až poté, co předchozí odeslal své rozhodnutí.

Bez ohledu na to, zda je nastaveno „sekvenční“ zpracování, výsledek generovaný podle skutečného pořadí zpracování se řídí pravidly uvedenými výše v „Režimu dohody“. Uzel dokončí své provedení po dosažení odpovídajících podmínek.

### Ukončení pracovního postupu po skončení větve zamítnutí

Pokud je „Režim schválení“ nastaven na „Režim větví“, můžete zvolit ukončení pracovního postupu po skončení větve zamítnutí. Po zaškrtnutí této možnosti se na konci větve zamítnutí zobrazí „✗“, což znamená, že po skončení této větve nebudou pokračovat žádné další uzly:

![Schvalovací uzel_Ukončení po zamítnutí](https://static-docs.nocobase.com/20251107001839.png)

### Konfigurace rozhraní schvalovatele

Konfigurace rozhraní schvalovatele slouží k poskytnutí operačního rozhraní pro schvalovatele v okamžiku, kdy schvalovací pracovní postup dosáhne tohoto uzlu. Kliknutím na tlačítko konfigurace otevřete vyskakovací okno:

![Schvalovací uzel_Konfigurace rozhraní_Vyskakovací okno](https://static-docs.nocobase.com/20251107001958.png)

V konfiguračním okně můžete přidávat bloky, jako jsou původní obsah podání, informace o schválení, formulář pro zpracování a vlastní text nápovědy:

![Schvalovací uzel_Konfigurace rozhraní_Přidání bloků](https://static-docs.nocobase.com/20251107002604.png)

#### Původní obsah podání

Blok detailů obsahu schválení je datový blok odeslaný iniciátorem. Podobně jako u běžného datového bloku můžete libovolně přidávat komponenty polí z kolekce a libovolně je uspořádat, abyste zorganizovali obsah, který schvalovatel potřebuje vidět:

![Schvalovací uzel_Konfigurace rozhraní_Blok detailů](https://static-docs.nocobase.com/20251107002925.png)

#### Formulář pro zpracování

Do bloku formuláře pro zpracování můžete přidat akční tlačítka podporovaná tímto uzlem, včetně „Schválit“, „Zamítnout“, „Vrátit“, „Předat“ a „Přidat schvalovatele“:

![Schvalovací uzel_Konfigurace rozhraní_Blok formuláře pro zpracování](https://static-docs.nocobase.com/20251107003015.png)

Dále lze do formuláře pro zpracování přidat pole, která může schvalovatel upravovat. Tato pole se zobrazí ve formuláři pro zpracování, když schvalovatel vyřizuje schválení. Schvalovatel může upravit hodnoty těchto polí a po odeslání se současně aktualizují data použitá pro schválení i snímek odpovídajících dat v pracovním postupu schvalování.

![Schvalovací uzel_Konfigurace rozhraní_Formulář pro zpracování_Úprava polí obsahu schválení](https://static-docs.nocobase.com/20251107003206.png)

#### „Schválit“ a „Zamítnout“

Mezi tlačítky pro schvalovací operace jsou „Schválit“ a „Zamítnout“ rozhodující akce. Po odeslání je vyřízení schvalovatele v tomto uzlu dokončeno. Další pole, která je třeba vyplnit při odesílání, jako například „Komentář“, lze přidat v okně „Konfigurace zpracování“ akčního tlačítka.

![Schvalovací uzel_Konfigurace rozhraní_Formulář pro zpracování_Konfigurace zpracování](https://static-docs.nocobase.com/20251107003314.png)

#### „Vrátit“

„Vrátit“ je také rozhodující operace. Kromě konfigurace komentáře lze také nakonfigurovat uzly, na které lze schválení vrátit:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### „Předat“ a „Přidat schvalovatele“

„Předat“ a „Přidat schvalovatele“ jsou nerozhodující akce sloužící k dynamické úpravě schvalovatelů v pracovním postupu schvalování. „Předat“ znamená předat schvalovací úkol aktuálního uživatele jinému uživateli k vyřízení. „Přidat schvalovatele“ znamená přidat schvalovatele před nebo za aktuálního schvalovatele, přičemž nově přidaný schvalovatel bude pokračovat ve schvalování společně s ostatními.

Po povolení tlačítek „Předat“ nebo „Přidat schvalovatele“ je třeba v konfiguračním menu tlačítka vybrat „Rozsah přiřazení osob“ a nastavit rozsah uživatelů, které lze jako nové schvalovatele přiřadit:

![Schvalovací uzel_Konfigurace rozhraní_Formulář pro zpracování_Rozsah přiřazení osob](https://static-docs.nocobase.com/20241226232321.png)

Stejně jako u původní konfigurace schvalovatele uzlu může být rozsah přiřazení osob buď přímo vybraní uživatelé, nebo na základě podmínek dotazu z kolekce uživatelů. Nakonec se sloučí do jedné množiny a nebude obsahovat uživatele, kteří již v množině schvalovatelů jsou.

:::warning{title=Důležité}
Pokud zapnete nebo vypnete některé akční tlačítko nebo změníte rozsah přiřazení osob, musíte po zavření okna konfigurace rozhraní uložit konfiguraci uzlu, jinak se změny akčního tlačítka neprojeví.
:::

### Karta „Moje schválení“ <Badge>2.0+</Badge>

Lze použít ke konfiguraci karty úkolu v seznamu „Moje schválení“ v centru úkolů.

![20260214141554](https://static-docs.nocobase.com/20260214141554.png)

Na kartě můžete libovolně konfigurovat obchodní pole, která chcete zobrazit (kromě vztahových polí), nebo informace související se schvalováním.

Jakmile schvalování vstoupí do tohoto uzlu, uvidíte v seznamu centra úkolů vlastní kartu úkolu:

![20260214141722](https://static-docs.nocobase.com/20260214141722.png)

## Výsledek uzlu

Po dokončení schválení se relevantní stavy a data zaznamenají do výsledku uzlu a mohou být použity jako proměnné následnými uzly.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Stav schválení uzlu

Představuje stav vyřízení aktuálního schvalovacího uzlu, výsledkem je výčtová hodnota.

### Data po schválení

Pokud schvalovatel upravil obsah schválení ve formuláři pro zpracování, upravená data se zaznamenají do výsledku uzlu pro použití následnými uzly. Pokud potřebujete použít vztahová pole, musíte v triggeru nakonfigurovat jejich přednačtení.

### Záznamy schválení

> v1.8.0+

Záznamy o vyřízení schválení jsou polem, které obsahuje záznamy o vyřízení všech schvalovatelů v tomto uzlu. Každý záznam obsahuje následující pole:

| Pole | Typ | Popis |
| --- | --- | --- |
| id | number | Jedinečný identifikátor záznamu o vyřízení |
| userId | number | ID uživatele, který záznam vyřídil |
| status | number | Stav vyřízení |
| comment | string | Komentář při vyřízení |
| updatedAt | string | Čas aktualizace záznamu o vyřízení |

Pole z těchto záznamů můžete podle potřeby použít jako proměnné v následných uzlech.