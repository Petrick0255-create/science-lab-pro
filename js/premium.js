const labels = ["가", "나", "다"];
const keys = ["ga", "na", "da"];

const COLORS = {
  H: "#ef4444",
  Na: "#3b82f6",
  K: "#22c55e",
  Cl: "#64748b",
  OH: "#8b5cf6",
  H2O: "#06b6d4"
};

let currentResults = [];

function $(id) {
  return document.getElementById(id);
}

function fmt(x) {
  if (Math.abs(x) < 1e-10) return "0";
  return Number(x).toFixed(2).replace(/\.?0+$/, "");
}

function gcd2(a, b) {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function gcdArray(arr) {
  return arr.reduce((a, b) => gcd2(a, b), 0) || 1;
}

function simplifyRatio(values) {
  const scale = 100;
  const ints = values.map(v => Math.round(v * scale));
  const g = gcdArray(ints);
  return ints.map(v => v / g);
}

function getSettings() {
  return {
    aN: Number($("aN").value),
    bN: Number($("bN").value),
    cN: Number($("cN").value),
    unitV: Number($("unitV").value)
  };
}

function getMix(key) {
  return {
    A: Number($(key + "A").value),
    B: Number($(key + "B").value),
    C: Number($(key + "C").value)
  };
}

function unitAmount(volume, n, unitV) {
  return volume / unitV * n;
}

function calcMix(key, label) {
  const s = getSettings();
  const v = getMix(key);

  const hInput = unitAmount(v.A, s.aN, s.unitV);
  const ohFromB = unitAmount(v.B, s.bN, s.unitV);
  const ohFromC = unitAmount(v.C, s.cN, s.unitV);
  const ohInput = ohFromB + ohFromC;

  const reacted = Math.min(hInput, ohInput);

  const H = Math.max(0, hInput - ohInput);
  const OH = Math.max(0, ohInput - hInput);

  const Na = ohFromB;
  const K = ohFromC;
  const Cl = hInput;
  const H2O = reacted;

  const totalIon = H + Na + K + Cl + OH;

  let state = "중성";
  if (H > 0) state = "산성";
  if (OH > 0) state = "염기성";

  return {
    label,
    key,
    volume: v,
    H,
    Na,
    K,
    Cl,
    OH,
    H2O,
    totalIon,
    state,
    hInput,
    ohInput
  };
}

function calculateAll() {
  currentResults = keys.map((key, i) => calcMix(key, labels[i]));
  return currentResults;
}

function runAll() {
  const s = getSettings();

  if (s.aN <= 0 || s.bN <= 0 || s.cN <= 0 || s.unitV <= 0) {
    alert("단위량과 기준 부피는 0보다 커야 합니다.");
    return;
  }

  for (const key of keys) {
    const m = getMix(key);
    if (m.A < 0 || m.B < 0 || m.C < 0) {
      alert("부피는 음수가 될 수 없습니다.");
      return;
    }
  }

  calculateAll();
  renderExamTable();
  renderIonRatios();
  renderPieCharts();
  renderChoices();
  renderKillerPoints();
}

function stateHTML(state) {
  if (state === "산성") return `<span class="tag-acid">산성</span>`;
  if (state === "염기성") return `<span class="tag-base">염기성</span>`;
  return `<span class="tag-neutral">중성</span>`;
}

function renderExamTable() {
  const r = currentResults;

  const rows = [
    ["A 용액(mL)", ...r.map(x => fmt(x.volume.A))],
    ["B 용액(mL)", ...r.map(x => fmt(x.volume.B))],
    ["C 용액(mL)", ...r.map(x => fmt(x.volume.C))],
    ["A가 내놓는 H⁺", ...r.map(x => fmt(x.hInput))],
    ["B+C가 내놓는 OH⁻", ...r.map(x => fmt(x.ohInput))],
    ["생성된 물", ...r.map(x => fmt(x.H2O))],
    ["총 이온수", ...r.map(x => fmt(x.totalIon))],
    ["액성", ...r.map(x => stateHTML(x.state))],
    ["온도 기호", "t₁", "t₂", "t₃"]
  ];

  $("examTable").innerHTML = rows.map(row => `
    <tr>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
    </tr>
  `).join("");

  $("examTableText").textContent =
`[평가원 표]

항목\t(가)\t(나)\t(다)
A(mL)\t${fmt(r[0].volume.A)}\t${fmt(r[1].volume.A)}\t${fmt(r[2].volume.A)}
B(mL)\t${fmt(r[0].volume.B)}\t${fmt(r[1].volume.B)}\t${fmt(r[2].volume.B)}
C(mL)\t${fmt(r[0].volume.C)}\t${fmt(r[1].volume.C)}\t${fmt(r[2].volume.C)}
생성된 물\t${fmt(r[0].H2O)}\t${fmt(r[1].H2O)}\t${fmt(r[2].H2O)}
총 이온수\t${fmt(r[0].totalIon)}\t${fmt(r[1].totalIon)}\t${fmt(r[2].totalIon)}
액성\t${r[0].state}\t${r[1].state}\t${r[2].state}
온도\tt₁\tt₂\tt₃`;
}

function getPresentIons(x) {
  const ions = [
    ["H⁺", x.H, "H"],
    ["Na⁺", x.Na, "Na"],
    ["K⁺", x.K, "K"],
    ["Cl⁻", x.Cl, "Cl"],
    ["OH⁻", x.OH, "OH"]
  ];

  return ions.filter(i => i[1] > 1e-10);
}

function renderIonRatios() {
  const cards = [];
  const text = [];

  currentResults.forEach(x => {
    const ions = getPresentIons(x);
    const values = ions.map(i => i[1]);
    const ratio = simplifyRatio(values);

    const names = ions.map(i => i[0]).join(" : ");
    const ratioText = ratio.join(" : ");

    cards.push(`
      <div class="ratio-card">
        <div class="ratio-title">(${x.label})</div>
        <div class="ratio-line">
${names}

= ${ratioText}

액성: ${x.state}
총 이온수: ${fmt(x.totalIon)}
        </div>
      </div>
    `);

    text.push(`(${x.label})\n${names}\n= ${ratioText}\n액성: ${x.state}\n총 이온수: ${fmt(x.totalIon)}`);
  });

  $("ionRatioCards").innerHTML = cards.join("");
  $("ionRatioText").textContent = text.join("\n\n");
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

function makePieSVG(x) {
  const ions = getPresentIons(x);
  const total = ions.reduce((sum, i) => sum + i[1], 0);

  let angle = 0;
  let paths = "";

  ions.forEach(([name, value, colorKey]) => {
    const sliceAngle = total === 0 ? 0 : value / total * 360;
    const path = describeArc(100, 100, 80, angle, angle + sliceAngle);
    paths += `<path d="${path}" fill="${COLORS[colorKey]}" stroke="white" stroke-width="2"></path>`;
    angle += sliceAngle;
  });

  const legend = ions.map(([name, value, colorKey]) => `
    <div class="legend-row">
      <span class="legend-color" style="background:${COLORS[colorKey]}"></span>
      <span>${name} ${fmt(value)}</span>
    </div>
  `).join("");

  return `
    <div class="pie-card">
      <div class="pie-title">(${x.label})</div>
      <svg id="pie-${x.key}" width="220" height="220" viewBox="0 0 200 200">
        ${paths}
      </svg>
      <div class="legend">${legend}</div>
    </div>
  `;
}

function renderPieCharts() {
  $("pieCharts").innerHTML = currentResults.map(makePieSVG).join("");
}

function renderChoices() {
  const r = currentResults;

  const statements = [];

  statements.push({
    text: `ㄱ. (${r[0].label})의 액성은 ${r[0].state}이다.`,
    correct: true
  });

  statements.push({
    text: `ㄴ. 생성된 물의 양은 (${r[1].label})가 (${r[2].label})보다 크다.`,
    correct: r[1].H2O > r[2].H2O
  });

  statements.push({
    text: `ㄷ. (${r[0].label})와 (${r[2].label})의 총 이온수는 같다.`,
    correct: Math.abs(r[0].totalIon - r[2].totalIon) < 1e-10
  });

  statements.push({
    text: `ㄹ. (${r[1].label})에는 H⁺와 OH⁻가 모두 존재하지 않는다.`,
    correct: r[1].H === 0 && r[1].OH === 0
  });

  const answer = statements
    .filter(s => s.correct)
    .map(s => s.text[0])
    .join(", ");

  $("choiceBox").textContent =
`[자동 선지]

${statements.map(s => s.text).join("\n")}

정답: ${answer || "없음"}

해설 요약:
H⁺와 OH⁻는 1:1로 반응한다.
A 용액이 내놓은 H⁺ 수와 B, C 용액이 내놓은 OH⁻ 수를 비교하면 액성과 생성된 물의 양을 판단할 수 있다.
총 이온수는 남은 H⁺ 또는 OH⁻와 Na⁺, K⁺, Cl⁻의 합으로 판단한다.`;
}

function renderKillerPoints() {
  const r = currentResults;
  const points = [];

  const neutral = r.filter(x => x.state === "중성");
  if (neutral.length === 1) {
    points.push(`★ (${neutral[0].label})만 중성입니다. 중화점 추론 선지로 좋습니다.`);
  }

  for (let i = 0; i < r.length; i++) {
    for (let j = i + 1; j < r.length; j++) {
      if (Math.abs(r[i].totalIon - r[j].totalIon) < 1e-10) {
        points.push(`★ (${r[i].label})와 (${r[j].label})의 총 이온수가 같습니다.`);
      }

      if (Math.abs(r[i].H2O - r[j].H2O) < 1e-10) {
        points.push(`★ (${r[i].label})와 (${r[j].label})의 생성된 물의 양이 같습니다.`);
      }

      if (r[i].state !== r[j].state) {
        points.push(`★ (${r[i].label})와 (${r[j].label})의 액성이 다릅니다.`);
      }
    }
  }

  const maxWater = [...r].sort((a, b) => b.H2O - a.H2O)[0];
  points.push(`★ 온도 비교는 생성된 물이 가장 많은 (${maxWater.label})를 최고 온도로 잡으면 됩니다.`);

  points.push("★ 이온비 원그래프를 제시하고 액성 또는 총 이온수를 묻는 문항으로 변형하기 좋습니다.");

  $("killerBox").textContent =
`[추천 출제 포인트]

${points.join("\n")}`;
}

function copyText(id) {
  const text = $(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert("복사했습니다.");
  });
}

function downloadAllSVG() {
  currentResults.forEach(x => {
    const svg = document.getElementById(`pie-${x.key}`);
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `neutralization_${x.label}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  });
}

function makeRandomSet() {
  $("aN").value = randomPick([2, 3, 4, 5]);
  $("bN").value = randomPick([1, 2, 3]);
  $("cN").value = randomPick([1, 2, 3]);
  $("unitV").value = 10;

  keys.forEach(key => {
    $(key + "A").value = randomPick([10, 15, 20, 25, 30]);
    $(key + "B").value = randomPick([5, 10, 15, 20, 25, 30]);
    $(key + "C").value = randomPick([5, 10, 15, 20, 25, 30]);
  });

  runAll();
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resetDefault() {
  $("aN").value = 3;
  $("bN").value = 2;
  $("cN").value = 1;
  $("unitV").value = 10;

  $("gaA").value = 10;
  $("gaB").value = 15;
  $("gaC").value = 30;

  $("naA").value = 20;
  $("naB").value = 20;
  $("naC").value = 15;

  $("daA").value = 25;
  $("daB").value = 15;
  $("daC").value = 15;

  runAll();
}

runAll();