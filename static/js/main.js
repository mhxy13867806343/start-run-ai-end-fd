(function ($) {
  "use strict";

  function isIEBrowser() {
    var ua = window.navigator.userAgent;
    return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
  }

  function renderIETip() {
    if (!isIEBrowser()) {
      return;
    }

    var $tip = $(
      '<div class="ie-tip is-visible" role="status" aria-live="polite">' +
        '<div>当前浏览器为 IE，推荐使用 <a href="https://www.google.com/chrome/" target="_blank" rel="noreferrer">Chrome</a> 或 ' +
        '<a href="https://www.microsoft.com/edge" target="_blank" rel="noreferrer">Edge</a> 获得更佳体验。</div>' +
        '<button type="button" aria-label="关闭提示">关闭</button>' +
      "</div>"
    );

    $tip.on("click", "button", function () {
      $tip.slideUp(180, function () {
        $tip.remove();
      });
    });

    $("#ie-tip-anchor").after($tip);
  }

  function bindNavToggle() {
    var $toggle = $(".nav-toggle");
    var $nav = $(".nav");

    $toggle.on("click", function () {
      $toggle.toggleClass("is-open");
      $nav.toggleClass("is-open");
    });

    $nav.find("a").on("click", function () {
      $toggle.removeClass("is-open");
      $nav.removeClass("is-open");
    });
  }

  function markActiveNav() {
    var current = window.location.pathname.split("/").pop() || "index.html";

    $(".nav a").each(function () {
      var $link = $(this);
      var href = $link.attr("href") || "";
      var target = href.split("/").pop() || "index.html";

      if (target === current) {
        $link.addClass("is-active");
      }
    });
  }

  function bootHero() {
    var $items = $(".hero [data-reveal], .page-hero [data-reveal]");

    if (!$items.length) {
      return;
    }

    $("body").addClass("is-booting");

    window.setTimeout(function () {
      $items.each(function (index) {
        var $item = $(this);
        window.setTimeout(function () {
          $item.addClass("is-visible");
        }, index * 140);
      });
      $("body").removeClass("is-booting");
    }, 180);
  }

  function revealOnScroll() {
    var viewportBottom = $(window).scrollTop() + $(window).height();

    $("[data-reveal]").each(function () {
      var $el = $(this);
      var revealPoint = $el.offset().top + 60;

      if (viewportBottom > revealPoint) {
        $el.addClass("is-visible");
      }
    });
  }

  function updateParallax() {
    var scrollTop = $(window).scrollTop();

    $("[data-parallax]").each(function () {
      var depth = parseFloat($(this).attr("data-parallax")) || 20;
      var offset = scrollTop / depth;
      $(this).css("transform", "translate3d(0, " + offset.toFixed(2) + "px, 0)");
    });
  }

  function bindGallerySwitch() {
    var $cards = $(".channel-card");
    var $image = $("#preview-image");
    var $name = $("#channel-name");
    var $desc = $("#channel-desc");

    $cards.on("click", function () {
      var $card = $(this);
      var nextImage = $card.attr("data-image");
      var nextAlt = $card.attr("data-alt");

      if ($card.hasClass("is-active")) {
        return;
      }

      $cards.removeClass("is-active");
      $card.addClass("is-active");

      $image.stop(true, true).fadeOut(180, function () {
        $image.attr("src", nextImage).attr("alt", nextAlt).fadeIn(220);
      });

      $name.stop(true, true).fadeOut(120, function () {
        $name.text($card.attr("data-name")).fadeIn(180);
      });

      $desc.stop(true, true).fadeOut(120, function () {
        $desc.text($card.attr("data-desc")).fadeIn(180);
      });
    });
  }

  function bindSkillTabs() {
    var $tabs = $("[data-skill-tab]");
    var $panels = $("[data-skill-panel]");

    if (!$tabs.length || !$panels.length) {
      return;
    }

    $tabs.on("click", function () {
      var $tab = $(this);
      var target = $tab.attr("data-skill-tab");

      if (!target || $tab.hasClass("is-active")) {
        return;
      }

      $tabs.removeClass("is-active");
      $tab.addClass("is-active");

      $panels.removeClass("is-active");
      $panels.filter('[data-skill-panel="' + target + '"]').addClass("is-active");

      revealOnScroll();
    });
  }

  function bindSmoothHover() {
    var selector = ".channel-card, .btn, .feature, .mini-card, .portal-card, .info-card, .work-card, .link-tile, .contact-card, .guestbook-message-card, .guestbook-user";

    $(selector).on("mousemove", function (event) {
      var $el = $(this);
      var offset = $el.offset();
      var localX = event.pageX - offset.left;
      var localY = event.pageY - offset.top;

      $el.css(
        "background-image",
        "radial-gradient(circle at " +
          localX +
          "px " +
          localY +
          "px, rgba(109, 231, 255, 0.18), rgba(255, 255, 255, 0.02) 34%, transparent 65%)"
      );
    });

    $(selector).on("mouseleave", function () {
      $(this).css("background-image", "");
    });
  }

  $(function () {
    renderIETip();
    markActiveNav();
    bindNavToggle();
    bindGallerySwitch();
    bindSkillTabs();
    bindSmoothHover();
    bootHero();
    revealOnScroll();
    updateParallax();

    $(window).on("scroll resize", function () {
      revealOnScroll();
      updateParallax();
    });
  });
})(jQuery);
