/* 3D Adrie. The face is his real face (images/me-face.webp, cut from images/Me.jpg) projected onto
   a head sculpted to his face shape: slim oval, narrow jaw, light-medium warm skin. Hair matches his:
   thick black volume swept up and back, shorter tapered sides. Outfit from images/Profile.jpg:
   navy blazer over a cream turtleneck, dark trousers. He sits facing local -z.
   Poses: "type" (hands on the keyboard) and "wave" (spun round to the viewer). */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const SKIN = 0xd49466; // sampled from his cheeks and forehead in Me.jpg (warm-graded like the face texture)
const mat = (color, roughness = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, envMapIntensity: 0.4, ...extra });
const C = {
	skin: mat(SKIN, 0.72), hair: mat(0xffffff, 0.55, { vertexColors: true }), blazer: mat(0x232a3d, 0.85),
	shirt: mat(0xece2d0, 0.85), pants: mat(0x1b1b1d, 0.85), shoe: mat(0x0d0d0d, 0.45),
};
function part(geo, m, x, y, z, parent, sx = 1, sy = 1, sz = 1) {
	const o = new THREE.Mesh(geo, m);
	o.position.set(x, y, z); o.scale.set(sx, sy, sz);
	o.castShadow = o.receiveShadow = true;
	parent.add(o);
	return o;
}
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 16);
const ball = (r, w = 32, h = 24) => new THREE.SphereGeometry(r, w, h);

/* Head: a unit sphere sculpted into his face shape, with the photo projected onto the front.
   UVs come from the undeformed sphere so the photo lines up: cheeks at X = ±0.85 → u 0.19–0.81,
   hairline at Y = 0.55 → 20% from the top of the texture, chin at Y = -0.95 → 90%. */
const HEAD = { w: 0.09, h: 0.134, d: 0.112 }; // his face is long and narrow
function headGeometry() {
	const g = new THREE.SphereGeometry(1, 64, 48);
	const pos = g.attributes.position, uv = g.attributes.uv;
	for (let i = 0; i < pos.count; i++) {
		let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
		const front = z < -0.12;
		uv.setXY(i, front ? 0.5 + x * 0.39 : 0.03, front ? 1 - (0.2 + (0.55 - y) * 0.4667) : 0.5);
		if (y < 0) { const t = Math.pow(-y, 1.8); x *= 1 - 0.16 * t; z *= 1 - 0.08 * t; } // oval face, jaw tapering gently to the chin
		if (z < 0) {
			z -= 0.1 * Math.exp(-((x / 0.16) ** 2 + ((y + 0.12) / 0.26) ** 2));                 // nose
			z -= 0.03 * Math.exp(-(((Math.abs(x) - 0.5) / 0.22) ** 2 + ((y + 0.05) / 0.2) ** 2)); // cheekbones
		}
		pos.setXYZ(i, x * HEAD.w, y * HEAD.h, z * HEAD.d);
	}
	g.computeVertexNormals();
	return g;
}

/* Hair: one smooth mesh over the head. A direction on the unit sphere is hidden (pulled inside the
   head) below his hairline: high on the forehead, above the ears at the sides, at the nape at the back.
   Above it the hair thickens toward the top, lifts at the front, and carries fine front-to-back grooves.
   Vertex colours fade from black on top to a lighter taper on the short sides. */
function hairGeometry() {
	const g = new THREE.SphereGeometry(1, 160, 90, 0, Math.PI * 2, 0, Math.PI * 0.68);
	const pos = g.attributes.position, colors = [];
	const black = new THREE.Color(0x121110), taper = new THREE.Color(0x3a2e28), c = new THREE.Color();
	const ss = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
		const phi = Math.abs(Math.atan2(x, -z)); // 0 at the front, π/2 at the sides, π at the back
		const hl = phi < 0.5 ? 0.5 : phi < Math.PI / 2 ? 0.5 - 0.52 * ss(0.5, Math.PI / 2, phi) : -0.02 - 0.5 * ((phi - Math.PI / 2) / (Math.PI / 2)); // straight across the forehead, down at the temples
		const t = ss(hl, hl + 0.26, y); // rises from the hairline instead of hanging over it
		const top = 0.34 * ss(0.25, 0.85, y) + 0.22 * ss(0.5, 0.9, y) * Math.exp(-((phi / 1.3) ** 2)) - 0.08 * x; // full, wide top with the quiff at the front
		const groove = 1 + 0.035 * ss(0.3, 0.7, y) * Math.sin(x * 32 + z * 2); // soft parallel front-to-back grooves: swept back
		// starts just inside the skin and rises through it, so the hairline is a smooth curve, not stair-steps
		const thick = (0.06 + top) * t * groove; // full at the sides too
		const r = t > 0 ? 0.975 + 0.06 * t + thick : 0.8, ry = t > 0 ? 0.975 + 0.06 * t + thick * 0.62 : 0.8; // below the hairline: tucked well inside the head
		pos.setXYZ(i, x * r * HEAD.w, y * ry * HEAD.h, z * r * HEAD.d);
		c.copy(taper).lerp(black, phi < 0.9 ? 1 : ss(hl + 0.05, hl + 0.45, y));
		colors.push(c.r, c.g, c.b);
	}
	g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
	g.computeVertexNormals();
	return g;
}

export function buildMe(parent) {
	const me = new THREE.Group(); parent.add(me);

	// Legs: seated, feet on the floor
	part(new RoundedBoxGeometry(0.3, 0.13, 0.28, 3, 0.05), C.pants, 0, 0.66, 0.02, me);
	for (const s of [-1, 1]) {
		const thigh = part(cap(0.062, 0.34), C.pants, s * 0.08, 0.66, -0.2, me); thigh.rotation.x = Math.PI / 2;
		part(cap(0.052, 0.46), C.pants, s * 0.08, 0.36, -0.4, me);
		part(new RoundedBoxGeometry(0.1, 0.07, 0.25, 3, 0.03), C.shoe, s * 0.08, 0.035, -0.44, me);
	}

	// Torso pivots at the hips so he can lean
	const torso = new THREE.Group(); torso.position.set(0, 0.72, 0.02); me.add(torso);
	part(cap(0.14, 0.24), C.blazer, 0, 0.25, 0, torso, 1.18, 1, 0.74);
	part(new RoundedBoxGeometry(0.11, 0.3, 0.03, 3, 0.012), C.shirt, 0, 0.28, -0.1, torso);
	for (const s of [-1, 1]) { // lapels
		const lapel = part(new RoundedBoxGeometry(0.045, 0.24, 0.018, 2, 0.007), C.blazer, s * 0.064, 0.33, -0.106, torso);
		lapel.rotation.z = s * 0.26;
	}
	part(new THREE.CylinderGeometry(0.058, 0.066, 0.09, 24), C.shirt, 0, 0.5, 0, torso); // turtleneck collar

	// Arms: shoulder → elbow pivots
	const arms = [-1, 1].map((s) => {
		const shoulder = new THREE.Group(); shoulder.position.set(s * 0.175, 0.42, 0); torso.add(shoulder);
		part(ball(0.058), C.blazer, 0, 0, 0, shoulder);
		part(cap(0.048, 0.18), C.blazer, 0, -0.12, 0, shoulder);
		const elbow = new THREE.Group(); elbow.position.set(0, -0.25, 0); shoulder.add(elbow);
		part(cap(0.043, 0.17), C.blazer, 0, -0.1, 0, elbow);
		part(ball(0.04), C.skin, 0, -0.225, 0, elbow, 0.9, 1.2, 0.7);
		return { s, shoulder, elbow };
	});

	// Head on a neck
	const neck = new THREE.Group(); neck.position.set(0, 0.53, 0); torso.add(neck);
	part(new THREE.CylinderGeometry(0.042, 0.048, 0.08, 20), C.skin, 0, 0.04, 0, neck);
	const head = new THREE.Group(); head.position.y = 0.155; neck.add(head);
	const faceTex = new THREE.TextureLoader().load("/images/me-face.webp");
	faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 8;
	part(headGeometry(), mat(0xffffff, 0.75, { map: faceTex }), 0, 0, 0, head);
	for (const s of [-1, 1]) part(ball(0.026, 16, 12), C.skin, s * 0.092, -0.005, 0.012, head, 0.45, 1, 0.75); // ears

	part(hairGeometry(), C.hair, 0, 0, 0, head); // one sculpted mesh: short tapered sides, volume on top

	return { me, torso, arms, neck, head, wave: 0, look: new THREE.Vector3() };
}

const TYPE = { sx: 1.05, sz: 0.14, ex: 0.75 };
const lerp = (a, b, k) => a + (b - a) * k;

/* pose: "type" | "wave"; lookAt: world point the head should turn toward */
export function updateMe(rig, pose, dt, t, lookAt) {
	const k = 1 - Math.exp(-dt * 6);
	rig.wave = lerp(rig.wave, pose === "wave" ? 1 : 0, k);
	const w = rig.wave;

	rig.torso.rotation.x = lerp(-0.12, 0.03, w) + Math.sin(t * 1.6) * 0.008; // breathe
	for (const { s, shoulder, elbow } of rig.arms) {
		const waving = s === 1 ? w : 0;
		const tap = Math.sin(t * 13 + s * 1.7) * 0.05 * (1 - w);
		shoulder.rotation.x = lerp(TYPE.sx + tap, 0, w);
		shoulder.rotation.z = lerp(-s * TYPE.sz, s === 1 ? 2.5 : -0.1, s === 1 ? waving : w);
		elbow.rotation.x = lerp(TYPE.ex + tap * 1.4, 0.15, w);
		elbow.rotation.z = waving * (0.35 + Math.sin(t * 9) * 0.45);
	}

	// Head turns toward the look target, clamped to a believable range
	rig.head.parent.updateWorldMatrix(true, false);
	const local = rig.head.parent.worldToLocal(rig.look.copy(lookAt));
	const yaw = THREE.MathUtils.clamp(Math.atan2(-local.x, -local.z), -1.0, 1.0);
	const pitch = THREE.MathUtils.clamp(Math.atan2(local.y - 0.17, Math.hypot(local.x, local.z)), -0.35, 0.4);
	rig.head.rotation.y = lerp(rig.head.rotation.y, yaw, k * 0.6);
	rig.head.rotation.x = lerp(rig.head.rotation.x, pitch, k * 0.6);
	rig.head.rotation.z = Math.sin(t * 0.9) * 0.025 + w * Math.sin(t * 4.5) * 0.04;
}
