(function () {
  'use strict';

  var DATA_DIR = '_data/products/';

  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function encodeImagePath(p) {
    if (p.startsWith('http')) return p;
    return p.split('/').map(function (seg) { return encodeURIComponent(seg); }).join('/');
  }

  /* ---- Render product card HTML (for grids) ---- */
  function cardHTML(p) {
    var imgSrc = encodeImagePath(p.mainImage);
    var link = 'produkt.html?slug=' + encodeURIComponent(p.slug);

    var priceTags = p.sizes.map(function (s) {
      return '<span class="price-tag">' + s.label + ' – ' + s.price + ' zł</span>';
    }).join('\n            ');

    var dataImages = p.galleryImages.map(function (img) {
      return encodeImagePath(img);
    }).join('|');

    return '<div class="product-card">' +
      '<img class="product-img" src="' + imgSrc + '" alt="' + p.name + '"' +
        ' data-link="' + link + '"' +
        ' data-images="' + dataImages + '">' +
      '<div class="product-body">' +
        '<p class="product-category">' + p.category + '</p>' +
        '<h3 class="product-name">' + p.name + '</h3>' +
        '<p class="product-desc">' + (p.shortDescription || '') + '</p>' +
        '<div class="product-price-tags">' +
          priceTags +
        '</div>' +
        '<div class="product-footer">' +
          '<a href="' + link + '" class="btn-cart">Wybierz bukiet</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---- renderProductGrid ---- */
  window.renderProductGrid = function (containerId, options) {
    options = options || {};
    var container = document.getElementById(containerId);
    if (!container) return;

    fetchJSON(DATA_DIR + '_index.json').then(function (slugs) {
      var fetches = slugs.map(function (slug) {
        return fetchJSON(DATA_DIR + slug + '.json');
      });
      return Promise.all(fetches);
    }).then(function (products) {
      products.sort(function (a, b) { return (a.order || 99) - (b.order || 99); });

      if (options.featuredOnly) {
        products = products.filter(function (p) { return p.featured; });
      }
      if (options.limit) {
        products = products.slice(0, options.limit);
      }

      container.innerHTML = products.map(cardHTML).join('\n');

      // Re-init slideshow for newly rendered cards
      if (typeof window.initSlideshow === 'function') {
        window.initSlideshow(container);
      }
    }).catch(function (err) {
      console.error('Failed to load products:', err);
    });
  };

  /* ---- renderProductDetail ---- */
  window.renderProductDetail = function () {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    if (!slug) {
      document.getElementById('productDetailContainer').innerHTML =
        '<p style="text-align:center; padding:4rem 2rem;">Produkt nie został znaleziony.</p>';
      return;
    }

    fetchJSON(DATA_DIR + slug + '.json').then(function (p) {
      // Set page title and meta
      document.title = p.name + ' – Kwiaciarnia Sote';
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && p.metaDescription) metaDesc.content = p.metaDescription;

      // Breadcrumb
      document.getElementById('breadcrumbName').textContent = p.name;

      // Gallery
      var mainImg = document.getElementById('mainImg');
      mainImg.src = encodeImagePath(p.mainImage);
      mainImg.alt = p.name;

      var thumbsContainer = document.getElementById('galleryThumbs');
      thumbsContainer.innerHTML = p.galleryImages.map(function (img, i) {
        return '<img class="product-thumb' + (i === 0 ? ' active' : '') + '"' +
          ' src="' + encodeImagePath(img) + '"' +
          ' alt="' + p.name + ' ' + (i + 1) + '"' +
          ' onclick="switchImg(this)">';
      }).join('\n');

      // Info
      document.getElementById('productCategory').textContent = p.category;
      document.getElementById('productName').textContent = p.name;

      // Sizes
      var sizesContainer = document.getElementById('productSizes');
      sizesContainer.innerHTML = p.sizes.map(function (s, i) {
        return '<button class="size-btn' + (i === 0 ? ' active' : '') + '"' +
          ' data-size="' + s.label + '" data-price="' + s.price + '"' +
          ' onclick="selectSize(this)">' +
          '<span class="size-btn-label">' + s.label + '</span>' +
          '<span class="size-btn-price">' + s.price + ' zł</span>' +
        '</button>';
      }).join('\n');

      // Current price
      document.getElementById('currentPrice').textContent = p.sizes[0].price + ' zł';

      // Description — convert \n\n to <br><br>
      var descHtml = p.description.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
      document.getElementById('productDescription').innerHTML = descHtml;

      // Set globals for checkout.js
      window.productId = p.slug;
      window.productName = p.name;
      window.selectedSize = p.sizes[0].label;
      window.selectedPrice = p.sizes[0].price;

    }).catch(function () {
      document.getElementById('productDetailContainer').innerHTML =
        '<p style="text-align:center; padding:4rem 2rem;">Produkt nie został znaleziony.</p>';
    });
  };

})();
