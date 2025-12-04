:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Ukončit pracovní postup

Když se tento uzel spustí, okamžitě ukončí aktuálně běžící pracovní postup se stavem nakonfigurovaným v uzlu. Obvykle se používá pro řízení toku na základě specifické logiky, kdy po splnění určitých logických podmínek opustíte aktuální pracovní postup a zastavíte provádění následných procesů. Lze jej přirovnat k instrukci `return` v programovacích jazycích, která slouží k ukončení aktuálně prováděné funkce.

## Přidání uzlu

V rozhraní pro konfiguraci pracovního postupu klikněte na tlačítko plus („+“) v toku, abyste přidali uzel „Ukončit pracovní postup“:

![Ukončit pracovní postup_Přidat](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Konfigurace uzlu

![Ukončit pracovní postup_Konfigurace uzlu](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Stav ukončení

Stav ukončení ovlivní konečný stav provedení pracovního postupu. Lze jej nakonfigurovat jako „Úspěšné“ nebo „Selhalo“. Když provádění pracovního postupu dosáhne tohoto uzlu, okamžitě se ukončí s nakonfigurovaným stavem.

:::info{title=Poznámka}
Při použití v pracovním postupu typu „Událost před akcí“ dojde k zachycení požadavku, který akci inicioval. Podrobnosti naleznete v [Použití „Události před akcí“](../triggers/pre-action).

Kromě zachycení požadavku, který akci inicioval, konfigurace stavu ukončení ovlivní také stav zpětné vazby v „zprávě odpovědi“ pro tento typ pracovního postupu.
:::