/* Home 3D scene: a desk on a floating platform. Sections with data-shot are camera keyframes;
   scrolling blends between them, the monitor shows the matching screen, and the stack section
   drops tech balls you can push around. Falls back to a static gradient if WebGL is unavailable. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const root = document.documentElement;
const canvas = document.querySelector(".scene");
const loaderEl = document.querySelector(".loader");
const motionOn = () => root.dataset.motion !== "off";

/* ---------- Loader: counts toward the current build step ---------- */
let shown = 0, target = 0;
const loaderNum = loaderEl && loaderEl.querySelector("b");
const progress = (p) => { target = Math.max(target, p); };
(function tickLoader() {
	shown += (target - shown) * 0.18;
	if (loaderNum) loaderNum.textContent = Math.round(shown);
	if (shown < 99.5) requestAnimationFrame(tickLoader);
})();
const finishLoading = () => {
	progress(100);
	setTimeout(() => { root.classList.remove("is-loading"); if (loaderEl) loaderEl.classList.add("is-out"); }, 350);
};
progress(30);

let renderer;
try {
	renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (e) {
	finishLoading();
	throw e; // no WebGL: the CSS gradient fallback stays
}

/* ---------- Renderer, scene, camera ---------- */
const small = () => innerWidth < 900;
renderer.setPixelRatio(Math.min(devicePixelRatio, small() ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.Fog(0x050505, 10, 24);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 60);
progress(50);

/* ---------- Materials ---------- */
const std = (color, roughness = 0.6, metalness = 0.05, extra = {}) =>
	new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.45, ...extra });
const M = {
	platform: std(0x0d0d0d, 0.85),
	wood: std(0x221d19, 0.55),
	metal: std(0x2c2c2e, 0.35, 0.85),
	black: std(0x101010, 0.45, 0.2),
	white: std(0xe6e3dd, 0.42),
	fabric: std(0x1a1a1c, 0.95),
	pot: std(0x2e2724, 0.8),
	leaf: std(0x3c6b4b, 0.6),
	oxblood: std(0x5a1a1f, 0.6),
	glow: new THREE.MeshBasicMaterial({ color: 0xb9a8ff }),
};
const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene) => {
	const m = new THREE.Mesh(geo, mat);
	m.position.set(x, y, z);
	m.castShadow = m.receiveShadow = true;
	parent.add(m);
	return m;
};
const rbox = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, r);

/* ---------- Platform ---------- */
const R = 3.4;
mesh(new THREE.CylinderGeometry(R, R, 0.3, 96), M.platform, 0, -0.15, 0);
const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.014, 8, 200), M.glow);
rim.rotation.x = Math.PI / 2; scene.add(rim);
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(R - 0.5, 0.004, 6, 200), new THREE.MeshBasicMaterial({ color: 0xb9a8ff, transparent: true, opacity: 0.25 }));
ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.002; scene.add(ring2);

// Soft violet glow beneath the platform, so it floats
const glowTex = (() => {
	const c = document.createElement("canvas"); c.width = c.height = 256;
	const g = c.getContext("2d"), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
	grad.addColorStop(0, "rgba(150,130,255,0.55)"); grad.addColorStop(0.45, "rgba(120,100,255,0.16)"); grad.addColorStop(1, "rgba(0,0,0,0)");
	g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
	return new THREE.CanvasTexture(c);
})();
const under = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
under.rotation.x = -Math.PI / 2; under.position.y = -0.9; scene.add(under);

/* ---------- Desk ---------- */
const DESK_Y = 1.0, DESK_TOP = DESK_Y + 0.035;
mesh(rbox(2.6, 0.07, 1.15, 0.025), M.wood, 0, DESK_Y, 0);
for (const [x, z] of [[-1.2, -0.48], [1.2, -0.48], [-1.2, 0.48], [1.2, 0.48]]) mesh(new THREE.BoxGeometry(0.05, DESK_Y, 0.05), M.metal, x, DESK_Y / 2, z);

// Monitor
mesh(rbox(0.46, 0.02, 0.28, 0.008), M.metal, 0, DESK_TOP + 0.01, -0.3);
mesh(new THREE.BoxGeometry(0.06, 0.5, 0.035), M.metal, 0, DESK_TOP + 0.26, -0.38);
const monitor = new THREE.Group();
monitor.position.set(0, 1.74, -0.34); monitor.rotation.x = -0.04; scene.add(monitor);
mesh(rbox(1.62, 0.95, 0.05, 0.02), M.black, 0, 0, 0, monitor);
const SW = 1024, SH = 590;
const screenCanvas = document.createElement("canvas"); screenCanvas.width = SW; screenCanvas.height = SH;
const sx = screenCanvas.getContext("2d");
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.54, 0.88), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
screen.position.z = 0.026; monitor.add(screen);
const screenLight = new THREE.PointLight(0xb9a8ff, 2.2, 3.2, 1.6);
screenLight.position.set(0, 1.7, 0.25); scene.add(screenLight);

// Keyboard with instanced keys, mouse, notebook, mug
mesh(rbox(0.96, 0.025, 0.31, 0.01), M.white, -0.05, DESK_TOP + 0.012, 0.16);
const keyGeo = new THREE.BoxGeometry(0.052, 0.014, 0.05);
const keys = new THREE.InstancedMesh(keyGeo, std(0xf4f2ee, 0.5), 15 * 4);
const tmp = new THREE.Object3D(); let k = 0;
for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) {
	tmp.position.set(-0.05 - 0.42 + c * 0.06, DESK_TOP + 0.03, 0.16 - 0.09 + r * 0.06); tmp.updateMatrix(); keys.setMatrixAt(k++, tmp.matrix);
}
keys.castShadow = true; scene.add(keys);
const mouse3 = mesh(new THREE.SphereGeometry(0.06, 24, 16), M.white, 0.68, DESK_TOP + 0.012, 0.2); mouse3.scale.set(0.9, 0.38, 1.4);
const book = mesh(rbox(0.36, 0.022, 0.48, 0.006), M.oxblood, -0.72, DESK_TOP + 0.011, 0.16); book.rotation.y = 0.32;
mesh(rbox(0.33, 0.004, 0.45, 0.002), std(0xf1ece3, 0.8), -0.72, DESK_TOP + 0.024, 0.16).rotation.y = 0.32;
const mug = new THREE.Group(); mug.position.set(0.98, DESK_TOP, 0.22); scene.add(mug);
mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.15, 32), M.white, 0, 0.075, 0, mug);
mesh(new THREE.TorusGeometry(0.04, 0.012, 10, 24), M.white, 0.072, 0.08, 0, mug).rotation.y = 0;
mesh(new THREE.CircleGeometry(0.058, 24), std(0x2a160c, 0.3), 0, 0.14, 0, mug).rotation.x = -Math.PI / 2;

// Plant
const plant = new THREE.Group(); plant.position.set(1.08, DESK_TOP, -0.3); scene.add(plant);
mesh(new THREE.CylinderGeometry(0.12, 0.095, 0.22, 32), M.pot, 0, 0.11, 0, plant);
const leaves = [];
for (let i = 0; i < 9; i++) {
	const pivot = new THREE.Group(); pivot.position.y = 0.2; plant.add(pivot);
	const a = (i / 9) * Math.PI * 2, tilt = 0.35 + (i % 3) * 0.18;
	pivot.rotation.set(Math.cos(a) * tilt, a, Math.sin(a) * tilt);
	const leaf = mesh(new THREE.SphereGeometry(0.06, 16, 12), M.leaf, 0, 0.17 + (i % 3) * 0.04, 0, pivot);
	leaf.scale.set(0.55, 2.6, 0.18);
	leaves.push(pivot);
}

// Lamp with a warm spotlight onto the desk
const lamp = new THREE.Group(); lamp.position.set(-1.12, DESK_TOP, -0.2); lamp.rotation.y = -0.5; scene.add(lamp);
mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.025, 32), M.black, 0, 0.012, 0, lamp);
const arm1 = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 12), M.black, 0, 0.32, 0, lamp); arm1.rotation.z = -0.12;
const arm2 = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.48, 12), M.black, 0.2, 0.68, 0.02, lamp); arm2.rotation.z = -1.1;
const shade = mesh(new THREE.ConeGeometry(0.12, 0.17, 32, 1, true), std(0x141414, 0.4, 0.3, { side: THREE.DoubleSide }), 0.42, 0.76, 0.04, lamp);
shade.rotation.z = 0.5;
mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe2b8 }), 0.4, 0.72, 0.04, lamp);
const lampLight = new THREE.SpotLight(0xffc58f, 26, 4, 0.85, 0.7, 1.4);
lampLight.position.set(-0.78, DESK_TOP + 0.72, 0.0); lampLight.target.position.set(-0.4, DESK_TOP, 0.2);
lampLight.castShadow = true; lampLight.shadow.mapSize.set(1024, 1024); lampLight.shadow.bias = -0.0008;
scene.add(lampLight, lampLight.target);

// Chair
const chair = new THREE.Group(); chair.position.set(0.15, 0, 1.15); chair.rotation.y = -0.25; scene.add(chair);
mesh(rbox(0.6, 0.08, 0.56, 0.035), M.fabric, 0, 0.56, 0, chair);
const back = mesh(rbox(0.58, 0.72, 0.07, 0.035), M.fabric, 0, 1.0, 0.3, chair); back.rotation.x = 0.12;
mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12), M.metal, 0, 0.3, 0, chair);
for (let i = 0; i < 5; i++) {
	const a = (i / 5) * Math.PI * 2;
	const leg = mesh(new THREE.BoxGeometry(0.34, 0.03, 0.05), M.metal, Math.cos(a) * 0.17, 0.07, Math.sin(a) * 0.17, chair); leg.rotation.y = -a;
	mesh(new THREE.SphereGeometry(0.03, 12, 8), M.black, Math.cos(a) * 0.33, 0.03, Math.sin(a) * 0.33, chair);
}

// Homelab box under the desk, with LEDs
const lab = new THREE.Group(); lab.position.set(0.85, 0, -0.15); scene.add(lab);
mesh(rbox(0.36, 0.56, 0.46, 0.02), M.black, 0, 0.28, 0, lab);
const leds = [];
for (let i = 0; i < 4; i++) {
	const led = mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: i === 0 ? 0x5ee39a : 0xb9a8ff }), -0.1 + i * 0.05, 0.48, 0.235, lab);
	leds.push(led);
}
for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(0.3, 0.008, 0.004), M.metal, 0, 0.18 + i * 0.08, 0.232, lab);

/* ---------- Lights ---------- */
scene.add(new THREE.HemisphereLight(0x9c92ff, 0x0b0b0b, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(4, 7, 5); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 20 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key);
const rimLight = new THREE.PointLight(0x8b7bff, 40, 14, 1.5);
rimLight.position.set(-3.5, 3.2, -3); scene.add(rimLight);

/* ---------- Dust ---------- */
const dust = (() => {
	const n = 420, pos = new Float32Array(n * 3);
	for (let i = 0; i < n; i++) {
		const r = 3 + Math.random() * 8, a = Math.random() * Math.PI * 2;
		pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.random() * 7 - 1.5; pos[i * 3 + 2] = Math.sin(a) * r;
	}
	const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xb9a8ff, size: 0.025, transparent: true, opacity: 0.55, depthWrite: false }));
	scene.add(pts);
	return pts;
})();
progress(70);

/* ---------- Monitor screens (2D canvas) ---------- */
const F = (w, s, fam = "Geist") => `${w} ${s}px "${fam}", system-ui, sans-serif`;
const ppImg = new Image(); ppImg.src = "/images/pricepulse/dashboard.webp";
ppImg.onload = () => { if (screenState === "pp") drawScreen("pp", true); };

function chrome(bg, label) {
	sx.fillStyle = bg; sx.fillRect(0, 0, SW, SH);
	sx.fillStyle = "rgba(255,255,255,0.06)"; sx.fillRect(0, 0, SW, 40);
	["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { sx.fillStyle = c; sx.beginPath(); sx.arc(26 + i * 22, 20, 6.5, 0, 7); sx.fill(); });
	sx.fillStyle = "rgba(255,255,255,0.45)"; sx.font = F(500, 15, "Geist Mono"); sx.textAlign = "center"; sx.fillText(label, SW / 2, 26); sx.textAlign = "left";
}
function lines(arr, x, y, lh, font) {
	sx.font = font;
	arr.forEach((row, i) => {
		let cx = x;
		row.forEach(([t, c]) => { sx.fillStyle = c; sx.fillText(t, cx, y + i * lh); cx += sx.measureText(t).width; });
	});
}
const DIM = "#6f6f78", TXT = "#e8e8ec", VIO = "#b9a8ff", GRN = "#7ee2a8", ORG = "#ffb27a", BLU = "#8fc1ff";
const SCREENS = {
	hero(blink) {
		chrome("#0a0a0d", "adrie@aeska — zsh");
		lines([[["adrie@aeska", GRN], [" ~ % ", DIM], ["whoami", TXT]]], 40, 92, 30, F(500, 22, "Geist Mono"));
		sx.fillStyle = TXT; sx.font = F(500, 104); sx.fillText("Adrie Fadzly", 36, 250);
		sx.fillStyle = DIM; sx.font = F(400, 30); sx.fillText("Software engineer · Founder, AESKA Lab", 40, 304);
		lines([[["adrie@aeska", GRN], [" ~ % ", DIM], ["ls ~/work", TXT]], [["wedd/  aeskafilm/  pricepulse/  sm-agent/", BLU]], [["adrie@aeska", GRN], [" ~ % ", DIM]]], 40, 400, 34, F(500, 22, "Geist Mono"));
		if (blink) { sx.fillStyle = TXT; sx.fillRect(208, 448, 12, 26); }
	},
	desk() {
		chrome("#0b0b10", "payouts.service.ts — wedd");
		const code = [
			[["export async function ", VIO], ["release", BLU], ["(booking: Booking) {", TXT]],
			[["  if ", VIO], ["(!booking.coupleSignedOff) ", TXT], ["return ", VIO], ["hold", BLU], ["(booking);", TXT]],
			[["  if ", VIO], ["(booking.dispute) ", TXT], ["return ", VIO], ["review", BLU], ["(booking);", TXT]],
			[["", TXT]],
			[["  // fail closed: money moves only with evidence", DIM]],
			[["  const ", VIO], ["proof = ", TXT], ["await ", VIO], ["snapshot", BLU], ["(booking, ", TXT], ["'release'", ORG], [");", TXT]],
			[["  await ", VIO], ["payouts.", TXT], ["transfer", BLU], ["(booking.vendorId, proof);", TXT]],
			[["}", TXT]],
		];
		sx.fillStyle = "rgba(255,255,255,0.18)"; sx.font = F(400, 20, "Geist Mono");
		code.forEach((_, i) => sx.fillText(String(i + 1).padStart(2, " "), 24, 104 + i * 46));
		lines(code, 74, 104, 46, F(500, 22, "Geist Mono"));
	},
	wedd() {
		const g = sx.createRadialGradient(780, 60, 40, 600, 300, 700);
		g.addColorStop(0, "#8a3a3a"); g.addColorStop(0.5, "#4a1418"); g.addColorStop(1, "#22080b");
		sx.fillStyle = g; sx.fillRect(0, 0, SW, SH);
		sx.fillStyle = "#c4aa8b"; sx.font = `italic 400 120px "Instrument Serif", Georgia, serif`; sx.fillText("Wedd", 50, 150);
		sx.fillStyle = "#fbf8f3"; roundRect(470, 120, 500, 330, 22); sx.fill();
		sx.fillStyle = "#7a6f66"; sx.font = F(500, 17, "Geist Mono"); sx.fillText("SAT · 14 FEB 2027", 500, 170);
		sx.fillStyle = "#e7efe4"; roundRect(800, 148, 140, 32, 16); sx.fill(); sx.fillStyle = "#2f5b2b"; sx.font = F(500, 16); sx.fillText("● Confirmed", 818, 170);
		sx.fillStyle = "#2a2522"; sx.font = F(600, 28); sx.fillText("Akad & reception, full-day", 500, 222); sx.fillText("photography", 500, 256);
		sx.fillStyle = "rgba(42,37,34,0.12)"; sx.fillRect(500, 285, 440, 2);
		sx.fillStyle = "#2a2522"; sx.font = F(500, 20); sx.fillText("Deposit", 500, 322); sx.textAlign = "right"; sx.fillText("RM 1,500 · paid", 940, 322); sx.textAlign = "left";
		sx.fillStyle = "#f3ede4"; roundRect(500, 350, 440, 70, 14); sx.fill();
		sx.fillStyle = "#7a5520"; sx.font = F(500, 19); sx.fillText("Vendor payout", 520, 392); sx.textAlign = "right"; sx.fillText("● On hold until sign-off", 922, 392); sx.textAlign = "left";
		sx.fillStyle = "rgba(240,235,226,0.6)"; sx.font = F(500, 15, "Geist Mono"); sx.fillText("REDRAWN INTERFACE", 52, 540);
	},
	film() {
		sx.fillStyle = "#17120e"; sx.fillRect(0, 0, SW, SH);
		const glows = [["#ffd9a0", 0.3, 0.4], ["#c98a5c", 0.45, 0.55], ["#fff0c8", 0.62, 0.28], ["#d9a37a", 0.6, 0.6], ["#e8b98a", 0.35, 0.55], ["#f5c98f", 0.5, 0.1]];
		glows.forEach(([c, gx, gy], i) => {
			const x = 40 + (i % 3) * 320, y = 40 + Math.floor(i / 3) * 250, w = 300, h = 220;
			sx.save(); roundRect(x, y, w, h, 6); sx.clip();
			sx.fillStyle = "#2b1b12"; sx.fillRect(x, y, w, h);
			const g = sx.createRadialGradient(x + w * gx, y + h * gy, 4, x + w * gx, y + h * gy, w * 0.6);
			g.addColorStop(0, c); g.addColorStop(1, "rgba(0,0,0,0)"); sx.fillStyle = g; sx.fillRect(x, y, w, h);
			sx.restore();
			sx.fillStyle = "#c9a77c"; sx.font = F(500, 14, "Geist Mono"); sx.fillText(i === 5 ? "DEVELOP · OVERNIGHT" : "CAPTURE 0" + (i + 1), x, y + h + 20);
		});
	},
	pp(_, ready = ppImg.complete && ppImg.naturalWidth) {
		sx.fillStyle = "#efe9df"; sx.fillRect(0, 0, SW, SH);
		if (ready) {
			const s = SW / ppImg.naturalWidth; sx.drawImage(ppImg, 0, 0, SW, ppImg.naturalHeight * s);
		} else {
			sx.fillStyle = "#2a2522"; sx.font = F(600, 40); sx.fillText("PricePulse", 40, 80);
		}
	},
	career() {
		chrome("#0a0a0d", "git log --since=2023 — adrie");
		const rows = [["2026-09", "feat: join MoneyMax as full stack intern", GRN], ["2026-08", "award: Best Project, PricePulse (UiTM Jasin)", ORG], ["2026-06", "init: found AESKA Lab Solution", VIO], ["2024-10", "lead: president, Seni Silat Cekak UiTM Jasin", BLU], ["2023-10", "start: BSc Computer Science, Big Data", BLU]];
		rows.forEach(([d, m, c], i) => {
			const y = 108 + i * 62;
			sx.fillStyle = c; sx.beginPath(); sx.arc(56, y - 7, 8, 0, 7); sx.fill();
			if (i < rows.length - 1) { sx.fillStyle = "rgba(255,255,255,0.12)"; sx.fillRect(55, y + 4, 2, 50); }
			sx.fillStyle = DIM; sx.font = F(500, 20, "Geist Mono"); sx.fillText(d, 84, y);
			sx.fillStyle = TXT; sx.font = F(500, 24); sx.fillText(m, 210, y);
		});
		for (let c = 0; c < 46; c++) for (let r = 0; r < 4; r++) {
			const v = Math.abs(Math.sin(c * 1.7 + r * 2.3)) * (c / 46);
			sx.fillStyle = `rgba(126,226,168,${0.08 + v * 0.8})`; sx.fillRect(40 + c * 20.5, 430 + r * 20.5, 16, 16);
		}
	},
	stack() {
		chrome("#0a0a0d", "~/stack");
		lines([[["adrie@aeska", GRN], [" ~ % ", DIM], ["cat stack.txt", TXT]]], 40, 92, 30, F(500, 22, "Geist Mono"));
		const items = ["Python", "TypeScript", "Django", "FastAPI", "NestJS", "React", "Next.js", "PostgreSQL", "Redis", "Celery", "Docker", "Playwright", "Linux", "Proxmox", "Cloudflare", "GitHub Actions"];
		sx.font = F(500, 26);
		items.forEach((t, i) => { sx.fillStyle = i % 4 === 0 ? VIO : TXT; sx.fillText(t, 40 + (i % 4) * 240, 160 + Math.floor(i / 4) * 64); });
		sx.fillStyle = DIM; sx.font = F(500, 20, "Geist Mono"); sx.fillText("↓ they just fell on the floor. push them.", 40, 530);
	},
	also() {
		chrome("#0a0a0d", "sm-agent — scheduler");
		const rows = [["09:00", "draft  → check → approve", "post #412 scheduled", GRN], ["12:30", "reply  → tone check", "comment answered", GRN], ["15:00", "learn  → style memory", "+3 examples", VIO], ["18:00", "publish → instagram", "queued", ORG]];
		rows.forEach(([t, a, b, c], i) => {
			const y = 110 + i * 92;
			sx.fillStyle = "rgba(255,255,255,0.04)"; roundRect(36, y - 40, 952, 72, 12); sx.fill();
			sx.fillStyle = DIM; sx.font = F(500, 20, "Geist Mono"); sx.fillText(t, 60, y + 4);
			sx.fillStyle = TXT; sx.font = F(500, 24); sx.fillText(a, 170, y + 4);
			sx.fillStyle = c; sx.textAlign = "right"; sx.fillText("● " + b, 960, y + 4); sx.textAlign = "left";
		});
		sx.fillStyle = DIM; sx.font = F(500, 18, "Geist Mono"); sx.fillText("790 tests passing · USD 5 / month model budget", 40, 548);
	},
	contact(blink) {
		chrome("#0a0a0d", "new message");
		sx.fillStyle = DIM; sx.font = F(500, 22, "Geist Mono"); sx.fillText("to:", 40, 110);
		sx.fillStyle = TXT; sx.font = F(500, 64); sx.fillText("mafadzly@gmail.com", 40, 200);
		sx.fillStyle = DIM; sx.font = F(500, 22, "Geist Mono"); sx.fillText("subject:", 40, 280);
		sx.fillStyle = TXT; sx.font = F(400, 40); sx.fillText("I have something to build", 40, 340);
		if (blink) { sx.fillStyle = VIO; sx.fillRect(510, 312, 4, 40); }
		sx.fillStyle = "#ededed"; roundRect(40, 430, 190, 64, 32); sx.fill();
		sx.fillStyle = "#050505"; sx.font = F(500, 26); sx.fillText("Send  →", 82, 472);
	},
};
function roundRect(x, y, w, h, r) { sx.beginPath(); sx.roundRect(x, y, w, h, r); }
const SCREEN_LIGHT = { hero: 0xb9a8ff, desk: 0x9aa8ff, wedd: 0xff8a7a, film: 0xffb27a, pp: 0xfff3e0, career: 0x7ee2a8, stack: 0xb9a8ff, also: 0x7ee2a8, contact: 0xb9a8ff };
let screenState = "", blinkOn = true;
function drawScreen(name, force) {
	if (name === screenState && !force) return;
	screenState = name;
	sx.save(); SCREENS[name](blinkOn); sx.restore();
	screenTex.needsUpdate = true;
	screenLight.color.setHex(SCREEN_LIGHT[name] || 0xb9a8ff);
	needsRender = true;
}

/* ---------- Tech balls (simple sphere physics) ---------- */
const BR = 0.24;
const BALLS = [["Python", "#f7d34b"], ["TypeScript", "#f2f2f2"], ["Django", "#f2f2f2"], ["FastAPI", "#f2f2f2"], ["NestJS", "#f2f2f2"], ["React", "#f2f2f2"], ["Next.js", "#f2f2f2"], ["Postgres", "#b9a8ff"],
	["Redis", "#f2f2f2"], ["Celery", "#f2f2f2"], ["Docker", "#f2f2f2"], ["Playwright", "#f7d34b"], ["Linux", "#f2f2f2"], ["Proxmox", "#f2f2f2"], ["Cloudflare", "#f2f2f2"], ["Actions", "#b9a8ff"]];
const balls = BALLS.map(([label], i) => {
	const c = document.createElement("canvas"); c.width = 512; c.height = 256;
	const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
	const m = new THREE.Mesh(new THREE.SphereGeometry(BR, 40, 28), std(0xffffff, 0.32, 0, { map: tex }));
	m.castShadow = m.receiveShadow = true; m.visible = false; scene.add(m);
	return { m, tex, canvas: c, label, p: new THREE.Vector3(), v: new THREE.Vector3(), i };
});
const redrawBallLabels = () => balls.forEach(b => {
	const g = b.canvas.getContext("2d");
	g.fillStyle = BALLS[b.i][1]; g.fillRect(0, 0, 512, 256);
	g.fillStyle = "#0b0b0b"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `600 ${b.label.length > 8 ? 46 : 56}px "Geist", system-ui, sans-serif`;
	g.fillText(b.label, 128, 128); g.fillText(b.label, 384, 128); b.tex.needsUpdate = true;
});

// Solid boxes the balls collide with: desk (incl. top), monitor, chair seat, homelab box
const SOLIDS = [
	new THREE.Box3(new THREE.Vector3(-1.3, 0, -0.575), new THREE.Vector3(1.3, DESK_TOP, 0.575)),
	new THREE.Box3(new THREE.Vector3(-0.82, DESK_TOP, -0.42), new THREE.Vector3(0.82, 2.22, -0.26)),
	new THREE.Box3(new THREE.Vector3(-0.2, 0, 0.82), new THREE.Vector3(0.5, 0.6, 1.45)),
];
let dropped = false;
function dropBalls() {
	if (dropped) return;
	dropped = true;
	balls.forEach((b, i) => {
		const a = (i / balls.length) * Math.PI * 2 + Math.random() * 0.4, r = 0.6 + Math.random() * 1.9;
		b.p.set(Math.cos(a) * r, 3.2 + Math.random() * 3.4, Math.sin(a) * r + 0.4);
		b.v.set((Math.random() - 0.5) * 0.6, 0, (Math.random() - 0.5) * 0.6);
		b.m.visible = true;
	});
	if (!motionOn()) settleBalls();
}
function settleBalls() { // motion off: lay them out at rest in front of the desk
	balls.forEach((b, i) => {
		const row = Math.floor(i / 6), col = i % 6;
		b.p.set(-1.6 + col * 0.62 + (row % 2) * 0.3, BR, 1.2 + row * 0.55); b.v.set(0, 0, 0);
		b.m.position.copy(b.p);
	});
}
const closest = new THREE.Vector3(), n = new THREE.Vector3(), axis = new THREE.Vector3(), q = new THREE.Quaternion();
function stepBalls(dt) {
	for (const b of balls) {
		b.v.y -= 9.8 * dt;
		b.v.multiplyScalar(0.998);
		b.p.addScaledVector(b.v, dt);
		// Floor (platform top) and rim wall
		if (b.p.y < BR) { b.p.y = BR; if (b.v.y < 0) b.v.y *= -0.42; b.v.x *= 0.985; b.v.z *= 0.985; }
		const d = Math.hypot(b.p.x, b.p.z), maxR = R - BR - 0.05;
		if (d > maxR) {
			n.set(b.p.x / d, 0, b.p.z / d); b.p.x = n.x * maxR; b.p.z = n.z * maxR;
			const vn = b.v.dot(n); if (vn > 0) b.v.addScaledVector(n, -1.5 * vn);
		}
		// Boxes
		for (const box of SOLIDS) {
			box.clampPoint(b.p, closest);
			n.subVectors(b.p, closest); const dist = n.length();
			if (dist < BR) {
				if (dist < 1e-5) n.set(0, 1, 0); else n.divideScalar(dist);
				b.p.addScaledVector(n, BR - dist);
				const vn = b.v.dot(n); if (vn < 0) b.v.addScaledVector(n, -1.45 * vn);
				if (n.y > 0.7) { b.v.x *= 0.985; b.v.z *= 0.985; }
			}
		}
	}
	// Ball–ball
	for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
		const a = balls[i], c = balls[j];
		n.subVectors(c.p, a.p); const dist = n.length();
		if (dist > 0 && dist < BR * 2) {
			n.divideScalar(dist); const push = (BR * 2 - dist) / 2;
			a.p.addScaledVector(n, -push); c.p.addScaledVector(n, push);
			const rel = n.dot(axis.subVectors(c.v, a.v));
			if (rel < 0) { const imp = -1.4 * rel / 2; a.v.addScaledVector(n, -imp); c.v.addScaledVector(n, imp); }
		}
	}
	for (const b of balls) {
		const sp = Math.hypot(b.v.x, b.v.z);
		if (sp > 1e-4) { axis.set(b.v.z, 0, -b.v.x).normalize(); q.setFromAxisAngle(axis, (sp * dt) / BR); b.m.quaternion.premultiply(q); }
		b.m.position.copy(b.p);
	}
}

// Pointer pushes balls: ray onto a horizontal plane at ball height
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BR), hit = new THREE.Vector3(), lastHit = new THREE.Vector3();
let hasHit = false;
function pushAt(clientX, clientY, strength) {
	if (!dropped || !motionOn()) return;
	ndc.set((clientX / innerWidth) * 2 - 1, -(clientY / innerHeight) * 2 + 1);
	ray.setFromCamera(ndc, camera);
	if (!ray.ray.intersectPlane(plane, hit)) return;
	const vel = hasHit ? hit.clone().sub(lastHit) : new THREE.Vector3();
	lastHit.copy(hit); hasHit = true;
	for (const b of balls) {
		const dx = b.p.x - hit.x, dz = b.p.z - hit.z, d = Math.hypot(dx, dz);
		if (d < 0.75 && b.p.y < 1.6) {
			const f = (1 - d / 0.75) * strength;
			b.v.x += (dx / (d || 1)) * f * 3 + vel.x * 12 * f; b.v.z += (dz / (d || 1)) * f * 3 + vel.z * 12 * f; b.v.y += f * 2.2;
		}
	}
}
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener("pointermove", (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; pushAt(e.clientX, e.clientY, 0.5); }, { passive: true });
addEventListener("pointerdown", (e) => pushAt(e.clientX, e.clientY, 1.6), { passive: true });

/* ---------- Camera shots, blended by scroll ---------- */
// pos, target, and where the subject sits on screen (view offset as a fraction of width/height)
const SHOTS = {
	hero: { p: [3.5, 2.6, 4.4], t: [0, 1.15, 0], o: [-0.27, 0.03] },
	desk: { p: [2.0, 2.1, 2.8], t: [0, 1.5, -0.25], o: [-0.26, 0] },
	wedd: { p: [1.15, 1.95, 2.55], t: [0, 1.66, -0.34], o: [-0.27, 0] },
	film: { p: [-0.9, 1.95, 2.55], t: [0, 1.66, -0.34], o: [-0.27, 0] },
	pp: { p: [0.4, 2.1, 2.45], t: [0, 1.66, -0.34], o: [-0.27, 0] },
	career: { p: [-4.6, 2.7, 3.4], t: [0, 1.15, 0], o: [-0.2, 0] },
	stack: { p: [0.2, 6.4, 6.0], t: [0, 0.5, 0.5], o: [0, -0.12] },
	also: { p: [5.6, 2.4, -1.8], t: [0, 1.0, 0], o: [-0.2, 0] },
	contact: { p: [6.6, 4.6, 6.6], t: [0, 0.9, 0], o: [-0.18, 0.02] },
};
const MOBILE = { scale: 1.5, o: [0, 0.2] };
const shotEls = [...document.querySelectorAll("[data-shot]")];
let centers = [];
const measure = () => { centers = shotEls.map((el) => { const r = el.getBoundingClientRect(); return r.top + scrollY + r.height / 2; }); };

const want = { p: new THREE.Vector3(), t: new THREE.Vector3(), o: new THREE.Vector2() };
const cur = { p: new THREE.Vector3(), t: new THREE.Vector3(), o: new THREE.Vector2() };
const A = new THREE.Vector3(), B = new THREE.Vector3(), T = new THREE.Vector3();
const smooth = (x) => x * x * (3 - 2 * x);
function shotVec(name, key, out) {
	const s = SHOTS[name], v = s[key];
	if (key === "o") return out.set(...(small() ? MOBILE.o : v));
	out.set(...v);
	if (key === "p" && small()) { T.set(...s.t); out.sub(T).multiplyScalar(MOBILE.scale).add(T); }
	return out;
}
function desiredFromScroll() {
	const c = scrollY + innerHeight / 2;
	let i = 0;
	while (i < centers.length - 1 && c > centers[i + 1]) i++;
	const a = shotEls[i].dataset.shot, b = shotEls[Math.min(i + 1, shotEls.length - 1)].dataset.shot;
	const span = (centers[i + 1] || centers[i]) - centers[i];
	const t = span > 0 ? smooth(Math.min(Math.max((c - centers[i]) / span, 0), 1)) : 0;
	want.p.copy(shotVec(a, "p", A)).lerp(shotVec(b, "p", B), t);
	want.t.copy(shotVec(a, "t", A)).lerp(shotVec(b, "t", B), t);
	const oa = shotVec(a, "o", new THREE.Vector2()), ob = shotVec(b, "o", new THREE.Vector2());
	want.o.copy(oa).lerp(ob, t);
	const active = t < 0.5 ? a : b;
	drawScreen(active);
	if (active === "stack" || i >= shotEls.findIndex((el) => el.dataset.shot === "stack")) dropBalls();
	return active;
}

/* ---------- Resize ---------- */
function resize() {
	renderer.setSize(innerWidth, innerHeight, false);
	camera.aspect = innerWidth / innerHeight;
	camera.fov = small() ? 42 : 34;
	camera.updateProjectionMatrix();
	measure();
	needsRender = true;
}
addEventListener("resize", resize);
addEventListener("scroll", () => { needsRender = true; }, { passive: true });

/* ---------- Loop ---------- */
let needsRender = true, last = performance.now(), active = "hero", acc = 0, blinkT = 0;
const clock = { t: 0 };
function frame(now) {
	requestAnimationFrame(frame);
	if (document.hidden) { last = now; return; }
	const dt = Math.min((now - last) / 1000, 0.05); last = now;
	const moving = motionOn();
	active = desiredFromScroll();

	if (moving) {
		clock.t += dt;
		const k = 1 - Math.exp(-dt * 3.2);
		cur.p.lerp(want.p, k); cur.t.lerp(want.t, k); cur.o.lerp(want.o, k);
		pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
		// idle life
		leaves.forEach((l, i) => { l.rotation.z += Math.sin(clock.t * 1.3 + i) * 0.0006; });
		leds.forEach((l, i) => { l.visible = Math.sin(clock.t * (2 + i * 1.7) + i) > -0.6; });
		dust.rotation.y += dt * 0.02;
		rim.material.color.setHSL(0.71, 1, 0.78 + Math.sin(clock.t * 1.5) * 0.06);
		if (active === "contact") { const a = clock.t * 0.15; cur.p.applyAxisAngle(A.set(0, 1, 0), dt * 0.12 * Math.sin(a)); }
		blinkT += dt;
		if (blinkT > 0.55 && (active === "hero" || active === "contact")) { blinkT = 0; blinkOn = !blinkOn; drawScreen(active, true); }
		if (dropped) { acc += dt; while (acc > 1 / 120) { stepBalls(1 / 120); acc -= 1 / 120; } }
		needsRender = true;
	} else {
		cur.p.copy(want.p); cur.t.copy(want.t); cur.o.copy(want.o);
		pointer.x = pointer.y = 0;
	}
	if (!needsRender) return;
	needsRender = false;

	camera.position.copy(cur.p);
	camera.position.x += pointer.x * 0.35; camera.position.y -= pointer.y * 0.2;
	camera.lookAt(cur.t);
	camera.setViewOffset(innerWidth, innerHeight, cur.o.x * innerWidth, cur.o.y * innerHeight, innerWidth, innerHeight);
	renderer.render(scene, camera);
}

/* ---------- Start ---------- */
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
	progress(90);
	redrawBallLabels();
	resize();
	desiredFromScroll();
	drawScreen(active, true);
	cur.p.copy(want.p); cur.t.copy(want.t); cur.o.copy(want.o);
	if (motionOn()) cur.p.multiplyScalar(1.35); // first frame: start a little further out and glide in
	requestAnimationFrame(frame);
	requestAnimationFrame(() => { canvas.classList.add("is-ready"); root.classList.add("has-3d"); finishLoading(); });
	setTimeout(measure, 1200); // after images/fonts settle the layout
});
document.querySelectorAll(".motion-btn").forEach((b) => b.addEventListener("click", () => {
	setTimeout(() => { if (!motionOn() && dropped) settleBalls(); needsRender = true; }, 0);
}));
