:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/ai-employees/features/task).
:::

# Szybkie zadania

Aby umożliwić pracownikom AI bardziej efektywne rozpoczęcie pracy, mogą Państwo powiązać ich z blokami scenariuszy i wstępnie skonfigurować kilka typowych zadań.

Dzięki temu użytkownicy mogą rozpocząć przetwarzanie zadań jednym kliknięciem, bez konieczności każdorazowego **wybierania bloku** i **wprowadzania poleceń**.

## Powiązanie pracownika AI z blokiem

Po przejściu do trybu edycji interfejsu użytkownika, w blokach obsługujących `Actions`, należy wybrać menu `AI employees` pod `Actions`, a następnie wskazać konkretnego pracownika AI. Zostanie on powiązany z bieżącym blokiem.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Po zakończeniu powiązania, przy każdym wejściu na stronę, w obszarze `Actions` bloku wyświetlany będzie pracownik AI przypisany do tego bloku.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Konfiguracja zadań

W trybie edycji interfejsu użytkownika należy najechać kursorem na ikonę pracownika AI powiązanego z blokiem. Pojawi się przycisk menu – należy wybrać `Edit tasks`, aby przejść do strony ustawień zadań.

Na stronie ustawień zadań mogą Państwo dodać wiele zadań dla danego pracownika AI.

Każda karta reprezentuje niezależne zadanie. Aby dodać nowe zadanie, należy kliknąć symbol „+” obok karty.

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

Formularz ustawień zadania:

- W polu `Title` należy wpisać tytuł zadania. Krótki opis pojawi się na liście zadań pracownika AI.
- W polu `Background` należy wprowadzić główną treść zadania. Treść ta posłuży jako instrukcja systemowa (system prompt) podczas rozmowy z pracownikiem AI.
- W polu `Default user message` należy wpisać domyślną wiadomość użytkownika. Zostanie ona automatycznie wstawiona do pola wprowadzania po wybraniu zadania.
- W sekcji `Work context` należy wybrać domyślne informacje o kontekście aplikacji przesyłane do pracownika AI. Działa to w taki sam sposób, jak w panelu czatu.
- Selektor `Skills` pokazuje umiejętności dostępne dla bieżącego pracownika AI. Można odznaczyć wybraną umiejętność, aby pracownik AI ignorował ją podczas wykonywania tego konkretnego zadania.
- Pole wyboru `Send default user message automatically` określa, czy po kliknięciu zadania domyślna wiadomość użytkownika ma zostać wysłana automatycznie.


## Lista zadań

Po skonfigurowaniu zadań dla pracownika AI, będą one widoczne w oknie popover profilu pracownika oraz w wiadomości powitalnej przed rozpoczęciem rozmowy. Kliknięcie zadania spowoduje jego wykonanie.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)