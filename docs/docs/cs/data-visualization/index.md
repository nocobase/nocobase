---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Přehled

Plugin pro vizualizaci dat NocoBase nabízí vizuální dotazování dat a bohatou sadu grafových komponent. Pomocí jednoduché konfigurace můžete rychle vytvářet vizualizační panely, prezentovat datové poznatky a podporovat vícerozměrnou analýzu a zobrazení.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Základní pojmy
- Grafový blok: Konfigurovatelná grafová komponenta na stránce, která podporuje dotazování dat, možnosti grafu a interaktivní události.
- Dotazování dat (Builder / SQL): Konfigurujte vizuálně pomocí Builderu, nebo napište SQL pro získání dat.
- Míry (Measures) a Dimenze (Dimensions): Míry se používají pro číselnou agregaci; Dimenze seskupují data (například datum, kategorie, region).
- Mapování polí: Mapujte sloupce výsledků dotazu na klíčová pole grafu, jako jsou `xField`, `yField`, `seriesField` nebo `Category / Value`.
- Možnosti grafu (Basic / Custom): Basic konfiguruje běžné vlastnosti vizuálně; Custom vrací kompletní ECharts `option` pomocí JS.
- Spustit dotaz: Spusťte dotaz a získejte data v konfiguračním panelu; přepněte na Table / JSON pro kontrolu vrácených dat.
- Náhled a Uložit: Náhled je dočasný; kliknutím na „Uložit“ se konfigurace zapíše do databáze a oficiálně se použije.
- Kontextové proměnné: Znovu použijte kontextové informace stránky, uživatele a filtru (například `{{ ctx.user.id }}`) v dotazech a konfiguraci grafu.
- Filtry a propojení: Bloky filtrů na úrovni stránky shromažďují jednotné podmínky, automaticky se slučují do dotazů grafu a aktualizují propojené grafy.
- Interaktivní události: Registrujte události pomocí `chart.on` pro povolení zvýraznění, navigace a detailního zobrazení (drill-down).

## Instalace
Vizualizace dat je vestavěný plugin NocoBase; je připravena k použití ihned po vybalení a nevyžaduje samostatnou instalaci.