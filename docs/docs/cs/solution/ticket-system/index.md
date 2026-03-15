:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/solution/ticket-system/index).
:::

# Představení řešení pro tickety

> **Poznámka**: Tato verze je raný náhled (preview). Funkce nejsou zatím kompletní a neustále pracujeme na vylepšeních. Zpětná vazba je vítána!

## 1. Kontext (Proč)

### Jaké problémy v odvětvích, pozicích a managementu řešíme

Firmy čelí v každodenním provozu různým typům servisních požadavků: opravy zařízení, IT podpora, stížnosti zákazníků, konzultace atd. Tyto požadavky přicházejí z rozptýlených zdrojů (CRM systémy, technici v terénu, e-maily, veřejné formuláře atd.), mají různé pracovní postupy a postrádají jednotný mechanismus sledování a správy.

**Příklady typických obchodních scénářů:**

- **Opravy zařízení**: Poprodejní tým řeší požadavky na opravu zařízení, přičemž potřebuje zaznamenávat specifické informace, jako jsou sériová čísla, kódy chyb, náhradní díly atd.
- **IT podpora**: IT oddělení řeší požadavky interních zaměstnanců na resetování hesla, instalaci softwaru, problémy se sítí atd.
- **Stížnosti zákazníků**: Tým zákaznických služeb řeší stížnosti z více kanálů; někteří emočně vypjatí zákazníci vyžadují prioritní řešení.
- **Samoobsluha pro zákazníky**: Koncoví zákazníci chtějí mít možnost pohodlně odesílat požadavky na služby a sledovat průběh jejich zpracování.

### Profil cílového uživatele

| Dimenze | Popis |
|------|------|
| Velikost firmy | Malé a střední podniky až středně velké a velké podniky s výraznou potřebou zákaznického servisu |
| Struktura rolí | Týmy zákaznických služeb, IT podpora, poprodejní týmy, provozní manažeři |
| Digitální zralost | Začátečníci až středně pokročilí, kteří hledají způsob, jak přejít ze správy v Excelu/e-mailu na systémové řízení |

### Problémy stávajících hlavních řešení

- **Vysoké náklady / pomalé přizpůsobení**: SaaS systémy pro tickety jsou drahé a cykly vlastního vývoje jsou dlouhé.
- **Fragmentace systémů, datová sila**: Různé typy obchodních dat jsou rozptýleny v různých systémech, což ztěžuje jednotnou analýzu a rozhodování.
- **Rychlé změny v podnikání, obtížný vývoj**: Když se změní obchodní požadavky, je obtížné systémy rychle upravit.
- **Pomalá odezva služeb**: Požadavky proudící mezi různými systémy nelze včas přidělit.
- **Netransparentní proces**: Zákazníci nemohou sledovat průběh ticketu, což vede k častým dotazům a zvyšuje tlak na zákaznický servis.
- **Obtížné zajištění kvality**: Chybí monitorování SLA, na prodlevy a negativní hodnocení nelze včas upozornit.

---

## 2. Srovnání produktů a řešení (Benchmark)

### Hlavní produkty na trhu

- **SaaS**: např. Salesforce, Zendesk, Odoo atd.
- **Vlastní systémy / interní systémy**

### Dimenze srovnání

- Pokrytí funkcí
- Flexibilita
- Rozšiřitelnost
- Způsob využití AI

### Rozdíly v řešení NocoBase

**Výhody na úrovni platformy:**

- **Priorita konfigurace**: Od podkladových datových tabulek po typy obchodních případů, SLA a směrování podle dovedností – vše se spravuje pomocí konfigurace.
- **Rychlé sestavení s low-code**: Rychlejší než vlastní vývoj, flexibilnější než SaaS.

**Co tradiční systémy nedokážou nebo co je v nich extrémně nákladné:**

- **Nativní integrace AI**: S využitím AI pluginů NocoBase lze dosáhnout inteligentní klasifikace, pomoci při vyplňování formulářů a doporučování znalostí.
- **Všechny návrhy mohou uživatelé replikovat**: Uživatelé mohou systém sami rozšiřovat na základě šablon.
- **Datová architektura ve tvaru T**: Hlavní tabulka + rozšiřující tabulky pro konkrétní agendy. Přidání nového typu agendy vyžaduje pouze přidání rozšiřující tabulky.

---

## 3. Principy návrhu (Principles)

- **Nízké kognitivní náklady**
- **Business má přednost před technologií**
- **Vyvíjející se systém, nikoli jednorázové dokončení**
- **Nejprve konfigurace, kód jako záloha**
- **Spolupráce člověka a AI, nikoli nahrazení člověka AI**
- **Všechny návrhy by měly být pro uživatele replikovatelné**

---

## 4. Přehled řešení (Solution Overview)

### Stručné představení

Univerzální centrála pro tickety postavená na low-code platformě NocoBase umožňuje:

- **Jednotný vstup**: Přístup z více zdrojů, standardizované zpracování.
- **Inteligentní distribuce**: Klasifikace s podporou AI, přidělování s vyvažováním zátěže.
- **Polymorfní agenda**: Jádro v hlavní tabulce + rozšiřující tabulky pro agendy, flexibilní rozšiřitelnost.
- **Uzavřená smyčka zpětné vazby**: Monitorování SLA, hodnocení zákazníků, řešení negativní zpětné vazby.

### Proces zpracování ticketu

```
Vícezdrojový vstup → Předzpracování/AI analýza → Inteligentní přidělení → Ruční provedení → Smyčka zpětné vazby
        ↓                      ↓                          ↓                    ↓                ↓
 Kontrola duplicit      Rozpoznání záměru          Shoda dovedností      Tok stavů        Hodnocení spokojenosti
                        Analýza sentimentu         Vyvažování zátěže     Monitorování SLA Následná kontrola stížností
                        Automatická odpověď        Správa front          Komunikace       Archivace dat
```

### Seznam hlavních modulů

| Modul | Popis |
|------|------|
| Příjem ticketů | Veřejné formuláře, zákaznický portál, záznam operátorem, API/Webhook, parsování e-mailů |
| Správa ticketů | CRUD operace ticketů, tok stavů, přidělení/předání, komunikace v komentářích, protokoly operací |
| Rozšíření agendy | Rozšiřující tabulky pro opravy zařízení, IT podporu, stížnosti zákazníků atd. |
| Správa SLA | Konfigurace SLA, upozornění na prodlevu, eskalace při prodlevě |
| Správa zákazníků | Hlavní tabulka zákazníků, správa kontaktů, zákaznický portál |
| Systém hodnocení | Vícerozměrné bodování, rychlé štítky, NPS, upozornění na negativní zpětnou vazbu |
| AI asistence | Klasifikace záměru, analýza sentimentu, doporučování znalostí, pomoc s odpovědí, úprava tónu |

### Ukázka hlavního rozhraní

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. AI zaměstnanci (AI Employee)

### Typy AI zaměstnanců a scénáře

- **Asistent zákaznického servisu**, **Asistent prodeje**, **Datový analytik**, **Auditor**
- Pomáhají lidem, nenahrazují je.

### Kvantifikace hodnoty AI zaměstnanců

V tomto řešení mohou AI zaměstnanci:

| Dimenze hodnoty | Konkrétní efekt |
|----------|----------|
| Zvýšení efektivity | Automatická klasifikace zkracuje čas ručního třídění o více než 50 %; doporučování znalostí urychluje řešení problémů |
| Snížení nákladů | Automatické odpovědi na jednoduché dotazy snižují pracovní zátěž lidských operátorů |
| Posílení lidských zaměstnanců | Varování před emocemi pomáhá operátorům se předem připravit; úprava odpovědí zvyšuje kvalitu komunikace |
| Zvýšení spokojenosti zákazníků | Rychlejší odezva, přesnější přidělení, profesionálnější odpovědi |

---

## 6. Hlavní přednosti (Highlights)

### 1. Datová architektura ve tvaru T

- Všechny tickety sdílejí hlavní tabulku s jednotnou logikou toku.
- Rozšiřující tabulky nesou specifická pole pro daný typ agendy, což umožňuje flexibilní rozšíření.
- Přidání nového typu agendy vyžaduje pouze přidání rozšiřující tabulky a neovlivňuje hlavní proces.

### 2. Kompletní životní cyklus ticketu

- Nový → Přidělen → Zpracovává se → Pozastaven → Vyřešen → Uzavřen.
- Podpora složitých scénářů, jako je předání, vrácení nebo znovuotevření.
- Časování SLA je přesné a zohledňuje pozastavení (pending).

### 3. Jednotný přístup z více kanálů

- Veřejné formuláře, zákaznický portál, API, e-mail, záznam operátorem.
- Kontrola idempotence zabraňuje duplicitnímu vytváření požadavků.

### 4. Nativní integrace AI

- Nejde jen o „přidání tlačítka AI“, ale o integraci do každého kroku procesu.
- Rozpoznání záměru, analýza sentimentu, doporučování znalostí, úprava odpovědí.

---

## 7. Instalace a nasazení

### Jak nainstalovat a používat

Použijte správu migrací k migraci a integraci různých dílčích aplikací do jiných aplikací.

---

## 8. Roadmap (průběžně aktualizováno)

- **Vnoření do systému**: Podpora vnoření modulu ticketů do různých podnikových systémů, jako jsou ERP, CRM atd.
- **Propojení ticketů**: Integrace ticketů s navazujícími a předcházejícími systémy a zpětná volání stavu pro spolupráci na ticketech napříč systémy.
- **AI automatizace**: AI zaměstnanci vnoření do pracovních postupů s podporou automatického spouštění na pozadí pro bezobslužné zpracování.
- **Podpora více nájemců (Multi-tenancy)**: Horizontální škálování prostřednictvím architektury více prostorů/aplikací, umožňující distribuci různým servisním týmům pro nezávislý provoz.
- **Znalostní báze RAG**: Automatická vektorizace všech dat (tickety, zákazníci, produkty atd.) pro inteligentní vyhledávání a doporučování znalostí.
- **Podpora více jazyků**: Rozhraní a obsah podporují přepínání mezi více jazyky, což vyhovuje potřebám nadnárodních a regionálních týmů.