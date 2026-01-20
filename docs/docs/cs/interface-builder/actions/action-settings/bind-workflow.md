:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Navázání pracovního postupu

## Úvod

Na některých akčních tlačítkách můžete nakonfigurovat navázaný pracovní postup, který propojí danou akci s pracovním postupem a umožní automatizované zpracování dat.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Podporované akce a typy pracovních postupů

Níže jsou uvedeny aktuálně podporované akční tlačítka a typy pracovních postupů, které lze navázat:

| Akční tlačítko \ Typ pracovního postupu | Událost před akcí | Událost po akci | Událost schválení | Událost vlastní akce |
| --- | --- | --- | --- | --- |
| Tlačítka „Odeslat“, „Uložit“ ve formuláři | ✅ | ✅ | ✅ | ❌ |
| Tlačítko „Aktualizovat záznam“ v řádcích dat (tabulka, seznam atd.) | ✅ | ✅ | ✅ | ❌ |
| Tlačítko „Smazat“ v řádcích dat (tabulka, seznam atd.) | ✅ | ❌ | ❌ | ❌ |
| Tlačítko „Spustit pracovní postup“ | ❌ | ❌ | ❌ | ✅ |

## Navázání více pracovních postupů

Jedno akční tlačítko může být navázáno na více pracovních postupů. Pokud je navázáno více pracovních postupů, jejich pořadí spuštění se řídí následujícími pravidly:

1. U pracovních postupů stejného typu spouštěče se nejprve spustí synchronní pracovní postupy, poté asynchronní.
2. Pracovní postupy stejného typu spouštěče se spouštějí v pořadí, v jakém byly nakonfigurovány.
3. Mezi pracovními postupy různých typů spouštěčů:
    1. Události před akcí se vždy spustí před událostmi po akci a událostmi schválení.
    2. Události po akci a události schválení nemají žádné specifické pořadí a obchodní logika by neměla záviset na pořadí konfigurace.

## Více informací

Pro podrobné informace o různých typech událostí pracovních postupů se podívejte do dokumentace příslušných pluginů:

* [Událost po akci]
* [Událost před akcí]
* [Událost schválení]
* [Událost vlastní akce]