---
pkg: '@nocobase/plugin-workflow-parallel'
---

:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Paralelní větev

Uzel paralelní větve může rozdělit pracovní postup na více větví. Každá větev může být nakonfigurována s různými uzly a způsob provedení se liší v závislosti na režimu větve. Uzel paralelní větve použijte ve scénářích, kde je potřeba provést více akcí současně.

## Instalace

Jedná se o vestavěný plugin, který nevyžaduje instalaci.

## Vytvoření uzlu

V rozhraní pro konfiguraci pracovního postupu klikněte na tlačítko plus („+“) v diagramu a přidejte uzel „Paralelní větev“:

![Přidat paralelní větev](https://static-docs.nocobase.com/9e0f3faa0b9335270647a3047759eac.png)

Po přidání uzlu paralelní větve do pracovního postupu se ve výchozím nastavení přidají dvě podvětvě. Můžete také přidat libovolný počet dalších větví kliknutím na tlačítko pro přidání větve. Do každé větve lze přidat libovolný počet uzlů. Nepotřebné větve lze odebrat kliknutím na tlačítko pro smazání na začátku větve.

![Správa paralelních větví](https://static-docs.nocobase.com/36088b8b7970c8a1771eb3ee9bc2a757.png)

## Konfigurace uzlu

### Režim větve

Uzel paralelní větve má následující tři režimy:

-   **Všechny úspěšné**: Pracovní postup bude pokračovat v provádění uzlů po dokončení větví pouze v případě, že všechny větve proběhnou úspěšně. V opačném případě, pokud se kterákoli větev předčasně ukončí, ať už z důvodu selhání, chyby nebo jiného neúspěšného stavu, celý uzel paralelní větve se předčasně ukončí s tímto stavem. Tento režim je také známý jako „režim All“.
-   **Kterákoli úspěšná**: Pracovní postup bude pokračovat v provádění uzlů po dokončení větví, jakmile se kterákoli větev provede úspěšně. Celý uzel paralelní větve se předčasně ukončí pouze v případě, že se všechny větve předčasně ukončí, ať už z důvodu selhání, chyby nebo jiného neúspěšného stavu. Tento režim je také známý jako „režim Any“.
-   **Závodní režim (Race)**: Jakmile se kterákoli větev provede úspěšně, pracovní postup bude pokračovat v provádění uzlů po dokončení větví. Pokud však kterýkoli uzel selže, celý uzel paralelní větve se předčasně ukončí s tímto stavem. Tento režim je také známý jako „režim Race“.

Bez ohledu na zvolený režim se každá větev pokusí provést postupně zleva doprava. Jakmile jsou splněny podmínky přednastaveného režimu větve, pracovní postup buď pokračuje k dalším uzlům, nebo se předčasně ukončí.

## Příklad

Viz příklad v [Uzlu zpoždění](./delay.md).