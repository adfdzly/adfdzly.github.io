/* Scroll-scrubbed motion: Lenis smooth scroll + GSAP ScrollTrigger.
   Everything is built inside one gsap.context so turning Motion off reverts it cleanly. */
(function () {
	"use strict";
	if (!window.gsap || !window.ScrollTrigger) return;

	var gsap = window.gsap, ST = window.ScrollTrigger;
	gsap.registerPlugin(ST);

	var root = document.documentElement;
	var ctx = null, lenis = null;
	var EXPO = "expo.out";

	/* Wrap each word in a mask so lines can rise into place. Keeps <em> and other inline markup. */
	function split(el) {
		if (el.dataset.splitDone) return el.querySelectorAll(".w > span");
		(function walk(node) {
			Array.prototype.slice.call(node.childNodes).forEach(function (n) {
				if (n.nodeType === 3) {
					var frag = document.createDocumentFragment();
					n.textContent.split(/(\s+)/).forEach(function (part) {
						if (!part) return;
						if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
						var w = document.createElement("span"), i = document.createElement("span");
						w.className = "w"; i.textContent = part; w.appendChild(i); frag.appendChild(w);
					});
					n.parentNode.replaceChild(frag, n);
				} else if (n.nodeType === 1) {
					walk(n);
				}
			});
		})(el);
		el.dataset.splitDone = "1";
		return el.querySelectorAll(".w > span");
	}

	function build() {
		lenis = window.Lenis ? new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } }) : null;
		if (lenis) {
			lenis.on("scroll", ST.update);
			gsap.ticker.add(tick);
			gsap.ticker.lagSmoothing(0);
			document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(function (a) {
				a.addEventListener("click", anchor);
			});
		}

		ctx = gsap.context(function () {
			/* Opening: the hero is pinned (CSS sticky) while the layers part like a product film. */
			var pin = document.querySelector(".hero-pin");
			if (pin) {
				var stage = pin.querySelector(".stage");
				var h = function () { return stage.offsetHeight; };
				var tl = gsap.timeline({
					defaults: { ease: "none" },
					scrollTrigger: { trigger: pin, start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true }
				});
				pin.querySelectorAll("[data-shift]").forEach(function (l) {
					tl.fromTo(l, { y: 0 }, { y: function () { return parseFloat(l.dataset.shift) * h(); } }, 0);
				});
				tl.fromTo(".layer--core", { opacity: 0 }, { opacity: 1, duration: 0.55 }, 0)
					.fromTo(".obj__turn", { rotation: 0, y: 0 }, { rotation: -4, y: function () { return -0.12 * h(); } }, 0)
					.fromTo(".hero__text", { y: 0, opacity: 1 }, { y: -60, opacity: 0.25 }, 0.35);
			}

			/* Headlines rise line by line, once. */
			gsap.utils.toArray("[data-split]").forEach(function (el) {
				var words = split(el);
				gsap.fromTo(words, { yPercent: 115 }, {
					yPercent: 0, duration: 1.1, ease: EXPO, stagger: 0.035,
					scrollTrigger: el.hasAttribute("data-split-now") ? null : { trigger: el, start: "top 88%", once: true },
					delay: el.hasAttribute("data-split-now") ? 0.1 : 0
				});
			});

			/* Covers open from a framed card to full bleed, contents drift at their own depth. */
			gsap.utils.toArray("[data-open]").forEach(function (el) {
				gsap.fromTo(el, { scale: 0.88, borderRadius: 24 }, {
					scale: 1, borderRadius: 0, ease: "none",
					scrollTrigger: { trigger: el, start: "top bottom", end: "top 25%", scrub: 1 }
				});
			});
			gsap.utils.toArray("[data-depth]").forEach(function (el) {
				var d = parseFloat(el.dataset.depth);
				gsap.fromTo(el, { yPercent: d * 100 }, {
					yPercent: -d * 100, ease: "none",
					scrollTrigger: { trigger: el.closest("section, .cover, figure") || el, start: "top bottom", end: "bottom top", scrub: 1.2 }
				});
			});

			/* Film frames develop one after another, top edge first. */
			gsap.utils.toArray(".sheet[data-develop]").forEach(function (sheet) {
				sheet.classList.remove("stagger");
				gsap.fromTo(sheet.children, { clipPath: "inset(0 0 100% 0)", y: 24 }, {
					clipPath: "inset(0 0 0% 0)", y: 0, duration: 1, ease: EXPO, stagger: 0.08,
					scrollTrigger: { trigger: sheet, start: "top 80%", once: true }
				});
			});

			/* PricePulse: the line draws with the scroll, like a chart being plotted. */
			gsap.utils.toArray(".draw").forEach(function (fig) {
				fig.classList.remove("draw");
				var line = fig.querySelector(".pp-line");
				var tl2 = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 85%", end: "bottom 55%", scrub: 1 } });
				tl2.fromTo(line, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0)
					.fromTo(fig.querySelectorAll(".pp-area"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.5)
					.fromTo(fig.querySelectorAll(".pp-pred, .pp-end"), { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.85);
			});

			/* About: the ivory page slides up and widens to full bleed. */
			gsap.utils.toArray("[data-sheet]").forEach(function (el) {
				gsap.fromTo(el, { clipPath: "inset(0% 4% 0% 4% round 28px)" }, {
					clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
					scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: 1 }
				});
			});

			/* Images ease in from slightly larger, settling as they reach the centre. */
			gsap.utils.toArray("[data-settle]").forEach(function (img) {
				gsap.fromTo(img, { scale: 1.04, yPercent: -2 }, {
					scale: 1, yPercent: 2, ease: "none",
					scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: 1.2 }
				});
			});
		});

		/* Nav steps out of the way while reading down, returns on the way up. */
		ST.create({
			start: 200, end: "max",
			onUpdate: function (s) { document.body.classList.toggle("nav-hidden", s.direction === 1 && !document.body.classList.contains("menu-open")); }
		});
		if (document.fonts) document.fonts.ready.then(function () { ST.refresh(); });
	}

	function tick(t) { lenis.raf(t * 1000); }
	function anchor(e) {
		var id = this.getAttribute("href").replace(/^\//, "");
		if (location.pathname !== "/" && this.getAttribute("href").charAt(0) === "/") return;
		var target = document.querySelector(id);
		if (!target) return;
		e.preventDefault();
		lenis.scrollTo(target, { offset: -64, duration: 1.4 });
		history.pushState(null, "", id);
	}

	function teardown() {
		if (ctx) { ctx.revert(); ctx = null; }
		ST.getAll().forEach(function (t) { t.kill(); });
		if (lenis) {
			gsap.ticker.remove(tick);
			document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach(function (a) { a.removeEventListener("click", anchor); });
			lenis.destroy(); lenis = null;
		}
		document.body.classList.remove("nav-hidden");
	}

	window.AF_MOTION = {
		active: function () { return !!ctx; },
		sync: function () {
			var on = root.dataset.motion !== "off";
			if (on && !ctx) build();
			else if (!on && ctx) teardown();
		}
	};
	window.AF_MOTION.sync();
})();
