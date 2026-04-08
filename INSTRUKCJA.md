# Kwiaciarnia Sote – Instrukcja uruchomienia strony

---

## Struktura plików

```
prjkt_Ada/
├── index.html        ← strona główna
├── o-mnie.html       ← o mnie
├── sklep.html        ← sklep (6 bukietów)
├── warsztaty.html    ← warsztaty + formularz zapisu
├── style.css         ← wszystkie style (wspólne dla wszystkich stron)
└── INSTRUKCJA.md     ← ten plik
```

---

## Krok 1 – Zdjęcia

Obecne zdjęcia to **placeholdery** z picsum.photos – losowe obrazki, które należy zastąpić prawdziwymi fotos.

W każdym pliku HTML znajdź linijki wyglądające tak:

```html
<img ... src="https://picsum.photos/seed/meadow-sote/600/480" alt="Bukiet Polny">
```

Zamień `src="..."` na ścieżkę do własnego zdjęcia, np.:

```html
<img ... src="zdjecia/bukiet-polny.jpg" alt="Bukiet Polny">
```

### Zalecana organizacja zdjęć

Utwórz folder `zdjecia/` w katalogu projektu i wrzuć do niego fotos:

```
zdjecia/
├── hero.jpg                  ← zdjęcie główne na stronie głównej (ok. 1400px szer.)
├── o-mnie.jpg                ← Twoje zdjęcie (portretowe)
├── bukiet-polny.jpg
├── lawendowa-mgla.jpg
├── wiosenne-marzenie.jpg
├── rozana-historia.jpg
├── bialy-sen.jpg
├── sloneczne-poludnie.jpg
├── warsztat-suche-kwiaty.jpg
├── warsztat-wianki.jpg
└── warsztat-stol.jpg
```

### Parametry zdjęć produktów

- Format: JPG lub WebP
- Proporcje: **4:3** lub **1:1** (kwadrat)
- Minimalna szerokość: **600px**
- Maksymalna waga: **300 KB** (użyj np. squoosh.app do kompresji)

---

## Krok 2 – Dane kontaktowe

W **każdym** pliku HTML (index, o-mnie, sklep, warsztaty) znajdź i zaktualizuj:

```html
ul. Różana 14         ← zmień na prawdziwy adres
Szczecin              ← miasto

Pon–Pt: 9:00–18:00    ← godziny otwarcia
Sob: 9:00–15:00

+48 600 000 000       ← telefon (też w href="tel:+48600000000")

hello@kwiaciarniasote.pl  ← e-mail (też w href="mailto:...")

@kwiaciarnia.sote     ← Instagram (w o-mnie.html)
```

W stopce strony głównej (`index.html`) jest też:

```html
<p class="hero-eyebrow">Kwiaciarnia Sote &bull; Szczecin</p>
```

---

## Krok 3 – Sklep online (Snipcart + Stripe)

Snipcart to gotowy koszyk zakupowy działający na statycznych stronach HTML.
Obsługuje płatności kartą przez Stripe i wysyła e-maile z potwierdzeniem zamówienia.

**Koszt:** bezpłatnie do 10 zamówień/miesiąc, potem 2% od wartości zamówienia + opłaty Stripe (~1,5% + 0,25€).

### Jak skonfigurować

#### 1. Konto Snipcart

1. Wejdź na **https://snipcart.com** → kliknij „Start for free"
2. Utwórz konto (e-mail + hasło)
3. Po zalogowaniu przejdź do **Account → API Keys**
4. Skopiuj **Public API Key** (zaczyna się od długiego ciągu liter/cyfr)

#### 2. Wstaw klucz do plików HTML

W **każdym** pliku HTML (index, o-mnie, sklep, warsztaty) na dole znajdź:

```html
<div hidden id="snipcart" data-api-key="TWÓJ_KLUCZ_PUBLICZNY_SNIPCART" data-currency="pln"></div>
```

Zastąp `TWÓJ_KLUCZ_PUBLICZNY_SNIPCART` swoim kluczem, np.:

```html
<div hidden id="snipcart" data-api-key="abc123XYZ..." data-currency="pln"></div>
```

#### 3. Podłącz Stripe (płatności kartą)

1. W panelu Snipcart → **Payment → Gateway**
2. Wybierz **Stripe**
3. Kliknij „Connect with Stripe" → zostaniesz przekierowana do Stripe
4. Utwórz konto Stripe (lub zaloguj się) i potwierdź połączenie
5. Stripe w Polsce obsługuje: karty Visa/Mastercard, Apple Pay, Google Pay

#### 4. Skonfiguruj e-mail z zamówieniami

1. W panelu Snipcart → **Account → Notifications**
2. Ustaw swój adres e-mail jako odbiorcę powiadomień o zamówieniach
3. Możesz też dostosować treść maila do klienta

#### 5. Ustaw domenę strony

1. W panelu Snipcart → **Domains & URLs**
2. Wpisz adres swojej strony (np. `kwiaciarniasote.pl`)
3. **Ważne:** Snipcart weryfikuje ceny produktów odpytując Twoją stronę.
   Strona musi być publicznie dostępna pod tym adresem (patrz Krok 5 – Wdrożenie).

#### 6. Zaktualizuj data-item-url w produktach

W `sklep.html` i `index.html` każdy przycisk „Do koszyka" ma atrybut:

```html
data-item-url="/sklep.html"
```

Po wdrożeniu zmień na pełny adres z domeną:

```html
data-item-url="https://kwiaciarniasote.pl/sklep.html"
```

---

## Krok 4 – Formularz zapisu na warsztaty (Formspree)

Formularz na stronie `warsztaty.html` wysyła zgłoszenia na Twój e-mail.

**Koszt:** bezpłatnie do 50 zgłoszeń/miesiąc.

### Jak skonfigurować

1. Wejdź na **https://formspree.io** → „Get Started" (bezpłatnie)
2. Zaloguj się i kliknij **„+ New Form"**
3. Podaj nazwę (np. „Warsztaty Sote") i swój adres e-mail
4. Skopiuj ID formularza – wygląda tak: `xpwzkgdo` (8 znaków)
5. W pliku `warsztaty.html` znajdź:

```html
<form action="https://formspree.io/f/TWOJ_FORMULARZ_ID" method="POST">
```

Zastąp `TWOJ_FORMULARZ_ID` swoim ID:

```html
<form action="https://formspree.io/f/xpwzkgdo" method="POST">
```

6. Od teraz każde zgłoszenie z formularza trafi na Twój e-mail z danymi klientki i wybranym warsztatem.

---

## Krok 5 – Wdrożenie strony (publikacja w internecie)

Polecam **Netlify** – darmowe, proste, nie wymaga wiedzy technicznej.

### Przez przeciągnięcie folderu (najprościej)

1. Wejdź na **https://netlify.com** → „Sign up" (darmowe konto)
2. Po zalogowaniu na stronie głównej zobaczysz:
   > „Want to deploy a new site without connecting to Git? Drag and drop your site output folder here."
3. Przeciągnij folder `prjkt_Ada` (cały, z wszystkimi plikami) w to pole
4. Netlify opublikuje stronę pod adresem podobnym do `random-name-123.netlify.app`
5. Możesz zmienić adres na własną domenę w ustawieniach (np. `kwiaciarniasote.pl`)

### Podłączenie własnej domeny

1. Kup domenę np. na **home.pl** lub **domeny.pl** (ok. 50–80 zł/rok)
2. W panelu Netlify → **Domain settings → Add custom domain**
3. Postępuj zgodnie z instrukcjami Netlify dotyczącymi ustawień DNS u rejestatora

---

## Krok 6 – Aktualizacja cen i treści

### Sklep – zmiana ceny produktu

W `sklep.html` i `index.html` każdy produkt ma dwa miejsca z ceną:

```html
<p class="product-price">89 zł</p>       ← wyświetlana cena (zmień ją)

data-item-price="89.00"                   ← cena dla koszyka (zmień ją też!)
```

Obie wartości muszą być zgodne. Cena w `data-item-price` musi być liczbą z kropką (np. `149.00`).

### Warsztaty – zmiana terminów

W `warsztaty.html` każdy warsztat ma:

```html
<p class="workshop-date">15 marca 2025 &bull; godz. 10:00</p>
```

Zmień datę i godzinę według potrzeb.

### Status miejsc na warsztacie

Trzy dostępne klasy CSS:

```html
<span class="workshop-status status-open">Wolne miejsca</span>   ← zielony
<span class="workshop-status status-few">Ostatnie miejsca</span>  ← pomarańczowy
<span class="workshop-status status-full">Brak miejsc</span>      ← czerwony
```

Zmień klasę i tekst według aktualnej sytuacji.

---

## Krok 7 – Logo i favicon (opcjonalnie)

Obecne „logo" to tekst stylizowany czcionką. Jeśli chcesz dodać graficzne logo:

1. W każdym pliku HTML znajdź:
```html
<a href="index.html" class="nav-logo">Kwiaciarnia&nbsp;<em>Sote</em></a>
```

2. Zamień na:
```html
<a href="index.html" class="nav-logo">
  <img src="zdjecia/logo.png" alt="Kwiaciarnia Sote" style="height:40px;">
</a>
```

Favicon (ikonka w zakładce przeglądarki) – dodaj do `<head>` każdego pliku:

```html
<link rel="icon" href="zdjecia/favicon.ico" type="image/x-icon">
```

---

## Alternatywa bez płatności online

Jeśli nie chcesz konfigurować Snipcart/Stripe na razie, możesz:

1. Zastąp przyciski „Do koszyka" linkiem do formularza kontaktowego
2. Klientka wysyła zgłoszenie z wybranym bukietem
3. Ty wysyłasz numer do przelewu lub numer BLIK
4. Po potwierdzeniu płatności kompletujesz i dostarczasz zamówienie

To rozwiązanie jest **powszechne wśród małych polskich kwiaciarni** i nie wymaga żadnej konfiguracji technicznej poza Formspree.

---

## Przydatne linki

| Serwis | Co robi | Link |
|--------|---------|------|
| Snipcart | Koszyk + płatności online | https://snipcart.com |
| Stripe | Bramka płatności (przez Snipcart) | https://stripe.com/pl |
| Formspree | Formularze → e-mail | https://formspree.io |
| Netlify | Hosting strony (darmowy) | https://netlify.com |
| Squoosh | Kompresja zdjęć | https://squoosh.app |
| Google Fonts | Czcionki (już załadowane) | https://fonts.google.com |
| Picsum Photos | Obecne zdjęcia-placeholder | https://picsum.photos |

---

## Kolory strony (na przyszłość)

Jeśli chcesz coś zmienić w kolorystyce, edytuj zmienne w pliku `style.css` na samym początku:

```css
:root {
  --pink:       #ddb8c0;   /* główny różowy */
  --pink-dark:  #b8929e;   /* ciemniejszy różowy (linki, akcenty) */
  --green:      #b6ccb4;   /* główna zieleń */
  --green-dark: #7fa47d;   /* ciemniejsza zieleń */
  --text:       #4a3c3c;   /* kolor tekstu */
  --text-mid:   #7d6a6a;   /* szary tekst */
  --bg:         #fdfaf9;   /* tło strony */
  --bg-pink:    #faf3f4;   /* delikatne różowe tło sekcji */
  --bg-green:   #f3f7f2;   /* delikatne zielone tło sekcji */
}
```

---

*Pytania? Coś nie działa? Skontaktuj się z osobą, która robiła stronę.*
