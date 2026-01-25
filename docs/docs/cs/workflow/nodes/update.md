:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Aktualizace dat

Slouží k aktualizaci dat v kolekci, která splňují zadané podmínky.

Části týkající se kolekce a přiřazení polí jsou stejné jako u uzlu "Vytvořit záznam". Hlavní rozdíl uzlu "Aktualizovat data" spočívá v přidání podmínek filtru a nutnosti zvolit režim aktualizace. Navíc výsledek uzlu "Aktualizovat data" vrací počet řádků, které byly úspěšně aktualizovány. Ten lze zobrazit pouze v historii spuštění a nelze jej použít jako proměnnou v následných uzlech.

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus ("+") v rámci toku, čímž přidáte uzel "Aktualizovat data":

![Přidat uzel Aktualizovat data](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Konfigurace uzlu

![Konfigurace uzlu Aktualizovat data](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Kolekce

Vyberte kolekci, ve které je třeba aktualizovat data.

### Režim aktualizace

Existují dva režimy aktualizace:

*   **Hromadná aktualizace**: Nespouští události kolekce pro každý aktualizovaný záznam. Nabízí lepší výkon a je vhodná pro aktualizace velkého objemu dat.
*   **Aktualizace po jednom**: Spouští události kolekce pro každý aktualizovaný záznam. Může však způsobit problémy s výkonem u velkých objemů dat a je třeba ji používat opatrně.

Volba obvykle závisí na cílových datech pro aktualizaci a na tom, zda je třeba spustit další události pracovního postupu. Pokud aktualizujete jeden záznam na základě primárního klíče, doporučuje se použít "Aktualizaci po jednom". Pokud aktualizujete více záznamů na základě podmínek, doporučuje se použít "Hromadnou aktualizaci".

### Podmínky filtru

Podobně jako u podmínek filtru v běžném dotazu na kolekci můžete použít kontextové proměnné z pracovního postupu.

### Hodnoty polí

Podobně jako u přiřazení polí v uzlu "Vytvořit záznam" můžete použít kontextové proměnné z pracovního postupu nebo ručně zadat statické hodnoty.

Poznámka: Data aktualizovaná uzlem "Aktualizovat data" v pracovním postupu automaticky nezpracovávají data "Poslední úpravu provedl". Hodnotu tohoto pole je třeba podle potřeby nakonfigurovat sami.

## Příklad

Například, když je vytvořen nový "Článek", je potřeba automaticky aktualizovat pole "Počet článků" v kolekci "Kategorie článků". Toho lze dosáhnout pomocí uzlu "Aktualizovat data":

![Konfigurace příkladu uzlu Aktualizovat data](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Po spuštění pracovního postupu se automaticky aktualizuje pole "Počet článků" kolekce "Kategorie článků" na aktuální počet článků + 1.