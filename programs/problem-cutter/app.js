pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const pdfInput = document.getElementById("pdfInput");
const runBtn = document.getElementById("runBtn");
const statusBox = document.getElementById("status");

const startNumInput = document.getElementById("startNum");
const endNumInput = document.getElementById("endNum");
const scaleInput = document.getElementById("scaleInput");

const TOP_MARGIN = 50;
const BOTTOM_MARGIN = 20;
const LEFT_MARGIN = 25;
const CENTER_X_LIMIT = 250;

runBtn.addEventListener("click", async () => {
  const files = [...pdfInput.files];

  if (files.length === 0) {
    setStatus("PDF를 먼저 선택하세요.");
    return;
  }

  runBtn.disabled = true;

  try {
    const finalZip = new JSZip();

    for (const file of files) {
      await processPdf(file, finalZip);
    }

    setStatus("ZIP 생성 중...");

    const blob = await finalZip.generateAsync({ type: "blob" });
    downloadBlob(blob, "문항추출결과.zip");

    setStatus("완료");
  } catch (err) {
    console.error(err);
    setStatus("오류: " + err.message);
  } finally {
    runBtn.disabled = false;
  }
});

async function processPdf(file, finalZip) {
  const startNum = Number(startNumInput.value);
  const endNum = Number(endNumInput.value);
  const scale = Number(scaleInput.value);

  const pdfName = cleanName(file.name.replace(/\.pdf$/i, ""));
  const folder = finalZip.folder(pdfName);

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const questions = [];

  setStatus(`${file.name} 문항 번호 좌표 분석 중...`);

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      const text = item.str.trim();

      if (!/^([1-9]|1[0-9]|2[0-5])\.$/.test(text)) continue;

      const number = Number(text.replace(".", ""));

      if (number < startNum || number > endNum) continue;

      const tx = pdfjsLib.Util.transform(
        viewport.transform,
        item.transform
      );

      const x = tx[4];
      const y = viewport.height - tx[5];

      const fontSize = Math.abs(item.transform[0]);

      if (x < 500 && fontSize >= 9) {
        questions.push({
          number,
          page: pageNum,
          x,
          y
        });
      }
    }
  }

  questions.sort((a, b) => a.number - b.number);

  if (questions.length === 0) {
    throw new Error(`${file.name}: 문항 번호를 찾을 수 없습니다.`);
  }

  const leftXs = questions
    .filter(q => q.x < CENTER_X_LIMIT)
    .map(q => q.x);

  const rightXs = questions
    .filter(q => q.x > CENTER_X_LIMIT)
    .map(q => q.x);

  if (leftXs.length === 0 || rightXs.length === 0) {
    throw new Error(`${file.name}: 좌우 2단 문항 번호를 모두 찾지 못했습니다.`);
  }

  const leftXpdf = Math.min(...leftXs);
  const rightXpdf = Math.min(...rightXs);

  const leftX = Math.floor(leftXpdf * scale) - LEFT_MARGIN;
  const rightX = Math.floor(rightXpdf * scale) - LEFT_MARGIN;
  const columnWidth = rightX - leftX;

  setStatus(`${file.name} 문항 이미지 추출 중...`);

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise;

    const pageQuestions = questions.filter(q => q.page === pageNum);

    const leftQuestions = pageQuestions
      .filter(q => q.x < CENTER_X_LIMIT)
      .sort((a, b) => a.y - b.y);

    const rightQuestions = pageQuestions
      .filter(q => q.x > CENTER_X_LIMIT)
      .sort((a, b) => a.y - b.y);

    await cropColumn({
      canvas,
      questions: leftQuestions,
      cropX1: leftX,
      columnWidth,
      scale,
      folder,
      pdfName
    });

    await cropColumn({
      canvas,
      questions: rightQuestions,
      cropX1: rightX,
      columnWidth,
      scale,
      folder,
      pdfName
    });
  }
}

async function cropColumn({
  canvas,
  questions,
  cropX1,
  columnWidth,
  scale,
  folder,
  pdfName
}) {
  if (questions.length === 0) return;

  const cropX2 = Math.min(canvas.width, cropX1 + columnWidth);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const startY = Math.max(
      0,
      Math.floor(q.y * scale) - TOP_MARGIN
    );

    let endY;

    if (i < questions.length - 1) {
      endY =
        Math.floor(questions[i + 1].y * scale) - BOTTOM_MARGIN;
    } else {
      endY = canvas.height;
    }

    endY = Math.min(canvas.height, endY);

    const width = cropX2 - cropX1;
    const height = endY - startY;

    if (width <= 0 || height <= 0) continue;

    const outCanvas = document.createElement("canvas");
    const outCtx = outCanvas.getContext("2d");

    outCanvas.width = width;
    outCanvas.height = height;

    outCtx.drawImage(
      canvas,
      cropX1,
      startY,
      width,
      height,
      0,
      0,
      width,
      height
    );

    const blob = await canvasToBlob(outCanvas);

    folder.file(
      `${pdfName}${String(q.number).padStart(2, "0")}.png`,
      blob
    );
  }
}

function canvasToBlob(canvas) {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), "image/png");
  });
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function cleanName(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_");
}

function setStatus(text) {
  statusBox.textContent = text;
}