---
pkg: '@nocobase/plugin-workflow'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Přehled

## Úvod

Plugin pracovní postup Vám v NocoBase pomůže s orchestrací automatizovaných obchodních procesů, například každodenního schvalování, synchronizace dat, připomenutí a dalších úkolů. V rámci pracovního postupu můžete složitou obchodní logiku implementovat jednoduše konfigurací spouštěčů a souvisejících uzlů prostřednictvím vizuálního rozhraní, a to bez nutnosti psaní jakéhokoli kódu.

### Příklad

Každý pracovní postup je tvořen spouštěčem a několika uzly. Spouštěč představuje událost v systému a každý uzel představuje krok provedení. Společně popisují obchodní logiku, která se má zpracovat po nastání události. Následující obrázek ukazuje typický proces odečtení zásob po vytvoření objednávky produktu:

![Příklad pracovního postupu](https://static-docs.nocobase.com/20251029222146.png)

Když uživatel odešle objednávku, pracovní postup automaticky zkontroluje skladové zásoby. Pokud jsou skladové zásoby dostatečné, odečte se zboží ze skladu a pokračuje se vytvořením objednávky; v opačném případě proces končí.

### Scénáře použití

Z obecnějšího pohledu mohou pracovní postupy v aplikacích NocoBase řešit problémy v různých scénářích:

- Automatizace opakujících se úkolů: Kontroly objednávek, synchronizace skladových zásob, čištění dat, výpočty skóre a podobně, již nevyžadují ruční zásah.
- Podpora spolupráce člověka a stroje: Zajistěte schválení nebo revize v klíčových uzlech a pokračujte s následnými kroky na základě výsledků.
- Připojení k externím systémům: Odesílejte HTTP požadavky, přijímejte data z externích služeb a dosáhněte automatizace napříč systémy.
- Rychlá adaptace na obchodní změny: Upravte strukturu procesu, podmínky nebo jiné konfigurace uzlů a nasaďte do provozu bez nutnosti nového vydání.

## Instalace

Pracovní postup je integrovaný plugin NocoBase. Není nutná žádná další instalace ani konfigurace.

## Další informace

- [Začínáme](./getting-started)
- [Spouštěče](./triggers/index)
- [Uzly](./nodes/index)
- [Použití proměnných](./advanced/variables)
- [Spuštění](./advanced/executions)
- [Správa verzí](./advanced/revisions)
- [Pokročilá konfigurace](./advanced/options)
- [Vývoj rozšíření](./development/index)