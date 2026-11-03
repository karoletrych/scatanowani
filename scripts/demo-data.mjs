// Skrypt pomocniczy do podglądu: wypełnia bazę przykładowymi osobami.
// Użycie: node scripts/demo-data.mjs [seed|clear|reset]
// Uwaga: pisze do produkcyjnej bazy Firebase — używaj świadomie.
import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVzr0khnnvHDsEMoZb9X29r2LwxgIoUa0",
  authDomain: "scatanowani.firebaseapp.com",
  projectId: "scatanowani",
  storageBucket: "scatanowani.firebasestorage.app",
  messagingSenderId: "778237174145",
  appId: "1:778237174145:web:26af1b1162945c2f764880",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "default");

const pad = (value) => String(value).padStart(2, "0");
const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayISO = iso(new Date());
const addDays = (isoDate, days) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  return iso(new Date(y, m - 1, d + days));
};

const defaultConfig = {
  groupName: "sCATANowani",
  place: "U gospodarza",
  dayStart: "17:00",
  dayEnd: "22:00",
  slotMinutes: 30,
  horizonDays: 14,
  openWindows: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    from: "17:00",
    to: "22:00",
  })),
  dayOverrides: {},
  updatedAt: Date.now(),
};

const demoConfig = {
  ...defaultConfig,
  place: "U Karola",
  dayOverrides: {
    [addDays(todayISO, 4)]: { closed: true },
    [addDays(todayISO, 9)]: { place: "U Oli" },
  },
};

const key = (date, time) => `${date}|${time}`;
const rule = (id, weekday, from, to, verdict = "no") => ({ id, weekday, from, to, verdict });

const people = [
  {
    id: "karol",
    name: "Karol",
    rules: [rule("k-czw", 4, "17:00", "19:00"), rule("k-sr", 3, "19:20", "22:00")],
    exceptions: [],
    slots: {
      [key(addDays(todayISO, 1), "18:00")]: "yes",
      [key(addDays(todayISO, 1), "18:30")]: "yes",
      [key(addDays(todayISO, 2), "19:00")]: "yes",
      [key(addDays(todayISO, 3), "20:00")]: "no",
      [key(addDays(todayISO, 5), "18:00")]: "yes",
    },
  },
  {
    id: "ola",
    name: "Ola",
    rules: [rule("o-sob", 6, "17:00", "19:00")],
    exceptions: [
      { id: "o-wyj", date: addDays(todayISO, 3), from: "17:00", to: "22:00", verdict: "no" },
    ],
    slots: {
      [key(addDays(todayISO, 1), "18:00")]: "yes",
      [key(addDays(todayISO, 1), "19:30")]: "yes",
      [key(addDays(todayISO, 2), "18:00")]: "yes",
      [key(addDays(todayISO, 5), "17:00")]: "yes",
    },
  },
  {
    id: "michal",
    name: "Michał",
    rules: [rule("m-pt", 5, "17:00", "22:00")],
    exceptions: [],
    slots: {
      [key(addDays(todayISO, 1), "18:30")]: "yes",
      [key(addDays(todayISO, 2), "19:00")]: "yes",
      [key(addDays(todayISO, 2), "19:30")]: "yes",
      [key(addDays(todayISO, 6), "18:00")]: "yes",
    },
  },
  {
    id: "zuzia",
    name: "Zuzia",
    rules: [],
    exceptions: [{ id: "z-1", date: addDays(todayISO, 2), from: "17:00", to: "20:00", verdict: "no" }],
    slots: {
      [key(addDays(todayISO, 1), "18:00")]: "yes",
      [key(addDays(todayISO, 2), "20:00")]: "yes",
      [key(addDays(todayISO, 5), "18:00")]: "yes",
      [key(addDays(todayISO, 6), "19:00")]: "yes",
    },
  },
  {
    id: "bartek",
    name: "Bartek",
    rules: [rule("b-pon", 1, "17:00", "22:00")],
    exceptions: [],
    slots: {
      [key(addDays(todayISO, 1), "18:00")]: "yes",
      [key(addDays(todayISO, 1), "19:00")]: "yes",
      [key(addDays(todayISO, 2), "19:30")]: "yes",
      [key(addDays(todayISO, 3), "18:00")]: "no",
      [key(addDays(todayISO, 7), "18:00")]: "yes",
    },
  },
  {
    id: "ania",
    name: "Ania",
    rules: [rule("a-nd", 0, "17:00", "22:00")],
    exceptions: [],
    slots: {
      [key(addDays(todayISO, 2), "18:00")]: "yes",
      [key(addDays(todayISO, 2), "18:30")]: "yes",
      [key(addDays(todayISO, 5), "19:00")]: "yes",
      [key(addDays(todayISO, 6), "17:30")]: "yes",
    },
  },
];

async function clearCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  await Promise.all(snapshot.docs.map((entry) => deleteDoc(entry.ref)));
}

async function main() {
  const mode = process.argv[2] ?? "seed";

  if (mode === "clear") {
    await clearCollection("answers");
    await clearCollection("participants");
    console.log("Wyczyszczono odpowiedzi i uczestników.");
    return;
  }

  if (mode === "reset") {
    await clearCollection("answers");
    await clearCollection("participants");
    await clearCollection("config");
    await setDoc(doc(db, "config", "main"), defaultConfig);
    console.log("Baza wyczyszczona, przywrócono domyślną konfigurację.");
    return;
  }

  await setDoc(doc(db, "config", "main"), demoConfig);
  for (const person of people) {
    await setDoc(doc(db, "participants", person.id), {
      name: person.name,
      joinedAt: Date.now(),
    });
    await setDoc(doc(db, "answers", person.id), {
      slots: person.slots,
      rules: person.rules,
      exceptions: person.exceptions,
      updatedAt: Date.now(),
    });
  }
  console.log(`Zasiano ${people.length} osób. Start: ${todayISO}`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
