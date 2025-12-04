
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# AI zaměstnanec · Viz: Průvodce konfigurací scénáře CRM

> Na příkladu CRM se dozvíte, jak zajistit, aby váš AI analytik pro získávání poznatků skutečně rozuměl vašemu podnikání a naplno využil svůj potenciál.

## 1. Předmluva: Jak zajistit, aby Viz přešel od „vidění dat“ k „rozumění podnikání“

V systému NocoBase je **Viz** předpřipravený AI analytik pro získávání poznatků.
Dokáže rozpoznat kontext stránky (například Leads, Opportunities, Accounts) a generovat trendové grafy, trychtýřové grafy a KPI karty.
Ve výchozím nastavení však disponuje pouze nejzákladnějšími dotazovacími schopnostmi:

| Nástroj                 | Popis funkce            | Zabezpečení |
| ----------------------- | ----------------------- | ----------- |
| Get Collection Names    | Získat seznam kolekcí   | ✅ Bezpečné |
| Get Collection Metadata | Získat strukturu polí   | ✅ Bezpečné |

Tyto nástroje umožňují Viz pouze „rozpoznat strukturu“, ale zatím ne skutečně „porozumět obsahu“.
Abyste mu umožnili generovat poznatky, detekovat anomálie a analyzovat trendy, musíte mu **rozšířit vhodnější analytické nástroje**.

V oficiálním CRM demu jsme použili dva způsoby:

*   **Overall Analytics (obecný analytický engine)**: šablonové, bezpečné a opakovaně použitelné řešení;
*   **SQL Execution (specializovaný analytický engine)**: nabízí větší flexibilitu, ale nese s sebou i větší rizika.

Tyto dvě možnosti nejsou jediné; spíše představují **designový vzor**:

> Můžete se řídit jeho principy a vytvořit implementaci, která lépe vyhovuje vašemu podnikání.

---

## 2. Struktura Viz: Stabilní osobnost + flexibilní úkoly

Abyste pochopili, jak rozšířit Viz, musíte nejprve porozumět jeho vrstvené interní architektuře:

| Vrstva             | Popis                                                               | Příklad        |
| ------------------ | ------------------------------------------------------------------- | -------------- |
| **Definice role**  | Osobnost a analytická metoda Viz: Porozumět → Dotazovat → Analyzovat → Vizualizovat | Pevné          |
| **Definice úkolu** | Přizpůsobené výzvy a kombinace nástrojů pro konkrétní obchodní scénář | Upravitelné    |
| **Konfigurace nástroje** | Most pro Viz k volání externích zdrojů dat nebo pracovních postupů | Volně nahraditelné |

Tato vrstvená architektura umožňuje Viz udržovat stabilní osobnost (konzistentní analytická logika),
a zároveň se rychle přizpůsobovat různým obchodním scénářům (CRM, správa nemocnic, analýza kanálů, řízení výroby...).

## 3. Režim jedna: Šablonový analytický engine (doporučeno)

### 3.1 Přehled principů

**Overall Analytics** je jádrem analytického enginu v CRM demu.
Spravuje všechny SQL dotazy prostřednictvím **kolekce šablon pro analýzu dat (data_analysis)**.
Viz nepíše SQL přímo, ale místo toho **volá předdefinované šablony** k generování výsledků.

Průběh spuštění je následující:

```mermaid
flowchart TD
    A[Viz přijme úkol] --> B[Volá pracovní postup Overall Analytics]
    B --> C[Shoduje šablonu na základě aktuální stránky/úkolu]
    C --> D[Spustí SQL šablony (pouze pro čtení)]
    D --> E[Vrátí datový výsledek]
    E --> F[Viz vygeneruje graf + stručnou interpretaci]
```

Tímto způsobem může Viz během několika sekund generovat bezpečné a standardizované analytické výsledky,
a administrátoři mohou centrálně spravovat a kontrolovat všechny SQL šablony.

---

### 3.2 Struktura kolekce šablon (data_analysis)

| Název pole                                        | Typ       | Popis                 | Příklad                                            |
| ------------------------------------------------- | --------- | --------------------- | -------------------------------------------------- |
| **id**                                            | Integer   | Primární klíč         | 1                                                  |
| **name**                                          | Text      | Název analytické šablony | Leads Data Analysis                                |
| **collection**                                    | Text      | Odpovídající kolekce  | Lead                                               |
| **sql**                                           | Kód       | Analytický SQL příkaz (pouze pro čtení) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description**                                   | Markdown  | Popis nebo definice šablony | "Počet leadů podle fáze"                                   |
| **createdAt / createdBy / updatedAt / updatedBy** | Systémové pole | Auditní informace     | Automaticky generováno                             |

#### Příklady šablon v CRM demu

| Název                            | Kolekce     | Popis                               |
| -------------------------------- | ----------- | ----------------------------------- |
| Account Data Analysis            | Account     | Analýza dat účtů                    |
| Contact Data Analysis            | Contact     | Analýza dat kontaktů                |
| Leads Data Analysis              | Lead        | Analýza trendů leadů                |
| Opportunity Data Analysis        | Opportunity | Trychtýř fází obchodních příležitostí |
| Task Data Analysis               | Todo Tasks  | Statistiky stavu úkolů k vyřízení   |
| Users (Sales Reps) Data Analysis | Users       | Srovnání výkonu obchodních zástupců |

---

### 3.3 Výhody tohoto režimu

| Aspekt             | Výhoda                                                               |
| ------------------ | -------------------------------------------------------------------- |
| **Zabezpečení**   | Všechny SQL dotazy jsou uloženy a zkontrolovány, což zabraňuje přímému generování dotazů. |
| **Udržovatelnost** | Šablony jsou centrálně spravovány a jednotně aktualizovány.            |
| **Znovupoužitelnost** | Stejnou šablonu lze znovu použít pro více úkolů.                     |
| **Přenositelnost** | Lze snadno migrovat do jiných systémů, vyžaduje pouze stejnou strukturu kolekce. |
| **Uživatelská zkušenost** | Firemní uživatelé se nemusí starat o SQL; stačí, když iniciují požadavek na analýzu. |

> 📘 Tato kolekce `data_analysis` nemusí mít nutně tento název.
> Klíčové je: **šablonovitě ukládat analytickou logiku** a nechat ji jednotně volat pracovním postupem.

---

### 3.4 Jak zajistit, aby ji Viz používal

V definici úkolu můžete Viz explicitně říci:

```markdown
Ahoj Viz,

Prosím, analyzujte data aktuálního modulu.

**Priorita:** Použijte nástroj Overall Analytics k získání výsledků analýzy z kolekce šablon.
**Pokud není nalezena odpovídající šablona:** Uveďte, že šablona chybí, a navrhněte administrátorovi, aby ji doplnil.

Požadavky na výstup:
- Pro každý výsledek vygenerujte samostatný graf;
- Pod graf připojte stručný popis o 2–3 větách;
- Nevymýšlejte data ani nepředpokládejte.
```

Tímto způsobem Viz automaticky zavolá pracovní postup, shodne nejvhodnější SQL z kolekce šablon a vygeneruje graf.

---

## 4. Režim dva: Specializovaný SQL exekutor (používejte opatrně)

### 4.1 Použitelné scénáře

Když potřebujete průzkumnou analýzu, ad-hoc dotazy nebo agregace s JOINem více kolekcí, můžete nechat Viz zavolat nástroj **SQL Execution**.

Charakteristiky tohoto nástroje jsou:

*   Viz může přímo generovat `SELECT` dotazy;
*   Systém je spustí a vrátí výsledek;
*   Viz je zodpovědný za analýzu a vizualizaci.

Příklad úkolu:

> „Prosím, analyzujte trend konverzních poměrů leadů podle regionů za posledních 90 dní.“

V tomto případě může Viz vygenerovat:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Rizika a doporučení pro ochranu

| Rizikový bod              | Strategie ochrany                                    |
| ------------------------- | ---------------------------------------------------- |
| Generování operací zápisu | Nucené omezení na `SELECT`                           |
| Přístup k nesouvisejícím kolekcím | Ověřit, zda název kolekce existuje                   |
| Riziko výkonu u velkých kolekcí | Omezit časový rozsah, použít LIMIT pro počet řádků |
| Sledovatelnost operací    | Povolit protokolování dotazů a audit                 |
| Kontrola uživatelských oprávnění | Tento nástroj mohou používat pouze administrátoři    |

> Obecná doporučení:
>
> *   Běžní uživatelé by měli mít povolenou pouze šablonovou analýzu (Overall Analytics);
> *   Pouze administrátoři nebo seniorní analytici by měli mít povolené používání SQL Execution.

---

## 5. Pokud si chcete vytvořit vlastní „Overall Analytics“

Zde je jednoduchý, obecný přístup, který můžete replikovat v jakémkoli systému (nezávisle na NocoBase):

### Krok 1: Navrhněte kolekci šablon

Název kolekce může být libovolný (např. `analysis_templates`).
Stačí, aby obsahovala pole: `name`, `sql`, `collection` a `description`.

### Krok 2: Napište službu nebo pracovní postup „Načíst šablonu → Spustit“

Logika:

1.  Přijme úkol nebo kontext stránky (např. aktuální kolekci);
2.  Shodne šablonu;
3.  Spustí SQL šablony (pouze pro čtení);
4.  Vrátí standardizovanou datovou strukturu (řádky + pole).

### Krok 3: Nechte AI zavolat toto rozhraní

Výzva k úkolu může být napsána takto:

```
Nejprve zkuste zavolat nástroj pro analýzu šablon. Pokud v šablonách není nalezena žádná odpovídající analýza, použijte SQL exekutor.
Prosím, ujistěte se, že všechny dotazy jsou pouze pro čtení a generují grafy pro zobrazení výsledků.
```

> Tímto způsobem bude váš systém AI zaměstnance disponovat analytickými schopnostmi podobnými CRM demu, ale bude zcela nezávislý a přizpůsobitelný.

---

## 6. Nejlepší postupy a doporučení pro návrh

| Doporučení                     | Popis                                                              |
| ------------------------------ | ------------------------------------------------------------------ |
| **Upřednostněte šablonovou analýzu** | Bezpečné, stabilní a opakovaně použitelné                          |
| **SQL Execution pouze jako doplněk** | Omezeno na interní ladění nebo ad-hoc dotazy                       |
| **Jeden graf, jeden klíčový bod** | Udržujte výstup jasný a vyhněte se nadměrnému nepořádku            |
| **Jasné pojmenování šablon**   | Pojmenujte podle stránky/obchodní domény, např. `Leads-Stage-Conversion` |
| **Stručné a jasné vysvětlení** | Ke každému grafu připojte shrnutí o 2–3 větách                     |
| **Uveďte, když šablona chybí** | Informujte uživatele "Nenalezena odpovídající šablona" namísto prázdného výstupu |

---

## 7. Z CRM dema k vašemu scénáři

Ať už pracujete s nemocničním CRM, výrobou, skladovou logistikou nebo náborem studentů,
pokud dokážete odpovědět na následující tři otázky, může Viz přinést hodnotu do vašeho systému:

| Otázka                    | Příklad                               |
| ------------------------- | ------------------------------------- |
| **1. Co chcete analyzovat?** | Trendy leadů / Fáze obchodů / Provozní doba zařízení |
| **2. Kde jsou data?**     | Která kolekce, která pole             |
| **3. Jak to chcete prezentovat?** | Spojnicový graf, trychtýř, koláčový graf, srovnávací tabulka |

Jakmile toto definujete, stačí:

*   Zapsat analytickou logiku do kolekce šablon;
*   Připojit výzvu k úkolu na stránku;
*   A Viz pak může „převzít“ vaši analýzu reportů.

---

## 8. Závěr: Vezměte si tento vzor s sebou

„Overall Analytics“ a „SQL Execution“ jsou jen dvě příkladové implementace.
Důležitější je myšlenka, která za nimi stojí:

> **Zajistěte, aby AI zaměstnanec rozuměl vaší obchodní logice, a ne pouze vykonával výzvy.**

Ať už používáte NocoBase, soukromý systém nebo vlastní pracovní postup,
můžete replikovat tuto strukturu:

*   Centralizované šablony;
*   Volání pracovních postupů;
*   Spouštění pouze pro čtení;
*   Prezentace AI.

Tímto způsobem Viz už není jen „AI, která umí generovat grafy“,
ale skutečný analytik, který rozumí vašim datům, vašim definicím a vašemu podnikání.