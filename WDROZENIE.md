# Kwiaciarnia Sote – Instrukcja wdrożenia produkcyjnego

Dokument opisuje cały proces wdrożenia strony od zera oraz co należy zmienić przy zmianie konta Netlify, Stripe lub Formspree.

---

## Architektura systemu

```
Zamówienie gotówkowe (odbiór osobisty):
  Klient → formularz → /.netlify/functions/cash-order → Formspree → e-mail do Ady

Zamówienie online (karta / Przelewy24):
  Klient → formularz → /.netlify/functions/create-checkout → Stripe Checkout → klient płaci
                                                           → Stripe webhook
                                                           → /.netlify/functions/stripe-webhook
                                                           → Formspree → e-mail do Ady
```

**Używane serwisy:**

| Serwis     | Do czego                          | Koszt                            |
|------------|-----------------------------------|----------------------------------|
| Netlify    | Hosting strony + funkcje serwera  | Darmowy (125k req/miesiąc)       |
| Stripe     | Płatności online (karta, P24)     | 0 zł miesięcznie + 1,5% + 0,25€ |
| Formspree  | Wysyłka e-maili z zamówieniami    | Darmowy do 50 zamówień/miesiąc   |

---

## Zmienne środowiskowe (podsumowanie)

Wszystkie trzy zmienne ustawia się w **Netlify → Site configuration → Environment variables**.

| Zmienna                 | Skąd ją wziąć                                      |
|-------------------------|----------------------------------------------------|
| `STRIPE_SECRET_KEY`     | Stripe Dashboard → Developers → API keys           |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → endpoint |
| `FORMSPREE_FORM_ID`     | Formspree Dashboard → nazwa formularza → Settings  |

---

## Kolejność wdrożenia (pierwsze uruchomienie)

> Ważne: Stripe webhook wymaga działającego URL-a Netlify. Dlatego najpierw wdrażamy stronę, potem konfigurujemy webhook.

---

### Krok 1 – Wdrożenie na Netlify (wstępne)

1. Wejdź na **netlify.com** → zaloguj się lub utwórz konto
2. Na stronie głównej przeciągnij folder `prjkt_Ada` w pole **"Drop your site folder here"**
3. Netlify opublikuje stronę pod adresem podobnym do `random-name.netlify.app`
4. **Zanotuj ten adres** – będzie potrzebny w kroku z webhookiem Stripe

Opcjonalnie – zmiana adresu na czytelny:
- **Site configuration → General → Site details → Change site name**
- Lub podłącz własną domenę: **Domain management → Add custom domain**

---

### Krok 2 – Formspree

1. Wejdź na **formspree.io** → utwórz konto
2. Kliknij **+ New Form**
3. Podaj nazwę (np. `Zamówienia Sote`) i **adres e-mail Ady** jako odbiorcę
4. Skopiuj **ID formularza** – to 8-znakowy ciąg, np. `xpwzkgdo`
   - Znajdziesz go w ustawieniach formularza lub w URL: `formspree.io/f/xpwzkgdo`

---

### Krok 3 – Stripe: konto i klucz API

1. Wejdź na **stripe.com** → utwórz konto (wymaga danych firmy dla trybu live)
2. Po zalogowaniu w Stripe Dashboard przejdź do:
   **Developers → API keys**
3. Skopiuj **Secret key**:
   - Tryb testowy: zaczyna się od `sk_test_...`
   - Tryb live (produkcyjny): zaczyna się od `sk_live_...`

> W trybie testowym możesz testować płatności bez prawdziwych pieniędzy.
> Do produkcji użyj klucza `sk_live_...`.

---

### Krok 4 – Stripe: włącz Przelewy24

1. W Stripe Dashboard → **Settings → Payment methods**
2. Znajdź **Przelewy24** → kliknij **Enable**
3. Przelewy24 pojawi się automatycznie dla klientów płacących w PLN

---

### Krok 5 – Stripe: webhook (powiadomienie po płatności)

1. W Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL:**
   ```
   https://TWOJ-ADRES.netlify.app/.netlify/functions/stripe-webhook
   ```
   Zastąp `TWOJ-ADRES` adresem z Kroku 1.
3. **Events to listen:** wybierz `checkout.session.completed`
4. Kliknij **Add endpoint**
5. Wejdź w nowo dodany webhook → kliknij **Reveal** przy **Signing secret**
6. Skopiuj wartość zaczynającą się od `whsec_...`

---

### Krok 6 – Zmienne środowiskowe w Netlify

1. W Netlify Dashboard → **Site configuration → Environment variables → Add variable**
2. Dodaj wszystkie trzy zmienne:

| Klucz                   | Wartość                              |
|-------------------------|--------------------------------------|
| `STRIPE_SECRET_KEY`     | `sk_live_...` (z Kroku 3)            |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (z Kroku 5)              |
| `FORMSPREE_FORM_ID`     | `xpwzkgdo` (z Kroku 2, tylko samo ID) |

---

### Krok 7 – Ponowne wdrożenie

Zmienne środowiskowe działają dopiero po kolejnym wdrożeniu.

1. Netlify Dashboard → **Deploys**
2. Kliknij **Trigger deploy → Deploy site**

---

### Krok 8 – Weryfikacja

Złóż testowe zamówienie każdego typu:

**Zamówienie gotówkowe:**
1. Wejdź na stronę produktu → kliknij „Zamów bukiet"
2. Wypełnij formularz, wybierz **Odbiór osobisty** + **Gotówka przy odbiorze**
3. Kliknij „Zamów – zapłacę przy odbiorze"
4. Sprawdź skrzynkę Ady – powinien przyjść e-mail z Formspree

**Zamówienie online:**
1. Wypełnij formularz, wybierz **Dostawa pod adres** (lub odbiór z płatnością online)
2. Kliknij „Zamów i zapłać online"
3. W Stripe Checkout użyj karty testowej: `4242 4242 4242 4242`, dowolna data i CVC
4. Po płatności sprawdź skrzynkę Ady

---

## Zmiana konta lub serwisu

### Zmiana konta Stripe

Co się zmienia: klucze API i webhook.

1. **Nowy klucz API:**
   - Nowe konto Stripe → Developers → API keys → skopiuj nowy `sk_live_...`
   - Netlify → Environment variables → zaktualizuj `STRIPE_SECRET_KEY`

2. **Nowy webhook:**
   - Nowe konto Stripe → Developers → Webhooks → Add endpoint
   - URL bez zmian (adres Netlify pozostaje ten sam)
   - Skopiuj nowy `whsec_...`
   - Netlify → Environment variables → zaktualizuj `STRIPE_WEBHOOK_SECRET`

3. **Przelewy24:** włącz ponownie w nowym koncie (Krok 4)

4. Netlify → Deploys → **Trigger deploy**

---

### Zmiana konta Netlify (nowy URL strony)

Co się zmienia: adres URL strony, który jest wpisany w Stripe webhook.

1. Wdróż stronę na nowe konto Netlify (przeciągnij folder ponownie)
2. Dodaj wszystkie trzy zmienne środowiskowe (Krok 6)
3. **Zaktualizuj webhook w Stripe:**
   - Stripe → Developers → Webhooks → usuń stary endpoint
   - Dodaj nowy endpoint z nowym adresem Netlify (Krok 5)
   - Zaktualizuj `STRIPE_WEBHOOK_SECRET` jeśli się zmienił
4. Trigger deploy na nowym koncie Netlify

---

### Zmiana konta Formspree

Co się zmienia: tylko ID formularza.

1. Utwórz nowy formularz na Formspree (Krok 2)
2. Netlify → Environment variables → zaktualizuj `FORMSPREE_FORM_ID`
3. Netlify → Deploys → **Trigger deploy**

---

## Tryb testowy vs. produkcyjny (Stripe)

| Tryb       | Klucz API         | Płatności              | Kiedy używać          |
|------------|-------------------|------------------------|-----------------------|
| Testowy    | `sk_test_...`     | Karta `4242...`, fałszywe pieniądze | Podczas konfiguracji |
| Live       | `sk_live_...`     | Prawdziwe karty i P24  | Na produkcji          |

Przy przejściu z testu na produkcję:
1. Zmień `STRIPE_SECRET_KEY` na `sk_live_...`
2. Usuń stary webhook testowy, dodaj nowy live webhook (nowy `whsec_...`)
3. Zaktualizuj `STRIPE_WEBHOOK_SECRET`
4. Trigger deploy

---

## Przydatne linki

| Serwis    | Panel zarządzania                        |
|-----------|------------------------------------------|
| Netlify   | app.netlify.com                          |
| Stripe    | dashboard.stripe.com                     |
| Formspree | formspree.io/dashboard                   |
