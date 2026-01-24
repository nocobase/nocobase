:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Nastavení rozsahu dat

## Úvod

Nastavení rozsahu dat pro relační pole je podobné nastavení rozsahu dat pro blok. Definuje výchozí podmínky filtrace pro související data.

## Pokyny k použití

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Statická hodnota

Příklad: Pro propojení lze vybrat pouze produkty, které nebyly smazány.

> Seznam polí obsahuje pole z cílové kolekce relačního pole.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Hodnota proměnné

Příklad: Pro propojení lze vybrat pouze produkty, jejichž datum služby je pozdější než datum objednávky.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Více informací o proměnných naleznete v [Proměnné](/interface-builder/variables)

### Propojení relačních polí

Propojení mezi relačními poli se dosahuje nastavením rozsahu dat.

Příklad: Kolekce Objednávky obsahuje relační pole typu jedna k mnoha „Produkt příležitosti“ a relační pole typu mnoha k jedné „Příležitost“. Kolekce Produkt příležitosti má rovněž relační pole typu mnoha k jedné „Příležitost“. V bloku formuláře objednávky jsou volitelná data pro „Produkt příležitosti“ filtrována tak, aby zobrazovala pouze produkty příležitosti spojené s aktuálně vybranou „Příležitostí“ ve formuláři.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)