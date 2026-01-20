:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Blok tabulky

## Úvod

Blok tabulky je jedním z klíčových vestavěných datových bloků v **NocoBase**, primárně slouží k zobrazení a správě strukturovaných dat ve formě tabulky. Nabízí flexibilní možnosti konfigurace, které uživatelům umožňují přizpůsobit sloupce tabulky, šířku sloupců, pravidla řazení a rozsah dat tak, aby zobrazená data odpovídala konkrétním obchodním potřebám.

#### Klíčové funkce:
- **Flexibilní konfigurace sloupců**: Můžete si přizpůsobit sloupce tabulky a jejich šířku tak, aby vyhovovaly různým požadavkům na zobrazení dat.
- **Pravidla řazení**: Podporuje řazení dat v tabulce. Uživatelé mohou data uspořádat vzestupně nebo sestupně podle různých polí.
- **Nastavení rozsahu dat**: Nastavením rozsahu dat můžete kontrolovat rozsah zobrazených dat a vyhnout se tak rušení irelevantními daty.
- **Konfigurace akcí**: Blok tabulky obsahuje různé vestavěné možnosti akcí. Uživatelé mohou snadno konfigurovat akce jako Filtrovat, Přidat nové, Upravit a Smazat pro rychlou správu dat.
- **Rychlá úprava**: Podporuje přímou úpravu dat přímo v tabulce, což zjednodušuje operační proces a zvyšuje efektivitu práce.

## Nastavení bloku

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Pravidla propojení bloku

Chování bloku (např. zda se má zobrazit nebo spustit JavaScript) můžete řídit pomocí pravidel propojení.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Více informací naleznete v [Pravidlech propojení](/interface-builder/linkage-rule)

### Nastavení rozsahu dat

Příklad: Ve výchozím nastavení filtrujte objednávky, jejichž „Stav“ je „Zaplaceno“.

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Více informací naleznete v [Nastavení rozsahu dat](/interface-builder/blocks/block-settings/data-scope)

### Nastavení pravidel řazení

Příklad: Zobrazte objednávky sestupně podle data.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Více informací naleznete v [Nastavení pravidel řazení](/interface-builder/blocks/block-settings/sorting-rule)

### Povolit rychlou úpravu

Aktivujte „Povolit rychlou úpravu“ v nastavení bloku a nastavení sloupců tabulky, abyste si mohli přizpůsobit, které sloupce lze rychle upravovat.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Povolit stromovou tabulku

Pokud je datová tabulka hierarchická (stromová) tabulka, blok tabulky může povolit funkci **„Povolit stromovou tabulku“**. Ve výchozím nastavení je tato možnost vypnutá. Po povolení blok zobrazí data ve stromové struktuře a bude podporovat odpovídající možnosti konfigurace a operace.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

![20251125210719](https://static-docs.nocobase.com/20251125210719.gif)

### Ve výchozím nastavení rozbalit všechny řádky

Pokud je stromová tabulka povolena, blok podporuje rozbalení všech podřízených řádků ve výchozím nastavení při jeho načtení.

## Konfigurace polí

### Pole této kolekce

> **Poznámka**: Pole z děděných kolekcí (tj. pole rodičovské kolekce) se automaticky sloučí a zobrazí v aktuálním seznamu polí.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Pole souvisejících kolekcí

> **Poznámka**: Podporuje zobrazení polí ze souvisejících kolekcí (v současné době podporuje pouze vztahy jedna k jedné).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Další vlastní sloupce

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## Konfigurace akcí

### Globální akce

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filtrovat](/interface-builder/actions/types/filter)
- [Přidat nové](/interface-builder/actions/types/add-new)
- [Smazat](/interface-builder/actions/types/delete)
- [Obnovit](/interface-builder/actions/types/refresh)
- [Importovat](/interface-builder/actions/types/import)
- [Exportovat](/interface-builder/actions/types/export)
- [Tisk šablony](/template-print/index)
- [Hromadná aktualizace](/interface-builder/actions/types/bulk-update)
- [Exportovat přílohy](/interface-builder/actions/types/export-attachments)
- [Spustit pracovní postup](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI zaměstnanec](/interface-builder/actions/types/ai-employee)

### Akce řádku

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Zobrazit](/interface-builder/actions/types/view)
- [Upravit](/interface-builder/actions/types/edit)
- [Smazat](/interface-builder/actions/types/delete)
- [Vyskakovací okno](/interface-builder/actions/types/pop-up)
- [Odkaz](/interface-builder/actions/types/link)
- [Aktualizovat záznam](/interface-builder/actions/types/update-record)
- [Tisk šablony](/template-print/index)
- [Spustit pracovní postup](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI zaměstnanec](/interface-builder/actions/types/ai-employee)