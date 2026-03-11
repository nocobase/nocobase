---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/ui-templates).
:::

# UI šablony

## Úvod

UI šablony slouží k opakovanému použití konfigurací při sestavování rozhraní, což snižuje potřebu opakovaného nastavování a v případě potřeby udržuje konfigurace na více místech synchronizované.

Aktuálně podporované typy šablon zahrnují:

- **Šablona bloku**: Opakované použití konfigurace celého bloku.
- **Šablona pole**: Opakované použití konfigurace „oblasti polí“ ve formulářových nebo detailních blocích.
- **Šablona vyskakovacího okna**: Opakované použití konfigurací vyskakovacích oken (popup) spouštěných akcemi nebo poli.

## Základní pojmy

### Reference a Kopie

Při používání šablon existují obvykle dva způsoby:

- **Reference**: Více míst sdílí stejnou konfiguraci šablony; úprava šablony nebo kteréhokoli místa, kde je referencována, synchronizuje aktualizace na všechna ostatní místa.
- **Kopie**: Vytvoří se jako nezávislá konfigurace; následné úpravy se vzájemně neovlivňují.

### Uložit jako šablonu

Pokud je blok nebo vyskakovací okno již nakonfigurováno, můžete v jeho nabídce nastavení použít možnost `Uložit jako šablonu` a vybrat způsob uložení:

- **Převést aktuální... na šablonu**: Po uložení se aktuální pozice přepne na referenci této šablony.
- **Kopírovat aktuální... jako šablonu**: Pouze vytvoří šablonu, aktuální pozice zůstane beze změny.

## Šablona bloku

### Uložení bloku jako šablony

1) Otevřete nabídku nastavení cílového bloku a klikněte na `Uložit jako šablonu`.  
2) Vyplňte `Název šablony` / `Popis šablony` a vyberte režim uložení:
   - **Převést aktuální blok na šablonu**: Po uložení bude aktuální pozice nahrazena blokem `Šablona bloku` (tj. bude na tuto šablonu odkazovat).
   - **Kopírovat aktuální blok jako šablonu**: Pouze vytvoří šablonu, aktuální blok zůstane beze změny.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Použití šablony bloku

1) Přidat blok → „Ostatní bloky“ → `Šablona bloku`.  
2) V konfiguraci vyberte:
   - **Šablona**: Vyberte šablonu.
   - **Režim**: `Reference` nebo `Kopie`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Převod reference na kopii

Pokud blok odkazuje na šablonu, můžete v nabídce nastavení bloku použít možnost `Převést referenci na kopii`. Tím změníte aktuální blok na běžný blok (odpojíte referenci) a následné úpravy se nebudou vzájemně ovlivňovat.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Poznámky

- Režim `Kopie` znovu vygeneruje UID pro blok a jeho podřízené uzly. Některé konfigurace závislé na UID může být nutné znovu nakonfigurovat.

## Šablona pole

Šablony polí se používají k opakovanému použití konfigurací oblasti polí (výběr polí, rozvržení a nastavení polí) ve **formulářových blocích** a **detailních blocích**, čímž se zabrání opakovanému přidávání polí na více stránkách nebo v blocích.

> Šablony polí ovlivňují pouze „oblast polí“ a nenahrazují celý blok. Chcete-li znovu použít celý blok, použijte výše popsanou Šablonu bloku.

### Použití šablony pole ve formulářových/detailních blocích

1) Vstupte do režimu konfigurace a ve formulářovém nebo detailním bloku otevřete nabídku „Pole“.  
2) Vyberte `Šablona pole`.  
3) Vyberte šablonu a zvolte režim: `Reference` nebo `Kopie`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Výzva k přepsání

Pokud v bloku již pole existují, použití režimu **Reference** obvykle vyvolá potvrzení (protože referencovaná pole nahradí aktuální oblast polí).

### Převod referenčních polí na kopii

Pokud blok odkazuje na šablonu pole, můžete v nabídce nastavení bloku použít možnost `Převést referenční pole na kopii`. Tím se z aktuální oblasti polí stane nezávislá konfigurace (odpojí se reference) a následné úpravy se nebudou vzájemně ovlivňovat.

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Poznámky

- Šablony polí lze použít pouze ve **formulářových blocích** a **detailních blocích**.
- Pokud jsou šablona a aktuální blok vázány na různé datové tabulky, šablona se v selektoru zobrazí jako nedostupná s uvedením důvodu.
- Pokud chcete v aktuálním bloku provést „personifikované úpravy“ polí, doporučujeme použít přímo režim `Kopie` nebo nejprve provést „Převést referenční pole na kopii“.

## Šablona vyskakovacího okna

Šablony vyskakovacích oken slouží k opakovanému použití sady rozhraní a interakční logiky vyskakovacích oken. Obecné konfigurace, jako je způsob otevření a velikost okna, naleznete v části [Upravit vyskakovací okno](/interface-builder/actions/action-settings/edit-popup).

### Uložení vyskakovacího okna jako šablony

1) Otevřete nabídku nastavení tlačítka nebo pole, které může spustit vyskakovací okno, a klikněte na `Uložit jako šablonu`.  
2) Vyplňte název a popis šablony a vyberte režim uložení:
   - **Převést aktuální vyskakovací okno na šablonu**: Po uložení se aktuální okno přepne na referenci této šablony.
   - **Kopírovat aktuální vyskakovací okno jako šablonu**: Pouze vytvoří šablonu, aktuální okno zůstane beze změny.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Použití šablony v konfiguraci vyskakovacího okna

1) Otevřete konfiguraci vyskakovacího okna tlačítka nebo pole.  
2) V části `Šablona vyskakovacího okna` vyberte šablonu, kterou chcete použít.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Podmínky použití (Rozsah dostupnosti šablony)

Šablony vyskakovacích oken souvisejí se scénářem akce, která okno spouští. Selektor automaticky filtruje nebo zakazuje nekompatibilní šablony na základě aktuálního scénáře (při nesplnění podmínek se zobrazí důvod).

| Aktuální typ akce | Dostupné šablony vyskakovacích oken |
| --- | --- |
| **Akce kolekce** | Šablony vytvořené akcemi stejné kolekce |
| **Akce záznamu bez vazby** | Šablony vytvořené akcemi kolekce nebo akcemi záznamu bez vazby stejné kolekce |
| **Akce záznamu s vazbou** | Šablony vytvořené akcemi kolekce nebo akcemi záznamu bez vazby stejné kolekce; nebo šablony vytvořené akcemi záznamu s vazbou stejného vazebního pole |

### Vyskakovací okna s vazebními daty

Vyskakovací okna spouštěná vazebními daty (vazební pole) mají speciální pravidla párování:

#### Přísné párování pro šablony vazebních oken

Pokud je šablona vyskakovacího okna vytvořena z **akce záznamu s vazbou** (šablona má `associationName`), může být tato šablona použita pouze akcemi nebo poli se **zcela stejným vazebním polem**.

Například: Šablona vytvořená na vazebním poli `Objednávka.Zákazník` může být použita pouze jinými akcemi pole `Objednávka.Zákazník`. Nemůže být použita polem `Objednávka.Doporučitel` (i když obě cílí na stejnou tabulku `Zákazníci`).

Je to proto, že vnitřní proměnné a konfigurace šablon vazebních oken závisí na konkrétním kontextu vztahu (asociace).

#### Akce s vazbou využívající šablony cílové kolekce

Vazební pole/akce mohou znovu použít **šablony oken bez vazby z cílové datové tabulky** (šablony vytvořené akcemi kolekce nebo akcemi záznamu bez vazby), pokud se datová tabulka shoduje.

Například: Vazební pole `Objednávka.Zákazník` může používat šablony vyskakovacích oken z datové tabulky `Zákazníci`. Tento přístup je vhodný pro sdílení stejné konfigurace vyskakovacího okna napříč více vazebními poli (např. jednotný detail zákazníka).

### Převod reference na kopii

Pokud vyskakovací okno odkazuje na šablonu, můžete v nabídce nastavení použít možnost `Převést referenci na kopii`. Tím změníte aktuální okno na nezávislou konfiguraci (odpojíte referenci) a následné úpravy se nebudou vzájemně ovlivňovat.

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Správa šablon

V Nastavení systému → `UI šablony` můžete prohlížet a spravovat všechny šablony:

- **Šablony bloků (v2)**: Správa šablon bloků.
- **Šablony vyskakovacích oken (v2)**: Správa šablon vyskakovacích oken.

> Šablony polí vycházejí ze šablon bloků a jsou spravovány v rámci nich.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Podporované operace: Zobrazit, Filtrovat, Upravit, Odstranit.

> **Poznámka**: Pokud je šablona aktuálně referencována, nelze ji přímo odstranit. Nejprve použijte možnost `Převést referenci na kopii` na všech místech, která na šablonu odkazují, a poté šablonu odstraňte.