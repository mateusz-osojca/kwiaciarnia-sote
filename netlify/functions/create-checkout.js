const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* ── Authoritative price table – never trust the browser ── */
const SIZE_PRICES = { XS: 100, S: 150, M: 250, L: 350, XL: 450, XXL: 650 };
const DELIVERY_FEE = 25;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const items = data.items || [];

    if (!items.length) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Koszyk jest pusty' }),
      };
    }

    const line_items = [];

    for (const item of items) {
      const serverPrice = SIZE_PRICES[item.size];
      if (!serverPrice) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Nieprawidłowy rozmiar: ' + item.size }),
        };
      }
      const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
      line_items.push({
        price_data: {
          currency: 'pln',
          product_data: { name: item.name + ' (' + item.size + ')' },
          unit_amount: serverPrice * 100,
        },
        quantity: qty,
      });
    }

    const isDelivery = data.dostawa === 'Dostawa pod adres';
    if (isDelivery) {
      line_items.push({
        price_data: {
          currency: 'pln',
          product_data: { name: 'Dostawa' },
          unit_amount: DELIVERY_FEE * 100,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      locale: 'pl',
      line_items: line_items,
      mode: 'payment',
      customer_email: data.email_zamawiajacego,
      metadata: {
        koszyk:          (data.koszyk || '').substring(0, 500),
        razem:           data.razem || '',
        zamawiajacy:     data.imie_zamawiajacego || '',
        tel_zamawiajacy: data.telefon_zamawiajacego || '',
        odbiorca:        data.imie_odbiorcy || '',
        tel_odbiorca:    data.telefon_odbiorcy || '',
        dostawa:         data.dostawa || '',
        data_godzina:    data.data ? data.data + ' / ' + data.godzina : '',
        adres:           data.adres || '',
        bilecik:         data.bilecik || '',
        zyczenia:        (data.zyczenia || '').substring(0, 500),
        uwagi:           (data.uwagi || '').substring(0, 500),
      },
      success_url: process.env.URL + '/potwierdzenie.html',
      cancel_url:  process.env.URL + '/sklep.html',
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Błąd serwera' }),
    };
  }
};
