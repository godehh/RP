/**
 * BounceCards (Vanilla JS runtime with spring physics)
 * Origin: React Bits (https://reactbits.dev)
 */
(function(window, document) {
  'use strict';

  var PATTERN = [1, 0.5, -0.3, -1, 0.2, 0.75, -0.6, 0.35, -0.85, 0.1];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parseTransform(value) {
    if (typeof value !== 'string') return null;
    var rotate = value.match(/rotate\(\s*(-?[\d.]+)deg\s*\)/);
    var translate = value.match(/translate\(\s*(-?[\d.]+)px(?:\s*,\s*(-?[\d.]+)px)?\s*\)/);
    return {
      x: translate ? Number(translate[1]) : 0,
      y: translate && translate[2] ? Number(translate[2]) : 0,
      rotate: rotate ? Number(rotate[1]) : 0
    };
  }

  function step(value, velocity, target, stiffness, damping, dt) {
    var next = velocity + ((target - value) * stiffness - velocity * damping) * dt;
    return [value + next * dt, next];
  }

  function initBounceCards(root, options) {
    if (!root || root._bounceInitialized) return;
    root._bounceInitialized = true;

    options = options || {};
    var ds = root.dataset || {};

    var cardElements = Array.prototype.slice.call(root.querySelectorAll('.bounce-cards__card'));
    var count = cardElements.length;
    if (count === 0) return;

    var middle = (count - 1) / 2;
    var reach = Math.max(1, middle);

    var spread = options.spread !== undefined ? options.spread : (ds.spread ? parseFloat(ds.spread) : 85);
    var rotation = options.rotation !== undefined ? options.rotation : (ds.rotation ? parseFloat(ds.rotation) : 10);
    var arc = options.arc !== undefined ? options.arc : (ds.arc ? parseFloat(ds.arc) : 0);
    var cardSize = options.cardSize !== undefined ? options.cardSize : (ds.cardSize ? parseFloat(ds.cardSize) : 200);
    var animationDelay = options.animationDelay !== undefined ? options.animationDelay : (ds.animationDelay ? parseFloat(ds.animationDelay) : 0.4);
    var animationStagger = options.animationStagger !== undefined ? options.animationStagger : (ds.animationStagger ? parseFloat(ds.animationStagger) : 0.06);
    var bounciness = options.bounciness !== undefined ? options.bounciness : (ds.bounciness ? parseFloat(ds.bounciness) : 0.6);
    var enableHover = options.enableHover !== undefined ? options.enableHover : (ds.enableHover !== 'false');
    var pushDistance = options.pushDistance !== undefined ? options.pushDistance : (ds.pushDistance ? parseFloat(ds.pushDistance) : 160);
    var hoverScale = options.hoverScale !== undefined ? options.hoverScale : (ds.hoverScale ? parseFloat(ds.hoverScale) : 1.06);

    var settings = {
      slots: [],
      cardSize: Math.max(10, cardSize),
      delay: Math.max(0, animationDelay),
      stagger: Math.max(0, animationStagger),
      bounciness: clamp(bounciness, 0, 1),
      enableHover: enableHover,
      pushDistance: pushDistance,
      hoverScale: clamp(hoverScale, 0.5, 2),
      clickable: typeof options.onCardClick === 'function' || ds.clickable === 'true'
    };

    function applyResponsive() {
      var w = window.innerWidth || document.documentElement.clientWidth || 360;
      var curCardSize, curSpread, curRotation, curPushDist, curRadius, curBorder;

      if (w <= 360) {
        curCardSize = 148;
        curSpread = 50;
        curRotation = 5.5;
        curPushDist = 14;
        curRadius = 14;
        curBorder = 3;
      } else if (w <= 420) {
        // Covers typical Android viewports (375px, 390px, 400px, 412px)
        curCardSize = 160;
        curSpread = 56;
        curRotation = 6.5;
        curPushDist = 16;
        curRadius = 16;
        curBorder = 3.5;
      } else if (w <= 480) {
        curCardSize = 170;
        curSpread = 62;
        curRotation = 7;
        curPushDist = 18;
        curRadius = 18;
        curBorder = 3.5;
      } else if (w <= 768) {
        curCardSize = 205;
        curSpread = 74;
        curRotation = 8;
        curPushDist = 24;
        curRadius = 20;
        curBorder = 4;
      } else {
        curCardSize = options.cardSize !== undefined ? options.cardSize : (ds.cardSize ? parseFloat(ds.cardSize) : 410);
        curSpread = options.spread !== undefined ? options.spread : (ds.spread ? parseFloat(ds.spread) : 95);
        curRotation = options.rotation !== undefined ? options.rotation : (ds.rotation ? parseFloat(ds.rotation) : 9);
        curPushDist = options.pushDistance !== undefined ? options.pushDistance : (ds.pushDistance ? parseFloat(ds.pushDistance) : 160);
        curRadius = options.radius !== undefined ? options.radius : (ds.radius ? parseFloat(ds.radius) : 32);
        curBorder = options.border !== undefined ? options.border : (ds.border ? parseFloat(ds.border) : 6);
      }

      settings.cardSize = curCardSize;
      settings.spread = curSpread;
      settings.rotation = curRotation;
      settings.pushDistance = curPushDist;
      settings.enableHover = enableHover !== false;

      settings.slots = cardElements.map(function(_, i) {
        var offset = i - middle;
        return {
          x: offset * curSpread,
          y: arc * Math.pow(offset / reach, 2),
          rotate: curRotation * PATTERN[i % PATTERN.length]
        };
      });

      root.style.setProperty('--bounce-cards-size', settings.cardSize + 'px');
      root.style.setProperty('--bounce-cards-radius', curRadius + 'px');
      root.style.setProperty('--bounce-cards-border', curBorder + 'px');
    }

    applyResponsive();

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var bodies = [];
    var state = { hovered: -1, time: 0, layer: -1 };
    var raf = 0;
    var last = performance.now();
    var alive = true;

    function body(i) {
      if (!bodies[i]) {
        var slot = settings.slots[i] || { x: 0, y: 0, rotate: 0 };
        bodies[i] = {
          x: slot.x,
          y: slot.y,
          rotate: slot.rotate,
          scale: reduce ? 1 : 0,
          vx: 0,
          vy: 0,
          vr: 0,
          vs: 0,
          born: state.time
        };
      }
      return bodies[i];
    }

    function frame(now) {
      raf = 0;
      if (!alive) return;
      var s = settings;
      var dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      state.time += dt;

      var hovered = s.enableHover ? state.hovered : -1;
      var popStiffness = 170;
      var popDamping = 2 * (1 - 0.85 * s.bounciness) * Math.sqrt(popStiffness);
      var moveStiffness = 210;
      var moveDamping = 2 * (reduce ? 1 : 0.72) * Math.sqrt(moveStiffness);
      var substeps = Math.ceil(dt / (1 / 240));
      var h = dt / substeps;
      var moving = 0;

      for (var i = 0; i < s.slots.length; i++) {
        var el = cardElements[i];
        if (!el) continue;
        var card = body(i);
        var slot = s.slots[i];
        var appeared = reduce || state.time - card.born >= s.delay + i * s.stagger;
        var targetX = slot.x;
        var targetY = slot.y;
        var targetRotate = slot.rotate;
        var targetScale = appeared ? 1 : 0;

        if (hovered >= 0 && appeared) {
          if (i === hovered) {
            targetY = slot.y - s.cardSize * 0.07;
            targetRotate = 0;
            targetScale = s.hoverScale;
          } else {
            targetX = slot.x + Math.sign(i - hovered) * s.pushDistance;
          }
        }

        for (var k = 0; k < substeps; k++) {
          var stepX = step(card.x, card.vx, targetX, moveStiffness, moveDamping, h);
          card.x = stepX[0];
          card.vx = stepX[1];

          var stepY = step(card.y, card.vy, targetY, moveStiffness, moveDamping, h);
          card.y = stepY[0];
          card.vy = stepY[1];

          var stepR = step(card.rotate, card.vr, targetRotate, moveStiffness, moveDamping, h);
          card.rotate = stepR[0];
          card.vr = stepR[1];

          if (reduce) {
            card.scale = targetScale;
            card.vs = 0;
          } else {
            var stepS = step(card.scale, card.vs, targetScale, popStiffness, popDamping, h);
            card.scale = stepS[0];
            card.vs = stepS[1];
          }
        }

        moving +=
          Math.abs(card.vx) +
          Math.abs(card.vy) +
          Math.abs(card.vr) +
          Math.abs(card.vs) * 100 +
          Math.abs(targetX - card.x) +
          Math.abs(targetY - card.y) +
          Math.abs(targetRotate - card.rotate) +
          Math.abs(targetScale - card.scale) * 100 +
          (appeared ? 0 : 1);

        el.style.transform = 'translate(-50%, -50%) translate3d(' + card.x.toFixed(2) + 'px, ' + card.y.toFixed(2) + 'px, 0) rotate(' + card.rotate.toFixed(3) + 'deg) scale(' + Math.max(0, card.scale).toFixed(4) + ')';
      }

      if (state.layer !== hovered) {
        state.layer = hovered;
        cardElements.forEach(function(el, i) {
          if (!el) return;
          el.style.zIndex = i === hovered ? String(s.slots.length + 5) : String(i + 1);
          if (i === hovered) {
            el.setAttribute('data-active', '');
          } else {
            el.removeAttribute('data-active');
          }
        });
      }

      if (moving > 0.02) {
        raf = requestAnimationFrame(frame);
      }
    }

    function wake() {
      applyResponsive();
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function pick(event) {
      var s = settings;
      var rect = root.getBoundingClientRect();
      var px = event.clientX - rect.left - rect.width / 2;
      var py = event.clientY - rect.top - rect.height / 2;
      var best = -1;
      var distance = Infinity;
      s.slots.forEach(function(slot, i) {
        var gap = Math.abs(px - slot.x);
        if (gap < distance) {
          distance = gap;
          best = i;
        }
      });
      if (best < 0) return -1;
      var slot = s.slots[best];
      var half = s.cardSize / 2;
      if (Math.abs(py - slot.y) > half + 12 || distance > half + 12) return -1;
      if (state.hovered >= 0 && state.hovered !== best) {
        var current = s.slots[state.hovered];
        if (current && Math.abs(px - current.x) - distance < 6) return state.hovered;
      }
      return best;
    }

    function onMove(event) {
      var next = pick(event);
      if (next !== state.hovered) {
        state.hovered = next;
        wake();
      }
    }

    function onLeave() {
      if (state.hovered !== -1) {
        state.hovered = -1;
        wake();
      }
    }

    function navigateToCard(cardEl, index) {
      if (!cardEl) return;
      var href = cardEl.getAttribute('href') || cardEl.dataset.href;
      var productId = cardEl.dataset.productId;

      if (!href && cardEl.getAttribute('onclick')) {
        var onclickStr = cardEl.getAttribute('onclick');
        var matchUrl = onclickStr.match(/['"](product\.html\?[^'"]+)['"]/);
        if (matchUrl) {
          href = matchUrl[1];
        }
      }

      if (!productId && href) {
        var matchId = href.match(/id=([^&#]+)/);
        if (matchId) {
          productId = matchId[1];
        }
      }

      if (!href && productId) {
        href = 'product.html?id=' + productId;
      }

      if (productId) {
        try {
          sessionStorage.setItem('rp_current_product_id', productId);
          localStorage.setItem('rp_current_product_id', productId);
        } catch (e) {}
      }

      if (href) {
        window.location.href = href;
      }
    }

    function onClick(event) {
      var clickedCard = event.target ? (event.target.closest ? event.target.closest('.bounce-cards__card') : null) : null;
      var index = clickedCard ? cardElements.indexOf(clickedCard) : pick(event);
      if (index < 0 && !clickedCard) return;

      var targetCard = clickedCard || cardElements[index];
      if (targetCard) {
        navigateToCard(targetCard, index);
      }

      if (typeof options.onCardClick === 'function') {
        options.onCardClick(index, targetCard);
      }
    }

    // Desktop mouse click handling (fine pointers)
    cardElements.forEach(function(el, i) {
      el.addEventListener('click', function(e) {
        // Only trigger immediate navigation on desktop mouse clicks (not touchscreen taps)
        var isMouse = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (isMouse) {
          e.preventDefault();
          e.stopPropagation();
          navigateToCard(el, i);
        }
      });
    });

    // Touch interaction for mobile devices (Smooth scrub + tap to highlight + second tap to open)
    var touchInfo = null;
    var activeTouchCardIndex = -1;

    root.addEventListener('touchstart', function(e) {
      if (!e.touches || !e.touches[0]) return;
      var touch = e.touches[0];
      var targetCard = (e.target && e.target.closest) ? e.target.closest('.bounce-cards__card') : null;
      var cardIdx = targetCard ? cardElements.indexOf(targetCard) : pick(touch);

      touchInfo = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: performance.now(),
        moved: false,
        initialIndex: cardIdx,
        targetCard: targetCard
      };

      if (cardIdx >= 0) {
        state.hovered = cardIdx;
        wake();
      }
    }, { passive: true });

    root.addEventListener('touchmove', function(e) {
      if (!touchInfo || !e.touches || !e.touches[0]) return;
      var touch = e.touches[0];
      var dx = touch.clientX - touchInfo.startX;
      var dy = touch.clientY - touchInfo.startY;

      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        touchInfo.moved = true;
      }

      // If dragging horizontally across cards, interactively scrub cards!
      if (Math.abs(dx) > Math.abs(dy)) {
        var hoverIdx = pick(touch);
        if (hoverIdx >= 0 && hoverIdx !== state.hovered) {
          state.hovered = hoverIdx;
          wake();
        }
      }
    }, { passive: true });

    root.addEventListener('touchend', function(e) {
      if (!touchInfo) return;
      var touch = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
      var dx = touch ? Math.abs(touch.clientX - touchInfo.startX) : 0;
      var dy = touch ? Math.abs(touch.clientY - touchInfo.startY) : 0;
      var elapsed = performance.now() - touchInfo.startTime;
      var isTap = (!touchInfo.moved || (dx < 16 && dy < 16)) && elapsed < 450;

      if (isTap) {
        var targetCard = touchInfo.targetCard || ((touch && e.target && e.target.closest) ? e.target.closest('.bounce-cards__card') : null);
        var tappedIdx = targetCard ? cardElements.indexOf(targetCard) : (touch ? pick(touch) : -1);

        if (tappedIdx >= 0) {
          // If this card is ALREADY active from a previous tap/selection, navigate to its product!
          if (activeTouchCardIndex === tappedIdx) {
            navigateToCard(cardElements[tappedIdx], tappedIdx);
            activeTouchCardIndex = -1;
          } else {
            // First tap: Pop this card front-and-center with bouncy spring animation!
            activeTouchCardIndex = tappedIdx;
            state.hovered = tappedIdx;
            wake();
          }
        } else {
          // Tapped empty space: reset cards to resting fan
          activeTouchCardIndex = -1;
          state.hovered = -1;
          wake();
        }
      } else {
        // Drag/scrub gesture finished: keep the selected card active
        if (state.hovered >= 0) {
          activeTouchCardIndex = state.hovered;
        }
      }

      touchInfo = null;
    }, { passive: true });

    root.addEventListener('touchcancel', function() {
      touchInfo = null;
      activeTouchCardIndex = -1;
      state.hovered = -1;
      wake();
    }, { passive: true });

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('click', onClick);

    if (window.IntersectionObserver) {
      var intersection = new IntersectionObserver(function(entries) {
        var visible = entries.some(function(entry) { return entry.isIntersecting; });
        if (visible) {
          last = performance.now();
          wake();
        }
      });
      intersection.observe(root);
    }

    wake();

    var instance = {
      wake: wake,
      updateResponsive: applyResponsive,
      destroy: function() {
        alive = false;
        cancelAnimationFrame(raf);
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerdown', onMove);
        root.removeEventListener('pointerleave', onLeave);
        root.removeEventListener('click', onClick);
      }
    };
    root._bounceCardsInstance = instance;
    return instance;
  }

  // Global responsive resize listener to keep cards perfectly bounded
  var resizeDebounceTimer = null;
  window.addEventListener('resize', function() {
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(function() {
      var containers = document.querySelectorAll('.bounce-cards, [data-bounce-cards]');
      for (var i = 0; i < containers.length; i++) {
        var inst = containers[i]._bounceCardsInstance;
        if (inst && typeof inst.wake === 'function') {
          inst.wake();
        }
      }
    }, 120);
  }, { passive: true });

  function autoInit() {
    var containers = document.querySelectorAll('.bounce-cards, [data-bounce-cards]');
    for (var i = 0; i < containers.length; i++) {
      initBounceCards(containers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.BounceCards = {
    init: initBounceCards,
    autoInit: autoInit
  };

})(window, document);
