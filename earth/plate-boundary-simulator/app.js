import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.getElementById("simCanvas");

const boundaryType = document.getElementById("boundaryType");
const speedSlider = document.getElementById("speed");
const magmaSlider = document.getElementById("magma");
const quakeSlider = document.getElementById("quake");

const showPlates = document.getElementById("showPlates");
const showMantle = document.getElementById("showMantle");
const showBoundary = document.getElementById("showBoundary");

const showArrows = document.getElementById("showArrows");
const showQuakes = document.getElementById("showQuakes");
const showMagma = document.getElementById("showMagma");

const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");

const exampleList = document.getElementById("exampleList");
const mapMarkers = document.getElementById("mapMarkers");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdff6ff);
scene.fog = new THREE.Fog(0xdff6ff, 16, 34);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setSize(canvas.width, canvas.height, false);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(
  45,
  canvas.width / canvas.height,
  0.1,
  1000
);

camera.position.set(9, 7, 14);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;
controls.target.set(0, 0, 0);

const mainGroup = new THREE.Group();
scene.add(mainGroup);

const sun = new THREE.DirectionalLight(0xffffff, 2.6);
sun.position.set(6, 12, 8);
sun.castShadow = true;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 1.15));

const materials = {
  ocean: new THREE.MeshStandardMaterial({
    color: 0x168fd3,
    transparent: true,
    opacity: 0.62,
    roughness: 0.25,
    metalness: 0.05
  }),
  oceanDeep: new THREE.MeshStandardMaterial({
    color: 0x0b4f78,
    roughness: 0.8
  }),
  oceanPlate: new THREE.MeshStandardMaterial({
    color: 0x4f7488,
    roughness: 0.85
  }),
  oceanPlateDark: new THREE.MeshStandardMaterial({
    color: 0x273f4d,
    roughness: 0.9
  }),
  youngCrust: new THREE.MeshStandardMaterial({
    color: 0x8edcff,
    roughness: 0.45
  }),
  oldCrust: new THREE.MeshStandardMaterial({
    color: 0x27495d,
    roughness: 0.9
  }),
  continent: new THREE.MeshStandardMaterial({
    color: 0x9b7a4b,
    roughness: 0.9
  }),
  grass: new THREE.MeshStandardMaterial({
    color: 0x5f8f4e,
    roughness: 0.9
  }),
  mountain: new THREE.MeshStandardMaterial({
    color: 0x6d604c,
    roughness: 0.95
  }),
  snow: new THREE.MeshStandardMaterial({
    color: 0xf5f7fa,
    roughness: 0.55
  }),
  mantle: new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.75,
    transparent: true,
    opacity: 0.72
  }),
  mantleDark: new THREE.MeshStandardMaterial({
    color: 0x8b2f12,
    roughness: 0.9,
    transparent: true,
    opacity: 0.8
  }),
  magma: new THREE.MeshStandardMaterial({
    color: 0xff3b18,
    emissive: 0xff2600,
    emissiveIntensity: 2.4
  }),
  magmaBright: new THREE.MeshStandardMaterial({
    color: 0xfff176,
    emissive: 0xff7a00,
    emissiveIntensity: 3.2
  }),
  volcano: new THREE.MeshStandardMaterial({
    color: 0x54311f,
    roughness: 0.95
  }),
  dark: new THREE.MeshStandardMaterial({
    color: 0x1c1c1c
  }),
  quake: new THREE.MeshBasicMaterial({
    color: 0xff1a1a,
    transparent: true,
    opacity: 1
  }),
  smoke: new THREE.MeshStandardMaterial({
    color: 0x555555,
    transparent: true,
    opacity: 0.35,
    roughness: 1
  })
};

let time = 0;
let arrows = [];
let plateObjects = [];
let magmaObjects = [];
let quakes = [];
let crustBands = [];
let benioffDots = [];
let smokeObjects = [];
let waveObjects = [];
let convectionParticles = [];
let plateMeshes = [];
let mantleMeshes = [];
let boundaryMeshes = [];

function clearScene() {
  while (mainGroup.children.length) {
    const obj = mainGroup.children.pop();
    obj.traverse?.(child => {
      if (child.geometry) child.geometry.dispose();
    });
  }

  arrows = [];
  plateObjects = [];
  magmaObjects = [];
  quakes = [];
  crustBands = [];
  benioffDots = [];
  smokeObjects = [];
  waveObjects = [];
  convectionParticles = [];
  plateMeshes = [];
  mantleMeshes = [];
  boundaryMeshes = [];
}

function addBox(x, y, z, sx, sy, sz, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mainGroup.add(mesh);
  return mesh;
}

function addCone(x, y, z, r, h, mat, segments = 64) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, segments), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mainGroup.add(mesh);
  return mesh;
}

function addCylinder(x, y, z, r, h, mat, segments = 64) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mainGroup.add(mesh);
  return mesh;
}

function addSphere(x, y, z, r, mat) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mainGroup.add(mesh);
  return mesh;
}

function addArrow(start, end, color = 0xffffff) {
  const dir = new THREE.Vector3().subVectors(end, start).normalize();
  const len = start.distanceTo(end);

  const arrow = new THREE.ArrowHelper(dir, start, len, color, 0.55, 0.32);
  mainGroup.add(arrow);
  arrows.push(arrow);
  return arrow;
}

function createConvectionCell(cx, cz, reverse = false) {
  const group = new THREE.Group();
  mainGroup.add(group);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0xfff3a3,
    transparent: true,
    opacity: 0.75
  });

  const points = [];

  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        cx + Math.cos(a) * 1.45,
        -1.75 + Math.sin(a) * 0.55,
        cz
      )
    );
  }

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(lineGeo, lineMat);
  group.add(line);

  for (let i = 0; i < 8; i++) {

    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 24),
      materials.magmaBright.clone()
    );

    p.position.set(
      cx + Math.cos((i / 8) * Math.PI * 2) * 1.45,
      -1.2,
      cz
    );

    group.add(p);

    convectionParticles.push({
      mesh: p,
      cx,
      cz,
      phase: (i / 8) * Math.PI * 2,
      reverse
    });
  }
}


function createTerrainSurface(x, y, z, width, depth, mat, rough = 0.25, lift = 0) {
  const geo = new THREE.PlaneGeometry(width, depth, 48, 48);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);

    const h =
      Math.sin(px * 1.4) * rough +
      Math.cos(py * 1.2) * rough +
      Math.sin((px + py) * 1.7) * rough * 0.4 +
      lift;

    pos.setZ(i, h);
  }

  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mainGroup.add(mesh);
  return mesh;
}

function addOceanAndMantle() {

  const mantle = addBox(
    0, -2.05, 0,
    20, 2.5, 10,
    materials.mantle
  );

  mantleMeshes.push(mantle);

  const mantleDark = addBox(
    0, -3.15, 0,
    20, 0.45, 10,
    materials.mantleDark
  );

  mantleMeshes.push(mantleDark);

  for (let i = 0; i < 36; i++) {

    const blob = addCylinder(
      -9 + i * 0.55,
      -1.15,
      -4 + Math.random() * 8,
      0.13,
      0.055,
      materials.magma
    );

    blob.scale.x = 2.2;
    blob.scale.z = 0.7;

    mantleMeshes.push(blob);
    magmaObjects.push(blob);
  }
}

function makeMagmaColumn(x, z, height = 2.7) {
  const column = addCylinder(x, -0.6 + height / 2, z, 0.18, height, materials.magma);
  const core = addCylinder(x, -0.55 + height / 2, z, 0.08, height * 1.04, materials.magmaBright);

  const glow = addCylinder(x, -0.65 + height / 2, z, 0.38, height * 0.9, materials.magmaBright);
  glow.material = materials.magmaBright.clone();
  glow.material.transparent = true;
  glow.material.opacity = 0.25;

  magmaObjects.push(column, core, glow);
  return { column, core, glow };
}

function makeVolcano(x, z, scale = 1) {
  const base = addCone(x, 1.0, z, 1.05 * scale, 1.9 * scale, materials.volcano);
  const side = addCone(x - 0.16 * scale, 1.02, z + 0.12 * scale, 0.78 * scale, 1.55 * scale, materials.continent);

  const crater = addCylinder(x, 1.95 * scale, z, 0.27 * scale, 0.08, materials.dark);
  const lava = addCone(x, 2.18 * scale, z, 0.22 * scale, 0.62 * scale, materials.magmaBright);

  const lavaFlow1 = addBox(x, 1.36, z + 0.42 * scale, 0.11, 0.08, 0.9 * scale, materials.magma);
  lavaFlow1.rotation.x = 0.58;

  const lavaFlow2 = addBox(x + 0.28 * scale, 1.24, z - 0.28 * scale, 0.1, 0.07, 0.78 * scale, materials.magma);
  lavaFlow2.rotation.x = -0.45;
  lavaFlow2.rotation.z = 0.25;

  for (let i = 0; i < 8; i++) {
    const smoke = addSphere(
      x + (Math.random() - 0.5) * 0.35,
      2.35 + i * 0.18,
      z + (Math.random() - 0.5) * 0.35,
      0.16 + i * 0.025,
      materials.smoke.clone()
    );
    smokeObjects.push({ mesh: smoke, baseY: smoke.position.y, phase: Math.random() * 10 });
  }

  magmaObjects.push(lava, lavaFlow1, lavaFlow2);
  return { base, side, crater, lava };
}

function addMountainRange(startX, endX, zBase, count) {
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const x = startX + (endX - startX) * t;
    const z = zBase + Math.sin(i * 1.7) * 0.8;
    const h = 0.7 + Math.random() * 0.7;

    const m = addCone(x, 1.0 + h / 2, z, 0.38 + Math.random() * 0.18, h, materials.mountain, 5);
    m.rotation.y = Math.random() * Math.PI;

    const snow = addCone(x, 1.0 + h, z, 0.16, h * 0.28, materials.snow, 5);
    snow.rotation.y = m.rotation.y;
  }
}

function buildDivergent() {
  clearScene();
  addOceanAndMantle();

  createConvectionCell(-3, 0, false);
  createConvectionCell(3, 0, true);

  const left = addBox(-3.65, -0.05, 0, 6.1, 0.6, 6.8, materials.oceanPlate);
  const right = addBox(3.65, -0.05, 0, 6.1, 0.6, 6.8, materials.oceanPlate);

  const leftSurface = createTerrainSurface(-3.65, 0.35, 0, 6.2, 6.8, materials.oceanDeep, 0.08, 0);
  const rightSurface = createTerrainSurface(3.65, 0.35, 0, 6.2, 6.8, materials.oceanDeep, 0.08, 0);

  plateMeshes.push(left, right, leftSurface, rightSurface);

  left.rotation.z = -0.035;
  right.rotation.z = 0.035;

  plateObjects.push({
    mesh: left,
    surface: leftSurface,
    baseX: -3.65,
    surfaceBaseX: -3.65,
    dirX: -1,
    kind: "divergent"
  });

  plateObjects.push({
    mesh: right,
    surface: rightSurface,
    baseX: 3.65,
    surfaceBaseX: 3.65,
    dirX: 1,
    kind: "divergent"
  });

  const ridge = addCone(0, 0.5, 0, 1.2, 1.5, materials.oceanPlateDark);
  ridge.rotation.z = Math.PI;
  ridge.scale.z = 3.1;

  const plume = addCone(0, -0.3, 0, 0.78, 2.8, materials.magmaBright);
  plume.rotation.z = Math.PI;
  magmaObjects.push(plume);

  const magmaColumn = makeMagmaColumn(0, 0, 2.5);

  boundaryMeshes.push(ridge, plume);
  boundaryMeshes.push(magmaColumn.column, magmaColumn.core, magmaColumn.glow);

  for (let i = 0; i < 13; i++) {
    const offset = i * 0.48;

    const leftBand = addBox(
      -0.32 - offset,
      0.39,
      0,
      0.14,
      0.07,
      6.85,
      i % 2 ? materials.oldCrust : materials.youngCrust
    );

    const rightBand = addBox(
      0.32 + offset,
      0.39,
      0,
      0.14,
      0.07,
      6.85,
      i % 2 ? materials.oldCrust : materials.youngCrust
    );

    plateMeshes.push(leftBand, rightBand);

    crustBands.push({ mesh: leftBand, side: -1, offset });
    crustBands.push({ mesh: rightBand, side: 1, offset });
  }

  const arrow1 = addArrow(
    new THREE.Vector3(-0.8, 1.45, 0),
    new THREE.Vector3(-3.8, 1.45, 0)
  );

  const arrow2 = addArrow(
    new THREE.Vector3(0.8, 1.45, 0),
    new THREE.Vector3(3.8, 1.45, 0)
  );

  boundaryMeshes.push(arrow1, arrow2);

  infoTitle.textContent = "발산형 경계";
  infoText.textContent =
    "해령에서 마그마가 상승하고 새로운 해양 지각이 생성되어 양쪽으로 이동한다.";
}

function buildConvergent() {
  clearScene();
  addOceanAndMantle();

  createConvectionCell(-3, 0, true);
  createConvectionCell(3, 0, false);

  const oceanPlate = addBox(
    -3.5, -0.04, 0,
    6.0, 0.5, 6.5,
    materials.oceanPlate
  );

  oceanPlate.rotation.z = -0.12;

  const continent = addBox(
    3.7, 0.0, 0,
    7.2, 0.85, 6.5,
    materials.continent
  );

  const continentSurface = createTerrainSurface(
    3.8, 0.55, 0,
    7.0, 6.2,
    materials.grass,
    0.24,
    0.05
  );

  plateMeshes.push(oceanPlate, continent, continentSurface);

  addMountainRange(2.4, 6.3, -1.8, 9);

  plateObjects.push({
    mesh: oceanPlate,
    baseX: -3.5,
    baseY: -0.04,
    dirX: 1,
    dirY: -0.08,
    kind: "subductingPlate"
  });

  plateObjects.push({
    mesh: continent,
    surface: continentSurface,
    baseX: 3.7,
    surfaceBaseX: 3.8,
    dirX: -0.22,
    kind: "continent"
  });

  for (let i = 0; i < 8; i++) {
    const t = i / 7;

    const x = -0.25 + t * 2.8;
    const y = -0.38 - Math.pow(t, 1.7) * 1.55;

    const part = addBox(
      x, y, 0,
      0.72, 0.34, 6.3,
      materials.oceanPlateDark
    );

    part.rotation.z = -0.22 - t * 0.65;

    boundaryMeshes.push(part);

    plateObjects.push({
      mesh: part,
      baseX: x,
      baseY: y,
      dirX: 0.55,
      dirY: -0.6,
      kind: "slab"
    });
  }

  const trench = addBox(
    0.45, 0.32, 0,
    0.3, 0.2, 6.8,
    materials.dark
  );

  trench.rotation.z = -0.08;
  boundaryMeshes.push(trench);

  const volcano1 = makeVolcano(2.8, -1.4, 1.0);
  const volcano2 = makeVolcano(3.8, -0.2, 1.15);
  const volcano3 = makeVolcano(5.0, 1.4, 0.9);

  boundaryMeshes.push(
    volcano1.base, volcano1.side, volcano1.crater, volcano1.lava,
    volcano2.base, volcano2.side, volcano2.crater, volcano2.lava,
    volcano3.base, volcano3.side, volcano3.crater, volcano3.lava
  );

  const magma1 = makeMagmaColumn(2.8, -1.4, 2.7);
  const magma2 = makeMagmaColumn(3.8, -0.2, 2.9);
  const magma3 = makeMagmaColumn(5.0, 1.4, 2.4);

  boundaryMeshes.push(
    magma1.column, magma1.core, magma1.glow,
    magma2.column, magma2.core, magma2.glow,
    magma3.column, magma3.core, magma3.glow
  );

  for (let i = 0; i < 18; i++) {
    const t = i / 17;

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 16, 16),
      materials.quake.clone()
    );

    dot.position.set(
      -0.75 + t * 3.6,
      0.12 - Math.pow(t, 1.8) * 2.2,
      -2.8 + t * 1.8
    );

    mainGroup.add(dot);
    benioffDots.push(dot);
    boundaryMeshes.push(dot);
  }

  const arrow1 = addArrow(
    new THREE.Vector3(-6.1, 1.25, 0),
    new THREE.Vector3(-3.1, 1.25, 0)
  );

  const arrow2 = addArrow(
    new THREE.Vector3(6.2, 1.25, 0),
    new THREE.Vector3(3.4, 1.25, 0)
  );

  boundaryMeshes.push(arrow1, arrow2);

  infoTitle.textContent = "수렴형 경계";
  infoText.textContent =
    "해양판이 휘어지며 대륙판 아래로 섭입하고, 섭입대를 따라 지진과 화산 활동이 나타난다.";
}

function buildTransform() {
  clearScene();
  addOceanAndMantle();

  const a = addBox(
    -2.95, -0.05, 0,
    5.5, 0.6, 6.5,
    materials.oceanPlate
  );

  const b = addBox(
    2.95, -0.05, 0,
    5.5, 0.6, 6.5,
    materials.oceanPlateDark
  );

  const surfaceA = createTerrainSurface(
    -2.95, 0.35, 0,
    5.4, 6.4,
    materials.oceanDeep,
    0.08,
    0
  );

  const surfaceB = createTerrainSurface(
    2.95, 0.35, 0,
    5.4, 6.4,
    materials.oceanDeep,
    0.08,
    0
  );

  plateMeshes.push(a, b, surfaceA, surfaceB);

  plateObjects.push({
    mesh: a,
    surface: surfaceA,
    baseZ: 0,
    dirZ: -1,
    kind: "transform"
  });

  plateObjects.push({
    mesh: b,
    surface: surfaceB,
    baseZ: 0,
    dirZ: 1,
    kind: "transform"
  });

  const fault = addBox(
    0, 0.44, 0,
    0.12, 0.12, 6.8,
    materials.dark
  );

  fault.rotation.y = 0.05;
  boundaryMeshes.push(fault);

  const arrow1 = addArrow(
    new THREE.Vector3(-3.8, 1.2, 1.4),
    new THREE.Vector3(-3.8, 1.2, -2.6)
  );

  const arrow2 = addArrow(
    new THREE.Vector3(3.8, 1.2, -1.4),
    new THREE.Vector3(3.8, 1.2, 2.6)
  );

  boundaryMeshes.push(arrow1, arrow2);

  infoTitle.textContent = "보존형 경계";
  infoText.textContent =
    "두 판이 경계와 평행한 방향으로 서로 어긋나게 이동하며, 단층을 따라 지진이 발생한다.";
}

function rebuild() {
  if (boundaryType.value === "divergent") buildDivergent();
  if (boundaryType.value === "convergent") buildConvergent();
  if (boundaryType.value === "transform") buildTransform();

  updateExamples(boundaryType.value);
}

function addQuake(x, y, z) {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    materials.quake.clone()
  );

  sphere.position.set(x, y, z);
  mainGroup.add(sphere);
  quakes.push({ mesh: sphere, life: 1 });
}

function updateExamples(type) {
  const data = {
    divergent: {
      examples: [
        { name: "대서양 중앙 해령", desc: "해양판-해양판 발산형 경계. 새로운 해양 지각이 생성된다." },
        { name: "동태평양 해령", desc: "해양판-해양판 발산형 경계. 해령과 화산 활동이 나타난다." },
        { name: "동아프리카 열곡대", desc: "대륙판-대륙판 발산형 경계. 대륙이 갈라지는 지역이다." }
      ],
      markers: [
        { x: 47, y: 48 },
        { x: 25, y: 62 },
        { x: 57, y: 58 }
      ]
    },

    convergent: {
      examples: [
        { name: "페루-칠레 해구", desc: "해양판-대륙판 수렴형 경계. 해구와 안데스 산맥이 형성된다." },
        { name: "안데스 산맥", desc: "나스카판이 남아메리카판 아래로 섭입하여 형성되었다." },
        { name: "알류산 열도", desc: "해양판-해양판 수렴형 경계. 호상 열도가 발달한다." },
        { name: "마리아나 해구", desc: "해양판-해양판 수렴형 경계. 매우 깊은 해구가 나타난다." },
        { name: "히말라야 산맥", desc: "대륙판-대륙판 충돌형 경계. 높은 습곡 산맥이 형성된다." },
        { name: "알프스 산맥", desc: "대륙판-대륙판 충돌로 형성된 대표적인 습곡 산맥이다." }
      ],
      markers: [
        { x: 29, y: 72 },
        { x: 31, y: 73 },
        { x: 75, y: 32 },
        { x: 83, y: 54 },
        { x: 66, y: 47 },
        { x: 53, y: 43 }
      ]
    },

    transform: {
      examples: [
        { name: "산안드레아스 단층", desc: "태평양판과 북아메리카판이 서로 어긋나게 이동하는 보존형 경계이다." }
      ],
      markers: [
        { x: 22, y: 43 }
      ]
    }
  };

  const selected = data[type];
  if (!selected || !exampleList || !mapMarkers) return;

  exampleList.innerHTML = selected.examples.map(e => `
    <div class="example-item">
      <div class="example-name">${e.name}</div>
      <div class="example-desc">${e.desc}</div>
    </div>
  `).join("");

  mapMarkers.innerHTML = selected.markers.map(m => `
    <div class="map-marker" style="left:${m.x}%; top:${m.y}%;"></div>
  `).join("");
}

function animate() {
  requestAnimationFrame(animate);

  const speed = Number(speedSlider.value) / 100;
  const magmaPower = Number(magmaSlider.value) / 100;

  time += 0.008 + speed * 0.025;

  const cycle = (time * 0.55) % 1;
  const smooth = cycle;

  plateObjects.forEach(p => {
    if (p.kind === "divergent") {
      const x = p.baseX + smooth * 0.8 * p.dirX;

      p.mesh.position.x = x;

      if (p.surface) {
        p.surface.position.x =
          p.surfaceBaseX + smooth * 0.8 * p.dirX;
      }
    }

    if (p.kind === "subductingPlate") {
      p.mesh.position.x =
        p.baseX + smooth * 0.95 * p.dirX;

      p.mesh.position.y =
        p.baseY + smooth * 0.16 * p.dirY;
    }

    if (p.kind === "continent") {
      const x =
        p.baseX + smooth * 0.35 * p.dirX;

      p.mesh.position.x = x;

      if (p.surface) {
        p.surface.position.x =
          p.surfaceBaseX + smooth * 0.35 * p.dirX;
      }
    }

    if (p.kind === "slab") {
      p.mesh.position.x =
        p.baseX + smooth * 0.75 * p.dirX;

      p.mesh.position.y =
        p.baseY + smooth * 0.65 * p.dirY;
    }

    if (p.kind === "transform") {
      const slide =
        ((time * 0.75) % 2) - 1;

      const z =
        p.baseZ + slide * 1.25 * p.dirZ;

      p.mesh.position.z = z;

      if (p.surface) {
        p.surface.position.z = z;
      }
    }
  });

  crustBands.forEach(b => {
    const d =
      (b.offset + smooth * 1.2) % 5.6;

    b.mesh.position.x =
      b.side * (0.25 + d);

    b.mesh.scale.x =
      1 + Math.max(0, 0.5 - d) * 1.5;
  });

  magmaObjects.forEach((m, i) => {
    m.visible = showMagma.checked;

    m.scale.y =
      1 + Math.sin(time * 4 + i) * 0.11 * magmaPower;
  });

  convectionParticles.forEach(p => {
    const dir = p.reverse ? -1 : 1;
    const a = time * 2.2 * dir + p.phase;

    p.mesh.position.x =
      p.cx + Math.cos(a) * 1.45;

    p.mesh.position.y =
      -1.05 + Math.sin(a) * 0.75;

    p.mesh.position.z = p.cz;

    const scale =
      1.8 + Math.sin(a) * 0.35;

    p.mesh.scale.setScalar(scale);
  });

  smokeObjects.forEach((s, i) => {
    s.mesh.visible = showMagma.checked;

    s.mesh.position.y =
      s.baseY + Math.sin(time * 2 + s.phase) * 0.08;

    s.mesh.scale.setScalar(
      1 + Math.sin(time * 2 + i) * 0.08
    );
  });

  waveObjects.forEach((w, i) => {
    w.position.y =
      0.62 + Math.sin(time * 2 + i) * 0.015;
  });

  benioffDots.forEach((dot, i) => {
    dot.visible = showQuakes.checked;

    const pulse =
      0.8 + Math.sin(time * 6 + i * 0.8) * 0.35;

    dot.scale.setScalar(pulse);
  });

  arrows.forEach(a => {
    a.visible = showArrows.checked;
  });

  if (
    showQuakes.checked &&
    Math.random() < Number(quakeSlider.value) / 6000
  ) {
    if (boundaryType.value === "convergent") {
      const n = Math.random();

      addQuake(
        -0.4 + n * 2.6,
        0.05 - n * 1.3,
        -2.5 + Math.random() * 5
      );
    }

    if (boundaryType.value === "transform") {
      addQuake(
        0,
        0.7,
        -2.8 + Math.random() * 5.6
      );
    }

    if (boundaryType.value === "divergent") {
      addQuake(
        (Math.random() - 0.5) * 1.2,
        0.65,
        -2.6 + Math.random() * 5.2
      );
    }
  }

  quakes.forEach(q => {
    q.life -= 0.025;

    q.mesh.scale.setScalar(
      1 + (1 - q.life) * 1.4
    );

    q.mesh.material.opacity = q.life;
  });

  quakes = quakes.filter(q => {
    if (q.life <= 0) {
      mainGroup.remove(q.mesh);
      q.mesh.geometry.dispose();
      return false;
    }

    return true;
  });

  controls.update();
    plateMeshes.forEach(m => {
    m.visible = showPlates.checked;
  });

  mantleMeshes.forEach(m => {
    m.visible = showMantle.checked;
  });
 
  boundaryMeshes.forEach(m => {
    m.visible = showBoundary.checked;
  });
  renderer.render(scene, camera);
}

boundaryType.addEventListener("change", rebuild);

document.getElementById("captureBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "판의_경계_3D_시뮬레이터.png";
  link.href = renderer.domElement.toDataURL("image/png");
  link.click();
});

rebuild();
animate();