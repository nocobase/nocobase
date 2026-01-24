:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# RAG Vyhledávání

## Úvod

Po konfiguraci znalostní báze můžete v nastavení AI zaměstnanců povolit funkci RAG.

Jakmile je RAG povoleno, když uživatel konverzuje s AI zaměstnancem, AI zaměstnanec použije RAG vyhledávání k načtení dokumentů ze znalostní báze na základě zprávy uživatele a odpoví na základě těchto načtených dokumentů.

## Povolení RAG

Přejděte na stránku konfigurace pluginu AI zaměstnanců, klikněte na záložku `AI employees` a dostanete se na stránku správy AI zaměstnanců.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Vyberte AI zaměstnance, pro kterého chcete povolit RAG, klikněte na tlačítko `Edit` (Upravit) a přejděte na stránku úprav AI zaměstnance.

Na záložce `Knowledge base` (Znalostní báze) zapněte přepínač `Enable` (Povolit).

- Do pole `Knowledge Base Prompt` (Výzva znalostní báze) zadejte výzvu pro odkazování na znalostní bázi. `{knowledgeBaseData}` je pevný zástupný symbol a neměl by být upravován.
- V `Knowledge Base` (Znalostní báze) vyberte nakonfigurovanou znalostní bázi. Viz: [Znalostní báze](/ai-employees/knowledge-base/knowledge-base).
- Do vstupního pole `Top K` zadejte počet dokumentů k vyhledání, výchozí hodnota je 3.
- Do vstupního pole `Score` (Skóre) zadejte prahovou hodnotu relevance dokumentů pro vyhledávání.

Klikněte na tlačítko `Submit` (Odeslat) pro uložení nastavení AI zaměstnance.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)