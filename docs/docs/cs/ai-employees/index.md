---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/ai-employees/index).
:::

# Přehled

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI zaměstnanci (`AI Employees`) jsou schopnosti inteligentních agentů hluboce integrované do obchodních systémů NocoBase.

Nejsou to jen boti, kteří „umí jen chatovat“, ale „digitální kolegové“, kteří dokážou přímo v obchodním rozhraní porozumět kontextu a provádět operace:

- **Rozumí kontextu podnikání**: Vnímají aktuální stránku, bloky, datové struktury a vybraný obsah.
- **Mohou přímo provádět akce**: Mohou volat dovednosti k dokončení úkolů, jako je dotazování, analýza, vyplňování, konfigurace a generování.
- **Spolupráce založená na rolích**: Konfigurujte různé zaměstnance podle pracovních pozic a přepínejte modely v rámci konverzace pro spolupráci.

## 5minutová cesta k začátku

Nejprve se podívejte na [Rychlý start](/ai-employees/quick-start) a dokončete minimální použitelnou konfiguraci v následujícím pořadí:

1. Nakonfigurujte alespoň jednu [LLM službu](/ai-employees/features/llm-service).
2. Povolte alespoň jednoho [AI zaměstnance](/ai-employees/features/enable-ai-employee).
3. Otevřete konverzaci a začněte [spolupracovat s AI zaměstnanci](/ai-employees/features/collaborate).
4. Podle potřeby zapněte [vyhledávání na webu](/ai-employees/features/web-search) a [rychlé úkoly](/ai-employees/features/task).

## Mapa funkcí

### A. Základní konfigurace (Administrátor)

- [Konfigurace LLM služby](/ai-employees/features/llm-service): Připojení poskytovatelů (Provider), konfigurace a správa dostupných modelů.
- [Povolení AI zaměstnanců](/ai-employees/features/enable-ai-employee): Zapnutí/vypnutí vestavěných zaměstnanců a kontrola rozsahu dostupnosti.
- [Nový AI zaměstnanec](/ai-employees/features/new-ai-employees): Definování rolí, nastavení osobnosti, uvítacích zpráv a hranic schopností.
- [Používání dovedností](/ai-employees/features/tool): Konfigurace oprávnění dovedností (`Ask` / `Allow`) a kontrola rizik provádění.

### B. Každodenní spolupráce (Obchodní uživatelé)

- [Spolupráce s AI zaměstnanci](/ai-employees/features/collaborate): Přepínání zaměstnanců a modelů v rámci konverzace pro plynulou spolupráci.
- [Přidání kontextu - Bloky](/ai-employees/features/pick-block): Odeslání bloků stránky jako kontextu pro AI.
- [Rychlé úkoly](/ai-employees/features/task): Přednastavení běžných úkolů na stránkách/blocích a jejich spuštění jedním kliknutím.
- [Vyhledávání na webu](/ai-employees/features/web-search): Povolení rozšířeného vyhledávání odpovědí, když jsou potřeba nejnovější informace.

### C. Pokročilé schopnosti (Rozšíření)

- [Vestavění AI zaměstnanci](/ai-employees/features/built-in-employee): Pochopení zaměření a vhodných scénářů pro přednastavené zaměstnance.
- [Řízení oprávnění](/ai-employees/permission): Řízení přístupu k zaměstnancům, dovednostem a datům podle modelu oprávnění organizace.
- [AI znalostní báze](/ai-employees/knowledge-base/index): Zavedení podnikových znalostí pro zvýšení stability a dohledatelnosti odpovědí.
- [Uzel LLM v pracovním postupu](/ai-employees/workflow/nodes/llm/chat): Orchestrace schopností AI do automatizovaných procesů.

## Klíčové pojmy (Doporučujeme nejprve sjednotit)

Následující termíny jsou v souladu se slovníkem pojmů a doporučujeme je v týmu používat jednotně:

- **AI zaměstnanec (AI Employee)**: Proveditelný agent složený z nastavení role (Role setting) a dovedností (Tool / Skill).
- **LLM služba (LLM Service)**: Jednotka pro přístup k modelům a konfiguraci schopností, sloužící ke správě poskytovatelů (Provider) a seznamů modelů.
- **Poskytovatel (Provider)**: Dodavatel modelu stojící za LLM službou.
- **Povolené modely (Enabled Models)**: Sada modelů, které aktuální LLM služba umožňuje vybrat v konverzaci.
- **Přepínač AI zaměstnanců (AI Employee Switcher)**: Přepínání aktuálně spolupracujícího zaměstnance v rámci konverzace.
- **Přepínač modelů (Model Switcher)**: Přepínání modelů v konverzaci s pamatováním preferencí pro každého zaměstnance.
- **Dovednost (Tool / Skill)**: Jednotka proveditelné schopnosti, kterou může AI volat.
- **Oprávnění dovednosti (Permission: Ask / Allow)**: Zda je před voláním dovednosti vyžadováno potvrzení člověkem.
- **Kontext (Context)**: Informace o obchodním prostředí, jako jsou stránky, bloky, datové struktury atd.
- **Konverzace (Chat)**: Proces nepřetržité interakce mezi uživatelem a AI zaměstnancem.
- **Vyhledávání na webu (Web Search)**: Schopnost doplnit odpovědi o informace v reálném čase na základě externího vyhledávání.
- **Znalostní báze (Knowledge Base / RAG)**: Zavedení podnikových znalostí prostřednictvím generování rozšířeného o vyhledávání.
- **Vektorové úložiště (Vector Store)**: Vektorizované úložiště poskytující sémantické vyhledávání pro znalostní bázi.

## Pokyny k instalaci

AI zaměstnanci jsou vestavěným pluginem NocoBase (`@nocobase/plugin-ai`), jsou připraveni k okamžitému použití a nevyžadují samostatnou instalaci.