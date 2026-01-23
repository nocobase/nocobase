:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wyszukiwanie RAG

## Wprowadzenie

Po skonfigurowaniu bazy wiedzy mogą Państwo włączyć funkcję RAG w ustawieniach pracownika AI.

Po włączeniu RAG, gdy użytkownik rozmawia z pracownikiem AI, pracownik AI wykorzysta wyszukiwanie RAG, aby pobrać dokumenty z bazy wiedzy na podstawie wiadomości użytkownika i odpowiedzieć w oparciu o znalezione dokumenty.

## Włączanie RAG

Proszę przejść do strony konfiguracji wtyczki pracownika AI, a następnie kliknąć zakładkę `AI employees`, aby wejść na stronę zarządzania pracownikami AI.

![20251023010811](https://static-docs.nocobase.com/20251023010811.png)

Proszę wybrać pracownika AI, dla którego chcą Państwo włączyć RAG, a następnie kliknąć przycisk `Edit`, aby przejść do strony edycji pracownika AI.

W zakładce `Knowledge base` proszę włączyć przełącznik `Enable`.

- W polu `Knowledge Base Prompt` proszę wprowadzić komunikat odwołujący się do bazy wiedzy. `{knowledgeBaseData}` to stały symbol zastępczy, którego nie należy modyfikować;
- W polu `Knowledge Base` proszę wybrać skonfigurowaną bazę wiedzy. Zobacz: [Baza wiedzy](/ai-employees/knowledge-base/knowledge-base);
- W polu `Top K` proszę wprowadzić liczbę dokumentów do wyszukania. Domyślnie jest to 3;
- W polu `Score` proszę wprowadzić próg trafności dokumentów podczas wyszukiwania;

Proszę kliknąć przycisk `Submit`, aby zapisać ustawienia pracownika AI.

![20251023010844](https://static-docs.nocobase.com/20251023010844.png)