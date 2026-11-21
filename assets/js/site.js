/* Adrie Fadzly: portfolio behaviour. No dependencies. */
(function () {
	"use strict";

	var root = document.documentElement;
	var motionOn = function () { return root.dataset.motion !== "off"; };
	var store = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };

	/* ---------- Motion control ---------- */
	var motionListeners = [];
	function syncMotionButtons() {
		document.querySelectorAll(".motion-btn").forEach(function (b) {
			b.setAttribute("aria-pressed", String(motionOn()));
		});
	}
	document.querySelectorAll(".motion-btn").forEach(function (b) {
		b.addEventListener("click", function () {
			root.dataset.motion = motionOn() ? "off" : "on";
			root.classList.remove("intro");
			store("af-motion", root.dataset.motion);
			syncMotionButtons();
			if (window.AF_MOTION) window.AF_MOTION.sync();
			motionListeners.forEach(function (fn) { fn(); });
		});
	});
	syncMotionButtons();

	/* ---------- Local clock (Johor Bahru, MYT) ---------- */
	var clocks = document.querySelectorAll("[data-clock]");
	if (clocks.length) {
		var fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });
		var tickClock = function () { var t = "Johor Bahru " + fmt.format(new Date()) + " MYT"; clocks.forEach(function (c) { c.textContent = t; }); };
		tickClock();
		setInterval(tickClock, 15000);
	}

	/* ---------- Cursor + floating work preview (fine pointer, one rAF loop) ---------- */
	var cur = document.querySelector(".cur");
	var pv = document.querySelector(".pv");
	if (cur && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
		var curLabel = cur.querySelector(".cur__label");
		var panels = pv ? pv.querySelectorAll("[data-p]") : [];
		var lerp = function (a, b, t) { return a + (b - a) * t; };
		var m = { x: -100, y: -100 }, c = { x: -100, y: -100 }, p = { x: -100, y: -100 }, raf = 0;
		var loop = function () {
			c.x = lerp(c.x, m.x, 0.35); c.y = lerp(c.y, m.y, 0.35);
			p.x = lerp(p.x, m.x, 0.12); p.y = lerp(p.y, m.y, 0.12);
			cur.style.transform = "translate3d(" + c.x + "px," + c.y + "px,0)";
			if (pv) pv.style.transform = "translate3d(" + p.x + "px," + p.y + "px,0) rotate(" + ((m.x - p.x) * 0.03).toFixed(2) + "deg)";
			raf = Math.abs(m.x - p.x) + Math.abs(m.y - p.y) > 0.3 ? requestAnimationFrame(loop) : 0;
		};
		window.addEventListener("pointermove", function (e) {
			if (!motionOn()) return;
			m.x = e.clientX; m.y = e.clientY;
			root.classList.remove("is-hidden-cur");
			if (!raf) raf = requestAnimationFrame(loop);
		}, { passive: true });
		document.addEventListener("pointerleave", function () { root.classList.add("is-hidden-cur"); });
		document.addEventListener("pointerover", function (e) {
			var t = e.target.closest("a, button, summary, [data-cursor]");
			var text = t && t.getAttribute("data-cursor");
			cur.classList.toggle("is-label", !!text);
			cur.classList.toggle("is-link", !!t && !text);
			curLabel.textContent = text || "";
			var key = t && t.getAttribute("data-preview");
			if (pv) {
				pv.classList.toggle("is-on", !!key);
				panels.forEach(function (n) { n.classList.toggle("is-on", n.getAttribute("data-p") === key); });
			}
		});
		var syncCur = function () { root.classList.toggle("has-cur", motionOn()); };
		syncCur();
		motionListeners.push(syncCur);
	}

	/* ---------- Copy email ---------- */
	document.querySelectorAll("[data-copy]").forEach(function (btn) {
		var label = btn.querySelector("span");
		var status = document.getElementById(btn.getAttribute("aria-describedby"));
		var timer;
		btn.addEventListener("click", function () {
			var text = btn.dataset.copy;
			var done = function () {
				btn.classList.add("is-done");
				label.textContent = "Copied";
				if (status) status.textContent = "Email address copied";
				clearTimeout(timer);
				timer = setTimeout(function () {
					btn.classList.remove("is-done");
					label.textContent = "Copy";
					if (status) status.textContent = "";
				}, 2000);
			};
			if (navigator.clipboard && window.isSecureContext) {
				navigator.clipboard.writeText(text).then(done, function () { window.location.href = "mailto:" + text; });
			} else {
				window.location.href = "mailto:" + text;
			}
		});
	});

	/* ---------- Tabs (Wedd: Couple / Vendor / System) ---------- */
	document.querySelectorAll("[role='tablist']").forEach(function (list) {
		var tabs = Array.prototype.slice.call(list.querySelectorAll("[role='tab']"));
		var thumb = list.querySelector(".seg__thumb");
		var place = function (t) {
			if (!thumb) return;
			thumb.style.width = t.offsetWidth + "px";
			thumb.style.transform = "translateX(" + t.offsetLeft + "px)";
		};
		var select = function (t, focus) {
			tabs.forEach(function (x) {
				var on = x === t;
				x.setAttribute("aria-selected", String(on));
				x.tabIndex = on ? 0 : -1;
				document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
			});
			place(t);
			if (focus) t.focus();
		};
		tabs.forEach(function (t, i) {
			t.addEventListener("click", function () { select(t); });
			t.addEventListener("keydown", function (e) {
				var n = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
				if (e.key === "Home") n = -i; else if (e.key === "End") n = tabs.length - 1 - i;
				if (n === undefined) return;
				e.preventDefault();
				select(tabs[(i + n + tabs.length) % tabs.length], true);
			});
		});
		var current = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0];
		select(current);
		window.addEventListener("resize", function () { place(tabs.filter(function (t) { return t.tabIndex === 0; })[0]); });
		if (document.fonts) document.fonts.ready.then(function () { select(tabs.filter(function (t) { return t.tabIndex === 0; })[0]); });
	});

	/* ---------- Film strip (AeskaFilm: Scan / Capture / Reveal) ---------- */
	document.querySelectorAll(".strip").forEach(function (strip) {
		var track = strip.querySelector(".strip__track");
		var stops = strip.querySelectorAll(".strip__stop");
		var ctl = document.querySelector("[data-strip-ctl='" + strip.id + "']");
		var steps = ctl.querySelectorAll("[data-go]");
		var prev = ctl.querySelector("[data-prev]"), next = ctl.querySelector("[data-next]");
		var at = 0;
		var go = function (i) {
			at = Math.max(0, Math.min(stops.length - 1, i));
			track.style.transform = "translateX(" + (-100 * at) + "%)";
			stops.forEach(function (s, k) { s.setAttribute("aria-hidden", String(k !== at)); s.inert = k !== at; });
			steps.forEach(function (b, k) { b.setAttribute("aria-current", k === at ? "step" : "false"); });
			prev.disabled = at === 0;
			next.disabled = at === stops.length - 1;
		};
		steps.forEach(function (b, k) { b.addEventListener("click", function () { go(k); }); });
		prev.addEventListener("click", function () { go(at - 1); });
		next.addEventListener("click", function () { go(at + 1); });
		go(0);
	});

	/* ---------- Chart inspector (PricePulse) ---------- */
	var insp = document.querySelector("[data-inspect]");
	if (insp) {
		var data = JSON.parse(document.getElementById("pp-data").textContent);
		var svg = insp.querySelector("svg");
		var W = 800, H = 300, P = { l: 52, r: 16, t: 16, b: 34 };
		var prices = data.map(function (d) { return d.price; });
		var lo = Math.floor((Math.min.apply(null, prices) - 150) / 250) * 250;
		var hi = Math.ceil((Math.max.apply(null, prices) + 150) / 250) * 250;
		var x = function (i) { return P.l + (i / (data.length - 1)) * (W - P.l - P.r); };
		var y = function (v) { return P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b); };
		var ns = "http://www.w3.org/2000/svg";
		var el = function (tag, attrs, parent) {
			var n = document.createElementNS(ns, tag);
			for (var k in attrs) n.setAttribute(k, attrs[k]);
			(parent || svg).appendChild(n);
			return n;
		};
		var rm = function (v) { return "RM " + v.toLocaleString("en-MY"); };
		var tbody = document.getElementById("pp-table");
		if (tbody) tbody.innerHTML = data.map(function (d) {
			return "<tr><td>" + d.week + "</td><td>" + d.price.toLocaleString("en-MY") + "</td><td>" + d.pred.toLowerCase() + "</td><td>" + (d.actual ? d.actual.toLowerCase() : "–") + "</td></tr>";
		}).join("");

		var grid = el("g", { "class": "pp-grid" });
		for (var g = lo; g <= hi; g += 250) {
			el("line", { x1: P.l, x2: W - P.r, y1: y(g), y2: y(g) }, grid);
			if ((g - lo) % 500 === 0) el("text", { x: P.l - 10, y: y(g) + 4, "text-anchor": "end", "class": "pp-axis" }, grid).textContent = (g / 1000).toFixed(1) + "k";
		}
		data.forEach(function (d, i) {
			if (i % 2 === 0) el("text", { x: x(i), y: H - 8, "text-anchor": "middle", "class": "pp-axis" }).textContent = d.week;
		});
		var pts = data.map(function (d, i) { return x(i).toFixed(1) + "," + y(d.price).toFixed(1); });
		el("path", { d: "M" + pts.join("L") + "L" + x(data.length - 1) + "," + (H - P.b) + "L" + P.l + "," + (H - P.b) + "Z", "class": "pp-area" });
		el("path", { d: "M" + pts.join("L"), "class": "pp-line" });
		var hair = el("line", { y1: P.t, y2: H - P.b, "class": "hair" });
		var dot = el("circle", { r: 5, "class": "pt" });

		var out = {
			week: insp.querySelector("[data-o='week']"),
			price: insp.querySelector("[data-o='price']"),
			pred: insp.querySelector("[data-o='pred']"),
			actual: insp.querySelector("[data-o='actual']")
		};
		var label = function (dir) { return dir.charAt(0) + dir.slice(1).toLowerCase(); };
		var setDir = function (node, dir) { node.textContent = dir ? label(dir) : "Not yet known"; node.className = dir ? "dir-" + dir.toLowerCase() : ""; };
		var cur = -1;
		var show = function (i) {
			i = Math.max(0, Math.min(data.length - 1, i));
			if (i === cur) return;
			cur = i;
			var d = data[i];
			hair.setAttribute("x1", x(i)); hair.setAttribute("x2", x(i));
			dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(d.price));
			out.week.textContent = "Week of " + d.week;
			out.price.textContent = rm(d.price);
			setDir(out.pred, d.pred);
			setDir(out.actual, d.actual);
			svg.setAttribute("aria-valuenow", String(i));
			svg.setAttribute("aria-valuetext", "Week of " + d.week + ", " + rm(d.price) + ", predicted " + label(d.pred) + (d.actual ? ", actual " + label(d.actual) : ""));
		};
		var fromPointer = function (e) {
			var r = svg.getBoundingClientRect();
			var px = (e.clientX - r.left) / r.width * W;
			show(Math.round((px - P.l) / (W - P.l - P.r) * (data.length - 1)));
		};
		svg.addEventListener("pointermove", fromPointer);
		svg.addEventListener("pointerdown", fromPointer);
		svg.addEventListener("keydown", function (e) {
			var step = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 1, ArrowDown: -1 }[e.key];
			if (e.key === "Home") step = -cur; else if (e.key === "End") step = data.length - 1 - cur;
			if (step === undefined) return;
			e.preventDefault();
			show(cur + step);
		});
		show(data.length - 2);
	}
})();
