/* Home only: loader, hero scroll, scroll-read statement. Shared behaviour lives in site.js / motion.js. */
(function () {
	"use strict";

	var root = document.documentElement;
	var motionOn = function () { return root.dataset.motion !== "off"; };

	/* ---------- Loader: counts to 100, then lifts ---------- */
	var loader = document.querySelector(".loader");
	if (root.classList.contains("intro") && loader) {
		var num = loader.querySelector("b"), t0 = performance.now(), DUR = 1300;
		(function count(now) {
			var p = Math.min((now - t0) / DUR, 1);
			num.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
			if (p < 1) return requestAnimationFrame(count);
			loader.classList.add("is-out");
			setTimeout(function () { loader.remove(); }, 1000);
		})(t0);
	}

	/* ---------- Scroll-linked pieces (GSAP, motion on only) ---------- */
	function build() {
		if (!window.gsap || !window.ScrollTrigger || !motionOn()) return null;
		var gsap = window.gsap;
		return gsap.context(function () {
			/* Hero: the photo grows to fill as the name parts. */
			var tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ".hpin", start: "top top", end: "bottom bottom", scrub: 0.8 } });
			tl.to(".hero__photo", { width: "100vw", height: "100svh", ease: "power1.in" }, 0)
				.to(".hero__photo img", { filter: "grayscale(0.2) contrast(1.05) brightness(0.55)" }, 0)
				.to(".hero__name .ln:not(.ln--r)", { xPercent: -18 }, 0)
				.to(".hero__name .ln--r", { xPercent: 18 }, 0)
				.to(".hero__k, .hero__line, .hero__scroll", { opacity: 0, duration: 0.3 }, 0);

			/* Statement: words light up as they are read. */
			document.querySelectorAll("[data-read]").forEach(function (el) {
				var words = splitWords(el);
				gsap.fromTo(words, { opacity: 0.16 }, {
					opacity: 1, stagger: 0.05, ease: "none",
					scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 }
				});
			});
		});
	}

	function splitWords(el) {
		if (el.dataset.readDone) return el.querySelectorAll(".rw");
		(function walk(node) {
			Array.prototype.slice.call(node.childNodes).forEach(function (n) {
				if (n.nodeType === 3) {
					var frag = document.createDocumentFragment();
					n.textContent.split(/(\s+)/).forEach(function (part) {
						if (!part) return;
						if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
						var s = document.createElement("span"); s.className = "rw"; s.textContent = part; frag.appendChild(s);
					});
					n.parentNode.replaceChild(frag, n);
				} else if (n.nodeType === 1 && !n.classList.contains("tok")) {
					walk(n);
				} else if (n.nodeType === 1) {
					n.classList.add("rw");
				}
			});
		})(el);
		el.dataset.readDone = "1";
		return el.querySelectorAll(".rw");
	}

	/* motion.js and site.js load first (defer order); rebuild alongside them when Motion is toggled. */
	var ctx = null;
	var sync = function () {
		if (ctx) { ctx.revert(); ctx = null; }
		ctx = build();
		if (window.ScrollTrigger) window.ScrollTrigger.refresh();
	};
	document.querySelectorAll(".motion-btn").forEach(function (b) { b.addEventListener("click", sync); });
	sync();
})();
