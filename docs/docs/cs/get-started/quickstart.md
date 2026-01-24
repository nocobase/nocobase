---
versions:
  - label: Nejnovější (stabilní)
    features: Stabilní funkce, důkladně otestováno, pouze opravy chyb.
    audience: Uživatelé, kteří vyžadují stabilní prostředí, a produkční nasazení.
    stability: ★★★★★
    production_recommendation: Doporučeno
  - label: Beta (testovací)
    features: Obsahuje nadcházející funkce, které prošly počátečním testováním a mohou mít několik problémů.
    audience: Uživatelé, kteří chtějí získat včasný přístup k novým funkcím a poskytnout zpětnou vazbu.
    stability: ★★★★☆
    production_recommendation: Používejte s opatrností
  - label: Alpha (vývojová)
    features: Vývojová verze s nejnovějšími funkcemi, které však mohou být neúplné nebo nestabilní.
    audience: Technicky zdatní uživatelé a přispěvatelé se zájmem o špičkový vývoj.
    stability: ★★☆☆☆
    production_recommendation: Používejte s opatrností

install_methods:
  - label: Instalace Dockeru (doporučeno)
    features: Není potřeba psát kód; jednoduchá instalace; vhodné pro rychlé vyzkoušení.
    scenarios: Uživatelé bez kódu; uživatelé, kteří chtějí rychle nasadit na server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Stáhněte nejnovější image a restartujte kontejner.
  - label: Instalace create-nocobase-app
    features: Nezávislá aplikační kódová základna; podporuje rozšíření pluginů a přizpůsobení UI.
    scenarios: Front-end/full-stack vývojáři; týmové projekty; low-code vývoj.
    technical_requirement: ★★★☆☆
    upgrade_method: Aktualizujte závislosti pomocí yarn.
  - label: Instalace ze zdrojového kódu Git
    features: Získejte nejnovější zdrojový kód; vhodné pro přispívání a ladění.
    scenarios: Techničtí vývojáři; uživatelé, kteří chtějí vyzkoušet nevydané verze.
    technical_requirement: ★★★★★
    upgrade_method: Synchronizujte aktualizace prostřednictvím Git.
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Porovnání způsobů instalace a verzí

NocoBase můžete nainstalovat různými způsoby.

## Porovnání verzí

| Položka | **Nejnovější (stabilní)** | **Beta (testovací)** | **Alpha (vývojová)** |
|------|------------------------|----------------------|-----------------------|
| **Vlastnosti** | Stabilní funkce, důkladně otestováno, pouze opravy chyb. | Obsahuje nadcházející funkce, které prošly počátečním testováním a mohou mít několik problémů. | Vývojová verze s nejnovějšími funkcemi, které však mohou být neúplné nebo nestabilní. |
| **Cílová skupina** | Uživatelé, kteří vyžadují stabilní prostředí, a produkční nasazení. | Uživatelé, kteří chtějí získat včasný přístup k novým funkcím a poskytnout zpětnou vazbu. | Technicky zdatní uživatelé a přispěvatelé se zájmem o špičkový vývoj. |
| **Stabilita** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Doporučeno pro produkční použití** | Doporučeno | Používejte s opatrností | Používejte s opatrností |

## Porovnání způsobů instalace

| Položka | **Instalace Dockeru (doporučeno)** | **Instalace create-nocobase-app** | **Instalace ze zdrojového kódu Git** |
|------|--------------------------|------------------------------|------------------|
| **Vlastnosti** | Není potřeba psát kód; jednoduchá instalace; vhodné pro rychlé vyzkoušení. | Nezávislá aplikační kódová základna; podporuje rozšíření pluginů a přizpůsobení UI. | Získejte nejnovější zdrojový kód; vhodné pro přispívání a ladění. |
| **Scénáře použití** | Uživatelé bez kódu; uživatelé, kteří chtějí rychle nasadit na server. | Front-end/full-stack vývojáři; týmové projekty; low-code vývoj. | Techničtí vývojáři; uživatelé, kteří chtějí vyzkoušet nevydané verze. |
| **Technické požadavky** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Způsob aktualizace** | Stáhněte nejnovější image a restartujte kontejner. | Aktualizujte závislosti pomocí yarn. | Synchronizujte aktualizace prostřednictvím Git. |
| **Návody** | [<code>Instalace</code>](#) [<code>Aktualizace</code>](#) [<code>Nasazení</code>](#) | [<code>Instalace</code>](#) [<code>Aktualizace</code>](#) [<code>Nasazení</code>](#) | [<code>Instalace</code>](#) [<code>Aktualizace</code>](#) [<code>Nasazení</code>](#) |