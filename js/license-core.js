import {
  auth,
  db,
  doc,
  getDoc,
  updateDoc,
  increment
} from "./firebase.js";

const LIMIT = {
  physics: 5,
  chemistry: 5,
  biology: 5,
  earth: 5,
  programs: 5
};

export async function checkFolderLicense(folderName) {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        alert("로그인이 필요합니다.");
        location.href = "../../index.html";
        resolve(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        alert("회원 정보를 찾을 수 없습니다.");
        location.href = "../../index.html";
        resolve(false);
        return;
      }

      const data = snap.data();

      if (data.admin === true || data.premium === true) {
        resolve(true);
        return;
      }

      const field = folderName + "Count";
      const current = data[field] || 0;
      const limit = LIMIT[folderName] || 5;

      if (current >= limit) {
        alert(
          "무료 사용 횟수를 모두 사용했습니다.\n\nJ&B LAB PRO를 이용해 주세요."
        );
        location.href = "../../premium/index.html";
        resolve(false);
        return;
      }

      await updateDoc(userRef, {
        [field]: increment(1)
      });

      resolve(true);
    });
  });
}