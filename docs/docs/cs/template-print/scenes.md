
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Použití funkce „Tisk z šablony“ pro generování smluv o dodávkách a nákupu

V rámci dodavatelského řetězce nebo obchodních scénářů je často nutné rychle generovat standardizovanou „Smlouvu o dodávkách a nákupu“ a dynamicky vyplňovat její obsah na základě informací ze zdrojů dat, jako jsou kupující, prodávající a detaily produktů. Níže Vám na příkladu zjednodušeného případu použití „Smlouvy“ ukážeme, jak nakonfigurovat a používat funkci „Tisk z šablony“ pro mapování datových informací na zástupné symboly v šablonách smluv, a tím automaticky generovat finální smluvní dokument.

---

## 1. Pozadí a přehled datové struktury

V našem příkladu existují zhruba následující hlavní kolekce (ostatní irelevantní pole jsou vynechána):

- **parties**: ukládá informace o jednotkách nebo jednotlivcích strany A/strany B, včetně jména, adresy, kontaktní osoby, telefonu atd.
- **contracts**: ukládá konkrétní záznamy smluv, včetně čísla smlouvy, cizích klíčů kupujícího/prodávajícího, informací o signatářích, počátečních/koncových dat, bankovního účtu atd.
- **contract_line_items**: ukládá více položek v rámci smlouvy (název produktu, specifikace, množství, jednotková cena, datum dodání atd.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Jelikož současný systém podporuje pouze tisk jednotlivých záznamů, klikneme na „Tisk“ na stránce „Detaily smlouvy“ a systém automaticky načte odpovídající záznamy smluv a související informace o stranách atd., a vyplní je do dokumentů Word nebo PDF.

## 2. Příprava

### 2.1 Příprava pluginu

Upozorňujeme, že náš plugin „Tisk z šablony“ je komerční plugin, který je třeba zakoupit a aktivovat, než budete moci provádět tiskové operace.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Potvrzení aktivace pluginu:**

Na libovolné stránce vytvořte blok detailů (například pro uživatele) a zkontrolujte, zda v konfiguraci akcí existuje odpovídající možnost konfigurace šablony:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Vytvoření kolekcí

Vytvořte hlavní kolekci entit, kolekci smluv a kolekci položek produktů navržené výše (vyberte pouze klíčová pole).

#### Kolekce smluv

| Kategorie pole | Zobrazovaný název pole | Field Name | Rozhraní pole |
|---------|-------------------|------------|-----------------|
| **Pole primárních a cizích klíčů** | | | |
| | ID | id | Celé číslo |
| | Buyer ID | buyer_id | Celé číslo |
| | Seller ID | seller_id | Celé číslo |
| **Asociační pole** | | | |
| | Položky smlouvy | contract_items | Jeden k mnoha |
| | Kupující (strana A) | buyer | Mnoho k jednomu |
| | Prodávající (strana B) | seller | Mnoho k jednomu |
| **Obecná pole** | | | |
| | Číslo smlouvy | contract_no | Jednořádkový text |
| | Datum zahájení dodávky | start_date | Datum a čas (s časovou zónou) |
| | Datum ukončení dodávky | end_date | Datum a čas (s časovou zónou) |
| | Poměr zálohy (%) | deposit_ratio | Procenta |
| | Dny platby po dodání | payment_days_after | Celé číslo |
| | Název bankovního účtu (příjemce) | bank_account_name | Jednořádkový text |
| | Název banky | bank_name | Jednořádkový text |
| | Číslo bankovního účtu (příjemce) | bank_account_number | Jednořádkový text |
| | Celková částka | total_amount | Číslo |
| | Kódy měn | currency_codes | Jednoduchý výběr |
| | Poměr zůstatku (%) | balance_ratio | Procenta |
| | Dny zůstatku po dodání | balance_days_after | Celé číslo |
| | Místo dodání | delivery_place | Dlouhý text |
| | Jméno signatáře strany A | party_a_signatory_name | Jednořádkový text |
| | Titul signatáře strany A | party_a_signatory_title | Jednořádkový text |
| | Jméno signatáře strany B | party_b_signatory_name | Jednořádkový text |
| | Titul signatáře strany B | party_b_signatory_title | Jednořádkový text |
| **Systémová pole** | | | |
| | Vytvořeno v | createdAt | Vytvořeno v |
| | Vytvořeno uživatelem | createdBy | Vytvořeno uživatelem |
| | Poslední aktualizace v | updatedAt | Poslední aktualizace v |
| | Poslední aktualizace uživatelem | updatedBy | Poslední aktualizace uživatelem |

#### Kolekce stran

| Kategorie pole | Zobrazovaný název pole | Field Name | Rozhraní pole |
|---------|-------------------|------------|-----------------|
| **Pole primárních a cizích klíčů** | | | |
| | ID | id | Celé číslo |
| **Obecná pole** | | | |
| | Název strany | party_name | Jednořádkový text |
| | Adresa | address | Jednořádkový text |
| | Kontaktní osoba | contact_person | Jednořádkový text |
| | Kontaktní telefon | contact_phone | Telefon |
| | Pozice | position | Jednořádkový text |
| | E-mail | email | E-mail |
| | Webové stránky | website | URL |
| **Systémová pole** | | | |
| | Vytvořeno v | createdAt | Vytvořeno v |
| | Vytvořeno uživatelem | createdBy | Vytvořeno uživatelem |
| | Poslední aktualizace v | updatedAt | Poslední aktualizace v |
| | Poslední aktualizace uživatelem | updatedBy | Poslední aktualizace uživatelem |

#### Kolekce položek smlouvy

| Kategorie pole | Zobrazovaný název pole | Field Name | Rozhraní pole |
|---------|-------------------|------------|-----------------|
| **Pole primárních a cizích klíčů** | | | |
| | ID | id | Celé číslo |
| | Contract ID | contract_id | Celé číslo |
| **Asociační pole** | | | |
| | Smlouva | contract | Mnoho k jednomu |
| **Obecná pole** | | | |
| | Název produktu | product_name | Jednořádkový text |
| | Specifikace / Model | spec | Jednořádkový text |
| | Množství | quantity | Celé číslo |
| | Jednotková cena | unit_price | Číslo |
| | Celková částka | total_amount | Číslo |
| | Datum dodání | delivery_date | Datum a čas (s časovou zónou) |
| | Poznámka | remark | Dlouhý text |
| **Systémová pole** | | | |
| | Vytvořeno v | createdAt | Vytvořeno v |
| | Vytvořeno uživatelem | createdBy | Vytvořeno uživatelem |
| | Poslední aktualizace v | updatedAt | Poslední aktualizace v |
| | Poslední aktualizace uživatelem | updatedBy | Poslední aktualizace uživatelem |

### 2.3 Konfigurace rozhraní

**Zadejte ukázková data:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Pravidla propojení nakonfigurujte takto, aby se automaticky vypočítala celková cena a zbývající platby:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Vytvořte blok zobrazení, po potvrzení dat povolte akci „Tisk z šablony“:**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Konfigurace pluginu pro tisk z šablony

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Přidejte konfiguraci šablony, například „Smlouva o dodávkách a nákupu“:

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Dále přejděte na záložku Seznam polí, kde uvidíte všechna pole aktuálního objektu. Po kliknutí na „Kopírovat“ můžete začít vyplňovat šablonu.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Příprava souboru smlouvy

**Soubor šablony smlouvy Word**

Předem si připravte šablonu smlouvy (soubor .docx), například: `SUPPLY AND PURCHASE CONTRACT.docx`

V tomto příkladu uvádíme zjednodušenou verzi „Smlouvy o dodávkách a nákupu“, která obsahuje ukázkové zástupné symboly:

- `{d.contract_no}`: Číslo smlouvy
- `{d.buyer.party_name}`、`{d.seller.party_name}`: Jména kupujícího a prodávajícího
- `{d.total_amount}`: Celková částka smlouvy
- A další zástupné symboly, jako jsou „kontaktní osoba“, „adresa“, „telefon“ atd.

Dále můžete zkopírovat pole z vaší kolekce a vložit je do dokumentu Word.

---

## 3. Návod k proměnným šablony

### 3.1 Vyplňování základních proměnných a vlastností asociovaných objektů

**Vyplňování základních polí:**

Například číslo smlouvy v horní části nebo objekt smluvní strany. Klikněte na kopírovat a vložte jej přímo do odpovídajícího prázdného místa ve smlouvě.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Formátování dat

#### Formátování data

V šablonách často potřebujeme formátovat pole, zejména pole data. Přímo zkopírovaný formát data je obvykle dlouhý (například St 01. ledna 2025 00:00:00 GMT) a je třeba jej formátovat tak, aby zobrazoval požadovaný styl.

Pro pole data můžete použít funkci `formatD()` k určení výstupního formátu:

```
{název_pole:formatD(styl_formátování)}
```

**Příklad:**

Například, pokud je původní pole, které jsme zkopírovali, `{d.created_at}`, a potřebujeme formátovat datum do formátu `2025-01-01`, pak toto pole upravíme na:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Výstup: 2025-01-01
```

**Běžné styly formátování data:**

- `YYYY` - Rok (čtyři číslice)
- `MM` - Měsíc (dvě číslice)
- `DD` - Den (dvě číslice)
- `HH` - Hodina (24hodinový formát)
- `mm` - Minuty
- `ss` - Sekundy

**Příklad 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Výstup: 2025-01-01 14:30:00
```

#### Formátování čísel

Předpokládejme, že existuje pole pro částku, například `{d.total_amount}` ve smlouvě. Můžeme použít funkci `formatN()` k formátování čísel, specifikaci desetinných míst a oddělovače tisíců.

**Syntaxe:**

```
{název_pole:formatN(desetinná_místa, oddělovač_tisíců)}
```

- **desetinná místa**: Můžete určit, kolik desetinných míst se má zachovat. Například `2` znamená dvě desetinná místa.
- **oddělovač tisíců**: Určete, zda se má použít oddělovač tisíců, obvykle `true` nebo `false`.

**Příklad 1: Formátování částky s oddělovačem tisíců a dvěma desetinnými místy**

```
{d.amount:formatN(2, true)}  // Výstup: 1,234.56
```

Toto naformátuje `d.amount` na dvě desetinná místa a přidá oddělovač tisíců.

**Příklad 2: Formátování částky na celé číslo bez desetinných míst**

```
{d.amount:formatN(0, true)}  // Výstup: 1,235
```

Toto naformátuje `d.amount` na celé číslo a přidá oddělovač tisíců.

**Příklad 3: Formátování částky na dvě desetinná místa, ale bez oddělovače tisíců**

```
{d.amount:formatN(2, false)}  // Výstup: 1234.56
```

Zde je oddělovač tisíců zakázán a zachovávají se pouze dvě desetinná místa.

**Další potřeby formátování částek:**

- **Symbol měny**: Carbone sám přímo neposkytuje funkce formátování symbolů měn, ale symboly měn můžete přidat přímo do dat nebo šablon. Například:
  ```
  {d.amount:formatN(2, true)} CZK  // Výstup: 1,234.56 CZK
  ```

#### Formátování řetězců

Pro řetězcová pole můžete použít `:upperCase` k určení formátu textu, například převodu velikosti písmen.

**Syntaxe:**

```
{název_pole:upperCase:další_příkazy}
```

**Běžné metody převodu:**

- `upperCase` - Převést na velká písmena
- `lowerCase` - Převést na malá písmena
- `upperCase:ucFirst` - Velké písmeno na začátku

**Příklad:**

```
{d.party_a_signatory_name:upperCase}  // Výstup: JOHN DOE
```

### 3.3 Cyklický tisk

#### Jak tisknout seznamy podřízených objektů (například detaily produktů)

Když potřebujeme tisknout tabulku obsahující více podpoložek (například detaily produktů), obvykle je nutné použít cyklický tisk. Tímto způsobem systém vygeneruje řádek obsahu pro každou položku v seznamu, dokud nejsou zpracovány všechny položky.

Předpokládejme, že máme seznam produktů (například `contract_items`), který obsahuje více objektů produktů. Každý objekt produktu má více atributů, jako je název produktu, specifikace, množství, jednotková cena, celková částka a poznámky.

**Krok 1: Vyplňte pole v prvním řádku tabulky**

Nejprve v prvním řádku tabulky (nikoli v záhlaví) přímo zkopírujeme a vyplníme proměnné šablony. Tyto proměnné budou nahrazeny odpovídajícími daty a zobrazeny ve výstupu.

Například první řádek tabulky vypadá takto:

| Název produktu | Specifikace / Model | Množství | Jednotková cena | Celková částka | Poznámka |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Zde `d.contract_items[i]` představuje i-tou položku v seznamu produktů a `i` je index, který představuje pořadí aktuálního produktu.

**Krok 2: Upravte index ve druhém řádku**

Dále ve druhém řádku tabulky upravíme index pole na `i+1` a vyplníme pouze první atribut. To proto, že během cyklického tisku potřebujeme načíst další položku dat ze seznamu a zobrazit ji v dalším řádku.

Například druhý řádek se vyplní takto:
| Název produktu | Specifikace / Model | Množství | Jednotková cena | Celková částka | Poznámka |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |


V tomto příkladu jsme změnili `[i]` na `[i+1]`, takže můžeme získat další data produktu v seznamu.

**Krok 3: Automatický cyklický tisk během vykreslování šablony**

Když systém zpracovává tuto šablonu, bude fungovat podle následující logiky:

1. První řádek bude vyplněn podle polí, která jste nastavili v šabloně.
2. Poté systém automaticky odstraní druhý řádek a začne extrahovat data z `d.contract_items`, cyklicky vyplňovat každý řádek ve formátu tabulky, dokud nebudou vytištěny všechny detaily produktu.

Index `i` v každém řádku se bude zvyšovat, což zajistí, že každý řádek zobrazuje různé informace o produktu.

---

## 4. Nahrání a konfigurace šablony smlouvy

### 4.1 Nahrání šablony

1. Klikněte na tlačítko „Přidat šablonu“ a zadejte název šablony, například „Šablona smlouvy o dodávkách a nákupu“.
2. Nahrajte připravený [soubor smlouvy Word (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx), který již obsahuje všechny zástupné symboly.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Po dokončení systém zařadí šablonu do seznamu volitelných šablon pro budoucí použití.
4. Klikněte na „Použít“ pro aktivaci této šablony.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

V tomto okamžiku opusťte aktuální vyskakovací okno a klikněte na „Stáhnout šablonu“, abyste získali vygenerovanou kompletní šablonu.

**Tipy:**

- Pokud šablona používá formát `.doc` nebo jiné formáty, může být nutné ji převést na `.docx`, v závislosti na podpoře pluginu.
- V souborech Word dávejte pozor, abyste nerozdělili zástupné symboly do více odstavců nebo textových polí, aby nedošlo k chybám vykreslování.

---

Přejeme Vám úspěšné používání! Díky funkci „Tisk z šablony“ můžete výrazně ušetřit opakovanou práci při správě smluv, vyhnout se chybám při ručním kopírování a vkládání a dosáhnout standardizovaného a automatizovaného výstupu smluv.