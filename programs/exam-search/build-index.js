const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "data");
const OUT_FILE = path.join(ROOT_DIR, "index.json");

function walk(dir) {
  let results = [];

  if (!fs.existsSync(dir)) return results;

  for (const item of fs.readdirSync(dir)) {
    if (item.startsWith(".")) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }

  return results;
}

function toWebPath(fullPath) {
  return path
    .relative(__dirname, fullPath)
    .replace(/\\/g, "/")
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
}

const files = walk(ROOT_DIR).filter(file => !file.endsWith("index.json"));

const images = files
  .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
  .map(file => {
    const name = path.basename(file);
    const code = path.parse(name).name.toUpperCase();

    return {
      code,
      pdfKey: code.slice(0, 6),
      imageName: name,
      image: toWebPath(file)
    };
  });

const pdfs = files
  .filter(file => /\.pdf$/i.test(file))
  .map(file => {
    const name = path.basename(file);
    const upper = name.toUpperCase();
    const keyMatch = upper.match(/[23][MCBG]\d{4}/);

    return {
      name,
      key: keyMatch ? keyMatch[0] : "",
      type: name.includes("해설") ? "solution" : "problem",
      url: toWebPath(file)
    };
  });

const index = images.map(img => {
  const problemPdf = pdfs.find(pdf => pdf.key === img.pdfKey && pdf.type === "problem");
  const solutionPdf = pdfs.find(pdf => pdf.key === img.pdfKey && pdf.type === "solution");

  return {
    code: img.code,
    pdfKey: img.pdfKey,
    imageName: img.imageName,
    image: img.image,
    problemPdf: problemPdf ? problemPdf.url : "",
    problemPdfName: problemPdf ? problemPdf.name : "",
    solutionPdf: solutionPdf ? solutionPdf.url : "",
    solutionPdfName: solutionPdf ? solutionPdf.name : ""
  };
});

fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2), "utf-8");

console.log("색인 생성 완료");
console.log(`이미지: ${images.length}개`);
console.log(`PDF: ${pdfs.length}개`);
console.log(`색인: ${index.length}개`);