(function () {
  function initSlideshowIn(root) {
    root.querySelectorAll('.product-img[data-images]').forEach(function (img, i) {
      if (img._slideshowInit) return;
      img._slideshowInit = true;

      var images = img.dataset.images.split('|');
      var link = img.dataset.link;

      function navigate() { if (link) window.location.href = link; }
      if (link) { img.style.cursor = 'pointer'; img.onclick = navigate; }

      if (images.length < 2) return;

      images.forEach(function (src) { (new Image()).src = src; });

      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:relative; line-height:0; overflow:hidden;';
      img.parentNode.insertBefore(wrapper, img);
      wrapper.appendChild(img);

      var layerA = img;
      layerA.style.cssText += '; display:block; position:relative; z-index:1;';

      var layerB = document.createElement('img');
      layerB.alt = img.alt;
      layerB.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; opacity:0; z-index:2; display:block;';
      if (link) { layerB.style.cursor = 'pointer'; layerB.onclick = navigate; }
      wrapper.appendChild(layerB);

      var idx = 0;
      var busy = false;

      function transition() {
        if (busy) return;
        busy = true;
        idx = (idx + 1) % images.length;
        var newSrc = images[idx];

        layerB.src = newSrc;

        function doFade() {
          layerB.style.transition = 'opacity 0.7s ease';
          layerB.style.opacity = '1';

          setTimeout(function () {
            layerA.src = newSrc;

            setTimeout(function () {
              layerB.style.transition = 'opacity 0.7s ease';
              layerB.style.opacity = '0';
              setTimeout(function () { busy = false; }, 750);
            }, 50);
          }, 750);
        }

        if (layerB.complete && layerB.naturalWidth > 0) {
          doFade();
        } else {
          layerB.onload = function () { layerB.onload = null; doFade(); };
        }
      }

      setTimeout(function () {
        setInterval(transition, 5000);
      }, i * 1700);
    });
  }

  // Auto-init on page load
  initSlideshowIn(document);

  // Expose for dynamic content (called by products.js after rendering)
  window.initSlideshow = function (container) {
    initSlideshowIn(container || document);
  };
})();
