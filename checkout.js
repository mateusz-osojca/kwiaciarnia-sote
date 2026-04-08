(function () {
  'use strict';

  /* ---- Closed days ---- */
  var CLOSED_DAYS = [];
  var CLOSED_REASONS = {};

  function loadClosedDays() {
    return fetch('_data/closed-days.json').then(function (r) {
      if (!r.ok) return;
      return r.json();
    }).then(function (data) {
      if (data && data.closedDays) {
        CLOSED_DAYS = [];
        CLOSED_REASONS = {};
        data.closedDays.forEach(function (d) {
          CLOSED_DAYS.push(d.date);
          if (d.reason) CLOSED_REASONS[d.date] = d.reason;
        });
      }
    }).catch(function () { /* ignore */ });
  }

  function isClosedDay(dateStr) {
    return CLOSED_DAYS.indexOf(dateStr) !== -1;
  }

  /* ---- Cart storage (localStorage) ---- */
  var CART_KEY = 'sote_cart';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addToCart(id, name, size, price) {
    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id && cart[i].size === size) {
        cart[i].qty += 1;
        saveCart(cart);
        return;
      }
    }
    cart.push({ id: id, name: name, size: size, price: price, qty: 1 });
    saveCart(cart);
  }

  function removeFromCart(id, size) {
    saveCart(getCart().filter(function (item) {
      return !(item.id === id && item.size === size);
    }));
  }

  function cartTotal() {
    return getCart().reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);
  }

  function getDeliveryFee() {
    var el = document.querySelector('input[name="delivery"]:checked');
    return (el && el.value === 'address') ? 25 : 0;
  }

  function updateNavCart() {
    var btn = document.getElementById('navCartBtn');
    if (!btn) return;
    var total = getCart().reduce(function (s, i) { return s + i.qty; }, 0);
    btn.classList.toggle('visible', total > 0);
    var badge = document.getElementById('navCartCount');
    if (badge) badge.textContent = total;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---- Time slots by day of week ---- */
  function getSlotsForDate(dateStr) {
    if (!dateStr) return [];
    if (isClosedDay(dateStr)) return null; // admin-set closed day
    if (dateStr === '2026-03-07') { // Sobota 7 marca – wyjątek (10:00–18:00)
      var exSlots = [];
      for (var eh = 10; eh < 18; eh++) {
        exSlots.push(pad(eh) + ':00');
        exSlots.push(pad(eh) + ':30');
      }
      return exSlots;
    }
    if (dateStr === '2026-03-08') { // Niedziela 8 marca – wyjątek (10:00–16:00)
      var exSlots = [];
      for (var eh = 10; eh < 16; eh++) {
        exSlots.push(pad(eh) + ':00');
        exSlots.push(pad(eh) + ':30');
      }
      return exSlots;
    }
    var d = new Date(dateStr + 'T12:00:00');
    var day = d.getDay(); // 0=Sun, 1=Mon…6=Sat
    if (day === 0) return null; // closed
    var end = (day === 6) ? 14 : 18;
    var slots = [];
    for (var h = 10; h < end; h++) {
      slots.push(pad(h) + ':00');
      slots.push(pad(h) + ':30');
    }
    return slots;
  }

  function updateTimeSlots(dateStr) {
    var select = document.getElementById('coPickupTime');
    var dateInput = document.getElementById('coPickupDate');
    if (!dateStr) {
      select.innerHTML = '<option value="">— najpierw wybierz datę —</option>';
      return;
    }
    var slots = getSlotsForDate(dateStr);
    if (slots === null) {
      var reason = CLOSED_REASONS[dateStr];
      var msg = reason
        ? 'Sklep jest nieczynny w tym dniu (' + reason + '). Wybierz inny dzień.'
        : 'Sklep jest nieczynny w tym dniu. Wybierz inny dzień.';
      alert(msg);
      dateInput.value = '';
      select.innerHTML = '<option value="">— najpierw wybierz datę —</option>';
      return;
    }
    var now = new Date();
    var todayStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    if (dateStr === todayStr) {
      var minTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      slots = slots.filter(function (t) {
        var slotDate = new Date(dateStr + 'T' + t + ':00');
        return slotDate >= minTime;
      });
    }
    if (slots.length === 0) {
      select.innerHTML = '<option value="">— dziś brak godzin, wybierz inny dzień —</option>';
      return;
    }
    select.innerHTML = '<option value="">— wybierz godzinę —</option>' + slots.map(function (t) {
      return '<option value="' + t + '">' + t + '</option>';
    }).join('');
  }

  /* ---- Delivery time ranges (2-hour windows) ---- */
  function getDeliverySlotsForDate(dateStr) {
    if (!dateStr) return [];
    if (isClosedDay(dateStr)) return null; // admin-set closed day
    var d = new Date(dateStr + 'T12:00:00');
    var day = d.getDay();
    if (day === 0) return null; // closed Sunday
    var end = (day === 6) ? 14 : 18;
    var slots = [];
    for (var h = 10; h + 2 <= end; h++) {
      slots.push(pad(h) + ':00\u2013' + pad(h + 2) + ':00');
    }
    return slots;
  }

  function updateDeliveryTimeSlots(dateStr) {
    var select = document.getElementById('coDeliveryTime');
    var dateInput = document.getElementById('coDeliveryDate');
    if (!dateStr) {
      select.innerHTML = '<option value="">— najpierw wybierz datę —</option>';
      return;
    }
    var slots = getDeliverySlotsForDate(dateStr);
    if (slots === null) {
      var reason = CLOSED_REASONS[dateStr];
      var msg = reason
        ? 'Sklep jest nieczynny w tym dniu (' + reason + '). Wybierz inny dzień.'
        : 'Sklep jest nieczynny w tym dniu. Wybierz inny dzień.';
      alert(msg);
      dateInput.value = '';
      select.innerHTML = '<option value="">— najpierw wybierz datę —</option>';
      return;
    }
    var now = new Date();
    var todayStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    if (dateStr === todayStr) {
      var minTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      slots = slots.filter(function (t) {
        var startHour = parseInt(t.split(':')[0], 10);
        var slotDate = new Date(dateStr + 'T' + pad(startHour) + ':00:00');
        return slotDate >= minTime;
      });
    }
    if (slots.length === 0) {
      select.innerHTML = '<option value="">— dziś brak godzin, wybierz inny dzień —</option>';
      return;
    }
    select.innerHTML = '<option value="">— wybierz przedział godzinowy —</option>' + slots.map(function (t) {
      return '<option value="' + t + '">' + t + '</option>';
    }).join('');
  }

  /* ---- Build modal HTML ---- */
  function buildModalHTML() {
    return '<div id="checkoutOverlay" class="checkout-overlay" hidden>' +
      '<div class="checkout-modal" role="dialog" aria-modal="true" aria-label="Złóż zamówienie">' +

        '<button class="checkout-close" id="checkoutClose" aria-label="Zamknij">&times;</button>' +

        '<form id="checkoutForm" class="checkout-form" novalidate>' +

          /* 1. Koszyk */
          '<div class="checkout-section">' +
            '<p class="checkout-section-heading">Koszyk</p>' +
            '<div id="coCartItems"></div>' +
            '<div class="cart-total-row">' +
              'Razem: <strong id="coCartTotal">0 zł</strong>' +
            '</div>' +
          '</div>' +

          /* 2. Zamawiający */
          '<div class="checkout-section">' +
            '<p class="checkout-section-heading">Zamawiający</p>' +
            '<div class="checkout-field">' +
              '<label for="coOrdName">Imię i nazwisko *</label>' +
              '<input type="text" id="coOrdName" autocomplete="name" placeholder="Jan Kowalski">' +
            '</div>' +
            '<div class="checkout-field">' +
              '<label for="coOrdEmail">E-mail *</label>' +
              '<input type="email" id="coOrdEmail" autocomplete="email" placeholder="jan@example.com">' +
            '</div>' +
            '<div class="checkout-field">' +
              '<label for="coOrdPhone">Telefon *</label>' +
              '<input type="tel" id="coOrdPhone" autocomplete="tel" placeholder="+48 600 000 000">' +
            '</div>' +
          '</div>' +

          /* 3. Odbiorca */
          '<div class="checkout-section" id="checkoutRecipientSection" hidden>' +
            '<p class="checkout-section-heading">Odbiorca</p>' +
            '<div class="checkout-field">' +
              '<label for="coRecName">Imię i nazwisko *</label>' +
              '<input type="text" id="coRecName" placeholder="Anna Nowak">' +
            '</div>' +
            '<div class="checkout-field">' +
              '<label for="coRecPhone">Telefon *</label>' +
              '<input type="tel" id="coRecPhone" placeholder="+48 700 000 000">' +
            '</div>' +
          '</div>' +

          /* 4. Dostawa */
          '<div class="checkout-section">' +
            '<p class="checkout-section-heading">Dostawa</p>' +
            '<div class="checkout-radio-group" id="deliveryRadioGroup">' +
              '<label class="checkout-radio-card active">' +
                '<input type="radio" name="delivery" value="pickup" checked>' +
                '<span class="checkout-radio-label">Odbiór osobisty</span>' +
              '</label>' +
              '<label class="checkout-radio-card">' +
                '<input type="radio" name="delivery" value="address">' +
                '<span class="checkout-radio-label">Dostawa pod adres <span class="delivery-fee-tag">+25 zł</span></span>' +
              '</label>' +
            '</div>' +
            '<div id="deliveryPickupFields" class="delivery-pickup-fields">' +
              '<div class="checkout-field">' +
                '<label for="coPickupDate">Data odbioru *</label>' +
                '<input type="date" id="coPickupDate">' +
              '</div>' +
              '<div class="checkout-field">' +
                '<label for="coPickupTime">Godzina odbioru *</label>' +
                '<select id="coPickupTime"><option value="">— najpierw wybierz datę —</option></select>' +
              '</div>' +
            '</div>' +
            '<div id="deliveryAddressFields" class="delivery-address-fields" hidden>' +
              '<div class="checkout-field">' +
                '<label for="coDeliveryDate">Data dostawy *</label>' +
                '<input type="date" id="coDeliveryDate">' +
              '</div>' +
              '<div class="checkout-field">' +
                '<label for="coDeliveryTime">Przedział godzinowy *</label>' +
                '<select id="coDeliveryTime"><option value="">— najpierw wybierz datę —</option></select>' +
              '</div>' +
              '<div class="checkout-field">' +
                '<label for="coAddrStreet">Ulica i numer *</label>' +
                '<input type="text" id="coAddrStreet" placeholder="ul. Różana 5">' +
              '</div>' +
              '<div class="checkout-field">' +
                '<label for="coAddrZip">Kod pocztowy *</label>' +
                '<input type="text" id="coAddrZip" placeholder="71-000">' +
              '</div>' +
              '<div class="checkout-field">' +
                '<label for="coAddrCity">Miasto *</label>' +
                '<input type="text" id="coAddrCity" value="Szczecin">' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* 5. Bilecik */
          '<div class="checkout-section">' +
            '<p class="checkout-section-heading">Bilecik</p>' +
            '<label class="checkout-checkbox-row">' +
              '<input type="checkbox" id="coWishesCheck">' +
              '<span>Chcę bilecik z życzeniami</span>' +
            '</label>' +
            '<div id="coWishesWrap" class="checkout-wishes-wrap" hidden>' +
              '<div class="checkout-field">' +
                '<label for="coWishesText">Treść życzeń</label>' +
                '<textarea id="coWishesText" class="checkout-wishes-text" rows="3" placeholder="Napisz życzenia..."></textarea>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* 7. Uwagi */
          '<div class="checkout-section">' +
            '<p class="checkout-section-heading">Dodatkowe uwagi</p>' +
            '<div class="checkout-field">' +
              '<textarea id="coNotes" rows="3" placeholder="Np. kolor wstążki, alergie, inne uwagi..."></textarea>' +
            '</div>' +
          '</div>' +

          '<button type="submit" class="btn btn-primary checkout-submit" id="coSubmitBtn">' +
            'Zamów i zapłać online' +
          '</button>' +

        '</form>' +

        '<div id="checkoutThankyou" class="checkout-thankyou" hidden>' +
          '<p class="checkout-thankyou-icon">&#10003;</p>' +
          '<h2>Zamówienie przyjęte!</h2>' +
          '<p>Twoje zamówienie zostanie wkrótce zrealizowane.</p>' +
          '<button class="btn btn-outline" onclick="closeCheckout()">Zamknij</button>' +
        '</div>' +

      '</div>' +
    '</div>';
  }

  /* ---- Init ---- */
  function init() {
    try {
      var container = document.createElement('div');
      container.innerHTML = buildModalHTML();
      document.body.appendChild(container.firstChild);
      bindEvents();
    } catch (e) { /* ignore */ }
    updateNavCart();
    setTimeout(updateNavCart, 0);
  }

  /* ---- Bind events ---- */
  function bindEvents() {
    document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
    document.getElementById('checkoutOverlay').addEventListener('click', function (e) {
      if (e.target === this) closeCheckout();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCheckout();
    });

    document.getElementById('coPickupDate').addEventListener('change', function () {
      updateTimeSlots(this.value);
    });

    document.getElementById('coDeliveryDate').addEventListener('change', function () {
      updateDeliveryTimeSlots(this.value);
    });

    document.querySelectorAll('input[name="delivery"]').forEach(function (r) {
      r.addEventListener('change', onDeliveryChange);
    });

    document.getElementById('coWishesCheck').addEventListener('change', function () {
      document.getElementById('coWishesWrap').hidden = !this.checked;
    });

    document.getElementById('checkoutForm').addEventListener('submit', handleSubmit);

    document.querySelectorAll('.checkout-radio-card input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var name = this.name;
        document.querySelectorAll('.checkout-radio-card input[name="' + name + '"]').forEach(function (other) {
          other.closest('.checkout-radio-card').classList.toggle('active', other.checked);
        });
      });
    });
  }

  /* ---- Render cart items ---- */
  function renderCartItems() {
    var cart = getCart();
    var container = document.getElementById('coCartItems');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = '<p class="cart-empty">Koszyk jest pusty.</p>';
      document.getElementById('coCartTotal').textContent = '0 zł';
      return;
    }

    var fee = getDeliveryFee();
    var feeRow = fee > 0
      ? '<div class="cart-fee-row">' +
          '<span class="cart-fee-label">Dostawa</span>' +
          '<span class="cart-fee-price">' + fee + ' zł</span>' +
        '</div>'
      : '';

    container.innerHTML = cart.map(function (item) {
      var eid = item.id.replace(/[^a-z0-9-]/g, '');
      var esize = item.size.replace(/[^a-zA-Z0-9]/g, '');
      return '<div class="cart-item">' +
        '<div class="cart-item-info">' +
          '<span class="cart-item-name">' + item.name + '</span>' +
          '<span class="checkout-summary-badge">' + item.size + '</span>' +
        '</div>' +
        '<div class="cart-item-qty-ctrl">' +
          '<button type="button" class="cart-qty-btn" data-action="dec" data-id="' + eid + '" data-size="' + esize + '">&#8722;</button>' +
          '<span class="cart-item-qty-val">' + item.qty + '</span>' +
          '<button type="button" class="cart-qty-btn" data-action="inc" data-id="' + eid + '" data-size="' + esize + '">&#43;</button>' +
        '</div>' +
        '<span class="cart-item-subtotal">' + (item.price * item.qty) + ' zł</span>' +
        '<button type="button" class="cart-item-remove" data-id="' + eid + '" data-size="' + esize + '" aria-label="Usuń">&times;</button>' +
      '</div>';
    }).join('') + feeRow;

    document.getElementById('coCartTotal').textContent = (cartTotal() + fee) + ' zł';

    container.querySelectorAll('.cart-qty-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.id;
        var size = this.dataset.size;
        var cart = getCart();
        for (var i = 0; i < cart.length; i++) {
          if (cart[i].id === id && cart[i].size === size) {
            cart[i].qty += (this.dataset.action === 'inc') ? 1 : -1;
            break;
          }
        }
        saveCart(cart.filter(function (item) { return item.qty > 0; }));
        renderCartItems();
      });
    });

    container.querySelectorAll('.cart-item-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeFromCart(this.dataset.id, this.dataset.size);
        renderCartItems();
      });
    });

    updateNavCart();
  }

  /* ---- Open / close ---- */
  window.addToCartAndOpen = function () {
    var id    = (typeof window.productId    !== 'undefined') ? window.productId    : '';
    var name  = (typeof window.productName  !== 'undefined') ? window.productName  : '';
    var size  = (typeof window.selectedSize !== 'undefined') ? window.selectedSize : 'S';
    var price = (typeof window.selectedPrice !== 'undefined') ? window.selectedPrice : 100;
    if (id) addToCart(id, name, size, price);
    window.openCheckout();
  };

  window.openCheckout = function () {
    var overlay = document.getElementById('checkoutOverlay');
    overlay.hidden = false;
    document.body.classList.add('checkout-open');

    var today = new Date().toISOString().split('T')[0];
    var dateInput = document.getElementById('coPickupDate');
    dateInput.setAttribute('min', today);
    updateTimeSlots(dateInput.value);
    document.getElementById('coDeliveryDate').setAttribute('min', today);

    document.getElementById('checkoutForm').hidden = false;
    document.getElementById('checkoutThankyou').hidden = true;

    renderCartItems();
  };

  window.closeCheckout = function () {
    document.getElementById('checkoutOverlay').hidden = true;
    document.body.classList.remove('checkout-open');
  };

  window.openCartOnly = function () {
    var overlay = document.getElementById('checkoutOverlay');
    overlay.hidden = false;
    document.body.classList.add('checkout-open');
    var dateInput = document.getElementById('coPickupDate');
    var today2 = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today2);
    updateTimeSlots(dateInput.value);
    document.getElementById('coDeliveryDate').setAttribute('min', today2);
    document.getElementById('checkoutForm').hidden = false;
    document.getElementById('checkoutThankyou').hidden = true;
    renderCartItems();
  };

  /* ---- Delivery toggle ---- */
  function onDeliveryChange() {
    var val = document.querySelector('input[name="delivery"]:checked').value;
    var isPickup = (val === 'pickup');
    document.getElementById('deliveryPickupFields').hidden = !isPickup;
    document.getElementById('deliveryAddressFields').hidden = isPickup;
    document.getElementById('checkoutRecipientSection').hidden = isPickup;

    renderCartItems();
    updateSubmitLabel();
  }

  /* ---- Submit button label ---- */
  function updateSubmitLabel() {
    document.getElementById('coSubmitBtn').textContent = 'Zamów i zapłać online';
  }

  function getPaymentMethod() {
    return 'online';
  }

  /* ---- Validation ---- */
  function validate() {
    if (getCart().length === 0) {
      alert('Koszyk jest pusty.');
      return false;
    }
    var isAddress = document.querySelector('input[name="delivery"]:checked').value === 'address';
    var checks = [
      { id: 'coOrdName',  label: 'Imię i nazwisko zamawiającego' },
      { id: 'coOrdEmail', label: 'E-mail zamawiającego' },
      { id: 'coOrdPhone', label: 'Telefon zamawiającego' },
    ];
    if (isAddress) {
      checks.push({ id: 'coRecName',  label: 'Imię i nazwisko odbiorcy' });
      checks.push({ id: 'coRecPhone', label: 'Telefon odbiorcy' });
    }
    var emailEl = document.getElementById('coOrdEmail');
    if (emailEl.value.trim() && !emailEl.value.includes('@')) {
      alert('Proszę wpisać poprawny adres e-mail.');
      emailEl.focus();
      return false;
    }
    for (var i = 0; i < checks.length; i++) {
      var el = document.getElementById(checks[i].id);
      if (!el.value.trim()) {
        alert('Proszę wypełnić: ' + checks[i].label);
        el.focus();
        return false;
      }
    }
    var delivery = document.querySelector('input[name="delivery"]:checked').value;
    if (delivery === 'pickup') {
      if (!document.getElementById('coPickupDate').value) {
        alert('Proszę wybrać datę odbioru.');
        document.getElementById('coPickupDate').focus();
        return false;
      }
      if (!document.getElementById('coPickupTime').value) {
        alert('Proszę wybrać godzinę odbioru.');
        document.getElementById('coPickupTime').focus();
        return false;
      }
    } else {
      if (!document.getElementById('coDeliveryDate').value) {
        alert('Proszę wybrać datę dostawy.');
        document.getElementById('coDeliveryDate').focus();
        return false;
      }
      if (!document.getElementById('coDeliveryTime').value) {
        alert('Proszę wybrać przedział godzinowy dostawy.');
        document.getElementById('coDeliveryTime').focus();
        return false;
      }
      if (!document.getElementById('coAddrStreet').value.trim()) {
        alert('Proszę wpisać ulicę i numer.');
        document.getElementById('coAddrStreet').focus();
        return false;
      }
      if (!document.getElementById('coAddrZip').value.trim()) {
        alert('Proszę wpisać kod pocztowy.');
        document.getElementById('coAddrZip').focus();
        return false;
      }
    }
    return true;
  }

  /* ---- Collect form data ---- */
  function collectData() {
    var cart = getCart();
    var delivery = document.querySelector('input[name="delivery"]:checked').value;
    var wishesChecked = document.getElementById('coWishesCheck').checked;
    var adres = '';
    if (delivery === 'address') {
      adres = document.getElementById('coAddrStreet').value.trim()
        + ', ' + document.getElementById('coAddrZip').value.trim()
        + ' ' + document.getElementById('coAddrCity').value.trim();
    }
    var fee = getDeliveryFee();
    var koszyk = cart.map(function (item) {
      return item.name + ' (' + item.size + ') \u00d7 ' + item.qty + ' = ' + (item.price * item.qty) + ' z\u0142';
    }).join('\n');
    if (fee > 0) koszyk += '\nDostawa = ' + fee + ' z\u0142';

    return {
      items:                cart,
      koszyk:               koszyk,
      'Koszt dostawy':      fee > 0 ? fee + ' zł' : 'brak',
      razem:                (cartTotal() + fee) + ' zł',
      imie_zamawiajacego:   document.getElementById('coOrdName').value.trim(),
      email_zamawiajacego:  document.getElementById('coOrdEmail').value.trim(),
      telefon_zamawiajacego:document.getElementById('coOrdPhone').value.trim(),
      imie_odbiorcy:        document.getElementById('coRecName').value.trim(),
      telefon_odbiorcy:     document.getElementById('coRecPhone').value.trim(),
      dostawa:              delivery === 'pickup' ? 'Odbiór osobisty' : 'Dostawa pod adres',
      data:                 delivery === 'pickup' ? document.getElementById('coPickupDate').value : document.getElementById('coDeliveryDate').value,
      godzina:              delivery === 'pickup' ? document.getElementById('coPickupTime').value : document.getElementById('coDeliveryTime').value,
      adres:                adres,
      platnosc:             getPaymentMethod() === 'cash' ? 'gotówka' : 'online (Przelewy24)',
      bilecik:              wishesChecked ? 'tak' : 'nie',
      zyczenia:             wishesChecked ? document.getElementById('coWishesText').value.trim() : '',
      uwagi:                document.getElementById('coNotes').value.trim(),
    };
  }

  /* ---- Submit handler ---- */
  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (getPaymentMethod() === 'cash') {
      submitCash();
    } else {
      submitOnline();
    }
  }

  /* ---- Cash path → Netlify Function ---- */
  function submitCash() {
    var data = collectData();
    var btn = document.getElementById('coSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Wysyłanie...';

    fetch('/.netlify/functions/cash-order', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (json.ok) {
          saveCart([]);
          updateNavCart();
          document.getElementById('checkoutForm').hidden = true;
          document.getElementById('checkoutThankyou').hidden = false;
        } else {
          alert('Wystąpił błąd przy wysyłaniu zamówienia. Spróbuj ponownie lub skontaktuj się z nami bezpośrednio.');
          btn.disabled = false;
          updateSubmitLabel();
        }
      })
      .catch(function () {
        alert('Błąd połączenia. Sprawdź internet i spróbuj ponownie.');
        btn.disabled = false;
        updateSubmitLabel();
      });
  }

  /* ---- Online path → Stripe Checkout ---- */
  function submitOnline() {
    var data = collectData();
    var btn = document.getElementById('coSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Przekierowywanie...';

    fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (json.url) {
          saveCart([]);
          window.location.href = json.url;
        } else {
          btn.disabled = false;
          updateSubmitLabel();
        }
      })
      .catch(function () {
        btn.disabled = false;
        updateSubmitLabel();
      });
  }

  /* ---- Bootstrap ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      loadClosedDays().then(init);
    });
  } else {
    loadClosedDays().then(init);
  }

  window.addEventListener('pageshow', function () {
    updateNavCart();
  });

})();
