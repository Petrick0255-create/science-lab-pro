import {
  auth,
  db,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

const provider = new GoogleAuthProvider();

export let currentUser = null;

// 로그인
export async function login() {
  try {
    const result = await signInWithPopup(auth, provider);

    const user = result.user;

    const userRef = doc(db, "users", user.uid);

    const snap = await getDoc(userRef);

    if (!snap.exists()) {

      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        premium: false,
        admin:false,

        graphCount: 0,
        chemistryCount: 0,
        biologyCount: 0,
        earthCount: 0,

        createdAt: Date.now()
      });

    }

  } catch (e) {

    console.error(e);

    alert("로그인 실패");

  }
}

// 로그아웃
export async function logout() {

  await signOut(auth);

}

// 로그인 상태 감지
export function observeLogin(callback) {

  onAuthStateChanged(auth, (user)=>{

    currentUser = user;

    callback(user);

  });

}

const loginBtn=document.getElementById("loginBtn");

const userMenu=document.getElementById("userMenu");

loginBtn.onclick=()=>{

if(currentUser){

userMenu.classList.toggle("show");

}else{

login();

}

};

document.getElementById("logoutBtn").onclick=logout;