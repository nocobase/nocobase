:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Používání kontextových proměnných

Díky kontextovým proměnným můžete přímo znovu využít informace z aktuální stránky, uživatele, času nebo filtrovacích podmínek. To vám umožní dynamicky vykreslovat grafy a propojovat je na základě aktuálního kontextu.

## Oblast použití
- Při dotazování dat v režimu Builder: vyberte proměnné pro filtrovací podmínky.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Při dotazování dat v režimu SQL: při psaní příkazů vyberte proměnné a vložte výrazy (například `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- V možnostech grafů v režimu Custom: přímo pište JS výrazy.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- U interaktivních událostí (například kliknutí pro otevření podrobného dialogu a předání dat): přímo pište JS výrazy.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Poznámka:**
- Neobklopujte `{{ ... }}` jednoduchými ani dvojitými uvozovkami; systém provádí bezpečné navázání na základě typu proměnné (řetězec, číslo, čas, NULL).
- Pokud je proměnná `NULL` nebo nedefinovaná, zpracujte explicitně logiku prázdných hodnot v SQL pomocí `COALESCE(...)` nebo `IS NULL`.