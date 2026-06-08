/* =========================================================
   Adrie Fadzly — terminal portfolio
   Vanilla JS, no dependencies. Progressive enhancement.
   ========================================================= */
(function () {
	"use strict";

	/* ----- OPTIONAL: paste your Formspree endpoint here -----
	   e.g. "https://formspree.io/f/abcdwxyz"
	   Leave "" to use the mailto fallback (works out of the box). */
	var FORMSPREE_ENDPOINT = "https://formspree.io/f/xeewggby";
	var CONTACT_EMAIL = "mafadzly@gmail.com";

	// Respect OS reduced-motion, or an explicit ?fx=off escape hatch (shows
	// everything instantly with no animation — handy for low-power devices).
	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
		|| /[?&]fx=off\b/i.test(window.location.search);
	var finePointer  = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
	var $  = function (s, c) { return (c || document).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

	/* ---------------- Typewriter helper ---------------- */
	function typeText(el, text, speed) {
		return new Promise(function (resolve) {
			el.textContent = "";
			var i = 0;
			(function step() {
				if (i <= text.length) {
					el.textContent = text.slice(0, i);
					i++;
					setTimeout(step, speed);
				} else { resolve(); }
			})();
		});
	}

	/* ---------------- Boot sequence ---------------- */
	function runBoot() {
		var body = document.body;
		var done = function () { body.classList.remove("is-booting"); heroIntro(); };

		if (reduceMotion) { done(); return; }

		var log = $("#bootLog");
		var bar = $("#bootBar");
		var lines = [
			"booting adrie.os v3.75 ...",
			"[  ok  ] mount /home/adrie",
			"[  ok  ] load modules: backend, data, ml",
			"[  ok  ] start homelab services (docker x6)",
			"[  ok  ] establish uplink ...",
			"welcome, recruiter :) initializing portfolio"
		];
		var li = 0, progress = 0;
		bar.style.width = "0%";

		(function nextLine() {
			if (li >= lines.length) {
				bar.style.width = "100%";
				setTimeout(done, 480);
				return;
			}
			var line = lines[li] + "\n";
			var ci = 0;
			(function ch() {
				log.textContent += line[ci] || "";
				ci++;
				progress = Math.min(100, ((li + ci / line.length) / lines.length) * 100);
				bar.style.width = progress.toFixed(0) + "%";
				if (ci < line.length) { setTimeout(ch, 9); }
				else { li++; setTimeout(nextLine, 130); }
			})();
		})();

		// safety: never trap the user
		setTimeout(function () { if (body.classList.contains("is-booting")) done(); }, 6000);
	}

	/* ---------------- Hero intro + role cycler ---------------- */
	function heroIntro() {
		var heroCmd = $(".hero__line [data-typed]");
		var roleEl  = $("#roleText");
		var roles = ["Backend Developer", "Data Engineer", "ML Enthusiast", "Homelab Tinkerer"];

		if (reduceMotion) {
			if (roleEl) roleEl.textContent = roles[0];
			return;
		}

		var seq = heroCmd ? typeText(heroCmd, "whoami", 70) : Promise.resolve();
		seq.then(function () { if (roleEl) cycleRoles(roleEl, roles); });
	}

	function cycleRoles(el, roles) {
		var idx = 0;
		function loop() {
			var word = roles[idx % roles.length];
			typeText(el, word, 65).then(function () {
				setTimeout(function () { erase(); }, 1400);
			});
			function erase() {
				var t = el.textContent;
				if (t.length === 0) { idx++; setTimeout(loop, 220); return; }
				el.textContent = t.slice(0, -1);
				setTimeout(erase, 35);
			}
		}
		loop();
	}

	/* ---------------- Typed section commands (on reveal) ---------------- */
	function setupCommandTyping() {
		var cmds = $$(".cmd [data-typed]");
		cmds.forEach(function (el) { el.dataset.full = el.textContent; if (!reduceMotion) el.textContent = ""; });
		if (reduceMotion) return;

		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (en.isIntersecting && !en.target.dataset.typed2) {
					en.target.dataset.typed2 = "1";
					typeText(en.target, en.target.dataset.full, 32);
					io.unobserve(en.target);
				}
			});
		}, { threshold: 0.6 });
		cmds.forEach(function (el) { io.observe(el); });
	}

	/* ---------------- Scroll reveals (stagger) ---------------- */
	function setupReveals() {
		var els = $$("[data-reveal]");
		if (reduceMotion) { els.forEach(function (e) { e.classList.add("is-visible"); }); return; }

		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (!en.isIntersecting) return;
				var siblings = $$("[data-reveal]", en.target.parentNode)
					.filter(function (s) { return s.parentNode === en.target.parentNode; });
				var i = siblings.indexOf(en.target);
				en.target.style.setProperty("--d", (i > 0 ? i * 90 : 0) + "ms");
				en.target.classList.add("is-visible");
				io.unobserve(en.target);
			});
		}, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
		els.forEach(function (e) { io.observe(e); });
	}

	/* ---------------- Nav: scroll state, spy, burger ---------------- */
	function setupNav() {
		var nav = $("#nav");
		var links = $$(".nav__links a");
		var burger = $("#burger");
		var menu = $(".nav__links");

		window.addEventListener("scroll", function () {
			nav.classList.toggle("is-scrolled", window.scrollY > 10);
		}, { passive: true });

		// scroll-spy
		var byId = {};
		links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
		var sections = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
		var spy = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (en.isIntersecting) {
					links.forEach(function (l) { l.classList.remove("is-active"); });
					if (byId[en.target.id]) byId[en.target.id].classList.add("is-active");
				}
			});
		}, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
		sections.forEach(function (s) { spy.observe(s); });

		// mobile menu
		if (burger && menu) {
			burger.addEventListener("click", function () {
				var open = menu.classList.toggle("is-open");
				burger.setAttribute("aria-expanded", open ? "true" : "false");
			});
			links.forEach(function (a) {
				a.addEventListener("click", function () {
					menu.classList.remove("is-open");
					burger.setAttribute("aria-expanded", "false");
				});
			});
		}
	}

	/* ---------------- Theme toggle ---------------- */
	function setupTheme() {
		var btn = $("#themeToggle");
		var icon = btn ? btn.querySelector("i") : null;
		var meta = $('meta[name="theme-color"]');

		function apply(theme) {
			document.documentElement.setAttribute("data-theme", theme);
			if (icon) icon.className = theme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
			if (meta) meta.setAttribute("content", theme === "light" ? "#eef1f4" : "#0a0e14");
			if (window.__matrix) window.__matrix.refreshColor();
		}

		var saved = null;
		try { saved = localStorage.getItem("theme"); } catch (e) {}
		apply(saved || "dark");

		if (btn) btn.addEventListener("click", function () {
			var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
			apply(next);
			try { localStorage.setItem("theme", next); } catch (e) {}
		});
	}

	/* ---------------- Tilt + project glow ---------------- */
	function setupTilt() {
		if (!finePointer || reduceMotion) return;

		$$("[data-tilt]").forEach(function (el) {
			el.addEventListener("mousemove", function (e) {
				var r = el.getBoundingClientRect();
				var px = (e.clientX - r.left) / r.width - 0.5;
				var py = (e.clientY - r.top) / r.height - 0.5;
				el.style.transform = "perspective(800px) rotateX(" + (-py * 7).toFixed(2) + "deg) rotateY(" + (px * 7).toFixed(2) + "deg) translateY(-4px)";
			});
			el.addEventListener("mouseleave", function () { el.style.transform = ""; });
		});

		$$(".project").forEach(function (el) {
			el.addEventListener("mousemove", function (e) {
				var r = el.getBoundingClientRect();
				el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
				el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
			});
		});
	}

	/* ---------------- Matrix-rain canvas background ---------------- */
	function setupMatrix() {
		if (reduceMotion) return;
		var cv = $("#bg");
		if (!cv) return;
		var ctx = cv.getContext("2d");
		var glyphs = "01<>/{}[]=$#*+abcdef0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜ".split("");
		var fontSize = 16, cols = 0, drops = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
		var color = "#4ee39b";

		function readColor() {
			var c = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
			if (c) color = c;
		}
		function resize() {
			cv.width = Math.floor(innerWidth * dpr);
			cv.height = Math.floor(innerHeight * dpr);
			cv.style.width = innerWidth + "px";
			cv.style.height = innerHeight + "px";
			cols = Math.floor(innerWidth / fontSize);
			drops = [];
			for (var i = 0; i < cols; i++) drops[i] = Math.random() * -50;
		}

		var last = 0, fps = 18, interval = 1000 / fps, running = true;
		function frame(t) {
			if (!running) return;
			requestAnimationFrame(frame);
			if (t - last < interval) return;
			last = t;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.fillStyle = document.documentElement.getAttribute("data-theme") === "light"
				? "rgba(238,241,244,0.22)" : "rgba(10,14,20,0.20)";
			ctx.fillRect(0, 0, innerWidth, innerHeight);
			ctx.font = fontSize + "px monospace";
			for (var i = 0; i < drops.length; i++) {
				var ch = glyphs[(Math.random() * glyphs.length) | 0];
				var x = i * fontSize, y = drops[i] * fontSize;
				ctx.fillStyle = color;
				ctx.globalAlpha = Math.random() * 0.5 + 0.25;
				ctx.fillText(ch, x, y);
				ctx.globalAlpha = 1;
				if (y > innerHeight && Math.random() > 0.975) drops[i] = 0;
				drops[i] += 1;
			}
		}

		readColor(); resize();
		window.addEventListener("resize", resize, { passive: true });
		document.addEventListener("visibilitychange", function () {
			running = !document.hidden;
			if (running) requestAnimationFrame(frame);
		});
		requestAnimationFrame(frame);

		window.__matrix = { refreshColor: readColor };
	}

	/* ---------------- Contact form ---------------- */
	function setupForm() {
		var form = $("#contactForm");
		if (!form) return;
		var status = $("#formStatus");
		var btn = $("#sendBtn");

		form.addEventListener("submit", function (e) {
			e.preventDefault();
			var fd = new FormData(form);
			var data = {
				name: (fd.get("name") || "").toString().trim(),
				email: (fd.get("email") || "").toString().trim(),
				message: (fd.get("message") || "").toString().trim()
			};
			status.className = "contact__status";
			if (!data.name || !data.email || !data.message) {
				status.textContent = "✗ all fields are required.";
				status.classList.add("err");
				return;
			}

			// Fallback: open the user's mail client.
			if (!FORMSPREE_ENDPOINT) {
				var subject = encodeURIComponent("Portfolio message from " + data.name);
				var bodyTxt = encodeURIComponent(data.message + "\n\n— " + data.name + " (" + data.email + ")");
				window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + bodyTxt;
				status.textContent = "✓ opening your email client…";
				status.classList.add("ok");
				return;
			}

			// Formspree path
			btn.disabled = true;
			var label = btn.innerHTML;
			btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> sending…';
			fetch(FORMSPREE_ENDPOINT, {
				method: "POST",
				headers: { "Accept": "application/json", "Content-Type": "application/json" },
				body: JSON.stringify(data)
			}).then(function (r) {
				if (r.ok) {
					status.textContent = "✓ message sent — I'll reply soon!";
					status.classList.add("ok");
					form.reset();
				} else { throw new Error("bad response"); }
			}).catch(function () {
				status.textContent = "✗ couldn't send — email me at " + CONTACT_EMAIL;
				status.classList.add("err");
			}).then(function () {
				btn.disabled = false;
				btn.innerHTML = label;
			});
		});
	}

	/* ---------------- Init ---------------- */
	function init() {
		if (/[?&]fx=off\b/i.test(window.location.search)) document.documentElement.setAttribute("data-fx", "off");
		var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
		setupTheme();
		setupCommandTyping();
		setupReveals();
		setupNav();
		setupTilt();
		setupForm();
		setupMatrix();
		runBoot();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else { init(); }
})();
