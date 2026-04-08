const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: 'Webhook signature verification failed' };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Ignored' };
  }

  const session = stripeEvent.data.object;
  const m = session.metadata;

  const orderData = {
    _subject:              'Sote - zamowienie',
    koszyk:                m.koszyk || '',
    razem:                 (session.amount_total / 100) + ' zł',
    imie_zamawiajacego:    m.zamawiajacy,
    email_zamawiajacego:   session.customer_email,
    telefon_zamawiajacego: m.tel_zamawiajacy,
    imie_odbiorcy:         m.odbiorca,
    telefon_odbiorcy:      m.tel_odbiorca,
    dostawa:               m.dostawa,
    data_godzina:          m.data_godzina || '',
    adres:                 m.adres || '',
    platnosc:              'online (Przelewy24 / Karta)',
    bilecik:               m.bilecik,
    zyczenia:              m.zyczenia || '',
    uwagi:                 m.uwagi || '',
  };

  try {
    await fetch('https://formspree.io/f/' + process.env.FORMSPREE_FORM_ID, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
  } catch (err) {
    console.error('Formspree error:', err);
  }

  return { statusCode: 200, body: 'OK' };
};
