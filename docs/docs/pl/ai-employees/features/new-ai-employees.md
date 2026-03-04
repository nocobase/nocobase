:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/ai-employees/features/new-ai-employees).
:::

# Nowy pracownik AI

Jeśli wbudowani pracownicy AI nie spełniają Państwa potrzeb, mogą Państwo utworzyć i dostosować własnego pracownika AI.

## Rozpoczęcie tworzenia

Proszę przejść do strony zarządzania `AI employees` i kliknąć `New AI employee`.

## Konfiguracja informacji podstawowych

W zakładce `Profile` należy skonfigurować następujące elementy:

- `Username`: unikalny identyfikator.
- `Nickname`: nazwa wyświetlana.
- `Position`: opis stanowiska.
- `Avatar`: awatar pracownika.
- `Bio`: krótki opis.
- `About me`: prompt systemowy.
- `Greeting message`: powitanie w rozmowie.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Ustawienia roli (Role setting)

W zakładce `Role setting` należy skonfigurować prompt systemowy (System Prompt) pracownika. Treść ta definiuje tożsamość pracownika, jego cele, granice pracy oraz styl wypowiedzi podczas rozmowy.

Zaleca się, aby treść zawierała co najmniej:

- Pozycjonowanie roli i zakres odpowiedzialności.
- Zasady obsługi zadań i strukturę odpowiedzi.
- Zakazy, granice informacji oraz styl i ton wypowiedzi.

Można wstawiać zmienne (np. aktualny użytkownik, aktualna rola, aktualny język, data i godzina), aby prompt automatycznie dostosowywał się do kontekstu w różnych rozmowach.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Konfiguracja umiejętności i wiedzy

W zakładce `Skills` należy skonfigurować uprawnienia do umiejętności; jeśli funkcja bazy wiedzy jest włączona, można kontynuować konfigurację w zakładkach powiązanych z bazą wiedzy.

## Zakończenie tworzenia

Proszę kliknąć `Submit`, aby zakończyć tworzenie.