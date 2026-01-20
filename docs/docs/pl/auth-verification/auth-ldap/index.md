---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# Uwierzytelnianie: LDAP

## Wprowadzenie

Wtyczka Uwierzytelnianie: LDAP działa zgodnie ze standardem protokołu LDAP (Lightweight Directory Access Protocol), pozwalając użytkownikom logować się do NocoBase przy użyciu danych uwierzytelniających z serwera LDAP.

## Aktywacja wtyczki

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Dodawanie uwierzytelniania LDAP

Proszę przejść do strony zarządzania wtyczkami uwierzytelniania użytkowników.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Dodaj - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Konfiguracja

### Konfiguracja podstawowa

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Automatyczna rejestracja, gdy użytkownik nie istnieje – Czy automatycznie tworzyć nowego użytkownika, jeśli nie znaleziono pasującego istniejącego użytkownika.
- Adres URL serwera LDAP
- Bind DN – DN używany do testowania połączenia z serwerem i wyszukiwania użytkowników.
- Hasło Bind DN – Hasło dla Bind DN.
- Testuj połączenie – Proszę kliknąć przycisk, aby przetestować połączenie z serwerem i sprawdzić poprawność Bind DN.

### Konfiguracja wyszukiwania

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN – DN używany do wyszukiwania użytkowników.
- Filtr wyszukiwania – Warunek filtrowania do wyszukiwania użytkowników, gdzie `{{account}}` reprezentuje konto użytkownika używane do logowania.
- Zakres – `Base`, `One level`, `Subtree`, domyślnie `Subtree`.
- Limit rozmiaru – Rozmiar strony wyszukiwania.

### Mapowanie atrybutów

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Użyj tego pola do powiązania użytkownika – Pole używane do powiązania z istniejącymi użytkownikami. Proszę wybrać „nazwa użytkownika”, jeśli konto logowania to nazwa użytkownika, lub „e-mail”, jeśli jest to adres e-mail. Domyślnie jest to nazwa użytkownika.
- Mapa atrybutów – Mapowanie atrybutów użytkownika na pola w tabeli użytkowników NocoBase.

## Logowanie

Proszę przejść na stronę logowania i wprowadzić nazwę użytkownika oraz hasło LDAP w formularzu logowania.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>