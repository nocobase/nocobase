:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Proměnné

## Úvod

Proměnné jsou sady značek, které slouží k identifikaci hodnoty v aktuálním kontextu. Můžete je využít v různých situacích, například při konfiguraci rozsahů dat bloků, výchozích hodnot polí, pravidel propojení a pracovních postupů.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Aktuálně podporované proměnné

### Aktuální uživatel

Představuje data aktuálně přihlášeného uživatele.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Aktuální role

Představuje identifikátor role (název role) aktuálně přihlášeného uživatele.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Aktuální formulář

Hodnoty aktuálního formuláře, které se používají pouze v blocích formulářů. Mezi případy použití patří:

- Pravidla propojení pro aktuální formulář
- Výchozí hodnoty pro pole formuláře (účinné pouze při přidávání nových dat)
- Nastavení rozsahu dat pro relační pole
- Konfigurace přiřazení hodnot polí pro akce odeslání

#### Pravidla propojení pro aktuální formulář

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Výchozí hodnoty pro pole formuláře (pouze pro formuláře pro přidání)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### Nastavení rozsahu dat pro relační pole

Slouží k dynamickému filtrování možností následného pole na základě předchozího pole, čímž se zajišťuje přesné zadávání dat.

**Příklad:**

1. Uživatel vybere hodnotu pro pole **Owner**.
2. Systém automaticky filtruje možnosti pro pole **Account** na základě **userName** vybraného Ownera.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Aktuální záznam

Záznam odkazuje na řádek v kolekci, kde každý řádek představuje jeden záznam. Proměnná „Aktuální záznam“ je dostupná v **pravidlech propojení pro akce řádků** v blocích zobrazovacího typu.

Příklad: Zakázat tlačítko pro smazání u dokumentů, které jsou „Zaplacené“.

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Aktuální záznam vyskakovacího okna

Akce vyskakovacích oken hrají velmi důležitou roli v konfiguraci rozhraní NocoBase.

- Vyskakovací okno pro akce řádků: Každé vyskakovací okno má proměnnou „Aktuální záznam vyskakovacího okna“, která představuje aktuální záznam řádku.
- Vyskakovací okno pro relační pole: Každé vyskakovací okno má proměnnou „Aktuální záznam vyskakovacího okna“, která představuje aktuálně kliknutý relační záznam.

Bloky uvnitř vyskakovacího okna mohou používat proměnnou „Aktuální záznam vyskakovacího okna“. Mezi související případy použití patří:

- Konfigurace rozsahu dat bloku
- Konfigurace rozsahu dat relačního pole
- Konfigurace výchozích hodnot pro pole (ve formuláři pro přidání nových dat)
- Konfigurace pravidel propojení pro akce

### Parametry dotazu URL

Tato proměnná představuje parametry dotazu v URL adrese aktuální stránky. Je dostupná pouze v případě, že URL adresa stránky obsahuje řetězec dotazu. Její použití je pohodlnější ve spojení s [akcí Odkaz](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API token

Hodnota této proměnné je řetězec, který slouží jako pověření pro přístup k NocoBase API. Může být použit k ověření identity uživatele.

### Typ aktuálního zařízení

Příklad: Na zařízeních, která nejsou stolními počítači, nezobrazovat akci „Tisk šablony“.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)