/* ============================================================
   ESCALANDO CON PROPÓSITO. Comportamiento del sitio
   JS vanilla, patron IIFE, contenido critico ya esta en el HTML.
   ============================================================ */

(function () {
  "use strict";

  function safe(fn, name) {
    try {
      fn();
    } catch (err) {
      console.error("[ecp] fallo en " + name, err);
    }
  }

  function initNavToggle() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-nav-mobile]");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", function () {
      var isOpen = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    document.documentElement.classList.add("js-ready");

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });

    // Red de seguridad: si algo falla, todo queda visible a los 6s.
    window.setTimeout(function () {
      items.forEach(function (el) { el.classList.add("in-view"); });
    }, 6000);
  }

  function initStatCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function animate(el) {
      var target = el.getAttribute("data-count");
      var match = target.match(/^([^\d]*)(\d+)([^\d]*)$/);
      if (!match) return;
      var prefix = match[1];
      var end = parseInt(match[2], 10);
      var suffix = match[3];
      var start = 0;
      var duration = 1100;
      var startTime = null;

      function step(ts) {
        if (startTime === null) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(start + (end - start) * eased);
        el.textContent = prefix + value.toLocaleString("en-US") + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(animate);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    nums.forEach(function (el) { observer.observe(el); });

    // Red de seguridad: si el observer nunca dispara, muestra el valor final a los 6s.
    window.setTimeout(function () {
      nums.forEach(function (el) {
        if (el.textContent === "0") animate(el);
      });
    }, 6000);
  }

  var LANG_STORAGE_KEY = "escalandocs-lang";

  function getStoredLang() {
    try {
      return "es"; /* sitio solo en español */
    } catch (err) {
      return "es";
    }
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (err) {
      /* localStorage no disponible (modo privado, etc.): la app sigue funcionando */
    }
  }

  function applyLang(lang) {
    var dict = (window.I18N && window.I18N[lang]) || {};
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll("[data-lang-switch]").forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang-switch") === lang;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    if (window.CASOS) {
      try { renderCasos(lang); } catch (err) { console.error("[ecp] fallo en renderCasos", err); }
    }
  }

  function initI18n() {
    if (!window.I18N) return;
    var switches = document.querySelectorAll("[data-lang-switch]");
    if (!switches.length) return;

    applyLang(getStoredLang());

    switches.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var lang = btn.getAttribute("data-lang-switch");
        storeLang(lang);
        applyLang(lang);
      });
    });
  }

  function initGtagEvents() {
    var links = document.querySelectorAll("[data-gtag-event]");
    if (!links.length) return;

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        if (typeof window.gtag !== "function") return;
        var eventName = link.getAttribute("data-gtag-event");
        var section = link.getAttribute("data-gtag-section") || "";
        window.gtag("event", eventName, { section: section });
      });
    });
  }

  function initHeaderShadow() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      if (window.scrollY > 8) {
        header.style.boxShadow = "0 12px 30px -24px rgba(0,0,0,0.6)";
      } else {
        header.style.boxShadow = "none";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initExpandable() {
    var triggers = document.querySelectorAll("[data-expand-trigger]");
    if (!triggers.length) return;

    function toggle(trigger) {
      var targetId = trigger.getAttribute("data-expand-trigger");
      var panel = document.getElementById(targetId);
      if (!panel) return;
      var expanded = panel.classList.toggle("is-expanded");
      document
        .querySelectorAll('[data-expand-trigger="' + targetId + '"]')
        .forEach(function (t) {
          t.setAttribute("aria-expanded", String(expanded));
        });
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        toggle(trigger);
      });
      if (trigger.getAttribute("role") === "button") {
        trigger.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle(trigger);
          }
        });
      }
    });
  }

  /* ---------------- Casos de Éxito (listado + detalle dinámicos) ---------------- */

  function casoLabel(text) {
    var s = document.createElement("span");
    s.className = "caso-section-label";
    s.textContent = text;
    return s;
  }

  function buildCasoSection(sec) {
    var wrap = document.createElement("section");
    wrap.className = "caso-section";

    if (sec.type === "twocol") {
      wrap.className += " caso-twocol";
      var left = document.createElement("div");
      if (sec.label) left.appendChild(casoLabel(sec.label));
      if (sec.heading) {
        var h = document.createElement("h2");
        h.textContent = sec.heading;
        left.appendChild(h);
      }
      var right = document.createElement("div");
      right.className = "caso-twocol-body";
      (sec.body || []).forEach(function (para) {
        var p = document.createElement("p");
        p.textContent = para;
        right.appendChild(p);
      });
      wrap.appendChild(left);
      wrap.appendChild(right);
      return wrap;
    }

    if (sec.type === "image") {
      wrap.className += " caso-section-image case-subsection";
      if (sec.label) wrap.appendChild(casoLabel(sec.label));
      if (sec.sublabel) {
        var subl = document.createElement("p");
        subl.className = "caso-section-sublabel";
        subl.textContent = sec.sublabel;
        wrap.appendChild(subl);
      }
      var images = sec.images || (sec.image ? [sec.image] : []);
      images.forEach(function (src) {
        var fig = document.createElement("figure");
        fig.className = "caso-section-figure";
        var fimg = document.createElement("img");
        fimg.src = src;
        fimg.alt = "";
        fimg.setAttribute("aria-hidden", "true");
        fimg.loading = "lazy";
        fig.appendChild(fimg);
        wrap.appendChild(fig);
      });
      return wrap;
    }

    if (sec.type === "result") {
      wrap.className += " caso-result" + (sec.plain ? " caso-result-plain" : "");
      if (sec.label) wrap.appendChild(casoLabel(sec.label));
      if (sec.heading) {
        var rh = document.createElement("h2");
        rh.textContent = sec.heading;
        wrap.appendChild(rh);
      }
      if (sec.groups && sec.groups.length) {
        sec.groups.forEach(function (group) {
          if (group.title) {
            var gh = document.createElement("h3");
            gh.className = "caso-result-group-title";
            gh.textContent = group.title;
            wrap.appendChild(gh);
          }
          var gul = document.createElement("ul");
          gul.className = "case-card-list case-card-list-check";
          (group.items || []).forEach(function (item) {
            var li = document.createElement("li");
            if (item && typeof item === "object") {
              var strong = document.createElement("strong");
              strong.textContent = item.label;
              li.appendChild(strong);
              li.appendChild(document.createTextNode(" " + item.text));
            } else {
              li.textContent = item;
            }
            gul.appendChild(li);
          });
          wrap.appendChild(gul);
        });
      } else {
        var st = document.createElement("p");
        st.className = "caso-result-statement" + (sec.large ? " caso-result-statement-lg" : "");
        st.textContent = sec.statement || "";
        wrap.appendChild(st);
      }
      if (sec.support) {
        var sp = document.createElement("p");
        sp.className = "caso-result-support";
        sp.textContent = sec.support;
        wrap.appendChild(sp);
      }
      return wrap;
    }

    if (sec.label) wrap.appendChild(casoLabel(sec.label));
    if (sec.heading) {
      var sh = document.createElement("h2");
      sh.textContent = sec.heading;
      wrap.appendChild(sh);
    }
    if (sec.type === "list" || sec.type === "checklist") {
      (sec.body || []).forEach(function (para) {
        var bp = document.createElement("p");
        bp.textContent = para;
        wrap.appendChild(bp);
      });
      var ul = document.createElement("ul");
      ul.className = sec.type === "checklist"
        ? "case-card-list case-card-list-check"
        : "case-card-list";
      if (sec.numbered) ul.className += " case-card-list-numbered";
      (sec.items || []).forEach(function (item) {
        var li = document.createElement("li");
        if (item && typeof item === "object") {
          var strong = document.createElement("strong");
          strong.textContent = item.label;
          li.appendChild(strong);
          li.appendChild(document.createTextNode(" " + item.text));
          if (item.impact) {
            var imp = document.createElement("span");
            imp.className = "case-list-impact";
            imp.textContent = "✦ Impacto: " + item.impact;
            li.appendChild(imp);
          }
        } else {
          li.textContent = item;
        }
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
      return wrap;
    }
    (sec.body || []).forEach(function (para) {
      var p = document.createElement("p");
      p.textContent = para;
      wrap.appendChild(p);
    });
    return wrap;
  }

  function renderCasosListing(grid, root) {
    grid.innerHTML = "";
    root.order.forEach(function (slug) {
      var it = root.items[slug];
      if (!it) return;
      var a = document.createElement("a");
      a.className = "caso-block";
      a.href = "caso.html?slug=" + encodeURIComponent(slug);

      var media = document.createElement("div");
      media.className = "caso-block-media";
      if (it.image) {
        var img = document.createElement("img");
        img.src = it.image;
        img.alt = "";
        img.loading = "lazy";
        img.setAttribute("aria-hidden", "true");
        media.appendChild(img);
      }
      a.appendChild(media);

      var body = document.createElement("div");
      body.className = "caso-block-body";
      var h3 = document.createElement("h3");
      h3.className = "caso-block-title";
      h3.textContent = it.cardTitle || it.title;
      body.appendChild(h3);
      var p = document.createElement("p");
      p.className = "caso-block-desc";
      p.textContent = it.cardExcerpt || it.excerpt || "";
      body.appendChild(p);
      if (it.tags && it.tags.length) {
        var tw = document.createElement("div");
        tw.className = "caso-block-tags";
        it.tags.forEach(function (t) {
          var s = document.createElement("span");
          s.className = "case-card-tag";
          s.textContent = t;
          tw.appendChild(s);
        });
        body.appendChild(tw);
      }
      a.appendChild(body);
      grid.appendChild(a);
    });
  }

  function renderCasoDetail(rootEl, root) {
    var slug = "";
    try { slug = new URLSearchParams(window.location.search).get("slug") || ""; } catch (e) {}
    var it = root.items[slug];
    rootEl.innerHTML = "";

    if (!it) {
      var nf = document.createElement("div");
      nf.className = "caso-notfound";
      var np = document.createElement("p");
      np.className = "lede";
      np.textContent = root.ui.notFound;
      nf.appendChild(np);
      var nl = document.createElement("a");
      nl.className = "btn btn-ghost";
      nl.href = "casos-de-exito.html";
      nl.textContent = root.ui.notFoundLink;
      nf.appendChild(nl);
      rootEl.appendChild(nf);
      return;
    }

    document.title = it.title + " · Escalando con Propósito";
    var md = document.querySelector('meta[name="description"]');
    if (md && it.excerpt) md.setAttribute("content", it.excerpt);

    var back = document.createElement("a");
    back.className = "caso-back";
    back.href = "casos-de-exito.html";
    back.innerHTML = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3 5 8l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    back.appendChild(document.createTextNode(root.ui.back));
    rootEl.appendChild(back);

    var hero = document.createElement("header");
    hero.className = "caso-hero";
    var kicker = document.createElement("span");
    kicker.className = "caso-kicker";
    kicker.textContent = root.ui.kicker;
    hero.appendChild(kicker);
    var h1 = document.createElement("h1");
    h1.textContent = it.title;
    hero.appendChild(h1);
    if (it.intro) {
      var intro = document.createElement("p");
      intro.className = "lede";
      intro.textContent = it.intro;
      hero.appendChild(intro);
    }
    if (it.tags && it.tags.length) {
      var htags = document.createElement("div");
      htags.className = "caso-hero-tags";
      it.tags.forEach(function (t) {
        var s = document.createElement("span");
        s.className = "caso-tag-outline";
        s.textContent = t;
        htags.appendChild(s);
      });
      hero.appendChild(htags);
    }
    if (it.companyUrl) {
      var clink = document.createElement("a");
      clink.className = "caso-company-link";
      clink.href = it.companyUrl;
      clink.target = "_blank";
      clink.rel = "noopener";
      clink.textContent = it.company;
      hero.appendChild(clink);
    }
    rootEl.appendChild(hero);

    if (it.image && it.heroDiagram !== false) {
      var diagram = document.createElement("div");
      diagram.className = "caso-diagram";
      var dimg = document.createElement("img");
      dimg.src = it.image;
      dimg.alt = "";
      dimg.setAttribute("aria-hidden", "true");
      dimg.loading = "lazy";
      diagram.appendChild(dimg);
      rootEl.appendChild(diagram);
    }

    if (it.stats && it.stats.length) {
      var stats = document.createElement("div");
      stats.className = "caso-stats";
      it.stats.forEach(function (stt) {
        var d = document.createElement("div");
        d.className = "caso-stat";
        var v = document.createElement("span");
        v.className = "caso-stat-value";
        v.textContent = stt.value;
        var l = document.createElement("span");
        l.className = "caso-stat-label";
        l.textContent = stt.label;
        d.appendChild(v);
        d.appendChild(l);
        stats.appendChild(d);
      });
      rootEl.appendChild(stats);
    }

    (it.sections || []).forEach(function (sec) {
      rootEl.appendChild(buildCasoSection(sec));
    });

    var cta = document.createElement("div");
    cta.className = "caso-cta";
    var clead = document.createElement("p");
    clead.className = "caso-cta-lead";
    clead.textContent = root.ui.ctaLead;
    cta.appendChild(clead);
    var cbtn = document.createElement("a");
    cbtn.className = "btn btn-gold";
    cbtn.href = "https://calendar.app.google/FzGwmAzHEnLBb7UY6";
    cbtn.target = "_blank";
    cbtn.rel = "noopener";
    cbtn.textContent = root.ui.ctaBtn;
    cta.appendChild(cbtn);
    rootEl.appendChild(cta);
  }

  function renderCasos(lang) {
    var root = window.CASOS && (window.CASOS[lang] || window.CASOS.es);
    if (!root) return;
    var grid = document.getElementById("casos-grid");
    if (grid) renderCasosListing(grid, root);
    var detail = document.querySelector("[data-caso-detail]");
    if (detail) renderCasoDetail(detail, root);
  }

  function initCasos() {
    if (!window.CASOS) return;
    renderCasos(getStoredLang());
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(initI18n, "initI18n");
    safe(initCasos, "initCasos");
    safe(initGtagEvents, "initGtagEvents");
    safe(initNavToggle, "initNavToggle");
    safe(initReveal, "initReveal");
    safe(initStatCounters, "initStatCounters");
    safe(initHeaderShadow, "initHeaderShadow");
    safe(initExpandable, "initExpandable");
  });
})();
