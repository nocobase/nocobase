:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/ai-employees/quick-start).
:::

# Rychlý start

Pojďme během 5 minut dokončit minimální použitelnou konfiguraci AI zaměstnanců.

## Instalace pluginu

AI zaměstnanci jsou součástí vestavěných pluginů NocoBase (`@nocobase/plugin-ai`), takže není vyžadována žádná samostatná instalace.

## Konfigurace modelů

Služby LLM můžete nakonfigurovat prostřednictvím jednoho z následujících vstupů:

1. Vstup z administrace: `Systémová nastavení -> AI zaměstnanci -> Služba LLM`.
2. Rychlý vstup z frontendu: V panelu AI chatu použijte `Model Switcher` pro výběr modelu a poté klikněte na zkratku „Přidat službu LLM“ pro přímý přechod do nastavení.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

Obvykle je třeba potvrdit:
1. Výběr poskytovatele (Provider).
2. Vyplnění API klíče.
3. Konfiguraci `Povolených modelů` (Enabled Models); ve výchozím nastavení stačí použít Doporučené (Recommend).

## Povolení vestavěných zaměstnanců

Vestavění AI zaměstnanci jsou ve výchozím nastavení všichni povoleni, takže je obvykle není nutné aktivovat ručně jednoho po druhém.

Pokud potřebujete upravit rozsah dostupnosti (povolit/zakázat konkrétního zaměstnance), můžete tak učinit pomocí přepínače `Enabled` na stránce seznamu v `Systémová nastavení -> AI zaměstnanci`.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## Začněte spolupracovat

Na stránce aplikace najeďte myší na rychlý vstup v pravém dolním rohu a vyberte AI zaměstnance.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

Kliknutím otevřete dialogové okno AI chatu:

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

Můžete také:  
* Přidávat bloky
* Přidávat přílohy
* Zapnout vyhledávání na webu
* Přepínat AI zaměstnance
* Vybírat modely

Zaměstnanci mohou také automaticky získat strukturu stránky jako kontext. Například Dex v bloku formuláře automaticky načte strukturu polí formuláře a vyvolá vhodné dovednosti pro práci se stránkou.

## Rychlé úkoly 

Pro každého AI zaměstnance můžete na aktuální pozici přednastavit běžné úkoly. Práci tak zahájíte jediným kliknutím, což je rychlé a pohodlné.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## Přehled vestavěných zaměstnanců

NocoBase nabízí několik přednastavených AI zaměstnanců pro různé scénáře.

Stačí pouze:

1. Nakonfigurovat služby LLM.
2. Podle potřeby upravit stav povolení zaměstnanců (výchozí je povoleno).
3. Vybrat model v konverzaci a začít spolupracovat.

| Jméno zaměstnance | Role | Klíčové schopnosti |
| :--- | :--- | :--- |
| **Cole** | Asistent NocoBase | Otázky a odpovědi k produktu, vyhledávání v dokumentaci |
| **Ellis** | Expert na e-maily | Psaní e-mailů, generování shrnutí, návrhy odpovědí |
| **Dex** | Expert na organizaci dat | Překlad polí, formátování, extrakce informací |
| **Viz** | Analytik vhledů | Datové vhledy, analýza trendů, interpretace klíčových ukazatelů |
| **Lexi** | Asistent překladu | Vícejazyčný překlad, podpora komunikace |
| **Vera** | Výzkumný analytik | Vyhledávání na webu, agregace informací, hloubkový výzkum |
| **Dara** | Expert na vizualizaci dat | Konfigurace grafů, generování vizuálních reportů |
| **Orin** | Expert na datové modelování | Pomoc s návrhem struktury kolekce, návrhy polí |
| **Nathan** | Frontend inženýr | Pomoc s psaním fragmentů frontend kódu, úpravy stylů |

**Poznámky**

Někteří vestavění AI zaměstnanci se v seznamu vpravo dole nezobrazují, protože mají specifické pracovní scénáře:

- Orin: Stránky pro datové modelování.
- Dara: Bloky pro konfiguraci grafů.
- Nathan: JS Block a podobné editory kódu.