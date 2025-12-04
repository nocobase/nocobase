---
pkg: '@nocobase/plugin-workflow-response-message'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Odpovědní zpráva

## Úvod

Uzel odpovědní zprávy slouží k odesílání vlastních zpráv z pracovního postupu zpět klientovi, který odeslal akci, a to v určitých typech pracovních postupů.

:::info{title=Poznámka}
V současné době je podporováno pro použití v pracovních postupech typu „Událost před akcí“ a „Událost vlastní akce“ v synchronním režimu.
:::

## Vytvoření uzlu

V podporovaných typech pracovních postupů můžete přidat uzel „Odpovědní zpráva“ kamkoli do pracovního postupu. Klikněte na tlačítko plus („+“) v pracovním postupu pro přidání uzlu „Odpovědní zpráva“:

![Přidání uzlu](https://static-docs.nocobase.com/eac2b3565e95e4ce59f340624062ed3d.png)

Odpovědní zpráva existuje jako pole po celou dobu procesu požadavku. Kdykoli je v pracovním postupu proveden uzel odpovědní zprávy, nový obsah zprávy se připojí k poli. Když server odešle odpověď, všechny zprávy jsou odeslány klientovi společně.

## Konfigurace uzlu

Obsah zprávy je šablonový řetězec, do kterého lze vkládat proměnné. Tento obsah šablony můžete libovolně uspořádat v konfiguraci uzlu:

![Konfigurace uzlu](https://static-docs.nocobase.com/d5fa5f4002d50baf3ba16048818fddfc.png)

Když se pracovní postup provede k tomuto uzlu, šablona bude analyzována a vygeneruje se výsledek obsahu zprávy. V konfiguraci výše bude proměnná „Lokální proměnná / Projít všechny produkty / Objekt smyčky / Produkt / Název“ nahrazena konkrétní hodnotou ve skutečném pracovním postupu, například:

```
Produkt „iPhone 14 pro“ není skladem
```

![Obsah zprávy](https://static-docs.nocobase.com/06fa4b6b6ec499c853f0c39987f63a6a.png)

## Konfigurace pracovního postupu

Stav odpovědní zprávy závisí na úspěšném nebo neúspěšném provedení pracovního postupu. Selhání jakéhokoli uzlu způsobí selhání celého pracovního postupu. V takovém případě bude obsah zprávy vrácen klientovi se stavem selhání a zobrazen.

Pokud potřebujete aktivně definovat stav selhání v pracovním postupu, můžete použít „Ukončovací uzel“ a nakonfigurovat jej na stav selhání. Když je tento uzel proveden, pracovní postup se ukončí se stavem selhání a zpráva bude vrácena klientovi se stavem selhání.

Pokud celý pracovní postup nevygeneruje stav selhání a úspěšně se provede až do konce, obsah zprávy bude vrácen klientovi se stavem úspěchu.

:::info{title=Poznámka}
Pokud je v pracovním postupu definováno více uzlů odpovědní zprávy, provedené uzly připojí obsah zprávy k poli. Při konečném vrácení klientovi bude veškerý obsah zprávy vrácen a zobrazen společně.
:::

## Případy použití

### Pracovní postup „Událost před akcí“

Použití odpovědní zprávy v pracovním postupu „Událost před akcí“ umožňuje odesílat odpovídající zpětnou vazbu zprávy klientovi po dokončení pracovního postupu. Podrobnosti naleznete v [Událost před akcí](../triggers/pre-action.md).

### Pracovní postup „Událost vlastní akce“

Použití odpovědní zprávy v „Události vlastní akce“ v synchronním režimu umožňuje odesílat odpovídající zpětnou vazbu zprávy klientovi po dokončení pracovního postupu. Podrobnosti naleznete v [Událost vlastní akce](../triggers/custom-action.md).