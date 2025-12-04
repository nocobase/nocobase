:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled

Vývoj serverových pluginů pro NocoBase nabízí širokou škálu funkcí a možností, které vývojářům pomáhají přizpůsobit a rozšířit základní funkce NocoBase. Níže naleznete přehled hlavních možností a souvisejících kapitol:

| Modul                                   | Popis                                                                                                     | Související kapitola                               |
| :-------------------------------------- | :-------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| **Třída pluginu**                       | Vytváření a správa serverových pluginů, rozšiřování základních funkcí.                                    | [plugin.md](plugin.md)                             |
| **Databázové operace**                  | Poskytuje rozhraní pro databázové operace, podporuje CRUD operace a správu transakcí.                     | [database.md](database.md)                         |
| **Vlastní kolekce**                     | Přizpůsobení struktur kolekcí na základě obchodních potřeb pro flexibilní správu datových modelů.         | [collections.md](collections.md)                   |
| **Kompatibilita dat při aktualizaci pluginu** | Zajišťuje, že aktualizace pluginu neovlivní stávající data, provádí migraci dat a zajišťuje kompatibilitu. | [migration.md](migration.md)                       |
| **Správa externích zdrojů dat**         | Integrace a správa externích zdrojů dat pro umožnění datové interakce.                                    | [data-source-manager.md](data-source-manager.md) |
| **Vlastní API**                         | Rozšíření správy API zdrojů psaním vlastních rozhraní.                                                    | [resource-manager.md](resource-manager.md)         |
| **Správa oprávnění API**                | Přizpůsobení oprávnění API pro jemně odstupňovanou kontrolu přístupu.                                     | [acl.md](acl.md)                                   |
| **Zachycení a filtrování požadavků/odpovědí API** | Přidání interceptorů nebo middleware pro požadavky a odpovědi k řešení úloh, jako je logování, autentizace atd. | [context.md](context.md) a [middleware.md](middleware.md) |
| **Naslouchání událostem**               | Naslouchání systémovým událostem (např. z aplikace nebo databáze) a spouštění odpovídajících handlerů.   | [event.md](event.md)                               |
| **Správa cache**                        | Správa cache pro zlepšení výkonu aplikace a rychlosti odezvy.                                             | [cache.md](cache.md)                               |
| **Plánované úlohy**                     | Vytváření a správa plánovaných úloh, jako je pravidelné čištění, synchronizace dat atd.                   | [cron-job-manager.md](cron-job-manager.md)       |
| **Podpora více jazyků**                 | Integrace podpory více jazyků pro implementaci internacionalizace a lokalizace.                           | [i18n.md](i18n.md)                                 |
| **Výstup logů**                         | Přizpůsobení formátů logů a metod výstupu pro zlepšení možností ladění a monitorování.                   | [logger.md](logger.md)                             |
| **Vlastní příkazy**                     | Rozšíření NocoBase CLI přidáním vlastních příkazů.                                                        | [command.md](command.md)                           |
| **Psaní testovacích případů**           | Psaní a spouštění testovacích případů pro zajištění stability a funkční přesnosti pluginu.                | [test.md](test.md)                                 |