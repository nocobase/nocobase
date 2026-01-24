:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pravidla propojení polí

## Úvod

Pravidla propojení polí umožňují dynamicky upravovat stav polí v blocích formulářů a detailů na základě akcí uživatele. V současné době tato pravidla podporují následující bloky:

-   [Blok formuláře](/interface-builder/blocks/data-blocks/form)
-   [Blok detailů](/interface-builder/blocks/data-blocks/details)
-   [Dílčí formulář](/interface-builder/fields/specific/sub-form)

## Pokyny k použití

### **Blok formuláře**

V bloku formuláře mohou pravidla propojení dynamicky upravovat chování polí na základě specifických podmínek:

-   **Ovládání viditelnosti pole (zobrazit/skrýt)**: Rozhodněte, zda se má aktuální pole zobrazit, na základě hodnot jiných polí.
-   **Nastavení pole jako povinného**: Za specifických podmínek dynamicky nastavte pole jako povinné nebo nepovinné.
-   **Přiřazení hodnoty**: Automaticky přiřaďte hodnotu poli na základě podmínek.
-   **Spuštění zadaného JavaScriptu**: Napište JavaScript podle obchodních požadavků.

### **Blok detailů**

V bloku detailů se pravidla propojení používají hlavně k dynamickému ovládání viditelnosti (zobrazení/skrytí) polí v tomto bloku.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Propojení vlastností

### Přiřazení hodnoty

Příklad: Když je objednávka označena jako doplňková objednávka, stav objednávky se automaticky nastaví na 'Čeká na schválení'.

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Povinné

Příklad: Když je stav objednávky 'Zaplaceno', pole 'Částka objednávky' je povinné.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Zobrazit/Skrýt

Příklad: Platební účet a celková částka se zobrazí pouze tehdy, když je stav objednávky 'Čeká na platbu'.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)