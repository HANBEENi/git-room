import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirestoreDb } from "@/lib/firebase-admin";

// 방 업그레이드 등급/방치 단계는 GitHub 잔디 데이터로 매번 계산하므로 저장하지 않는다.
// 여기서는 "사용자가 직접 고른 값"(선택한 스킨, 잠금해제한 스킨 목록)만 저장한다.

export const DEFAULT_SKIN = "pixel-basic";

export interface RoomState {
  selectedSkin: string;
  unlockedSkins: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function userDoc(login: string) {
  return getFirestoreDb().collection("users").doc(login);
}

/** 방 상태를 조회. 최초 접속이면 기본값으로 문서를 생성한다. */
export async function getRoomState(login: string): Promise<RoomState> {
  const ref = userDoc(login);
  const snap = await ref.get();

  if (snap.exists) {
    return snap.data() as RoomState;
  }

  const now = Timestamp.now();
  const initial: RoomState = {
    selectedSkin: DEFAULT_SKIN,
    unlockedSkins: [DEFAULT_SKIN],
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(initial);
  return initial;
}

/** 잠금해제된 스킨 중 하나를 선택 스킨으로 지정. */
export async function setSelectedSkin(login: string, skinId: string): Promise<RoomState> {
  const state = await getRoomState(login);

  if (!state.unlockedSkins.includes(skinId)) {
    throw new Error(`아직 잠금해제되지 않은 스킨입니다: ${skinId}`);
  }

  await userDoc(login).update({
    selectedSkin: skinId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { ...state, selectedSkin: skinId };
}

/** 달성 조건을 만족했을 때 스킨을 잠금해제 목록에 추가 (이미 있으면 아무 동작 안 함). */
export async function unlockSkin(login: string, skinId: string): Promise<void> {
  await getRoomState(login); // 문서 없으면 먼저 생성
  await userDoc(login).update({
    unlockedSkins: FieldValue.arrayUnion(skinId),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
