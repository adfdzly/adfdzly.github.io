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
			/* Headlines rise line by line, once. */
			gsap.utils.toArray("[data-split]").forEach(function (el) {
				var words = split(el);
				gsap.fromTo(words, { yPercent: 115 }, {
					yPercent: 0, duration: 1.1, ease: EXPO, stagger: 0.035,
					scrollTrigger: el.hasAttribute("data-split-now") ? null : { trigger: el, start: "top 88%", once: true },
					delay: el.hasAttribute("data-split-now") ? 0.1 : 0
				});
			});

			gsap.utils.toArray("[data-depth]").forEach(function (el) {
				var d = parseFloat(el.dataset.depth);
				gsap.fromTo(el, { yPercent: d * 100 }, {
					yPercent: -d * 100, ease: "none",
					scrollTrigger: { trigger: el.closest("section, .cover, figure") || el, start: "top bottom", end: "bottom top", scrub: 1.2 }
				});
			});

			/* Work titles slide in from alternating sides. */
			gsap.utils.toArray(".row__t").forEach(function (t, i) {
				gsap.fromTo(t, { xPercent: i % 2 ? 8 : -8 }, {
					xPercent: 0, ease: "none",
					scrollTrigger: { trigger: t, start: "top bottom", end: "top 55%", scrub: 0.8 }
				});
			});

			/* Footer wordmark rises out of the floor. */
			gsap.utils.toArray(".foot2__mark").forEach(function (el) {
				gsap.fromTo(el, { yPercent: 60 }, {
					yPercent: 0, ease: "none",
					scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom bottom", scrub: 0.8 }
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
			onUpdate: function (s) { document.body.classList.toggle("nav-hidden", s.direction === 1); }
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
		lenis.scrollTo(target, { duration: 1.4 });
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
