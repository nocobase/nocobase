---
pkg: "@nocobase/plugin-calendar"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Blok Kalendarza

## Wprowadzenie

Blok Kalendarza oferuje usprawniony sposób przeglądania i zarządzania wydarzeniami oraz danymi związanymi z datami w formacie kalendarza, co czyni go idealnym do planowania spotkań, wydarzeń i efektywnej organizacji czasu.

## Instalacja

Ta wtyczka jest preinstalowana, więc nie wymaga dodatkowej konfiguracji.

## Dodawanie bloków

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  **Pole tytułu**: Służy do wyświetlania informacji na paskach kalendarza. Obecnie obsługuje typy pól takie jak `input` (jednowierszowy tekst), `select` (pojedynczy wybór), `phone` (telefon), `email` (e-mail), `radioGroup` (grupa pól wyboru) i `sequence` (sekwencja). Obsługiwane typy pól tytułu można rozszerzyć za pomocą wtyczek.
2.  **Czas rozpoczęcia**: Wskazuje, kiedy zadanie się rozpoczyna.
3.  **Czas zakończenia**: Określa, kiedy zadanie się kończy.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Kliknięcie paska zadania podświetla go i otwiera szczegółowe okno pop-up.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Opcje konfiguracji bloku

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Wyświetlanie kalendarza księżycowego

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

### Ustawianie zakresu danych

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Więcej informacji znajdą Państwo w .

### Ustawianie wysokości bloku

Przykład: Dostosowanie wysokości bloku kalendarza zamówień. Wewnątrz bloku kalendarza nie pojawi się pasek przewijania.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Więcej informacji znajdą Państwo w .

### Pole koloru tła

:::info{title=Wskazówka}
Wymagana jest wersja NocoBase v1.4.0-beta lub nowsza.
:::

Ta opcja pozwala skonfigurować kolor tła wydarzeń w kalendarzu. Sposób użycia jest następujący:

1.  Tabela danych kalendarza musi zawierać pole typu **Pojedynczy wybór (Single select)** lub **Grupa pól wyboru (Radio group)**, a to pole musi mieć skonfigurowane kolory.
2.  Następnie, proszę wrócić do interfejsu konfiguracji bloku kalendarza i w polu **Pole koloru tła** wybrać pole, dla którego właśnie skonfigurowano kolory.
3.  Na koniec, mogą Państwo spróbować wybrać kolor dla wydarzenia w kalendarzu i kliknąć przycisk „Zapisz”. Zobaczą Państwo, że kolor został zastosowany.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Dzień rozpoczęcia tygodnia

> Obsługiwane w wersji v1.7.7 i nowszych

Blok kalendarza umożliwia ustawienie dnia rozpoczęcia tygodnia, pozwalając wybrać **Niedzielę** lub **Poniedziałek** jako pierwszy dzień tygodnia.
Domyślnym dniem rozpoczęcia jest **Poniedziałek**, co ułatwia użytkownikom dostosowanie wyświetlania kalendarza do regionalnych zwyczajów, zapewniając lepsze doświadczenie użytkownika.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Konfiguracja operacji

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Dzisiaj

Przycisk „Dzisiaj” w Bloku Kalendarza oferuje szybką nawigację, umożliwiając użytkownikom natychmiastowy powrót do bieżącej daty po przeglądaniu innych dat.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Zmiana widoku

Domyślny widok to Miesiąc.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)