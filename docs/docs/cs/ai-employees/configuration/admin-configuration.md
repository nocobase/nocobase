:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# AI zaměstnanec · Průvodce konfigurací pro administrátory



# AI zaměstnanec · Průvodce konfigurací pro administrátory

> Tento dokument Vám pomůže rychle pochopit, jak konfigurovat a spravovat AI zaměstnance. Provedeme Vás krok za krokem celým procesem, od modelových služeb až po přidělování úkolů.

## I. Než začnete

### 1. Systémové požadavky

Před konfigurací se prosím ujistěte, že Vaše prostředí splňuje následující podmínky:

* Je nainstalován **NocoBase 2.0 nebo novější**
* Je povolen **plugin AI zaměstnanec**
* Je k dispozici alespoň jedna **služba velkého jazykového modelu** (např. OpenAI, Claude, DeepSeek, GLM atd.)

### 2. Pochopení dvouvrstvého designu AI zaměstnanců

AI zaměstnanci jsou rozděleni do dvou vrstev: **„Definice role“** a **„Přizpůsobení úkolů“**.

| Vrstva       | Popis                          | Charakteristika           | Funkce                  |
| ------------ | ------------------------------ | ------------------------- | ----------------------- |
| **Definice role** | Základní osobnost a klíčové schopnosti zaměstnance | Stabilní a neměnná, jako „životopis“ | Zajišťuje konzistenci role |
| **Přizpůsobení úkolů** | Konfigurace pro různé obchodní scénáře | Flexibilní a nastavitelná | Přizpůsobuje se konkrétním úkolům |

**Jednoduše řečeno:**

> „Definice role“ určuje, kdo tento zaměstnanec je,
> „Přizpůsobení úkolů“ určuje, co má právě dělat.

Výhody tohoto designu jsou:

* Role zůstává konstantní, ale může zvládat různé scénáře
* Upgrade nebo nahrazení úkolů neovlivní samotného zaměstnance
* Pozadí a úkoly jsou nezávislé, což usnadňuje údržbu

## II. Proces konfigurace (v 5 krocích)

### Krok 1: Konfigurace modelové služby

Modelová služba je jako mozek AI zaměstnance a musí být nejprve nastavena.

> 💡 Podrobné pokyny k nastavení naleznete v: [Konfigurace služby LLM](/ai-employees/quick-start/llm-service)

**Cesta:**
`Systémová nastavení → AI zaměstnanec → Modelová služba`

![Vstup na konfigurační stránku](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klikněte na **Přidat** a vyplňte následující informace:

| Položka        | Popis                                | Poznámky                     |
| -------------- | ------------------------------------ | ---------------------------- |
| Typ rozhraní   | Např. OpenAI, Claude atd.            | Kompatibilní se službami se stejnou specifikací |
| API klíč       | Klíč poskytnutý poskytovatelem služby | Uchovávejte v tajnosti a pravidelně měňte |
| Adresa služby  | API Endpoint                         | Je třeba upravit při použití proxy |
| Název modelu   | Konkrétní název modelu (např. gpt-4, claude-opus) | Ovlivňuje schopnosti a náklady |

![Vytvoření služby velkého modelu](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Po konfiguraci prosím **otestujte připojení**.
Pokud se nezdaří, zkontrolujte síť, API klíč nebo název modelu.

![Test připojení](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Krok 2: Vytvoření AI zaměstnance

> 💡 Podrobné pokyny naleznete v: [Vytvoření AI zaměstnance](/ai-employees/quick-start/ai-employees)

Cesta: `Správa AI zaměstnanců → Vytvořit zaměstnance`

Vyplňte základní informace:

| Pole            | Povinné | Příklad              |
| --------------- | ------- | -------------------- |
| Název           | ✓       | viz, dex, cole       |
| Přezdívka       | ✓       | Viz, Dex, Cole       |
| Stav povolení   | ✓       | Zapnuto              |
| Popis           | -       | „Expert na analýzu dat“ |
| Hlavní prompt   | ✓       | Viz průvodce prompt engineeringem |
| Uvítací zpráva  | -       | „Dobrý den, jsem Viz…“ |

![Konfigurace základních informací](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Poté propojte právě nakonfigurovanou **modelovou službu**.

![Propojení služby velkého modelu](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Doporučení pro psaní promptů:**

* Jasně uveďte roli, tón a odpovědnosti zaměstnance
* Používejte slova jako „musí“ a „nikdy“ k zdůraznění pravidel
* Pokud možno, zahrňte příklady, abyste se vyhnuli abstraktním popisům
* Udržujte délku mezi 500–1000 znaky

> Čím jasnější je prompt, tím stabilnější je výkon AI.
> Můžete se podívat na [Průvodce prompt engineeringem](./prompt-engineering-guide.md).

### Krok 3: Konfigurace dovedností

Dovednosti určují, co zaměstnanec „umí dělat“.

> 💡 Podrobné pokyny naleznete v: [Dovednosti](/ai-employees/advanced/skill)

| Typ        | Rozsah schopností        | Příklad                  | Úroveň rizika     |
| ---------- | ------------------------ | ------------------------ | ----------------- |
| Frontend   | Interakce se stránkou    | Čtení dat bloku, vyplňování formulářů | Nízká             |
| Datový model | Dotazování a analýza dat | Agregované statistiky    | Střední           |
| Pracovní postup | Provádění obchodních procesů | Vlastní nástroje         | Závisí na pracovním postupu |
| Jiné       | Externí rozšíření        | Vyhledávání na webu, operace se soubory | Liší se případ od případu |

**Doporučení pro konfiguraci:**

* 3–5 dovedností na zaměstnance je nejvhodnější
* Nedoporučuje se vybírat všechny, může to vést ke zmatkům
* Před důležitými operacemi vypněte automatické použití (Auto usage)

![Konfigurace dovedností](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Krok 4: Konfigurace znalostní báze (volitelné)

Pokud Váš AI zaměstnanec potřebuje pamatovat si nebo odkazovat na velké množství materiálů, jako jsou produktové manuály, FAQ atd., můžete nakonfigurovat znalostní bázi.

> 💡 Podrobné pokyny naleznete v:
> - [Přehled znalostní báze AI](/ai-employees/knowledge-base/index)
> - [Vektorová databáze](/ai-employees/knowledge-base/vector-database)
> - [Konfigurace znalostní báze](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

To vyžaduje dodatečnou instalaci pluginu vektorové databáze.

![Konfigurace znalostní báze](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Použitelné scénáře:**

* Aby AI rozuměla podnikovým znalostem
* Podpora otázek a odpovědí a vyhledávání v dokumentech
* Trénování asistentů specifických pro danou oblast

### Krok 5: Ověření konfigurace

Po dokončení uvidíte avatar nového zaměstnance v pravém dolním rohu stránky.

![Ověření konfigurace](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Zkontrolujte prosím každou položku:

* ✅ Zda se ikona zobrazuje správně
* ✅ Zda je možné vést základní konverzaci
* ✅ Zda lze dovednosti správně vyvolat

Pokud vše projde, konfigurace je úspěšná 🎉

## III. Konfigurace úkolů: Aby AI začala pracovat

Dosud jsme dokončili „vytvoření zaměstnance“,
nyní je čas, aby „začali pracovat“.

AI úkoly definují chování zaměstnance na konkrétní stránce nebo v bloku.

> 💡 Podrobné pokyny naleznete v: [Úkoly](/ai-employees/advanced/task)

### 1. Úkoly na úrovni stránky

Použitelné pro celou stránku, například „Analyzovat data na této stránce“.

**Vstup pro konfiguraci:**
`Nastavení stránky → AI zaměstnanec → Přidat úkol`

| Pole         | Popis                      | Příklad                  |
| ------------ | -------------------------- | ------------------------ |
| Název        | Název úkolu                | Analýza konverze fází    |
| Kontext      | Kontext aktuální stránky   | Stránka seznamu leadů    |
| Výchozí zpráva | Přednastavená konverzace   | „Prosím, analyzujte trendy tohoto měsíce“ |
| Výchozí blok   | Automaticky propojit s kolekcí | tabulka leadů            |
| Dovednosti   | Dostupné nástroje          | Dotazování dat, generování grafů |

![Konfigurace úkolu na úrovni stránky](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Podpora více úkolů:**
Jednomu AI zaměstnanci lze nakonfigurovat více úkolů, které jsou uživateli prezentovány jako možnosti k výběru:

![Podpora více úkolů](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Doporučení:

* Jeden úkol by se měl zaměřit na jeden cíl
* Název by měl být jasný a snadno srozumitelný
* Počet úkolů udržujte v rozmezí 5–7

### 2. Úkoly na úrovni bloku

Vhodné pro operace s konkrétním blokem, například „Přeložit aktuální formulář“.

**Způsob konfigurace:**

1. Otevřete konfiguraci akcí bloku
2. Přidejte „AI zaměstnance“

![Tlačítko Přidat AI zaměstnance](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Propojte cílového zaměstnance

![Vybrat AI zaměstnance](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Konfigurace úkolu na úrovni bloku](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Položka srovnání | Na úrovni stránky | Na úrovni bloku     |
| ---------------- | ---------------- | ------------------ |
| Rozsah dat       | Celá stránka     | Aktuální blok      |
| Granularita      | Globální analýza | Detailní zpracování |
| Typické použití  | Analýza trendů  | Překlad formulářů, extrakce polí |

## IV. Osvědčené postupy

### 1. Doporučení pro konfiguraci

| Položka         | Doporučení             | Důvod                       |
| --------------- | ---------------------- | --------------------------- |
| Počet dovedností | 3–5                    | Vysoká přesnost, rychlá odezva |
| Auto usage      | Povolit s opatrností   | Zabraňuje náhodným operacím |
| Délka promptu   | 500–1000 znaků         | Vyvažuje rychlost a kvalitu |
| Cíl úkolu       | Jednoduchý a jasný     | Zabraňuje zmatení AI        |
| Pracovní postup | Použít po zapouzdření složitých úkolů | Vyšší míra úspěšnosti       |

### 2. Praktická doporučení

**Začněte v malém, optimalizujte postupně:**

1. Nejprve vytvořte základní zaměstnance (např. Viz, Dex)
2. Povolte 1–2 klíčové dovednosti pro testování
3. Ověřte, že úkoly lze normálně provádět
4. Poté postupně rozšiřujte o další dovednosti a úkoly

**Proces neustálé optimalizace:**

1. Zprovozněte počáteční verzi
2. Sbírejte zpětnou vazbu od uživatelů
3. Optimalizujte prompty a konfigurace úkolů
4. Testujte a opakovaně vylepšujte

## V. Často kladené otázky

### 1. Fáze konfigurace

**Q: Co když se uložení nezdaří?**
A: Zkontrolujte, zda jste vyplnili všechna povinná pole, zejména modelovou službu a prompt.

**Q: Který model bych měl/a zvolit?**

* Pro kód → Claude, GPT-4
* Pro analýzu → Claude, DeepSeek
* Citlivé na náklady → Qwen, GLM
* Dlouhé texty → Gemini, Claude

### 2. Fáze použití

**Q: AI odpovídá příliš pomalu?**

* Snižte počet dovedností
* Optimalizujte prompt
* Zkontrolujte latenci modelové služby
* Zvažte změnu modelu

**Q: Provádění úkolů je nepřesné?**

* Prompt není dostatečně jasný
* Příliš mnoho dovedností vede ke zmatkům
* Rozdělte úkol na menší části, přidejte příklady

**Q: Kdy by mělo být povoleno automatické použití (Auto usage)?**

* Lze povolit pro úkoly typu dotazování
* Pro úkoly typu úpravy dat se doporučuje vypnout

**Q: Jak zajistit, aby AI zpracovala konkrétní formulář?**

A: Pokud se jedná o konfiguraci na úrovni stránky, je třeba blok vybrat ručně.

![Ruční výběr bloku](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Pokud se jedná o konfiguraci úkolu na úrovni bloku, datový kontext se automaticky propojí.

## VI. Další čtení

Chcete-li, aby byli Vaši AI zaměstnanci výkonnější, můžete pokračovat ve čtení následujících dokumentů:

**Související s konfigurací:**

* [Průvodce prompt engineeringem](./prompt-engineering-guide.md) – Techniky a osvědčené postupy pro psaní vysoce kvalitních promptů
* [Konfigurace služby LLM](/ai-employees/quick-start/llm-service) – Podrobné pokyny k nastavení služeb velkých modelů
* [Vytvoření AI zaměstnance](/ai-employees/quick-start/ai-employees) – Vytvoření a základní konfigurace AI zaměstnanců
* [Spolupráce s AI zaměstnancem](/ai-employees/quick-start/collaborate) – Jak efektivně komunikovat s AI zaměstnanci

**Pokročilé funkce:**

* [Dovednosti](/ai-employees/advanced/skill) – Hlubší pochopení konfigurace a použití různých dovedností
* [Úkoly](/ai-employees/advanced/task) – Pokročilé techniky konfigurace úkolů
* [Výběr bloku](/ai-employees/advanced/pick-block) – Jak určit datové bloky pro AI zaměstnance
* [Zdroj dat](/ai-employees/advanced/datasource) – Konfigurace a správa zdrojů dat
* [Vyhledávání na webu](/ai-employees/advanced/web-search) – Konfigurace schopnosti AI zaměstnanců vyhledávat na webu

**Znalostní báze a RAG:**

* [Přehled znalostní báze AI](/ai-employees/knowledge-base/index) – Úvod do funkce znalostní báze
* [Vektorová databáze](/ai-employees/knowledge-base/vector-database) – Konfigurace vektorové databáze
* [Znalostní báze](/ai-employees/knowledge-base/knowledge-base) – Jak vytvářet a spravovat znalostní báze
* [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) – Aplikace technologie RAG

**Integrace pracovních postupů:**

* [Uzel LLM – Textová konverzace](/ai-employees/workflow/nodes/llm/chat) – Použití textové konverzace v pracovních postupech
* [Uzel LLM – Multimodální konverzace](/ai-employees/workflow/nodes/llm/multimodal-chat) – Zpracování multimodálních vstupů, jako jsou obrázky a soubory
* [Uzel LLM – Strukturovaný výstup](/ai-employees/workflow/nodes/llm/structured-output) – Získání strukturovaných odpovědí AI

## Závěr

Nejdůležitější při konfiguraci AI zaměstnanců je: **nejprve zprovoznit, poté optimalizovat**.
Nejprve zajistěte, aby se první zaměstnanec úspěšně zapojil do práce, a poté postupně rozšiřujte a dolaďujte.

Směr řešení problémů může být následující:

1. Je modelová služba připojena?
2. Není počet dovedností příliš vysoký?
3. Je prompt jasný?
4. Je cíl úkolu dobře definován?

Pokud budete postupovat krok za krokem, můžete vybudovat skutečně efektivní AI tým.