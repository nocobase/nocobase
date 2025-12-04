:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Magazyn wektorowy

## Wprowadzenie

W bazie wiedzy, podczas zapisywania dokumentów są one wektoryzowane. Podobnie, podczas wyszukiwania dokumentów, wektoryzowane są terminy wyszukiwania. Oba te procesy wymagają użycia `Embedding model` do wektoryzacji oryginalnego tekstu.

W wtyczce AI Baza Wiedzy, magazyn wektorowy to powiązanie `Embedding model` z bazą danych wektorów.

## Zarządzanie magazynem wektorowym

Proszę przejść do strony konfiguracji wtyczki AI Pracownicy, kliknąć zakładkę `Vector store`, a następnie wybrać `Vector store`, aby przejść do strony zarządzania magazynem wektorowym.

![20251023003023](https://static-docs.nocobase.com/20251023003023.png)

Proszę kliknąć przycisk `Add new` w prawym górnym rogu, aby dodać nowy magazyn wektorowy:

- W polu `Name` proszę wprowadzić nazwę magazynu wektorowego;
- W `Vector store` proszę wybrać już skonfigurowaną bazę danych wektorów. Proszę zapoznać się z: [Baza danych wektorów](/ai-employees/knowledge-base/vector-database);
- W `LLM service` proszę wybrać już skonfigurowaną usługę LLM. Proszę zapoznać się z: [Zarządzanie usługą LLM](/ai-employees/quick-start/llm-service);
- W polu `Embedding model` proszę wprowadzić nazwę `Embedding model`, który ma być użyty;

Proszę kliknąć przycisk `Submit`, aby zapisać informacje o magazynie wektorowym.

![20251023003121](https://static-docs.nocobase.com/20251023003121.png)