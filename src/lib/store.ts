import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Participant, ParticipantAnswers, RoomConfig, RoomData } from "../types";
import { firebaseConfig, firestoreDatabaseId, hasFirebaseConfig } from "./firebaseConfig";
import {
  DEFAULT_CONFIG,
  normalizeAnswers,
  normalizeConfig,
  normalizeRoom,
} from "./model";

export type StoreStatus = "connecting" | "live" | "error" | "local";

export interface RoomStore {
  mode: "cloud" | "local";
  subscribe(
    onRoom: (room: RoomData) => void,
    onStatus: (status: StoreStatus) => void,
  ): () => void;
  saveParticipant(id: string, participant: Participant): Promise<void>;
  saveAnswers(id: string, answers: ParticipantAnswers): Promise<void>;
  saveConfig(config: RoomConfig): Promise<void>;
  clearAnswers(): Promise<void>;
  removeParticipant(id: string): Promise<void>;
}

function emptyRoom(): RoomData {
  return { config: { ...DEFAULT_CONFIG, dayOverrides: {} }, participants: {}, answers: {} };
}

function createCloudStore(): RoomStore {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firestoreDatabaseId);
  const configRef = doc(db, "config", "main");
  const participantsRef = collection(db, "participants");
  const answersRef = collection(db, "answers");

  return {
    mode: "cloud",

    subscribe(onRoom, onStatus) {
      const room: RoomData = emptyRoom();
      let configReady = false;
      let participantsReady = false;
      let answersReady = false;
      let seeded = false;

      const emit = () => onRoom({
        config: room.config,
        participants: room.participants,
        answers: room.answers,
      });
      const ready = () => {
        if (configReady && participantsReady && answersReady) onStatus("live");
      };
      const fail = (error: unknown) => {
        console.error("Firestore:", error);
        onStatus("error");
      };

      const unsubConfig = onSnapshot(
        configRef,
        (snapshot) => {
          if (snapshot.exists()) {
            room.config = normalizeConfig(snapshot.data());
          } else {
            room.config = normalizeConfig(null);
            if (!seeded) {
              seeded = true;
              void setDoc(configRef, { ...DEFAULT_CONFIG, updatedAt: Date.now() }).catch(fail);
            }
          }
          configReady = true;
          emit();
          ready();
        },
        fail,
      );

      const unsubParticipants = onSnapshot(
        participantsRef,
        (snapshot) => {
          const participants: RoomData["participants"] = {};
          snapshot.forEach((entry) => {
            const data = entry.data();
            if (typeof data.name !== "string") return;
            participants[entry.id] = {
              name: data.name,
              joinedAt: typeof data.joinedAt === "number" ? data.joinedAt : Date.now(),
            };
          });
          room.participants = participants;
          participantsReady = true;
          emit();
          ready();
        },
        fail,
      );

      const unsubAnswers = onSnapshot(
        answersRef,
        (snapshot) => {
          const answers: RoomData["answers"] = {};
          snapshot.forEach((entry) => {
            answers[entry.id] = normalizeAnswers(entry.data());
          });
          room.answers = answers;
          answersReady = true;
          emit();
          ready();
        },
        fail,
      );

      return () => {
        unsubConfig();
        unsubParticipants();
        unsubAnswers();
      };
    },

    async saveParticipant(id, participant) {
      await setDoc(
        doc(participantsRef, id),
        { name: participant.name, joinedAt: participant.joinedAt },
        { merge: true },
      );
    },

    async saveAnswers(id, answers) {
      await setDoc(doc(answersRef, id), {
        slots: answers.slots,
        rules: answers.rules,
        exceptions: answers.exceptions,
        updatedAt: Date.now(),
      });
    },

    async saveConfig(config) {
      await setDoc(configRef, { ...config, updatedAt: Date.now() });
    },

    async clearAnswers() {
      const snapshot = await getDocs(answersRef);
      const batch = writeBatch(db);
      snapshot.forEach((entry) => batch.delete(entry.ref));
      await batch.commit();
    },

    async removeParticipant(id) {
      await Promise.all([
        deleteDoc(doc(answersRef, id)),
        deleteDoc(doc(participantsRef, id)),
      ]);
    },
  };
}

const LOCAL_KEY = "scatanowani:room:v1";
const CHANNEL = "scatanowani:room";

function readLocalRoom(): RoomData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return normalizeRoom(JSON.parse(raw));
  } catch (error) {
    console.warn("Nie udało się odczytać danych lokalnych", error);
  }
  return emptyRoom();
}

function createLocalStore(): RoomStore {
  let room = readLocalRoom();
  const listeners = new Set<(room: RoomData) => void>();
  let statusListener: ((status: StoreStatus) => void) | null = null;
  const channel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;

  const emit = () => {
    const snapshot = { ...room };
    listeners.forEach((listener) => listener(snapshot));
  };

  const persist = () => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(room));
    } catch (error) {
      console.warn("Nie udało się zapisać danych lokalnych", error);
    }
  };

  const commit = () => {
    persist();
    emit();
    channel?.postMessage("update");
  };

  const reloadFromStorage = () => {
    room = readLocalRoom();
    emit();
    statusListener?.("local");
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key === LOCAL_KEY) reloadFromStorage();
    });
    channel?.addEventListener("message", reloadFromStorage);
  }

  return {
    mode: "local",
    subscribe(onRoom, onStatus) {
      listeners.add(onRoom);
      statusListener = onStatus;
      onRoom({ ...room });
      onStatus("local");
      return () => {
        listeners.delete(onRoom);
        statusListener = null;
      };
    },
    async saveParticipant(id, participant) {
      room.participants[id] = participant;
      commit();
    },
    async saveAnswers(id, answers) {
      room.answers[id] = { ...answers, updatedAt: Date.now() };
      commit();
    },
    async saveConfig(config) {
      room.config = { ...config, updatedAt: Date.now() };
      commit();
    },
    async clearAnswers() {
      room.answers = {};
      commit();
    },
    async removeParticipant(id) {
      delete room.answers[id];
      delete room.participants[id];
      commit();
    },
  };
}

function createStore(): RoomStore {
  const forcedLocal =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("local");
  if (forcedLocal || !hasFirebaseConfig) return createLocalStore();
  return createCloudStore();
}

export const store = createStore();

export function useRoom() {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [status, setStatus] = useState<StoreStatus>(
    store.mode === "local" ? "local" : "connecting",
  );

  useEffect(() => {
    return store.subscribe(setRoom, setStatus);
  }, []);

  return { room, status, mode: store.mode };
}
