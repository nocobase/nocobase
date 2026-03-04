:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/ai-employees/configuration/admin-configuration).
:::

# AI zaměstnanec · Průvodce konfigurací pro administrátory

> Tato dokumentace vám pomůže rychle pochopit, jak konfigurovat a spravovat AI zaměstnance, od modelových služeb až po nasazení do úkolů, a provede vás celým procesem krok za krokem.


## I. Než začnete

### 1. Systémové požadavky

Před konfigurací se prosím ujistěte, že vaše prostředí splňuje následující podmínky:

* Je nainstalován **NocoBase 2.0 nebo vyšší**
* Je povolen **plugin AI zaměstnanec**
* Je k dispozici alespoň jedna **služba velkého jazykového modelu** (např. OpenAI, Claude, DeepSeek, GLM atd.)


### 2. Pochopení dvouvrstvého designu AI zaměstnanců

AI zaměstnanci jsou rozděleni do dvou vrstev: **"Definice role"** a **"Přizpůsobení úkolů"**.

| Vrstva | Popis | Charakteristika | Funkce |
| -------- | ------------ | ---------- | ------- |
| **Definice role** | Základní osobnost a klíčové schopnosti zaměstnance | Stabilní a neměnná, jako "životopis" | Zajišťuje konzistenci role |
| **Přizpůsobení úkolů** | Konfigurace pro různé obchodní scénáře | Flexibilní a nastavitelná | Přizpůsobuje se konkrétním úkolům |

**Jednoduché pochopení:**

> "Definice role" určuje, kdo tento zaměstnanec je,
> "Přizpůsobení úkolů" určuje, co má v danou chvíli dělat.

Výhody tohoto designu jsou:

* Role zůstává stejná, ale může zastávat různé scénáře
* Upgrade nebo výměna úkolů neovlivní samotného zaměstnance
* Pozadí a úkoly jsou na sobě nezávislé, což usnadňuje údržbu


## II. Proces konfigurace (5 kroků)

### Krok 1: Konfigurace modelové služby

Modelová služba odpovídá mozku AI zaměstnance a musí být nastavena jako první.

> 💡 Podrobné pokyny ke konfiguraci naleznete v: [Konfigurace LLM služby](/ai-employees/features/llm-service)

**Cesta:**
`Systémová nastavení → AI zaměstnanec → LLM service`

![Vstup na konfigurační stránku](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Klikněte na **Přidat** a vyplňte následující informace:

| Položka | Popis | Poznámky |
| ------ | -------------------------- | --------- |
| Provider | Např. OpenAI, Claude, Gemini, Kimi atd. | Kompatibilní se službami stejné specifikace |
| API klíč | Klíč poskytnutý poskytovatelem služby | Uchovávejte v tajnosti a pravidelně měňte |
| Base URL | API Endpoint (volitelné) | Je třeba upravit při použití proxy |
| Povolené modely | Doporučené modely / Výběr modelů / Ruční zadání | Určuje rozsah modelů přepínatelných v konverzaci |

![Vytvoření služby velkého modelu](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Po konfiguraci použijte `Test flight` pro **testování připojení**.
Pokud selže, zkontrolujte síť, klíč nebo název modelu.

![Test připojení](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Krok 2: Vytvoření AI zaměstnance

> 💡 Podrobné pokyny naleznete v: [Vytvoření AI zaměstnance](/ai-employees/features/new-ai-employees)

Cesta: `Správa AI zaměstnanců → Vytvořit zaměstnance`

Vyplňte základní informace:

| Pole | Povinné | Příklad |
| ----- | -- | -------------- |
| Název | ✓ | viz, dex, cole |
| Přezdívka | ✓ | Viz, Dex, Cole |
| Stav povolení | ✓ | Zapnuto |
| Bio | - | "Expert na analýzu dat" |
| Hlavní prompt | ✓ | Viz průvodce prompt engineeringem |
| Uvítací zpráva | - | "Ahoj, já jsem Viz…" |

![Konfigurace základních informací](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Ve fázi vytváření zaměstnance se dokončuje hlavně konfigurace role a dovedností. Skutečný model lze vybrat v konverzaci prostřednictvím `Model Switcher`.

**Doporučení pro psaní promptů:**

* Jasně popište roli, tón a odpovědnosti zaměstnance
* Používejte slova jako "musí" nebo "nikdy" pro zdůraznění pravidel
* Snažte se zahrnout příklady, vyhněte se abstraktním popisům
* Udržujte délku v rozmezí 500–1000 znaků

> Čím jasnější je prompt, tím stabilnější je výkon AI.
> Můžete se podívat na [Průvodce prompt engineeringem](./prompt-engineering-guide.md).


### Krok 3: Konfigurace dovedností

Dovednosti určují, co zaměstnanec "může dělat".

> 💡 Podrobné pokyny naleznete v: [Dovednosti](/ai-employees/features/tool)

| Typ | Rozsah schopností | Příklad | Úroveň rizika |
| ---- | ------- | --------- | ------ |
| Frontend | Interakce se stránkou | Čtení dat bloku, vyplnění formuláře | Nízká |
| Datový model | Dotazování a analýza dat | Agregované statistiky | Střední |
| Pracovní postup | Provádění obchodních procesů | Vlastní nástroje | Závisí na pracovním postupu |
| Ostatní | Externí rozšíření | Vyhledávání na webu, operace se soubory | Podle situace |

**Doporučení pro konfiguraci:**

* Pro každého zaměstnance je nejvhodnější 3–5 dovedností
* Nedoporučuje se vybírat vše, může to vést ke zmatku
* U důležitých operací se doporučuje používat oprávnění `Ask` namísto `Allow`

![Konfigurace dovedností](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Krok 4: Konfigurace znalostní báze (volitelné)

Pokud váš AI zaměstnanec potřebuje pamatovat si nebo odkazovat na velké množství materiálů, jako jsou produktové manuály, FAQ atd., můžete nakonfigurovat znalostní bázi.

> 💡 Podrobné pokyny naleznete v:
> - [Přehled znalostní báze AI](/ai-employees/knowledge-base/index)
> - [Vektorová databáze](/ai-employees/knowledge-base/vector-database)
> - [Konfigurace znalostní báze](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag)

Toto vyžaduje dodatečnou instalaci pluginu vektorové databáze.

![Konfigurace znalostní báze](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Vhodné scénáře:**

* Umožnit AI porozumět podnikovým znalostem
* Podpora otázek a odpovědí nad dokumenty a vyhledávání
* Trénování asistentů specializovaných na určitou oblast


### Krok 5: Ověření efektu

Po dokončení uvidíte v pravém dolním rohu stránky avatar nového zaměstnance.

![Ověření konfigurace](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Zkontrolujte prosím jednotlivé body:

* ✅ Zda se ikona zobrazuje správně
* ✅ Zda lze vést základní konverzaci
* ✅ Zda lze dovednosti správně vyvolat

Pokud vše projde, konfigurace byla úspěšná 🎉


## III. Konfigurace úkolů: Skutečné nasazení AI do práce

Předchozí kroky dokončily "vytvoření zaměstnance",
nyní je musíme nechat "jít pracovat".

AI úkoly definují chování zaměstnance na konkrétní stránce nebo v bloku.

> 💡 Podrobné pokyny naleznete v: [Úkoly](/ai-employees/features/task)


### 1. Úkoly na úrovni stránky

Vhodné pro rozsah celé stránky, například "Analyzovat data na této stránce".

**Vstup pro konfiguraci:**
`Nastavení stránky → AI zaměstnanec → Přidat úkol`

| Pole | Popis | Příklad |
| ---- | -------- | --------- |
| Název | Název úkolu | Analýza konverze fází |
| Kontext | Kontext aktuální stránky | Seznam Leads |
| Výchozí zpráva | Přednastavená konverzace | "Prosím analyzuj trendy tohoto měsíce" |
| Výchozí blok | Automaticky propojit s kolekcí | tabulka leads |
| Dovednosti | Dostupné nástroje | Dotazování dat, generování grafů |

![Konfigurace úkolu na úrovni stránky](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Podpora více úkolů:**
Pro jednoho AI zaměstnance lze nakonfigurovat více úkolů, které se uživateli zobrazí jako možnosti výběru:

![Podpora více úkolů](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Doporučení:

* Jeden úkol by se měl zaměřit na jeden cíl
* Název by měl být jasný a srozumitelný
* Počet úkolů udržujte v rozmezí 5–7


### 2. Úkoly na úrovni bloku

Vhodné pro operace nad konkrétním blokem, jako je "Přeložit aktuální formulář".

**Způsob konfigurace:**

1. Otevřete konfiguraci akcí bloku
2. Přidejte "AI zaměstnance"

![Tlačítko přidání AI zaměstnance](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Stačí propojit cílového zaměstnance

![Výběr AI zaměstnance](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Konfigurace úkolu na úrovni bloku](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Položka srovnání | Na úrovni stránky | Na úrovni bloku |
| ---- | ---- | --------- |
| Rozsah dat | Celá stránka | Aktuální blok |
| Granularita | Globální analýza | Detailní zpracování |
| Typické použití | Analýza trendů | Překlad formulářů, extrakce polí |


## IV. Osvědčené postupy

### 1. Doporučení pro konfiguraci

| Položka | Doporučení | Důvod |
| ---------- | ----------- | -------- |
| Počet dovedností | 3–5 | Vysoká přesnost, rychlá odezva |
| Režim oprávnění (Ask / Allow) | Pro úpravu dat doporučeno Ask | Prevence chybných operací |
| Délka promptu | 500–1000 znaků | Vyvážení rychlosti a kvality |
| Cíl úkolu | Jediný a jasný | Zamezení zmatení AI |
| Pracovní postup | Použít po zapouzdření složitých úkolů | Vyšší míra úspěšnosti |


### 2. Praktická doporučení

**Od malého k velkému, postupná optimalizace:**

1. Nejdříve vytvořte základní zaměstnance (např. Viz, Dex)
2. Zapněte 1–2 klíčové dovednosti pro testování
3. Potvrďte, že lze úkoly normálně provádět
4. Poté postupně rozšiřujte o další dovednosti a úkoly

**Proces neustálé optimalizace:**

1. První verze musí běžet
2. Sbírejte zpětnou vazbu z používání
3. Optimalizujte prompty a konfigurace úkolů
4. Testujte a v cyklech vylepšujte


## V. Často kladené otázky

### 1. Fáze konfigurace

**Q: Co dělat, když uložení selže?**
A: Zkontrolujte, zda jsou vyplněna všechna povinná pole, zejména modelová služba a prompt.

**Q: Který model vybrat?**

* Programování → Claude, GPT-4
* Analýza → Claude, DeepSeek
* Citlivost na náklady → Qwen, GLM
* Dlouhý text → Gemini, Claude


### 2. Fáze používání

**Q: AI odpovídá příliš pomalu?**

* Snižte počet dovedností
* Optimalizujte prompt
* Zkontrolujte latenci modelové služby
* Zvažte výměnu modelu

**Q: Provádění úkolů není přesné?**

* Prompt není dostatečně jasný
* Příliš mnoho dovedností vede ke zmatku
* Rozdělte úkoly na menší, přidejte příklady

**Q: Kdy zvolit Ask / Allow?**

* Pro dotazovací úkoly lze použít `Allow`
* Pro úkoly upravující data se doporučuje `Ask`

**Q: Jak nechat AI zpracovat konkrétní formulář?**

A: Pokud se jedná o konfiguraci na úrovni stránky, je třeba blok vybrat ručně.

![Ruční výběr bloku](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Pokud se jedná o konfiguraci úkolu na úrovni bloku, datový kontext se propojí automaticky.


## VI. Další čtení

Chcete-li, aby byli vaši AI zaměstnanci výkonnější, můžete pokračovat ve čtení následujících dokumentů:

**Související s konfigurací:**

* [Průvodce prompt engineeringem](./prompt-engineering-guide.md) - Techniky a osvědčené postupy pro psaní kvalitních promptů
* [Konfigurace LLM služby](/ai-employees/features/llm-service) - Podrobné pokyny pro nastavení služeb velkých modelů
* [Vytvoření AI zaměstnance](/ai-employees/features/new-ai-employees) - Vytváření a základní konfigurace AI zaměstnanců
* [Spolupráce s AI zaměstnancem](/ai-employees/features/collaborate) - Jak efektivně komunikovat s AI zaměstnanci

**Pokročilé funkce:**

* [Dovednosti](/ai-employees/features/tool) - Hlubší pochopení konfigurace a použití různých dovedností
* [Úkoly](/ai-employees/features/task) - Pokročilé techniky konfigurace úkolů
* [Výběr bloku](/ai-employees/features/pick-block) - Jak pro AI zaměstnance určit datové bloky
* Zdroj dat - Viz dokumentace ke konfiguraci zdrojů dat u příslušných pluginů
* [Vyhledávání na webu](/ai-employees/features/web-search) - Konfigurace schopnosti AI zaměstnanců vyhledávat na webu

**Znalostní báze a RAG:**

* [Přehled znalostní báze AI](/ai-employees/knowledge-base/index) - Představení funkcí znalostní báze
* [Vektorová databáze](/ai-employees/knowledge-base/vector-database) - Konfigurace vektorové databáze
* [Znalostní báze](/ai-employees/knowledge-base/knowledge-base) - Jak vytvářet a spravovat znalostní báze
* [RAG (Retrieval-Augmented Generation)](/ai-employees/knowledge-base/rag) - Aplikace technologie RAG

**Integrace pracovních postupů:**

* [LLM uzel - Textová konverzace](/ai-employees/workflow/nodes/llm/chat) - Použití textové konverzace v pracovním postupu
* [LLM uzel - Multimodální konverzace](/ai-employees/workflow/nodes/llm/multimodal-chat) - Zpracování multimodálních vstupů jako obrázky a soubory
* [LLM uzel - Strukturovaný výstup](/ai-employees/workflow/nodes/llm/structured-output) - Získání strukturovaných odpovědí od AI


## Závěr

Při konfiguraci AI zaměstnanců je nejdůležitější: **nejdříve zprovoznit, poté optimalizovat**.
Nechte prvního zaměstnance úspěšně nastoupit do práce a poté postupně rozšiřujte a laďte.

Směr řešení problémů může následovat toto pořadí:

1. Zda je modelová služba propojena
2. Zda není počet dovedností příliš vysoký
3. Zda je prompt jasný
4. Zda je cíl úkolu zřetelný

Pokud budete postupovat krok za krokem, dokážete vytvořit skutečně efektivní AI tým.