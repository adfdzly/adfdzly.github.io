/* A stylised 3D Adrie, built from primitives and coloured from images/Profile.jpg:
   side-swept black hair, navy blazer over a cream turtleneck, dark trousers.
   He sits in the desk chair facing local -z. Poses: "type" (hands on the keyboard) and
   "wave" (spun round to the viewer). Head turns toward a look target; he blinks. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const mat = (color, roughness = 0.7) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, envMapIntensity: 0.4 });
const C = {
	skin: mat(0xa86c4f, 0.6), hair: mat(0x161514, 0.75), blazer: mat(0x232a3d, 0.85),
	shirt: mat(0xece2d0, 0.85), pants: mat(0x1b1b1d, 0.85), shoe: mat(0x0d0d0d, 0.45),
	eye: new THREE.MeshBasicMaterial({ color: 0x0f0c0b }), shine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};
function part(geo, m, x, y, z, parent, sx = 1, sy = 1, sz = 1) {
	const o = new THREE.Mesh(geo, m);
	o.position.set(x, y, z); o.scale.set(sx, sy, sz);
	o.castShadow = o.receiveShadow = true;
	parent.add(o);
	return o;
}
const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 16);
const MOUTH_Y = 0.092; // head-local height of the mouth, below the nose
const ball = (r) => new THREE.SphereGeometry(r, 32, 24);

export function buildMe(parent) {
	const me = new THREE.Group(); parent.add(me);

	// Legs (short, chibi: feet dangle above the floor)
	part(new RoundedBoxGeometry(0.34, 0.14, 0.3, 3, 0.06), C.pants, 0, 0.68, 0.02, me);
	for (const s of [-1, 1]) {
		const thigh = part(cap(0.075, 0.24), C.pants, s * 0.09, 0.68, -0.16, me); thigh.rotation.x = Math.PI / 2;
		part(cap(0.065, 0.2), C.pants, s * 0.09, 0.5, -0.31, me);
		part(new RoundedBoxGeometry(0.11, 0.07, 0.2, 3, 0.03), C.shoe, s * 0.09, 0.34, -0.35, me);
	}

	// Torso pivots at the hips so he can lean
	const torso = new THREE.Group(); torso.position.set(0, 0.72, 0.02); me.add(torso);
	part(cap(0.17, 0.2), C.blazer, 0, 0.24, 0, torso, 1.15, 1, 0.78);
	part(new RoundedBoxGeometry(0.13, 0.3, 0.03, 3, 0.014), C.shirt, 0, 0.27, -0.122, torso);
	for (const s of [-1, 1]) { // lapels
		const lapel = part(new RoundedBoxGeometry(0.05, 0.24, 0.02, 2, 0.008), C.blazer, s * 0.075, 0.33, -0.128, torso);
		lapel.rotation.z = s * 0.28;
	}
	part(new THREE.CylinderGeometry(0.08, 0.09, 0.1, 24), C.shirt, 0, 0.5, 0, torso);

	// Arms: shoulder → elbow pivots
	const arms = [-1, 1].map((s) => {
		const shoulder = new THREE.Group(); shoulder.position.set(s * 0.205, 0.41, 0); torso.add(shoulder);
		part(ball(0.065), C.blazer, 0, 0, 0, shoulder);
		part(cap(0.055, 0.15), C.blazer, 0, -0.11, 0, shoulder);
		const elbow = new THREE.Group(); elbow.position.set(0, -0.22, 0); shoulder.add(elbow);
		part(cap(0.05, 0.14), C.blazer, 0, -0.09, 0, elbow);
		part(ball(0.047), C.skin, 0, -0.205, 0, elbow, 1, 1.1, 0.85);
		return { s, shoulder, elbow };
	});

	// Head
	const neck = new THREE.Group(); neck.position.set(0, 0.55, 0); torso.add(neck);
	const head = new THREE.Group(); neck.add(head);
	part(ball(0.2), C.skin, 0, 0.18, 0, head, 1, 1.06, 0.98);
	for (const s of [-1, 1]) part(ball(0.045), C.skin, s * 0.198, 0.17, 0.01, head, 0.55, 1, 0.8);
	// Hair: a cap tilted back, volume on top swept to one side, short sides
	const hairCap = part(new THREE.SphereGeometry(0.214, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), C.hair, 0, 0.19, 0.014, head);
	hairCap.rotation.x = 0.78; // back and crown; the forehead stays clear
	const tuft = (r, x, y, z, sx, sy, sz, rx, rz) => { const t = part(ball(r), C.hair, x, y, z, head, sx, sy, sz); t.rotation.set(rx, 0, rz); };
	tuft(0.14, 0.0, 0.36, -0.02, 1.45, 0.62, 1.25, 0, -0.12);   // volume on top
	tuft(0.1, 0.05, 0.35, -0.12, 1.55, 0.6, 0.85, 0.35, -0.32); // quiff swept to one side
	tuft(0.075, -0.1, 0.33, -0.12, 1.3, 0.55, 0.8, 0.3, 0.45);  // the other side of the part
	tuft(0.07, 0.13, 0.3, -0.05, 1.1, 0.8, 1.2, 0, -0.7);       // side volume
	// Face
	const eyes = [-1, 1].map((s) => {
		const e = part(ball(0.019), C.eye, s * 0.07, 0.19, -0.188, head, 1, 1.3, 0.5);
		part(ball(0.006), C.shine, s * 0.07 + 0.006, 0.198, -0.198, head);
		const brow = part(new RoundedBoxGeometry(0.07, 0.015, 0.02, 2, 0.006), C.hair, s * 0.072, 0.245, -0.188, head);
		brow.rotation.z = -s * 0.1;
		return e;
	});
	part(ball(0.026), C.skin, 0, 0.14, -0.203, head, 0.85, 1, 0.9);
	// Mouth: an open smile drawn flat, then wrapped onto the face surface so it never sticks out
	const onFace = (shape, lift, color) => {
		const g = new THREE.ShapeGeometry(shape, 24), p = g.attributes.position;
		for (let i = 0; i < p.count; i++) {
			const x = p.getX(i), y = p.getY(i) + MOUTH_Y, ny = (y - 0.18) / 1.06;
			p.setXYZ(i, x, y, -0.98 * Math.sqrt(Math.max(0.04 - x * x - ny * ny, 0)) - lift);
		}
		g.computeVertexNormals();
		const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.6, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
		head.add(m);
	};
	const smile = new THREE.Shape();
	smile.moveTo(-0.044, 0.004); smile.quadraticCurveTo(0, -0.004, 0.044, 0.004);
	smile.bezierCurveTo(0.036, -0.03, -0.036, -0.03, -0.044, 0.004);
	const teeth = new THREE.Shape();
	teeth.moveTo(-0.036, 0.0); teeth.quadraticCurveTo(0, -0.007, 0.036, 0.0);
	teeth.quadraticCurveTo(0, -0.018, -0.036, 0.0);
	onFace(smile, 0.0015, 0x4a1d17);
	onFace(teeth, 0.0025, 0xf4efe8);

	return { me, torso, arms, neck, head, eyes, blinkIn: 2.5, wave: 0, look: new THREE.Vector3() };
}

const TYPE = { sx: 1.12, sz: 0.16, ex: 0.62 };
const lerp = (a, b, k) => a + (b - a) * k;

/* pose: "type" | "wave"; lookAt: world point the head should turn toward */
export function updateMe(rig, pose, dt, t, lookAt) {
	const k = 1 - Math.exp(-dt * 6);
	rig.wave = lerp(rig.wave, pose === "wave" ? 1 : 0, k);
	const w = rig.wave;

	rig.torso.rotation.x = lerp(-0.14, 0.04, w) + Math.sin(t * 1.6) * 0.01; // breathe
	for (const { s, shoulder, elbow } of rig.arms) {
		const waving = s === 1 ? w : 0;
		const tap = Math.sin(t * 13 + s * 1.7) * 0.05 * (1 - w);
		shoulder.rotation.x = lerp(TYPE.sx + tap, 0, w);
		shoulder.rotation.z = lerp(-s * TYPE.sz, s === 1 ? 2.55 : -0.12, s === 1 ? waving : w);
		elbow.rotation.x = lerp(TYPE.ex + tap * 1.4, 0.2, w);
		elbow.rotation.z = waving * (0.35 + Math.sin(t * 9) * 0.45);
	}

	// Head turns toward the look target, clamped to a believable range
	rig.head.parent.updateWorldMatrix(true, false);
	const local = rig.head.parent.worldToLocal(rig.look.copy(lookAt));
	const yaw = THREE.MathUtils.clamp(Math.atan2(-local.x, -local.z), -1.0, 1.0);
	const pitch = THREE.MathUtils.clamp(Math.atan2(local.y - 0.18, Math.hypot(local.x, local.z)), -0.35, 0.4);
	rig.head.rotation.y = lerp(rig.head.rotation.y, yaw, k * 0.6);
	rig.head.rotation.x = lerp(rig.head.rotation.x, pitch, k * 0.6);
	rig.head.rotation.z = Math.sin(t * 0.9) * 0.03 + w * Math.sin(t * 4.5) * 0.05;

	// Blink (only while animating; a still frame keeps the eyes open)
	if (dt > 0.5) return;
	rig.blinkIn -= dt;
	const closed = rig.blinkIn < 0.12;
	for (const e of rig.eyes) e.scale.y = closed ? 0.15 : 1.25;
	if (rig.blinkIn < 0) rig.blinkIn = 2 + Math.random() * 3;
}
