:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Markdown blok

## Úvod

Markdown blok můžete použít bez nutnosti vázat jej na **zdroj dat**. Slouží k definování textového obsahu pomocí syntaxe Markdown a k zobrazování formátovaného textu.

## Přidání bloku

Markdown blok můžete přidat na stránku nebo do vyskakovacího okna.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Inline (inline-block) Markdown bloky můžete také přidat do bloků formuláře a detailů.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Šablonovací engine

Využívá **[šablonovací engine Liquid](https://liquidjs.com/tags/overview.html)**, který poskytuje výkonné a flexibilní možnosti vykreslování šablon. Díky němu lze obsah dynamicky generovat a přizpůsobovat. Pomocí tohoto šablonovacího enginu můžete:

- **Dynamická interpolace**: V šabloně použijte zástupné symboly pro odkazování na proměnné, například `{{ ctx.user.userName }}` se automaticky nahradí odpovídajícím uživatelským jménem.
- **Podmíněné vykreslování**: Podporuje podmíněné příkazy (`{% if %}...{% else %}`), které zobrazují různý obsah na základě různých stavů dat.
- **Iterace (cykly)**: Použijte `{% for item in list %}...{% endfor %}` k procházení polí nebo **kolekcí** a generování seznamů, tabulek nebo opakujících se modulů.
- **Vestavěné filtry**: Nabízí bohatou sadu filtrů (například `upcase`, `downcase`, `date`, `truncate` atd.) pro formátování a zpracování dat.
- **Rozšiřitelnost**: Podporuje vlastní proměnné a funkce, díky čemuž je logika šablon opakovaně použitelná a snadno udržovatelná.
- **Bezpečnost a izolace**: Vykreslování šablon probíhá v izolovaném (sandboxovém) prostředí, což zabraňuje přímému spouštění nebezpečného kódu a zvyšuje bezpečnost.

Díky šablonovacímu enginu Liquid mohou vývojáři a tvůrci obsahu **snadno dosáhnout dynamického zobrazování obsahu, personalizovaného generování dokumentů a vykreslování šablon pro složité datové struktury**, což výrazně zvyšuje efektivitu a flexibilitu.

## Používání proměnných

Markdown na stránce podporuje běžné systémové proměnné (například aktuálního uživatele, aktuální roli atd.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Markdown ve vyskakovacím okně pro akci řádku bloku (nebo na podstránce) podporuje více proměnných datového kontextu (například aktuální záznam, aktuální záznam ve vyskakovacím okně atd.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## QR kód

V Markdownu můžete konfigurovat QR kódy.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```