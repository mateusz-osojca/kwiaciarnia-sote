const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/*
 * Seat check for products sold through a Stripe Payment Link (e.g. workshops).
 * GET /.netlify/functions/workshop-seats?link=https://buy.stripe.com/...
 *
 * Stripe itself enforces the payment limit set on the link and deactivates
 * the link once it is reached. This function only reads that state so the
 * site can show "Wyprzedane" and disable the button.
 */
exports.handler = async function (event) {
  const json = (statusCode, body) => ({
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
    body: JSON.stringify(body),
  });

  const link = (event.queryStringParameters || {}).link || '';
  if (!/^https:\/\/buy\.stripe\.com\//.test(link)) {
    return json(400, { error: 'Invalid link' });
  }

  try {
    let found = null;
    for await (const pl of stripe.paymentLinks.list({ limit: 100 })) {
      if (pl.url === link) { found = pl; break; }
    }
    if (!found) return json(404, { error: 'Link not found' });

    const cs = (found.restrictions && found.restrictions.completed_sessions) || null;
    const limit = cs ? cs.limit : null;
    const sold = cs ? cs.count : null;
    const left = cs ? Math.max(0, limit - sold) : null;

    return json(200, {
      available: found.active && (left === null || left > 0),
      left: left,
      limit: limit,
    });
  } catch (err) {
    console.error('workshop-seats error:', err);
    return json(500, { error: 'Stripe error' });
  }
};
