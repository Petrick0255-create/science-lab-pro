import {
  auth,
  db,
  doc,
  getDoc,
  updateDoc,
  increment
} from "./firebase.js";

const LIMIT = {
  graph:20,
  chemistry:20,
  biology:20,
  earth:10
};

async function getUserDoc(){

    const user=auth.currentUser;

    if(!user){

        alert("로그인이 필요합니다.");

        return null;

    }

    const ref=doc(db,"users",user.uid);

    const snap=await getDoc(ref);

    if(!snap.exists()){

        alert("사용자 정보를 찾을 수 없습니다.");

        return null;

    }

    return {
        ref,
        data:snap.data()
    };

}

export async function useFeature(feature){

    const user=await getUserDoc();

    if(!user) return false;

    const data=user.data;

    if(data.premium===true){

        return true;

    }

    const limit=LIMIT[feature];

    const field=feature+"Count";

    const count=data[field]||0;

    if(count>=limit){

        alert(
`무료 사용 횟수를 모두 사용했습니다.

J&B LAB PRO를 이용해 주세요.`
);

        return false;

    }

    await updateDoc(user.ref,{
        [field]:increment(1)
    });

    return true;

}

export async function getRemain(feature){

    const user=await getUserDoc();

    if(!user) return 0;

    if(user.data.premium){

        return Infinity;

    }

    return LIMIT[feature]-(user.data[feature+"Count"]||0);

}