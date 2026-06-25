import {
  db,
  doc,
  getDoc,
  updateDoc
} from "./firebase.js";

export async function setPremium(uid, value){

    const ref = doc(db,"users",uid);

    await updateDoc(ref,{
        premium:value
    });

    alert("변경 완료");

}

export async function resetCount(uid){

    const ref = doc(db,"users",uid);

    await updateDoc(ref,{
        graphCount:0,
        chemistryCount:0,
        biologyCount:0,
        earthCount:0
    });

    alert("초기화 완료");

}