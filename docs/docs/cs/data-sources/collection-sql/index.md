---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# SQL kolekce

## Úvod

SQL kolekce poskytuje výkonnou metodu pro získávání dat pomocí SQL dotazů. Extrakcí datových polí prostřednictvím SQL dotazů a konfigurací souvisejících metadat polí můžete tato pole používat, jako byste pracovali se standardní tabulkou (kolekcí). Tato funkce je obzvláště výhodná pro scénáře zahrnující složité dotazy s JOIN, statistické analýzy a další.

## Uživatelská příručka

### Vytvoření nové SQL kolekce

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Ve vstupním poli pro SQL zadejte svůj SQL dotaz a klikněte na Spustit (Execute). Systém poté analyzuje dotaz, aby určil zapojené tabulky a pole, a automaticky extrahuje relevantní metadata polí ze zdrojových tabulek.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Pokud je systémová analýza zdrojových tabulek a polí nesprávná, můžete ručně vybrat příslušné tabulky a pole, abyste zajistili použití správných metadat. Nejprve vyberte zdrojovou tabulku a poté zvolte odpovídající pole v sekci zdroj polí níže.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. U polí, která nemají přímý zdroj, systém odvodí typ pole na základě datového typu. Pokud je tento odhad nesprávný, můžete ručně vybrat správný typ pole.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. Při konfiguraci každého pole můžete v oblasti náhledu vidět jeho zobrazení, což vám umožní okamžitě vidět dopad vašich nastavení.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. Po dokončení konfigurace a potvrzení, že je vše správně, klikněte na tlačítko Potvrdit (Confirm) pod vstupním polem SQL, abyste dokončili odeslání.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Úpravy

1. Pokud potřebujete upravit SQL dotaz, klikněte na tlačítko Upravit (Edit), abyste přímo změnili SQL příkaz a podle potřeby překonfigurovali pole.

2. Chcete-li upravit metadata polí, použijte možnost Konfigurovat pole (Configure fields), která vám umožní aktualizovat nastavení polí stejně jako u běžné tabulky (kolekce).

### Synchronizace

Pokud se SQL dotaz nezměnil, ale podkladová struktura databázové tabulky byla upravena, můžete synchronizovat a překonfigurovat pole výběrem Konfigurovat pole (Configure fields) - Synchronizovat z databáze (Sync from database).

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### SQL kolekce vs. propojené databázové pohledy

| Typ šablony                | Nejvhodnější pro                                                                                              | Metoda implementace | Podpora CRUD operací |
| :------------------------- | :------------------------------------------------------------------------------------------------------------ | :------------------ | :------------------- |
| SQL                        | Jednoduché modely, odlehčené scénáře použití<br />Omezená interakce s databází<br />Vyhýbání se údržbě pohledů<br />Preferujete operace řízené uživatelským rozhraním | SQL poddotaz        | Nepodporováno        |
| Propojení s databázovým pohledem | Složité modely<br />Vyžaduje interakci s databází<br />Potřeba úpravy dat<br />Vyžaduje silnější a stabilnější databázovou podporu | Databázový pohled   | Částečně podporováno |

:::warning
Při používání SQL kolekce se ujistěte, že vybíráte tabulky, které jsou spravovatelné v rámci NocoBase. Používání tabulek ze stejné databáze, které nejsou připojeny k NocoBase, může vést k nepřesné analýze SQL dotazů. Pokud je to problém, zvažte vytvoření a propojení s pohledem.
:::