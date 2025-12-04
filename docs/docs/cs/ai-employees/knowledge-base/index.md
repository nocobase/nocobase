:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled

## Úvod

Plugin AI znalostní báze poskytuje AI agentům možnosti RAG vyhledávání.

Díky možnostem RAG vyhledávání mohou AI agenti při odpovídání na dotazy uživatelů poskytovat přesnější, profesionálnější a pro podnik relevantnější odpovědi.

Využitím odborných a interních podnikových dokumentů ze znalostní báze spravované administrátorem se zvyšuje přesnost a sledovatelnost odpovědí AI agentů.

### Co je RAG

RAG (Retrieval Augmented Generation) znamená „Vyhledávání-Rozšíření-Generování“.

- **Vyhledávání:** Dotaz uživatele je převeden na vektor pomocí Embedding modelu (např. BERT). Vektorová knihovna následně vyvolá Top-K relevantních textových bloků prostřednictvím hustého vyhledávání (sémantická podobnost) nebo řídkého vyhledávání (shoda klíčových slov).
- **Rozšíření:** Výsledky vyhledávání jsou spojeny s původním dotazem a tvoří rozšířený prompt, který je následně vložen do kontextového okna LLM.
- **Generování:** LLM kombinuje rozšířený prompt k vygenerování konečné odpovědi, čímž zajišťuje faktickou správnost a sledovatelnost.

## Instalace

1. Přejděte na stránku Správce pluginů.
2. Najděte plugin `AI: Knowledge base` a aktivujte jej.

![20251022224818](https://static-docs.nocobase.com/20251022224818.png)