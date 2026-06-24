console.log("직접 경로 생성 app.js 로드됨");
const SUBJECT_INFO = {
  "통합과학": { code: "T", folder: "통합과학" },
  "통과": { code: "T", folder: "통합과학" },

  "물리학Ⅰ": { code: "M", folder: "물리학" },
  "물리학1": { code: "M", folder: "물리학" },
  "물리": { code: "M", folder: "물리학" },

  "화학Ⅰ": { code: "H", folder: "화학" },
  "화학1": { code: "H", folder: "화학" },
  "화학": { code: "H", folder: "화학" },

  "생명과학Ⅰ": { code: "S", folder: "생명과학" },
  "생명과학1": { code: "S", folder: "생명과학" },
  "생명": { code: "S", folder: "생명과학" },

  "지구과학Ⅰ": { code: "G", folder: "지구과학" },
  "지구과학1": { code: "G", folder: "지구과학" },
  "지구": { code: "G", folder: "지구과학" }
};

function pad2(n){
  return String(n).padStart(2, "0");
}

function normalize(text){
  return text
    .replace(/I/g, "Ⅰ")
    .replace(/ⅰ/g, "Ⅰ")
    .replace(/\s+/g, " ")
    .trim();
}

function findSubject(q){
  for(const key in SUBJECT_INFO){
    if(q.includes(key)){
      return SUBJECT_INFO[key];
    }
  }
  throw new Error("과목을 찾지 못했습니다.");
}

function parseSearch(text){
  const q = normalize(text);

  // 통합과학 예시문항 특별 규칙
  // 예: 28 수능 통합과학 예시문항 14번 → 3T250014
  // 예: 통합과학 예시문항(안) 2번 → 3T240902
  if(q.includes("통합과학") && q.includes("예시문항")){
    const exampleNumberMatch = q.match(/(\d{1,2})\s*번/);
    if(!exampleNumberMatch) throw new Error("문항 번호를 찾지 못했습니다.");

    const exampleNumber = Number(exampleNumberMatch[1]);

    let specialPdfKey;

    if(q.includes("예시문항(안)")){
      specialPdfKey = "3T2409";
    }else{
      specialPdfKey = "3T2500";
    }

    const specialCode = specialPdfKey + pad2(exampleNumber);

    const gradeFolder = "고3 기출";
    const subjectFolder = "통합과학";

    return {
      raw: text,
      code: specialCode,
      pdfKey: specialPdfKey,
      imagePath: encodeURI(`data/${gradeFolder}/${subjectFolder}/문제 이미지 파일/${specialCode}.png`),
      problemPdfPath: encodeURI(`data/${gradeFolder}/${subjectFolder}/${specialPdfKey}.pdf`),
      solutionPdfPath: encodeURI(`data/${gradeFolder}/${subjectFolder}/${specialPdfKey} 해설.pdf`)
    };
  }

  const yearMatch = q.match(/(\d{2})/);
  if(!yearMatch) throw new Error("연도를 찾지 못했습니다.");
  const year = Number(yearMatch[1]);

  let month;
  if(q.includes("수능")){
    month = 11;
  }else{
    const ym = q.match(/(\d{2})\s+(\d{1,2})/);
    if(!ym) throw new Error("월을 찾지 못했습니다.");
    month = Number(ym[2]);
  }

  let grade;

  if(q.includes("수능")){
    grade = 3;
  }else{
    const gradeMatch = q.match(/고\s*([123])/);

    if(!gradeMatch){
      throw new Error("고1, 고2 또는 고3을 찾지 못했습니다.");
    }

    grade = Number(gradeMatch[1]);
  }

  const numMatch = q.match(/(\d{1,2})\s*번/);
  if(!numMatch) throw new Error("문항 번호를 찾지 못했습니다.");
  const number = Number(numMatch[1]);

  const subject = findSubject(q);

  let fileYear = year;

  if(grade === 3 && [3, 4, 5, 7, 10].includes(month)){
    fileYear = year + 1;
  }

  const code =
    String(grade) +
    subject.code +
    pad2(fileYear) +
    pad2(month) +
    pad2(number);

  const pdfKey = code.slice(0, 6);

  const gradeFolder = `고${grade} 기출`;
  const subjectFolder = subject.folder;

  return {
    raw: text,
    code,
    pdfKey,
    imagePath: encodeURI(`data/${gradeFolder}/${subjectFolder}/문제 이미지 파일/${code}.png`),
    problemPdfPath: encodeURI(`data/${gradeFolder}/${subjectFolder}/${pdfKey}.pdf`),
    solutionPdfPath: encodeURI(`data/${gradeFolder}/${subjectFolder}/${pdfKey} 해설.pdf`)
  };
}

function search(){
  const input = document.getElementById("searchInput").value;
  const info = document.getElementById("searchInfo");

  const resultArea = document.getElementById("resultArea");
  const resultTitle = document.getElementById("resultTitle");
  const questionImage = document.getElementById("questionImage");
  const problemPdfBtn = document.getElementById("problemPdfBtn");
  const solutionPdfBtn = document.getElementById("solutionPdfBtn");

  resultArea.classList.add("hidden");

  if(!input.trim()){
    info.innerHTML = "검색어를 입력하세요.";
    return;
  }

  try{
    const parsed = parseSearch(input);

    info.innerHTML = `
      변환 코드: <b>${parsed.code}</b><br>
      이미지 경로: <b>${decodeURI(parsed.imagePath)}</b><br>
      문제 PDF: <b>${decodeURI(parsed.problemPdfPath)}</b><br>
      해설 PDF: <b>${decodeURI(parsed.solutionPdfPath)}</b>
    `;

    resultArea.classList.remove("hidden");
    resultTitle.textContent = parsed.raw;

    questionImage.style.display = "block";
    questionImage.src = parsed.imagePath;
    questionImage.alt = parsed.code;

    questionImage.onerror = function(){
      questionImage.style.display = "none";
      info.innerHTML += `<br>❌ 이미지 못 찾음: <b>${decodeURI(parsed.imagePath)}</b>`;
    };

    problemPdfBtn.style.display = "inline-block";
    problemPdfBtn.href = parsed.problemPdfPath;
    problemPdfBtn.textContent = "문제 PDF 열기";

    solutionPdfBtn.style.display = "inline-block";
    solutionPdfBtn.href = parsed.solutionPdfPath;
    solutionPdfBtn.textContent = "해설 PDF 열기";

  }catch(err){
    info.innerHTML = `❌ ${err.message}`;
  }
}

document.getElementById("searchBtn").addEventListener("click", search);

document.getElementById("searchInput").addEventListener("keydown", function(e){
  if(e.key === "Enter") search();
});