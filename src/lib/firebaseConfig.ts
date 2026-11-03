// Konfiguracja publiczna aplikacji webowej Firebase (nie jest sekretem).
export const firebaseConfig = {
  apiKey: "AIzaSyCVzr0khnnvHDsEMoZb9X29r2LwxgIoUa0",
  authDomain: "scatanowani.firebaseapp.com",
  projectId: "scatanowani",
  storageBucket: "scatanowani.firebasestorage.app",
  messagingSenderId: "778237174145",
  appId: "1:778237174145:web:26af1b1162945c2f764880",
};

// Projekt nie ma włączonego billingu, więc korzystamy z nazwanej bazy „default”
// zamiast bazy domyślnej „(default)”.
export const firestoreDatabaseId = "default";

export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
