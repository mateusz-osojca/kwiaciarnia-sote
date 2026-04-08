# Kwiaciarnia Sote – Kontekst projektu

## Co zostało zrobione

### Pliki projektu
```
prjkt_Ada/
├── index.html                        ← strona główna
├── o-mnie.html                       ← podstrona o mnie
├── sklep.html                        ← podstrona sklep (6 bukietów)
├── warsztaty.html                    ← podstrona warsztaty + formularz zapisu
├── style.css                         ← wszystkie style (wspólne)
├── checkout.js                       ← modal zamówienia (shared, ładowany na wszystkich str. produktów)
├── produkt-bukiet-polny.html         ← strona produktu
├── produkt-lawendowa-mgla.html       ← strona produktu
├── produkt-wiosenne-marzenie.html    ← strona produktu
├── produkt-rozana-historia.html      ← strona produktu
├── produkt-bialy-sen.html            ← strona produktu
├── produkt-sloneczne-poludnie.html   ← strona produktu
├── INSTRUKCJA.md                     ← instrukcja konfiguracji (Snipcart, Formspree, Netlify)
├── KONTEKST.md                       ← ten plik
└── images/
    ├── kompozycje/     ← zdjęcia bukietów (używane na stronie głównej i w sklepie)
    ├── omnie/          ← zdjęcie Ady (używane na stronie głównej i o-mnie.html)
    └── main/           ← zdjęcia hero (ada1.jpg aktualnie użyte jako tło)
```

### Decyzje projektowe
- **Nazwa:** Kwiaciarnia Sote
- **Właścicielka:** Ada (nie Marta)
- **Miasto:** Szczecin (nie Warszawa / Warszawie → Szczecinie)
- **Paleta:** ultra-delikatny róż (#ddb8c0) + delikatna zieleń (#b6ccb4), tło kremowe
- **Czcionki:** Cormorant Garamond (nagłówki, italic) + Nunito (treść)
- **Koszyk:** Snipcart (wymaga konfiguracji – patrz INSTRUKCJA.md)
- **Formularz warsztatów:** Formspree (wymaga konfiguracji – patrz INSTRUKCJA.md)

### Hero (sekcja główna index.html)
- **Zdjęcie:** `images/main/ada1.jpg` — portretowe, `background-position: center 42%`
- **Overlay:** `linear-gradient(rgba(0,0,0,0.38), rgba(0,0,0,0.38))`
- **Padding (domyślnie):** `10rem 2rem 9rem`
- **Duże ekrany (`min-width: 1200px`):** `max-width: 2200px`, `min-height: 92vh` — sekcja wysoka, obraz nie jest nadmiernie przycięty
- **Mobile (`max-width: 640px`):** `background-position: center top`, padding zmniejszony

### Strony produktów (bukiety)
- Każdy bukiet ma osobną podstronę: `produkt-[slug].html`
- Struktura: breadcrumb → galeria (główne zdjęcie + 4 miniatury klikalne) → info (kategoria, nazwa, wybór rozmiaru S/M/L, cena, opis, przycisk koszyka)
- Rozmiary (placeholder): S = 100 zł, M = 200 zł, L = 300 zł
- Galeria JS: kliknięcie miniatury podmienia główne zdjęcie
- Rozmiar JS: kliknięcie rozmiaru aktualizuje `selectedSize`, `selectedPrice` i wyświetlaną cenę
- **"Dodaj do koszyka" tylko na stronach produktów** — otwiera modal zamówienia
- Każda strona deklaruje zmienne globalnie przez `var` (nie `const`/`let` — muszą być dostępne jako `window.*` dla checkout.js):
  - `var productId` — slug produktu (np. `'bukiet-polny'`)
  - `var productName` — nazwa wyświetlana (np. `'Bukiet Polny'`)
  - `var selectedSize` — aktualnie wybrany rozmiar, domyślnie `'S'`
  - `var selectedPrice` — aktualnie wybrana cena, domyślnie `100`

### Modal zamówienia (checkout.js)
- Plik `checkout.js` ładowany na wszystkich 6 stronach produktów przed `</body>`
- Jest IIFE (immediately invoked function expression) — nie zanieczyszcza globalnego scope
- Przycisk "Dodaj do koszyka" wywołuje globalną `openCheckout()` — otwiera modal overlay
- `closeCheckout()` również globalna — używana przez przycisk "Zamknij" w panelu potwierdzenia

**Sekcje modala:**
1. **Ilość** — input number 1–10; w tym samym wierszu: `[qty] [szt.] [Nazwa bukietu] [rozmiar]` … `Razem: X zł` (live update)
2. **Zamawiający** — imię i nazwisko, telefon
3. **Odbiorca** — imię i nazwisko, telefon
4. **Dostawa** — radio: Odbiór osobisty / Dostawa pod adres
   - Odbiór: pokazuje datę + godzinę (sloty co 30 min, 9:00–17:00)
   - Dostawa: pokazuje ulicę, kod pocztowy, miasto
5. **Płatność**
   - Odbiór osobisty: radio Gotówka / Płatność online (Przelewy24)
   - Dostawa pod adres: tylko stały napis "Płatność online (Przelewy24)" — brak wyboru
6. **Bilecik** — checkbox "Chcę bilecik z życzeniami" → textarea z treścią życzeń
7. **Uwagi** — opcjonalne textarea

**Ścieżki po złożeniu:**
- **Gotówka przy odbiorze** → POST JSON do Formspree (`FORM_ID_CASH`) → panel potwierdzenia "Zamówienie przyjęte! Ada skontaktuje się z Tobą wkrótce."
- **Płatność online** → `Snipcart.api.cart.items.add(...)` z 6 custom fields → `Snipcart.api.theme.cart.open()` → klient płaci przez Przelewy24

**Custom fields przekazywane do Snipcart (max 10, używamy 6):**
- Sposób dostawy, Data / Godzina (lub Adres dostawy), Zamawiający, Odbiorca, Bilecik, Uwagi

**Snipcart skip-cart:** `item.added` event → `Snipcart.api.theme.cart.open({ step: 'checkout_shipping' })` — pomija widok koszyka, przechodzi od razu do płatności

**Znana pułapka:** zmienne na stronach produktów muszą być `var`, nie `const`/`let` — tylko `var` tworzy właściwości `window`, z których korzysta checkout.js

**Do skonfigurowania przed uruchomieniem:** zastąpić `FORM_ID_CASH` w `checkout.js` (ok. linia 148) prawdziwym ID formularza Formspree

### Kafelki produktów (index.html i sklep.html)
- Ceny wyświetlane jako trzy osobne obrysowane prostokąty: `S – 100 zł`, `M – 200 zł`, `L – 300 zł`
- CSS: `.product-price-tags` (flex, gap) + `.price-tag` (border, border-radius: 6px, padding)
- Jeden przycisk "**Wybierz bukiet**" — link do strony produktu, nie dodaje do koszyka

### Co zostało usunięte / zmienione względem oryginału
- Usunięta sekcja "Trzy filary" (Kwiaty sezonowe / Każdy bukiet inny / Dostawa w Szczecinie) z index.html
- Usunięte pola z wartościami (Sezonowość, Lokalność, Uważność, Prostota) z o-mnie.html
- Usunięty napis "Polecane" nad "Dostępne kompozycje"
- Usunięta podpowiedź pod "Dostępne kompozycje"
- Usunięta ikona z przycisku Koszyk
- Zaokrąglone rogi przywrócone (border-radius: 14px)

### Zdjęcia
- **Hero (tło):** `images/main/ada1.jpg` — portretowe, position center 42%
- **Produkt 1 (Bukiet Polny):** `images/kompozycje/489780407_...jpg`
- **Produkt 2 (Różana Historia):** `images/kompozycje/496936694_...jpg`
- **Produkt 3 (Wiosenne Marzenie):** `images/kompozycje/527551963_...jpg`
- **O mnie (split, index):** `images/omnie/549802983_...jpg`
- **O mnie (podstrona):** `images/omnie/549802983_...jpg`
- Zdjęcia na stronach produktów i w sklep.html (produkty 4–6) to nadal **placeholdery picsum** – do zastąpienia

### Responsywność
- Hamburger menu: breakpoint **768px** (nav zwija się do hamburgera)
- Treść (gridy, padding): breakpoint **640px**
- Dodatkowy breakpoint **400px** dla bardzo małych ekranów
- Duże ekrany: breakpoint **1200px** (hero max-width + min-height)
- iOS form zoom fix: font-size 16px na inputach
- Przyciski hero na mobile: pełna szerokość, ułożone pionowo
- Strona produktu: grid 2-kolumnowy → 1-kolumnowy poniżej 640px

---

## Co jeszcze do zrobienia

- [ ] Zastąpić placeholder picsum zdjęciami na stronach produktów (wszystkie 6)
- [ ] Zastąpić placeholder picsum zdjęciami w `sklep.html` (produkty 4–6 + sekcja "Klasyki")
- [ ] Zastąpić placeholder picsum zdjęciami w `warsztaty.html` (3 warsztaty)
- [ ] Zaktualizować prawdziwe ceny S/M/L dla każdego bukietu
- [ ] Skonfigurować Snipcart (klucz API, Stripe, email) – patrz INSTRUKCJA.md Krok 3
- [ ] Skonfigurować Formspree dla zamówień gotówkowych: zastąpić `FORM_ID_CASH` w `checkout.js`
- [ ] Skonfigurować Formspree (formularz warsztatów) – patrz INSTRUKCJA.md Krok 4
- [ ] Uzupełnić prawdziwy adres, telefon, email, Instagram we wszystkich plikach
- [ ] Zaktualizować terminy i ceny warsztatów w `warsztaty.html`
- [ ] Wdrożyć stronę (Netlify) – patrz INSTRUKCJA.md Krok 5
- [ ] Po wdrożeniu: Snipcart użyje `window.location.href` jako URL produktu (już ustawione w checkout.js — brak dalszych zmian)

---

## Jak kontynuować pracę z Claude

Po otwarciu nowej sesji powiedz Claude:
> "Pracujemy nad stroną Kwiaciarnia Sote w folderze prjkt_Ada na Pulpicie. Przeczytaj plik KONTEKST.md żeby wiedzieć co zostało zrobione."

Claude może wtedy przeczytać ten plik i od razu wiedzieć gdzie jesteśmy.
