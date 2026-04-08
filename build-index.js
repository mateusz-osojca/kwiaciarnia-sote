var fs = require('fs');
var path = require('path');

var dir = path.join(__dirname, '_data', 'products');
var files = fs.readdirSync(dir).filter(function (f) {
  return f.endsWith('.json') && !f.startsWith('_');
});

var products = files.map(function (f) {
  var data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return { slug: data.slug, order: data.order || 99 };
}).sort(function (a, b) { return a.order - b.order; });

var slugs = products.map(function (p) { return p.slug; });

fs.writeFileSync(
  path.join(dir, '_index.json'),
  JSON.stringify(slugs, null, 2)
);

console.log('Product index built: ' + slugs.length + ' products');
