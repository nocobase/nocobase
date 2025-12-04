:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Psaní a spouštění JS online

V NocoBase **RunJS** nabízí odlehčený způsob rozšíření, který je ideální pro **rychlé experimenty a dočasné zpracování logiky**. Bez nutnosti vytvářet pluginy nebo upravovat zdrojový kód můžete pomocí JavaScriptu personalizovat rozhraní nebo interakce.

Díky němu můžete přímo v návrháři rozhraní zadávat JS kód a dosáhnout tak:

- Vlastního vykreslování obsahu (polí, bloků, sloupců, položek atd.)
- Vlastní interakční logiky (kliknutí na tlačítka, propojení událostí)
- Dynamického chování v kombinaci s kontextovými daty

## Podporované scénáře

### JS blok

Pomocí JS si můžete přizpůsobit vykreslování bloku a získat tak úplnou kontrolu nad jeho strukturou a styly. Je to ideální pro zobrazení vlastních komponent, statistických grafů, obsahu třetích stran a dalších vysoce flexibilních scénářů.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

Dokumentace: [JS blok](/interface-builder/blocks/other-blocks/js-block)

### JS akce

Pomocí JS si můžete přizpůsobit logiku kliknutí akčních tlačítek, což vám umožní provádět jakékoli operace frontendových nebo API požadavků. Například: dynamicky počítat hodnoty, odesílat vlastní data, spouštět vyskakovací okna atd.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

Dokumentace: [JS akce](/interface-builder/actions/types/js-action)

### JS pole

Pomocí JS si můžete přizpůsobit logiku vykreslování polí. Na základě hodnot polí můžete dynamicky zobrazovat různé styly, obsah nebo stavy.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

Dokumentace: [JS pole](/interface-builder/fields/specific/js-field)

### JS položka

Pomocí JS můžete vykreslovat nezávislé položky, které nejsou vázány na konkrétní pole. Běžně se používá pro zobrazení vlastních informačních bloků.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

Dokumentace: [JS položka](/interface-builder/fields/specific/js-item)

### JS sloupec tabulky

Pomocí JS si můžete přizpůsobit vykreslování sloupců tabulky. Můžete implementovat složitou logiku zobrazení buněk, jako jsou indikátory průběhu, štítky stavu atd.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

Dokumentace: [JS sloupec tabulky](/interface-builder/fields/specific/js-column)

### Pravidla propojení

Pomocí JS můžete řídit logiku propojení mezi poli ve formulářích nebo na stránkách. Například: když se změní jedno pole, dynamicky upravíte hodnotu nebo viditelnost jiného pole.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

Dokumentace: [Pravidla propojení](/interface-builder/linkage-rule)

### Tok událostí

Pomocí JS si můžete přizpůsobit spouštěcí podmínky a logiku provádění toku událostí a vytvářet tak složitější frontendové interakční řetězce.

![](https://static-docs.nocobase.com/20251031092755.png)

Dokumentace: [Tok událostí](/interface-builder/event-flow)