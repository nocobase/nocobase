---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Szyfrowanie

## Wprowadzenie

Niektóre prywatne dane biznesowe, takie jak numery telefonów klientów, adresy e-mail, numery kart itp., mogą zostać zaszyfrowane. Po zaszyfrowaniu są one przechowywane w bazie danych w postaci zaszyfrowanej (jako szyfrogram).

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Metody szyfrowania

:::warning
Wtyczka automatycznie generuje `klucz aplikacji`, który jest przechowywany w katalogu `/storage/apps/main/encryption-field-keys`.

Plik `klucza aplikacji` ma nazwę będącą identyfikatorem klucza z rozszerzeniem `.key`. Proszę nie zmieniać nazwy pliku.

Proszę bezpiecznie przechowywać plik `klucza aplikacji`. W przypadku jego utraty zaszyfrowane dane nie będą mogły zostać odszyfrowane.

Jeśli wtyczka jest włączona dla podaplikacji, klucz jest domyślnie zapisywany w katalogu `/storage/apps/${sub-application name}/encryption-field-keys`.
:::

### Zasada działania

Wykorzystuje szyfrowanie kopertowe (Envelope Encryption).

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Proces tworzenia kluczy
1.  Przy pierwszym tworzeniu zaszyfrowanego pola automatycznie generowany jest 32-bitowy `klucz aplikacji` i zapisywany w domyślnym katalogu przechowywania w kodowaniu Base64.
2.  Przy każdym tworzeniu nowego zaszyfrowanego pola generowany jest losowy 32-bitowy `klucz pola` dla tego pola, a następnie szyfrowany za pomocą `klucza aplikacji` i losowo wygenerowanego 16-bitowego `wektora szyfrującego pola` (algorytm szyfrowania `AES`) i zapisywany w polu `options` tabeli `fields`.

### Proces szyfrowania pola
1.  Przy każdym zapisie danych do zaszyfrowanego pola najpierw pobierany jest zaszyfrowany `klucz pola` oraz `wektor szyfrujący pola` z pola `options` tabeli `fields`.
2.  Zaszyfrowany `klucz pola` jest odszyfrowywany za pomocą `klucza aplikacji` i `wektora szyfrującego pola`, a następnie dane są szyfrowane za pomocą `klucza pola` i losowo wygenerowanego 16-bitowego `wektora szyfrującego dane` (algorytm szyfrowania `AES`).
3.  Dane są podpisywane za pomocą odszyfrowanego `klucza pola` (algorytm skrótu `HMAC-SHA256`) i konwertowane do ciągu znaków w kodowaniu Base64 (uzyskany `podpis danych` jest następnie wykorzystywany do wyszukiwania danych).
4.  16-bitowy `wektor szyfrujący dane` i zaszyfrowany `szyfrogram danych` są łączone binarnie i konwertowane do ciągu znaków w kodowaniu Base64.
5.  Ciąg znaków `podpisu danych` w kodowaniu Base64 i połączony ciąg znaków `szyfrogramu danych` w kodowaniu Base64 są łączone za pomocą separatora `.`.
6.  Ostateczny połączony ciąg znaków jest zapisywany w bazie danych.

## Zmienne środowiskowe

Aby określić niestandardowy `klucz aplikacji`, proszę ustawić zmienną środowiskową `ENCRYPTION_FIELD_KEY_PATH`. Wtyczka załaduje plik z tej ścieżki jako `klucz aplikacji`.

**Wymagania dla pliku klucza aplikacji:**
1.  Rozszerzenie pliku musi być `.key`.
2.  Nazwa pliku będzie używana jako identyfikator klucza; zaleca się użycie UUID w celu zapewnienia unikalności.
3.  Zawartość pliku musi być 32-bitowymi danymi binarnymi zakodowanymi w Base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Konfiguracja pola

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Wpływ szyfrowania na filtrowanie

Zaszyfrowane pola obsługują tylko następujące operacje: równa się, nie równa się, istnieje, nie istnieje.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Metoda filtrowania danych:
1.  Pobierany jest `klucz pola` zaszyfrowanego pola i odszyfrowywany za pomocą `klucza aplikacji`.
2.  Używa się `klucza pola` do podpisania tekstu wprowadzonego przez użytkownika (algorytm skrótu `HMAC-SHA256`).
3.  Podpisany tekst jest łączony z separatorem `.` i w bazie danych wykonywane jest wyszukiwanie z dopasowaniem prefiksu dla zaszyfrowanego pola.

## Rotacja kluczy

:::warning
Przed użyciem polecenia `nocobase key-rotation` proszę upewnić się, że wtyczka została załadowana.
:::

Podczas migracji aplikacji do nowego środowiska można użyć polecenia `nocobase key-rotation`, aby zastąpić `klucz aplikacji`.

Uruchomienie polecenia rotacji kluczy wymaga podania `klucza aplikacji` ze starego środowiska. Po wykonaniu zostanie wygenerowany nowy `klucz aplikacji` i zapisany (w kodowaniu Base64) w domyślnym katalogu.

```bash
# --key-path określa klucz aplikacji ze starego środowiska
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Aby zrotować `klucz aplikacji` podaplikacji, proszę dodać parametr `--app-name`:

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```