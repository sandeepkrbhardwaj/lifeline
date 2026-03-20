import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyA2FIugwti0ri5lA-XRoBuFMkDhq9LQYvE",
    authDomain: "hospital-a9b43.firebaseapp.com",
    projectId: "hospital-a9b43",
    storageBucket: "hospital-a9b43.firebasestorage.app",
    messagingSenderId: "124364489495",
    appId: "1:124364489495:web:59b44243d005c556da2d52",
    measurementId: "G-2BJG78RGFV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'lifeline-app';

// User provided API Key for Gemini Integration
const apiKey = "8612405284:AAGWNk4H6SD0d0aVmYTpw33dm_YVYtqgaZg"; 

// --- STATE & DATA MAPS ---
let state = {
    loading: true, 
    view: 'user', 
    activeTab: 'home', 
    lang: 'en',
    location: { lat: 28.6139, lng: 77.2090, name: "Locating...", granted: false },
    osmHospitals: [], 
    firebaseHospitals: [], 
    hospitals: [],
    searchQuery: '', 
    isAiModal: false, 
    aiMessages: [], 
    isAiThinking: false,
    adminHospitalId: null, 
    viewingHospitalDetail: null
};
window.state = state;

function t() { return TRANSLATIONS[state.lang]; }

function setState(newState, forceRender = true) { 
    state = { ...state, ...newState }; 
    window.state = state; 
    if(forceRender) render(); 
}
window.setState = setState;

const TRANSLATIONS = {
    en: { 
        gridTitle: "Emergency Grid", searchPlaceholder: "Search disease, symptoms, specialist...", 
        searchTitle: "Search Medical Care", bloodUnits: "Blood Units", realTimeStocks: "Live stock", 
        firstAid: "First Aid", emergencyGuides: "6 Emergency guides", matchedCenters: "Matched Centers", 
        centersFound: "Centers", beds: "Beds", icuBeds: "ICU Beds", ventilators: "Ventilators", 
        doctors: "Doctors", staff: "Staff", liveStatus: "Live Status", panicSOS: "Panic SOS", 
        call108: "Call 108", bloodBank: "Blood Bank", inventoryNear: "Live inventory near you", 
        emergencyAid: "Emergency Aid", stepsFollow: "Follow these until help arrives", 
        aiTitle: "Lifeline AI", aiSub: "Expert Medical Triage", aiPlaceholder: "Explain symptoms (e.g. Heart pain)...", 
        openMaps: "Open Google Maps", consultation: "Consultation", standby: "Paramedics on standby" 
    },
    hi: { 
        gridTitle: "आपातकालीन ग्रिड", searchPlaceholder: "बीमारी या लक्षण खोजें...", 
        searchTitle: "चिकित्सा देखभाल खोजें", bloodUnits: "ब्लड यूनिट्स", realTimeStocks: "लाइव स्टॉक", 
        firstAid: "प्राथमिक उपचार", emergencyGuides: "6 आपातकालीन गाइड", matchedCenters: "मिलते-जुलते अस्पताल", 
        centersFound: "अस्पताल मिले", beds: "बेड", icuBeds: "ICU बेड", ventilators: "वेंटिलेटर", 
        doctors: "डॉक्टर", staff: "कर्मचारी", liveStatus: "लाइव स्थिति", panicSOS: "SOS", 
        call108: "108 कॉल करें", bloodBank: "ब्लड बैंक", inventoryNear: "आपके पास उपलब्ध रक्त", 
        emergencyAid: "आपातकालीन सहायता", stepsFollow: "मदद आने तक इनका पालन करें", 
        aiTitle: "लाइफलाइन AI", aiSub: "विशेषज्ञ चिकित्सा सलाहकार", aiPlaceholder: "लक्षण बताएं (जैसे सीने में दर्द)...", 
        openMaps: "गूगल मैप्स खोलें", consultation: "परामर्श", standby: "पैरामेडिक्स तैयार हैं" 
    },
    bn: {
        gridTitle: "ইমার্জেন্সি গ্রিড", searchPlaceholder: "রোগ বা লক্ষণ খুঁজুন...", 
        searchTitle: "চিকিৎসা সহায়তা খুঁজুন", bloodUnits: "রক্তের ইউনিট", realTimeStocks: "লাইভ স্টক", 
        firstAid: "প্রাথমিক চিকিৎসা", emergencyGuides: "৬টি ইমার্জেন্সি গাইড", matchedCenters: "মিলে যাওয়া হাসপাতাল", 
        centersFound: "হাসপাতাল পাওয়া গেছে", beds: "শয্যা", icuBeds: "আইসিইউ শয্যা", ventilators: "ভেন্টিলেটর", 
        doctors: "ডাক্তার", staff: "কর্মী", liveStatus: "লাইভ স্ট্যাটাস", panicSOS: "প্যানিক SOS", 
        call108: "108 কল করুন", bloodBank: "ব্লাড ব্যাংক", inventoryNear: "আপনার কাছাকাছি ব্লাড স্টক", 
        emergencyAid: "জরুরী সহায়তা", stepsFollow: "সাহায্য না আসা পর্যন্ত এগুলি অনুসরণ করুন", 
        aiTitle: "লাইফলাইন AI", aiSub: "বিশেষজ্ঞ চিকিৎসা পরামর্শদাতা", aiPlaceholder: "লক্ষণগুলি বর্ণনা করুন (যেমন বুকে ব্যথা)...", 
        openMaps: "গুগল ম্যাপ খুলুন", consultation: "পরামর্শ", standby: "প্যারামেডিকরা প্রস্তুত"
    }
};
