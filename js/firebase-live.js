import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    onValue,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBSctt_aV3EGIgVlnz2WziggDoQF6K50xU",
    authDomain: "everboten.firebaseapp.com",
    databaseURL: "https://everboten.firebaseio.com",
    projectId: "everboten",
    storageBucket: "everboten.firebasestorage.app",
    messagingSenderId: "936485444223",
    appId: "1:936485444223:web:c2c56885032de304223d4a"
};

export const ADMIN_UID = "86FXXYrmiZbkqNPV29kkrqrLsVC3";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export function watchAdmin(callback) {
    return onAuthStateChanged(auth, user => {
        callback(Boolean(user && user.uid === ADMIN_UID), user || null);
    });
}

export async function adminLogin(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth);
        throw new Error("not-admin");
    }
    return credential.user;
}

export function adminLogout() {
    return signOut(auth);
}

export function watchBacaroLive(callback) {
    return onValue(ref(db, "bacaroTour"), snapshot => {
        callback(snapshot.val());
    });
}

export function publishBacaroStop(stop) {
    if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
        throw new Error("not-admin");
    }

    return set(ref(db, "bacaroTour"), {
        currentStop: stop.id,
        name: stop.name,
        mapsQuery: stop.mapsQuery,
        updatedAt: serverTimestamp()
    });
}

export function googleMapsSearch(query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatLiveTime(timestamp, lang = "it") {
    if (!timestamp) return "";
    return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "it-IT", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(timestamp));
}
