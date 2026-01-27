:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vektorová databáze

## Úvod

V databázi znalostí vektorová databáze ukládá vektorizované dokumenty znalostní báze. Vektorizované dokumenty fungují jako index pro tyto dokumenty.

Pokud je v konverzaci s AI agentem povoleno RAG vyhledávání, zpráva uživatele je vektorizována a z vektorové databáze jsou načítány fragmenty dokumentů znalostní báze, aby se nalezly relevantní odstavce a původní text dokumentů.

V současné době plugin AI znalostní báze nativně podporuje pouze vektorovou databázi PGVector, což je plugin pro databázi PostgreSQL.

## Správa vektorové databáze

Přejděte na konfigurační stránku pluginu AI agenta, klikněte na záložku `Vector store` a vyberte `Vector database`, čímž se dostanete na stránku správy vektorové databáze.

![20251022233704](https://static-docs.nocobase.com/20251022233704.png)

Klikněte na tlačítko `Add new` v pravém horním rohu pro přidání nového připojení k vektorové databázi `PGVector`:

- Do pole `Name` zadejte název připojení.
- Do pole `Host` zadejte IP adresu vektorové databáze.
- Do pole `Port` zadejte číslo portu vektorové databáze.
- Do pole `Username` zadejte uživatelské jméno k vektorové databázi.
- Do pole `Password` zadejte heslo k vektorové databázi.
- Do pole `Database` zadejte název databáze.
- Do pole `Table name` zadejte název tabulky, který se použije při vytváření nové tabulky pro ukládání vektorových dat.

Po zadání všech potřebných informací klikněte na tlačítko `Test`, abyste ověřili dostupnost služby vektorové databáze, a poté klikněte na tlačítko `Submit` pro uložení informací o připojení.

![20251022234644](https://static-docs.nocobase.com/20251022234644.png)