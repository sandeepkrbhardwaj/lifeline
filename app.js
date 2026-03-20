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

// --- 5 FULL LANGUAGES SUPPORT ---
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
    },
    ta: {
        gridTitle: "அவசர கட்டம்", searchPlaceholder: "நோய் அல்லது அறிகுறிகளை தேடுங்கள்...", 
        searchTitle: "மருத்துவ உதவி தேடுங்கள்", bloodUnits: "இரத்த அலகுகள்", realTimeStocks: "நிகழ்நேர இருப்பு", 
        firstAid: "முதலுதவி", emergencyGuides: "6 அவசர வழிகாட்டிகள்", matchedCenters: "பொருத்தமான மருத்துவமனைகள்", 
        centersFound: "மையங்கள்", beds: "படுக்கைகள்", icuBeds: "ICU படுக்கைகள்", ventilators: "வென்டிலேட்டர்கள்", 
        doctors: "மருத்துவர்கள்", staff: "பணியாளர்கள்", liveStatus: "நேரடி நிலை", panicSOS: "அவசர SOS", 
        call108: "108 ஐ அழைக்கவும்", bloodBank: "இரத்த வங்கி", inventoryNear: "அருகிலுள்ள இரத்த இருப்பு", 
        emergencyAid: "அவசர உதவி", stepsFollow: "உதவி வரும் வரை பின்பற்றவும்", 
        aiTitle: "லைஃப்லைன் AI", aiSub: "நிபுணர் மருத்துவ வழிகாட்டி", aiPlaceholder: "அறிகுறிகளை விவரிக்கவும்...", 
        openMaps: "வரைபடத்தை திறக்க", consultation: "ஆலோசனை", standby: "தயார் நிலை"
    },
    te: {
        gridTitle: "అత్యవసర గ్రిడ్", searchPlaceholder: "వ్యాధి లేదా లక్షణాలను శోధించండి...", 
        searchTitle: "వైద్య సహాయం శోధించండి", bloodUnits: "రక్త యూనిట్లు", realTimeStocks: "లైవ్ స్టాక్", 
        firstAid: "ప్రథమ చికిత్స", emergencyGuides: "6 అత్యవసర గైడ్‌లు", matchedCenters: "సరిపోలిన ఆసుపత్రులు", 
        centersFound: "కేంద్రాలు", beds: "పడకలు", icuBeds: "ICU పడకలు", ventilators: "వెంటిలేటర్లు", 
        doctors: "వైద్యులు", staff: "సిబ్బంది", liveStatus: "లైవ్ స్టేటస్", panicSOS: "అత్యవసర SOS", 
        call108: "108 కు కాల్ చేయండి", bloodBank: "బ్లడ్ బ్యాంక్", inventoryNear: "మీ దగ్గర ఉన్న రక్తం నిల్వ", 
        emergencyAid: "అత్యవసర సహాయం", stepsFollow: "సహాయం వచ్చేవరకు వీటిని పాటించండి", 
        aiTitle: "లైఫ్‌లైన్ AI", aiSub: "నిపుణుల వైద్య సలహాదారు", aiPlaceholder: "లక్షణాలను వివరించండి...", 
        openMaps: "మ్యాప్స్ తెరవండి", consultation: "సంప్రదింపులు", standby: "సిద్ధంగా ఉన్నారు"
    }
};

const FIRST_AID_GUIDES = {
    en: [
        { id: 'cpr', title: 'CPR (Adult)', steps: ['Check scene safety', 'Call 108/Emergency', 'Push hard & fast in center of chest', 'Allow full chest recoil', 'Give rescue breaths'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'Choking / Heimlich', steps: ['Stand behind the person', 'Give 5 back blows', 'Give 5 abdominal thrusts', 'Repeat until object is out'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'Severe Bleeding', steps: ['Apply firm, direct pressure', 'Use clean cloth or bandage', 'Elevate the injured area', 'Do not remove blood-soaked bandages'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'Major Burns', steps: ['Cool burn under cool running water for 10-20 mins', 'Remove jewelry near burn', 'Cover with clean dressing', 'Do NOT apply ice'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'Heart Attack', steps: ['Have person sit down & rest', 'Loosen tight clothing', 'Ask about chest pain meds', 'Chew adult Aspirin'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'Stroke (F.A.S.T.)', steps: ['F - Face drooping?', 'A - Arm weakness?', 'S - Speech difficulty?', 'T - Time to call 108'], color: 'bg-purple-500', icon: 'brain' }
    ],
    hi: [
        { id: 'cpr', title: 'CPR (वयस्क)', steps: ['जगह की सुरक्षा जांचें', '108 कॉल करें', 'छाती के बीच में जोर से दबाएं', 'छाती को वापस आने दें', 'सांस दें'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'दम घुटना (Heimlich)', steps: ['व्यक्ति के पीछे खड़े हों', 'पीठ पर 5 बार थपथपाएं', 'पेट पर 5 बार दबाव दें', 'वस्तु बाहर आने तक दोहराएं'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'गंभीर रक्तस्राव', steps: ['मजबूती से सीधा दबाव डालें', 'साफ कपड़े का प्रयोग करें', 'घायल हिस्से को ऊपर उठाएं', 'खून से सने कपड़े न हटाएं'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'गंभीर रूप से जलना', steps: ['जले हुए हिस्से को 10-20 मिनट ठंडे पानी के नीचे रखें', 'गहने हटाएं', 'साफ पट्टी से ढकें', 'बर्फ न लगाएं'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'दिल का दौरा', steps: ['व्यक्ति को बैठाएं और आराम कराएं', 'तंग कपड़े ढीले करें', 'दवा के बारे में पूछें', 'अगर होश में है, तो एक एस्पिरिन दें'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'स्ट्रोक (लकवा)', steps: ['चेहरा टेढ़ा होना?', 'हाथ कमज़ोर होना?', 'बोलने में दिक्कत?', '108 कॉल करें'], color: 'bg-purple-500', icon: 'brain' }
    ],
    bn: [
        { id: 'cpr', title: 'CPR (প্রাপ্তবয়স্ক)', steps: ['নিরাপত্তা পরীক্ষা করুন', '108 কল করুন', 'বুকের মাঝখানে জোরে চাপ দিন', 'বুক প্রসারিত হতে দিন', 'শ্বাস দিন'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'শ্বাসরোধ', steps: ['ব্যক্তির পিছনে দাঁড়ান', 'পিঠে 5 বার চাপড় দিন', 'পেটে 5 বার চাপ দিন', 'পুনরাবৃত্তি করুন'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'রক্তপাত', steps: ['শক্ত চাপ দিন', 'পরিষ্কার কাপড় ব্যবহার করুন', 'আহত স্থান উঁচু করুন', 'ব্যান্ডেজ সরাবেন না'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'পোড়া', steps: ['10-20 মিনিট ঠান্ডা জলে ধুয়ে ফেলুন', 'গয়না সরিয়ে ফেলুন', 'পরিষ্কার কাপড় দিয়ে ঢেকে দিন', 'বরফ লাগাবেন না'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'হার্ট অ্যাটাক', steps: ['রোগীকে বসান', 'পোশাক আলগা করুন', 'ওষুধের কথা জিজ্ঞাসা করুন', 'অ্যাসপিরিন দিন'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'স্ট্রোক', steps: ['মুখ বেঁকে গেছে?', 'হাত দুর্বল?', 'কথা বলতে সমস্যা?', '108 কল করুন'], color: 'bg-purple-500', icon: 'brain' }
    ],
    ta: [
        { id: 'cpr', title: 'CPR', steps: ['பாதுகாப்பை உறுதி செய்யவும்', '108 ஐ அழைக்கவும்', 'நெஞ்சின் நடுவில் வேகமாக அழுத்தவும்', 'நெஞ்சு எழ அனுமதிக்கவும்', 'சுவாசம் அளிக்கவும்'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'மூச்சுத்திணறல்', steps: ['பின்னால் நிற்கவும்', 'முதுகில் 5 முறை தட்டவும்', 'வயிற்றில் 5 முறை அழுத்தவும்', 'தொடரவும்'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'ரத்தக்கசிவு', steps: ['அழுத்தம் கொடுக்கவும்', 'சுத்தமான துணியை பயன்படுத்தவும்', 'காயமடைந்த பகுதியை உயர்த்தவும்', 'பேண்டேஜை அகற்ற வேண்டாம்'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'தீக்காயம்', steps: ['10-20 நிமிடம் குளிர்ந்த நீரில் கழுவவும்', 'நகைகளை அகற்றவும்', 'சுத்தமான துணியால் மூடவும்', 'ஐஸ் வைக்க வேண்டாம்'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'மாரடைப்பு', steps: ['உட்கார வைக்கவும்', 'ஆடைகளை தளர்த்தவும்', 'மருந்து பற்றி கேட்கவும்', 'ஆஸ்பிரின் கொடுக்கவும்'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'பக்கவாதம்', steps: ['முகம் கோணலாக உள்ளதா?', 'கை பலவீனமா?', 'பேச சிரமமா?', '108 ஐ அழைக்கவும்'], color: 'bg-purple-500', icon: 'brain' }
    ],
    te: [
        { id: 'cpr', title: 'CPR', steps: ['భద్రతను తనిఖీ చేయండి', '108 కు కాల్ చేయండి', 'ఛాతీ మధ్యలో బలంగా నొక్కండి', 'ఛాతీ పైకి రానివ్వండి', 'శ్వాస ఇవ్వండి'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'ఊపిరాడకపోవడం', steps: ['వెనుక నిలబడండి', 'వీపుపై 5 సార్లు కొట్టండి', 'పొట్టపై 5 సార్లు నొక్కండి', 'బయటకు వచ్చేలా చేయండి'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'రక్తస్రావం', steps: ['గట్టిగా ఒత్తిడి చేయండి', 'శుభ్రమైన వస్త్రాన్ని వాడండి', 'భాగాన్ని పైకి ఎత్తండి', 'బ్యాండేజీని తీయవద్దు'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'కాలిన గాయాలు', steps: ['10-20 నిమిషాలు చల్లటి నీటిలో కడగండి', 'ఆభరణాలను తీసివేయండి', 'శుభ్రమైన వస్త్రంతో కప్పండి', 'మంచును వాడవద్దు'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'గుండెపోటు', steps: ['కూర్చోబెట్టండి', 'దుస్తులను వదులు చేయండి', 'మందుల గురించి అడగండి', 'ఆస్పిరిన్ ఇవ్వండి'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'పక్షవాతం', steps: ['ముఖం వంకరగా ఉందా?', 'చేయి బలహీనంగా ఉందా?', 'మాట్లాడటం కష్టంగా ఉందా?', '108 కు కాల్ చేయండి'], color: 'bg-purple-500', icon: 'brain' }
    ]
};

const SMART_SEARCH_MAP = {
    'heart': 'cardiologist', 'dil': 'cardiologist', 'chest': 'cardiologist', 'chest pain': 'cardiologist', 'attack': 'cardiologist',
    'head': 'neurologist', 'brain': 'neurologist', 'stroke': 'neurologist', 'sir': 'neurologist', 'headache': 'neurologist', 'dizzy': 'neurologist',
    'bone': 'orthopedic', 'fracture': 'orthopedic', 'haddi': 'orthopedic', 'joint': 'orthopedic', 'knee': 'orthopedic', 'accident': 'emergency specialist',
    'child': 'pediatrician', 'kid': 'pediatrician', 'baby': 'pediatrician', 'bacha': 'pediatrician', 'fever': 'general physician',
    'skin': 'dermatologist', 'burn': 'dermatologist', 'twacha': 'dermatologist', 'rash': 'dermatologist',
    'stomach': 'gastroenterologist', 'pet': 'gastroenterologist', 'digestion': 'gastroenterologist', 'pain in stomach': 'gastroenterologist', 'vomit': 'gastroenterologist',
    'lungs': 'pulmonologist', 'breath': 'pulmonologist', 'saans': 'pulmonologist', 'cough': 'pulmonologist', 'asthma': 'pulmonologist',
    'women': 'gynecologist', 'pregnancy': 'gynecologist', 'period': 'gynecologist',
    'eye': 'ophthalmologist', 'aankh': 'ophthalmologist', 'vision': 'ophthalmologist',
    'emergency': 'emergency specialist'
};

// --- CORE FUNCTIONS ---
window.showToast = function(msg) {
    const container = document.getElementById('app-container');
    const id = 't' + Date.now();
    const toastHTML = `
        <div id="${id}" class="fixed top-24 left-4 right-4 z-[300] bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] text-center uppercase tracking-widest shadow-2xl animate-in">
            ${msg}
        </div>
    `;
    container.insertAdjacentHTML('beforeend', toastHTML);
    setTimeout(() => document.getElementById(id)?.remove(), 4000);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function mergeHospitals() {
    let merged = [...state.osmHospitals];
    
    state.firebaseHospitals.forEach(fbH => {
        const hLat = parseFloat(fbH.lat) || state.location.lat;
        const hLng = parseFloat(fbH.lng) || state.location.lng;
        
        fbH.distance = calculateDistance(state.location.lat, state.location.lng, hLat, hLng);
        
        const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const fbName = normalize(fbH.name);
        
        const idx = merged.findIndex(h => 
            h.id === fbH.id || normalize(h.name) === fbName
        );
        
        if (idx > -1) {
            merged[idx] = { ...merged[idx], ...fbH, isCloudSynced: true, id: fbH.id };
        } else {
            merged.push({ ...fbH, isCloudSynced: true });
        }
    });
    
    merged.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    state.hospitals = merged;
}

function listenToFirebase() {
    const hospitalsRef = collection(db, 'artifacts', appId, 'public', 'data', 'hospitals');
    onSnapshot(hospitalsRef, (snapshot) => {
        state.firebaseHospitals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        mergeHospitals();
        
        if (state.view === 'user') {
            if (state.activeTab === 'home') {
                const container = document.getElementById('hlist');
                if(container) { container.innerHTML = window.renderList(); lucide.createIcons(); }
            } else if (state.activeTab === 'map') {
                if(window.updateMapMarkers) window.updateMapMarkers();
            } else if (state.activeTab === 'blood') {
                const container = document.getElementById('blood-list-container');
                if(container) { container.innerHTML = window.renderBloodList(); lucide.createIcons(); }
            }
            
            if (state.viewingHospitalDetail) {
                const popupContent = document.getElementById('popup-internal-content');
                if(popupContent) {
                    popupContent.innerHTML = window.renderPopupInnerHtml();
                    lucide.createIcons();
                }
            }
        }
    }, (error) => {
        console.error("Firebase Read Error: ", error);
        window.showToast("Cloud Read Error: " + error.message);
    });
}

async function initApp() {
    // FORCE HARD-LOCK SPLASH SCREEN FOR EXACTLY 5 SECONDS
    setTimeout(() => {
        mergeHospitals();
        setState({ loading: false });
    }, 5000);

    listenToFirebase(); 

    try { 
        await signInAnonymously(auth); 
    } catch (e) { 
        console.warn("Local Auth Notice: Working offline/local."); 
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        state.location = { lat: latitude, lng: longitude, granted: true, name: "GPS Active" };
        
        try {
            const osmQuery = `[out:json];node["amenity"="hospital"](around:15000,${latitude},${longitude});out body;`;
            const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`);
            const data = await res.json();
            
            const specs = ["Cardiologist", "Neurologist", "Orthopedic Surgeon", "General Physician", "Pediatrician"];
            
            state.osmHospitals = data.elements.map(h => {
                const spec = specs[Math.floor(Math.random() * specs.length)];
                return {
                    id: h.id.toString(), 
                    name: h.tags.name || "Medical Center", 
                    lat: h.lat, 
                    lng: h.lon,
                    // Extract Real Phone number from OpenStreetMaps tags
                    phone: h.tags.phone || h.tags['contact:phone'] || h.tags['mobile'] || null,
                    distance: calculateDistance(latitude, longitude, h.lat, h.lon),
                    beds: 0, icuBeds: 0, ventilators: 0, doctors: 0, cost: 500, specialty: spec,
                    blood: { 'O+': 0, 'AB-': 0, 'B+': 0 }, 
                    medicines: { "Oxygen Cylinders": 0 },
                    doctorsList: [{type: 'General Physician', price: 500}],
                    isAutoPilot: false
                };
            });
            mergeHospitals();
        } catch (e) { 
            console.error("OSM Error, falling back to Firebase only.");
        }
    }, () => {
        console.warn("Location denied, falling back to default/Firebase.");
    }, { timeout: 5000, enableHighAccuracy: true });
}

// --- AUTOMATION: BACKGROUND SYNC & HIS SIMULATOR ---

window.debounceTimer = null;
window.triggerAutoSave = (hId) => {
    clearTimeout(window.debounceTimer);
    window.debounceTimer = setTimeout(async () => {
        const h = state.hospitals.find(x => x.id === hId);
        if (h) {
            try {
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hospitals', h.id), h, { merge: true });
            } catch(e) {
                console.error("Background save failed", e);
            }
        }
    }, 1000); 
};

window.autoPilotInterval = null;
window.toggleAutoPilot = (hId) => {
    const h = state.hospitals.find(x => x.id === hId);
    if (!h) return;
    
    h.isAutoPilot = !h.isAutoPilot;
    
    if (h.isAutoPilot) {
        window.showToast("HIS Auto-Pilot Enabled: Simulating live updates");
        window.autoPilotInterval = setInterval(async () => {
            const currentH = state.hospitals.find(x => x.id === hId);
            if(!currentH || !currentH.isAutoPilot) {
                clearInterval(window.autoPilotInterval);
                return;
            }
            
            if(Math.random() > 0.5 && currentH.beds > 0) currentH.beds--;
            else if(Math.random() > 0.5 && currentH.beds < 200) currentH.beds++;

            if(Math.random() > 0.7 && currentH.icuBeds > 0) currentH.icuBeds--;
            else if(Math.random() > 0.7 && currentH.icuBeds < 50) currentH.icuBeds++;

            const bloodTypes = Object.keys(currentH.blood || {});
            if(bloodTypes.length > 0) {
                const randBlood = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
                if(Math.random() > 0.5) currentH.blood[randBlood]++;
                else if(currentH.blood[randBlood] > 0) currentH.blood[randBlood]--;
            }

            try {
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hospitals', hId), currentH, { merge: true });
            } catch(e) {}
            
            if(state.view === 'admin') {
                const bedsInp = document.getElementById(`admin-beds-${hId}`);
                if(bedsInp) bedsInp.value = currentH.beds;
                const icuInp = document.getElementById(`admin-icu-${hId}`);
                if(icuInp) icuInp.value = currentH.icuBeds;
            }

        }, 5000); 
    } else {
        clearInterval(window.autoPilotInterval);
        window.showToast("HIS Auto-Pilot Disabled");
    }
    
    render();
    window.triggerAutoSave(hId);
};

// --- HANDLERS ---
window.handleLogin = async () => {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    let admin = state.firebaseHospitals.find(a => a.adminUser === user && a.adminPass === pass);
    
    if (admin) {
        setState({ view: 'admin', adminHospitalId: admin.id });
        window.showToast("Connection to Firebase Secured.");
        if(admin.isAutoPilot) window.toggleAutoPilot(admin.id); 
    } else {
        window.showToast("Invalid Credentials or Hospital Not Synced.");
    }
};

window.handleLogout = () => {
    if(window.autoPilotInterval) {
        clearInterval(window.autoPilotInterval);
    }
    setState({view: 'user', adminHospitalId: null});
}

window.handleRegister = async () => {
    const name = document.getElementById('reg-name').value;
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    const address = document.getElementById('reg-address').value || state.location.name;
    const phone = document.getElementById('reg-phone').value || null;
    const lat = parseFloat(document.getElementById('reg-lat').value) || state.location.lat;
    const lng = parseFloat(document.getElementById('reg-lng').value) || state.location.lng;
    
    if(!name || !user || !pass) return window.showToast("Required fields missing");

    const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameQuery = normalize(name);
    const existingHospital = state.hospitals.find(h => normalize(h.name) === nameQuery);
    
    const targetId = existingHospital ? existingHospital.id : 'h-' + Date.now();
    
    const newHospital = {
        id: targetId, 
        name: existingHospital ? existingHospital.name : name, 
        address: address, 
        phone: existingHospital && existingHospital.phone ? existingHospital.phone : phone,
        adminUser: user, 
        adminPass: pass, 
        lat: lat, 
        lng: lng, 
        distance: calculateDistance(state.location.lat, state.location.lng, lat, lng),
        beds: existingHospital ? existingHospital.beds : 50, 
        icuBeds: existingHospital ? existingHospital.icuBeds : 10, 
        ventilators: existingHospital ? existingHospital.ventilators : 5, 
        doctors: existingHospital ? existingHospital.doctors : 15, 
        cost: existingHospital ? existingHospital.cost : 500, 
        specialty: existingHospital ? existingHospital.specialty : "Multispecialty",
        blood: existingHospital ? existingHospital.blood : { 'O+': 20, 'AB-': 5, 'B+': 15 }, 
        medicines: existingHospital ? existingHospital.medicines : { "Oxygen Cylinders": 30 },
        doctorsList: existingHospital && existingHospital.doctorsList ? existingHospital.doctorsList : [{ type: 'General Physician', price: 500 }],
        isAutoPilot: false
    };

    try {
        if(!existingHospital) {
            state.firebaseHospitals.push(newHospital);
        } else {
            const idx = state.firebaseHospitals.findIndex(h => h.id === targetId);
            if(idx > -1) state.firebaseHospitals[idx] = newHospital;
            else state.firebaseHospitals.push(newHospital);
        }
        
        mergeHospitals();
        
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hospitals', targetId), newHospital, {merge: true});
        
        setState({ view: 'admin', adminHospitalId: targetId });
        window.showToast("Hospital Data Secured & Overridden in Firebase");
    } catch (e) { 
        console.error(e);
        window.showToast("Firebase Error: Check Console Logs or Rules. " + e.message); 
    }
};

window.handleAdminPublish = async () => {
    const h = state.hospitals.find(h => h.id === state.adminHospitalId);
    if (!h) return;
    
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hospitals', h.id), h, { merge: true });
        window.showToast("Live Updates Uploaded to Cloud");
    } catch(e) { 
        window.showToast("Sync Failed: " + e.message); 
    }
};

window.updateHospitalStatText = (hId, key, val) => { 
    const h = state.hospitals.find(x => x.id === hId); 
    if (h) {
        h[key] = val; 
        window.triggerAutoSave(hId);
    }
};

window.updateHospitalStat = (hId, key, val) => { 
    const h = state.hospitals.find(x => x.id === hId); 
    if (h) {
        h[key] = parseInt(val) || 0; 
        window.triggerAutoSave(hId);
    }
};

window.updateHospitalBlood = (hId, bType, val) => { 
    const h = state.hospitals.find(x => x.id === hId); 
    if (h && h.blood) {
        h.blood[bType] = parseInt(val) || 0; 
        window.triggerAutoSave(hId);
    }
};

window.updateHospitalMeds = (hId, mType, val) => { 
    const h = state.hospitals.find(x => x.id === hId); 
    if (h && h.medicines) {
        h.medicines[mType] = parseInt(val) || 0; 
        window.triggerAutoSave(hId);
    }
};

window.updateDoctor = (hId, idx, key, val) => {
    const h = state.hospitals.find(x => x.id === hId);
    if (h && h.doctorsList) {
        h.doctorsList[idx][key] = key === 'price' ? parseInt(val) || 0 : val;
        if (idx === 0 && key === 'price') h.cost = parseInt(val) || 0;
        window.triggerAutoSave(hId);
    }
};

window.addDoctorSlot = (hId) => {
    const h = state.hospitals.find(x => x.id === hId);
    if (h) {
        if(!h.doctorsList) h.doctorsList = [];
        h.doctorsList.push({ type: 'General Physician', price: 500 });
        window.triggerAutoSave(hId);
        setState({}, true);
    }
};

// --- LEAFLET SATELLITE MAP INITIALIZATION ---
window.initLeafletMap = () => {
    if(window.mapInstance) {
        window.mapInstance.off();
        window.mapInstance.remove();
    }
    
    const container = document.getElementById('leaflet-map');
    if(!container) return;

    window.mapInstance = L.map('leaflet-map', { 
        zoomControl: false, 
        attributionControl: false 
    }).setView([state.location.lat, state.location.lng], 14);
    
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18
    }).addTo(window.mapInstance);

    const userHtml = `
        <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,1)] animate-pulse"></div>
    `;
    const userIcon = L.divIcon({className: '', html: userHtml, iconSize: [16, 16], iconAnchor: [8,8]});
    L.marker([state.location.lat, state.location.lng], {icon: userIcon, zIndexOffset: 1000})
        .addTo(window.mapInstance)
        .bindPopup('<b>Your Location</b>');

    window.hospLayer = L.layerGroup().addTo(window.mapInstance);
    window.updateMapMarkers();

    const ambData = [
        { plate: 'DL 1C AA 1234', type: 'Advanced Life Support (ALS)', phone: '+91-108', cost: '₹1500 base' },
        { plate: 'UP 16 BX 9876', type: 'Basic Life Support (BLS)', phone: '+91-9999888877', cost: '₹800 base' },
        { plate: 'HR 26 XX 5555', type: 'Neonatal Care Unit', phone: '+91-8888777766', cost: '₹2000 base' }
    ];

    const ambHtml = `
        <div class="w-6 h-6 bg-white rounded-full border-2 border-blue-600 shadow-[0_0_10px_rgba(255,255,255,1)] flex items-center justify-center text-[10px] amb-marker">🚑</div>
    `;
    const ambIcon = L.divIcon({className: '', html: ambHtml, iconSize: [24, 24], iconAnchor: [12,12]});
    
    if(window.ambMapInterval) clearInterval(window.ambMapInterval);
    
    const ambs = [
        L.marker([state.location.lat + 0.005, state.location.lng + 0.005], {icon: ambIcon}).addTo(window.mapInstance),
        L.marker([state.location.lat - 0.003, state.location.lng + 0.008], {icon: ambIcon}).addTo(window.mapInstance),
        L.marker([state.location.lat + 0.007, state.location.lng - 0.004], {icon: ambIcon}).addTo(window.mapInstance)
    ];

    ambs.forEach((amb, i) => {
        amb.bindPopup(`
            <div class="p-1">
                <div class="text-xs font-black text-blue-900">${ambData[i].type}</div>
                <div class="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">${ambData[i].plate}</div>
                <div class="text-[11px] font-black text-green-600 mt-2">Contact: ${ambData[i].phone}</div>
                <div class="text-[10px] font-bold text-slate-400 mt-1">Est. Cost: ${ambData[i].cost}</div>
            </div>
        `);
    });

    let angle = 0;
    window.ambMapInterval = setInterval(() => {
        angle += 0.05;
        ambs[0].setLatLng([state.location.lat + Math.sin(angle)*0.005, state.location.lng + Math.cos(angle)*0.005]);
        ambs[1].setLatLng([state.location.lat - 0.003 + Math.cos(angle)*0.003, state.location.lng + 0.008 + Math.sin(angle)*0.003]);
        ambs[2].setLatLng([state.location.lat + 0.007 + Math.sin(angle)*0.004, state.location.lng - 0.004 + Math.cos(angle)*0.004]);
    }, 1000);
};

window.updateMapMarkers = () => {
    if(!window.mapInstance || !window.hospLayer) return;
    window.hospLayer.clearLayers();
    
    const hospHtml = `
        <div class="w-8 h-8 bg-red-600 rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">H</div>
    `;
    const hospIcon = L.divIcon({className: '', html: hospHtml, iconSize: [32, 32], iconAnchor: [16,16]});

    state.hospitals.slice(0, 15).forEach(h => {
        if(h.lat && h.lng) {
            L.marker([parseFloat(h.lat), parseFloat(h.lng)], {icon: hospIcon})
                .addTo(window.hospLayer)
                .bindPopup(`
                    <div class="p-1">
                        <b class="text-slate-800 text-sm block mb-1">${h.name}</b>
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">${(h.distance||0).toFixed(2)} km away</span>
                        <div class="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                            <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">BEDS: ${h.beds}</span>
                            <span class="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded">ICU: ${h.icuBeds}</span>
                        </div>
                    </div>
                `);
        }
    });
}

// --- Bypass Google Maps App Blocker ---
window.handleNavigation = (hId) => {
    const h = state.hospitals.find(x => x.id === hId);
    if (!h) return;
    const destLat = parseFloat(h.lat);
    const destLng = parseFloat(h.lng);
    if (isNaN(destLat) || isNaN(destLng)) {
        window.showToast("Invalid hospital coordinates.");
        return;
    }
    
    const origin = `${state.location.lat},${state.location.lng}`;
    const destination = `${destLat},${destLng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// --- VIEWS ---
function Header() {
    const langs = ['en', 'hi', 'bn', 'ta', 'te'];
    const nextLang = langs[(langs.indexOf(state.lang) + 1) % langs.length];

    return `
        <div class="bg-white/95 backdrop-blur-xl p-4 pt-safe flex justify-between items-center sticky top-0 z-[100] border-b border-slate-100">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <i data-lucide="zap" class="text-white fill-white w-5 h-5"></i>
                </div>
                <div>
                    <h1 class="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">${t().gridTitle}</h1>
                    <p class="text-xs font-black text-slate-900 truncate max-w-[140px] mt-0.5">${state.location.name}</p>
                </div>
            </div>
            <div class="flex gap-2 items-center">
                <a href="tel:108" class="px-3 py-1.5 bg-red-600 rounded-xl text-[10px] font-black text-white active:scale-95 transition-transform flex items-center gap-1 shadow-lg shadow-red-500/30">
                    <i data-lucide="phone-call" class="w-3 h-3"></i> SOS
                </a>
                <button onclick="window.setState({lang: '${nextLang}'})" class="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-600 active:scale-95 transition-transform">
                    ${state.lang.toUpperCase()}
                </button>
                <button onclick="window.setState({view: 'login'})" class="p-2 bg-slate-900 rounded-xl text-white active:scale-95 transition-all shadow-lg flex items-center gap-1">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `;
}

window.renderList = () => {
    let query = (state.searchQuery || '').toLowerCase().trim();
    let mappedQuery = query;
    
    for (let key in SMART_SEARCH_MAP) {
        if (query.includes(key)) { 
            mappedQuery = SMART_SEARCH_MAP[key]; 
            break; 
        }
    }

    const filtered = state.hospitals.filter(h => {
        if (!query) return true;
        const nameMatch = (h.name || '').toLowerCase().includes(query);
        const specMatch = (h.specialty || '').toLowerCase().includes(query) || (h.specialty || '').toLowerCase().includes(mappedQuery);
        const docMatch = (h.doctorsList || []).some(d => (d.type || '').toLowerCase().includes(query) || (d.type || '').toLowerCase().includes(mappedQuery));
        return nameMatch || specMatch || docMatch;
    });

    let html = `
        <div class="flex justify-between items-center px-1">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${t().matchedCenters}</h3>
            <span class="text-[10px] font-bold text-blue-600">${filtered.length} ${t().centersFound}</span>
        </div>
    `;

    if (filtered.length === 0) {
        html += `
            <div class="p-6 text-center text-slate-400 font-bold bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                No centers found matching criteria. Try checking your spelling or use general terms.
            </div>
        `;
    }

    html += filtered.map(h => `
        <div onclick="window.setState({viewingHospitalDetail: '${h.id}'}, true)" class="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden active:scale-95 transition-all cursor-pointer">
            ${h.isCloudSynced ? `<div class="absolute top-0 right-0 bg-blue-500 text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-md">Live Verified</div>` : ''}
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <i data-lucide="hospital" class="w-6 h-6"></i>
                    </div>
                    <div class="max-w-[140px]">
                        <h4 class="font-black text-slate-900 text-sm truncate">${h.name}</h4>
                        <p class="text-[9px] font-bold text-blue-500 uppercase">${(h.distance||0).toFixed(2)} km • ${h.specialty}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs font-black text-green-600">₹${h.cost || 0}</p>
                    <p class="text-[8px] font-bold text-slate-400 uppercase">${t().consultation}</p>
                </div>
            </div>
            <div class="flex gap-2 border-t border-slate-50 pt-3 mt-4">
                <span class="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">${h.beds} ${t().beds}</span>
                <span class="text-[8px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase">${h.icuBeds} ICU</span>
            </div>
        </div>
    `).join('');

    return html;
};

function UserHomeView() {
    return `
        <div class="p-4 space-y-6 pb-32 overflow-y-auto flex-1 hide-scrollbar">
            <div class="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50">
                <h2 class="text-lg font-black text-slate-900 mb-4">${t().searchTitle}</h2>
                <div class="relative">
                    <i data-lucide="search" class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"></i>
                    <input type="text" placeholder="${t().searchPlaceholder}" class="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-[2rem] font-bold text-sm outline-none shadow-inner" value="${state.searchQuery}" oninput="window.state.searchQuery=this.value; document.getElementById('hlist').innerHTML=window.renderList(); lucide.createIcons();"/>
                </div>
            </div>
            <div id="hlist" class="space-y-4">
                ${window.renderList()}
            </div>
        </div>
    `;
}

window.renderBloodList = () => {
    return state.hospitals.map(h => `
        <div onclick="window.setState({viewingHospitalDetail: '${h.id}'}, true)" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer active:bg-slate-50 transition-colors relative">
            ${h.isCloudSynced ? `<div class="absolute top-0 right-0 bg-blue-500 text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-md">LIVE UPDATE</div>` : ''}
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center">
                        <i data-lucide="navigation" class="w-5 h-5"></i>
                    </div>
                    <h4 class="font-black text-slate-800 text-sm truncate max-w-[140px]">${h.name||'Hospital'}</h4>
                </div>
                <span class="text-[9px] font-black text-slate-400 uppercase">${(h.distance||0).toFixed(2)} km</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
                ${Object.entries(h.blood||{'O+':0,'AB-':0,'B+':0}).map(([type,q])=>`
                    <div class="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                        <p class="text-xs font-black text-slate-800">${type}</p>
                        <p class="text-[10px] font-bold ${q>0?'text-green-600':'text-red-500'}">${q}u</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
};

function BloodBankView() {
    return `
        <div class="p-4 pb-32 animate-in flex-1 overflow-y-auto hide-scrollbar space-y-4">
            <div class="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-50">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                        <i data-lucide="droplet" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900">${t().bloodBank}</h2>
                </div>
                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">${t().inventoryNear}</p>
            </div>
            <div id="blood-list-container" class="space-y-4">
                ${window.renderBloodList()}
            </div>
        </div>
    `;
}

function FirstAidView() {
    const guides = FIRST_AID_GUIDES[state.lang] || FIRST_AID_GUIDES['en'];
    return `
        <div class="p-4 pb-32 animate-in flex-1 overflow-y-auto hide-scrollbar space-y-4">
            <div class="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-50">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white">
                        <i data-lucide="info" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black text-slate-900">${t().emergencyAid}</h2>
                </div>
                <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">${t().emergencyGuides}</p>
            </div>
            ${guides.map(g => `
                <div class="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 ${g.color} text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <i data-lucide="${g.icon}" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-lg font-black text-slate-800">${g.title}</h3>
                    </div>
                    <div class="space-y-3">
                        ${g.steps.map((s, i) => `
                            <div class="flex gap-4 items-start">
                                <span class="w-6 h-6 bg-slate-50 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-slate-100">${i+1}</span>
                                <p class="text-xs font-medium text-slate-600 leading-relaxed">${s}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.renderPopupInnerHtml = () => {
    const h = state.hospitals.find(x => x.id === state.viewingHospitalDetail);
    if (!h) return '';
    const docs = h.doctorsList || [{type: 'General Physician', price: h.cost || 500}];
    
    // Extracted Real Phone formatting logic
    const displayPhone = h.phone || 'Contact not publicly listed';
    const phoneToDial = h.phone ? h.phone.replace(/[^0-9+]/g, '') : '108'; // Strips text/spaces for the dialer, defaults to 108
    
    return `
        <div class="p-6 bg-blue-600 text-white relative">
            <button onclick="window.setState({viewingHospitalDetail: null}, true)" class="absolute right-6 top-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <div class="flex items-center gap-2 mb-2">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-white/20 rounded-md live-badge">${h.isCloudSynced ? 'Live Sync' : t().liveStatus}</span>
            </div>
            <h2 class="text-2xl font-black leading-tight mb-1">${h.name || 'Hospital Details'}</h2>
            <p class="text-sm font-medium opacity-90 flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3 h-3"></i> ${(h.distance || 0).toFixed(2)} km away
            </p>
            <p class="text-[10px] font-medium opacity-80 mt-1 flex items-start gap-1">
                <i data-lucide="map" class="w-3 h-3 mt-0.5 shrink-0"></i> ${h.address || 'Address details not available'}
            </p>
            <p class="text-[10px] font-medium opacity-80 mt-1 flex items-start gap-1">
                <i data-lucide="phone" class="w-3 h-3 mt-0.5 shrink-0"></i> ${displayPhone}
            </p>
        </div>
        <div class="p-6 space-y-6">
            <div class="grid grid-cols-3 gap-3">
                <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                    <span class="text-2xl font-black text-blue-600">${h.beds || 0}</span>
                    <span class="text-[8px] font-black uppercase text-slate-400 mt-1">${t().beds}</span>
                </div>
                <div class="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center">
                    <span class="text-2xl font-black text-red-600">${h.icuBeds || 0}</span>
                    <span class="text-[8px] font-black uppercase text-slate-400 mt-1">${t().icuBeds}</span>
                </div>
                <div class="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex flex-col items-center">
                    <span class="text-2xl font-black text-teal-600">${h.ventilators || 0}</span>
                    <span class="text-[8px] font-black uppercase text-slate-400 mt-1">${t().ventilators}</span>
                </div>
            </div>
            <div class="mt-6">
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <i data-lucide="stethoscope" class="w-3 h-3"></i> Specialists & Pricing
                </h4>
                <div class="space-y-2">
                    ${docs.map(d => `
                        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span class="text-xs font-bold text-slate-700">${d.type}</span>
                            <span class="text-xs font-black text-green-600">₹${d.price}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">${t().bloodBank}</h4>
                    <div class="grid grid-cols-3 gap-2">
                        ${Object.entries(h.blood || {}).map(([type, qty]) => `
                            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span class="text-xs font-black text-slate-800">${type}</span>
                                <span class="text-[11px] font-bold ${qty > 0 ? 'text-green-600' : 'text-red-500'}">${qty}u</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="flex gap-3 pt-4 pb-safe">
                <a href="tel:${phoneToDial}" class="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black text-center text-sm uppercase active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <i data-lucide="phone" class="w-4 h-4"></i> Call Desk
                </a>
                <button onclick="window.handleNavigation('${h.id}')" class="flex-[1.5] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <i data-lucide="navigation" class="w-4 h-4"></i> ${t().openMaps}
                </button>
            </div>
        </div>
    `;
};

function HospitalDetailPopup() {
    if (!state.viewingHospitalDetail) return '';
    
    return `
        <div class="fixed inset-0 z-[1001] bg-slate-900/60 backdrop-blur-md flex items-end sm:items-center justify-center animate-in overflow-y-auto" onclick="window.setState({viewingHospitalDetail: null}, true)">
            <div id="popup-internal-content" class="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl slide-up overflow-hidden" onclick="event.stopPropagation()">
                ${window.renderPopupInnerHtml()}
            </div>
        </div>
    `;
}

window.askAI = async (text) => {
    if (!apiKey) {
        window.showToast("API Key Missing: Please ensure the execution environment has provided the key.");
        return;
    }
    if (!text.trim()) return;
    
    const msgs = [...state.aiMessages, { role: 'user', text }];
    setState({ aiMessages: msgs, isAiThinking: true }, false);
    window.renderAIModal();

    const topHospitals = state.hospitals.slice(0, 3).map(h => `${h.name} (${h.beds} beds available)`).join(', ');
    
    const langNames = {en: 'English', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu'};
    const currentLang = langNames[state.lang] || 'English';

    const sysPrompt = `
        You are Lifeline AI, an advanced, empathetic, and highly capable medical support and triage assistant for India. 
        Your primary goal is to provide immediate, actionable first-aid advice, assess symptom severity, and guide patients to the nearest appropriate medical facility based on the provided live data. 
        
        CRITICAL INSTRUCTIONS:
        1. Always maintain a professional, calm, and highly detailed medical tone.
        2. If symptoms indicate a severe life-threatening emergency (e.g., heart attack, severe bleeding, stroke, difficulty breathing), immediately instruct them to CALL 108 and provide step-by-step stabilization instructions.
        3. You have access to their live location and nearby hospitals. 
        User Location: ${state.location.name}. 
        Top hospitals nearby based on live data: ${topHospitals}. Recommend these specific hospitals by name if they require a physical visit.
        4. You must respond entirely and fluently in ${currentLang}. Do not mix languages unless using universally understood medical terms.
        5. Always end your advice by reminding the user that you are an AI assistant and they should consult a human doctor or call 108 for final medical decisions.
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text }] }], 
                systemInstruction: { parts: [{ text: sysPrompt }] } 
            })
        });
        const result = await response.json();
        const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Call 108 immediately. We are unable to process your request at this moment.";
        state.aiMessages = [...msgs, { role: 'ai', text: aiText }];
        state.isAiThinking = false;
        window.renderAIModal();
    } catch (e) {
        state.aiMessages = [...msgs, { role: 'ai', text: "Connection error to Medical AI Server. Please try calling 108 directly." }];
        state.isAiThinking = false;
        window.renderAIModal();
    }
};

window.renderAIModal = () => {
    const container = document.getElementById('ai-modal-root');
    if(!container) return;
    
    container.innerHTML = `
        <div class="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm px-4 pb-10 animate-in" onclick="window.setState({isAiModal: false}, true)">
            <div class="bg-white w-full max-w-md h-[85vh] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden slide-up" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                            <i data-lucide="bot" class="text-white w-5 h-5"></i>
                        </div>
                        <div>
                            <h2 class="text-lg font-black text-slate-900 leading-none">${t().aiTitle}</h2>
                            <p class="text-[10px] font-bold text-green-500 uppercase mt-1">${t().aiSub}</p>
                        </div>
                    </div>
                    <button onclick="window.setState({isAiModal: false}, true)" class="p-2 bg-slate-50 rounded-xl text-slate-400">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div id="ai-chat-box" class="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 hide-scrollbar">
                    ${state.aiMessages.map(m => `
                        <div class="flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}">
                            <div class="max-w-[85%] p-4 rounded-3xl ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-lg' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm'}">
                                <p class="text-sm font-medium leading-relaxed">${m.text}</p>
                            </div>
                        </div>
                    `).join('')}
                    ${state.isAiThinking ? `
                        <div class="flex justify-start">
                            <div class="bg-white p-4 rounded-3xl flex gap-1 items-center shadow-sm">
                                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="p-6 bg-white border-t border-slate-100 pb-safe">
                    <form onsubmit="event.preventDefault(); const inp = this.querySelector('input'); window.askAI(inp.value); inp.value='';" class="relative">
                        <input type="text" placeholder="${t().aiPlaceholder}" class="w-full pl-6 pr-14 py-5 rounded-[2rem] bg-slate-100 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <button type="submit" class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    const cb = document.getElementById('ai-chat-box'); 
    if(cb) cb.scrollTop = cb.scrollHeight;
};

function AdminPanelView() {
    const h = state.hospitals.find(h => h.id === state.adminHospitalId);
    if (!h) return `
        <div class="h-full flex flex-col items-center justify-center bg-slate-900 text-white">
            <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    `;

    return `
        <div class="h-full flex flex-col bg-slate-50 animate-in relative">
            
            <div class="bg-slate-900 text-white p-6 pt-safe flex justify-between items-center shadow-xl z-10">
                <div>
                    <span class="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-1">
                        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Cloud Command
                    </span>
                    <h2 class="text-lg font-black truncate max-w-[200px] mt-1">${h.name}</h2>
                </div>
                <button onclick="window.handleLogout()" class="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                    <i data-lucide="log-out" class="w-5 h-5"></i>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar pb-32">
                
                <div class="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] shadow-sm flex justify-between items-center mt-2">
                    <div>
                        <h3 class="font-black text-indigo-900 flex items-center gap-2">
                            <i data-lucide="cpu" class="w-5 h-5 text-indigo-600"></i> HIS Auto-Pilot
                        </h3>
                        <p class="text-[10px] font-bold text-indigo-500 uppercase mt-1 tracking-widest">Simulate Live Updates</p>
                    </div>
                    <button onclick="window.toggleAutoPilot('${h.id}')" class="w-14 h-8 rounded-full transition-colors relative shadow-inner ${h.isAutoPilot ? 'bg-indigo-600' : 'bg-slate-300'}">
                        <div class="w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-md ${h.isAutoPilot ? 'left-7' : 'left-1'}"></div>
                    </button>
                </div>
                
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 class="font-black text-slate-800 mb-4 flex items-center gap-2">
                        <i data-lucide="bed" class="w-5 h-5 text-blue-500"></i> Ward Status
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p class="text-[10px] font-black text-blue-500 uppercase mb-2">Available Beds</p>
                            <input id="admin-beds-${h.id}" type="number" value="${h.beds}" oninput="window.updateHospitalStat('${h.id}', 'beds', this.value)" class="text-3xl font-black text-blue-700 w-full bg-transparent outline-none">
                        </div>
                        <div class="p-4 bg-red-50 rounded-2xl border border-red-100">
                            <p class="text-[10px] font-black text-red-500 uppercase mb-2">ICU Units</p>
                            <input id="admin-icu-${h.id}" type="number" value="${h.icuBeds}" oninput="window.updateHospitalStat('${h.id}', 'icuBeds', this.value)" class="text-3xl font-black text-red-600 w-full bg-transparent outline-none">
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 class="font-black text-slate-800 mb-4 flex items-center gap-2">
                        <i data-lucide="stethoscope" class="w-5 h-5 text-blue-500"></i> Specialists List
                    </h3>
                    <div class="space-y-3">
                        ${(h.doctorsList || []).map((doc, idx) => `
                            <div class="flex gap-2 items-center">
                                <input type="text" list="specialties-list" value="${doc.type}" onchange="window.updateDoctor('${h.id}', ${idx}, 'type', this.value)" class="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-800" placeholder="Type or Select...">
                                <input type="number" value="${doc.price}" onchange="window.updateDoctor('${h.id}', ${idx}, 'price', this.value)" class="w-24 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-800 text-center" placeholder="₹">
                            </div>
                        `).join('')}
                        <button onclick="window.addDoctorSlot('${h.id}')" class="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-blue-100">+ Add Specialist</button>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 class="font-black text-slate-800 mb-4 flex items-center gap-2">
                        <i data-lucide="droplet" class="w-5 h-5 text-orange-500"></i> Blood Bank Inventory
                    </h3>
                    <div class="grid grid-cols-3 gap-3">
                        ${Object.entries(h.blood || {}).map(([type, qty]) => `
                            <div class="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                                <p class="text-xs font-black text-slate-400 mb-1">${type}</p>
                                <input type="number" value="${qty}" oninput="window.updateHospitalBlood('${h.id}', '${type}', this.value)" class="text-xl text-center font-black text-slate-800 w-full bg-transparent outline-none border-b-2 border-transparent focus:border-orange-300 transition-colors">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
                    <h3 class="font-black mb-4 flex items-center gap-2 text-teal-400">
                        <i data-lucide="activity" class="w-5 h-5"></i> Resources & Contact
                    </h3>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                            <span class="text-sm font-bold">Helpline Number</span>
                            <input type="text" value="${h.phone || ''}" oninput="window.updateHospitalStatText('${h.id}', 'phone', this.value)" class="w-32 bg-white/10 rounded-xl p-2 text-center font-black outline-none" placeholder="e.g. 108">
                        </div>
                        <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                            <span class="text-sm font-bold">Oxygen Cylinders (O2)</span>
                            <input type="number" value="${(h.medicines||{})['Oxygen Cylinders'] || 0}" oninput="window.updateHospitalMeds('${h.id}', 'Oxygen Cylinders', this.value)" class="w-20 bg-white/10 rounded-xl p-2 text-center font-black text-teal-400 outline-none">
                        </div>
                        <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                            <span class="text-sm font-bold">On-Duty Doctors</span>
                            <input type="number" value="${h.doctors}" oninput="window.updateHospitalStat('${h.id}', 'doctors', this.value)" class="w-20 bg-white/10 rounded-xl p-2 text-center font-black outline-none">
                        </div>
                        <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                            <span class="text-sm font-bold">Active Ventilators</span>
                            <input type="number" value="${h.ventilators}" oninput="window.updateHospitalStat('${h.id}', 'ventilators', this.value)" class="w-20 bg-white/10 rounded-xl p-2 text-center font-black outline-none">
                        </div>
                    </div>
                </div>

            </div>
            
            <div class="fixed bottom-0 left-0 right-0 mx-auto w-full sm:max-w-[28rem] p-6 pb-safe bg-white border-t border-slate-100 z-[200]">
                <button onclick="window.handleAdminPublish()" class="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform flex justify-center items-center gap-2">
                    <i data-lucide="cloud-upload" class="w-5 h-5"></i> Force Manual Sync
                </button>
            </div>
        </div>
    `;
}

function LoginView() {
    return `
        <div class="h-full bg-slate-900 flex flex-col justify-center p-8 animate-in relative">
            <button onclick="window.setState({view: 'user'})" class="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white z-10 hover:bg-white/20 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <div class="mb-10 text-center">
                <div class="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <i data-lucide="shield-check" class="text-white w-10 h-10"></i>
                </div>
                <h2 class="text-3xl font-black text-white">Hospital Login</h2>
                <p class="text-blue-400 font-bold text-[10px] mt-2 uppercase tracking-widest">Authorized Personnel Only</p>
            </div>
            <div class="space-y-4 bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Username</label>
                    <input id="login-user" type="text" placeholder="Admin Username" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Secure Passcode</label>
                    <input id="login-pass" type="password" placeholder="Passcode" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold tracking-widest">
                </div>
                <button onclick="window.handleLogin()" class="w-full py-4 mt-2 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-transform flex justify-center items-center gap-2">
                    <i data-lucide="log-in" class="w-4 h-4"></i> Authenticate
                </button>
                <button onclick="window.setState({view: 'register'})" class="w-full text-slate-400 text-xs font-bold mt-4 hover:text-white transition-colors">
                    Register New Facility
                </button>
            </div>
        </div>
    `;
}

function RegisterView() {
    return `
        <div class="h-full bg-slate-900 flex flex-col justify-center p-8 animate-in overflow-y-auto relative">
            <button onclick="window.setState({view: 'login'})" class="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white z-10 hover:bg-white/20 transition-colors">
                <i data-lucide="arrow-left" class="w-6 h-6"></i>
            </button>
            <div class="mb-8 text-center mt-12">
                <h2 class="text-3xl font-black text-white">New Facility</h2>
                <p class="text-green-400 font-bold text-[10px] mt-2 uppercase tracking-widest">Real-time Cloud Storage</p>
            </div>
            <div class="space-y-4 bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Hospital Name *</label>
                    <input id="reg-name" type="text" placeholder="e.g. City Care Hospital" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Address *</label>
                    <input id="reg-address" type="text" placeholder="Full Address" value="${state.location.name !== 'Locating...' ? state.location.name : ''}" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Phone Number</label>
                    <input id="reg-phone" type="tel" placeholder="Hospital Phone Number" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold text-sm">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Latitude *</label>
                        <input id="reg-lat" type="number" step="any" placeholder="Lat" value="${state.location.lat}" class="w-full p-4 bg-slate-800 text-white rounded-2xl font-bold text-sm outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Longitude *</label>
                        <input id="reg-lng" type="number" step="any" placeholder="Lng" value="${state.location.lng}" class="w-full p-4 bg-slate-800 text-white rounded-2xl font-bold text-sm outline-none">
                    </div>
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Admin Username *</label>
                    <input id="reg-user" type="text" placeholder="Choose Username" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Admin Passcode *</label>
                    <input id="reg-pass" type="password" placeholder="Create Passcode" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold text-sm tracking-widest">
                </div>
                <div class="pt-4">
                    <button onclick="window.handleRegister()" class="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-transform flex justify-center items-center gap-2">
                        <i data-lucide="server" class="w-4 h-4"></i> Establish Connection
                    </button>
                </div>
            </div>
        </div>
    `;
}

function render() {
    const container = document.getElementById('app-container');
    
    if (state.loading) { 
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center bg-slate-950 absolute inset-0 z-[1000]">
                <div class="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-10 animate-bounce">
                    <i data-lucide="zap" class="text-white w-12 h-12 fill-current"></i>
                </div>
                <span class="text-[11px] font-black tracking-[0.6em] text-white uppercase animate-pulse">LIFELINE INDIA</span>
            </div>
        `; 
        lucide.createIcons(); 
        return; 
    }

    if (state.view === 'login') {
        container.innerHTML = LoginView();
    } else if (state.view === 'register') {
        container.innerHTML = RegisterView();
    } else if (state.view === 'admin') {
        container.innerHTML = AdminPanelView();
    } else {
        let content = '';
        if(state.activeTab === 'home') content = UserHomeView();
        else if(state.activeTab === 'map') content = `<div id="leaflet-map" class="w-full h-full z-10 flex-1 relative animate-in"></div>`;
        else if(state.activeTab === 'blood') content = BloodBankView();
        else if(state.activeTab === 'firstaid') content = FirstAidView();
        
        const tabs = [
            { id: 'home', icon: 'home' }, 
            { id: 'map', icon: 'map' }, 
            { id: 'triage', icon: 'zap', central: true }, 
            { id: 'blood', icon: 'droplet' }, 
            { id: 'firstaid', icon: 'info' }
        ];

        container.innerHTML = `
            ${Header()}
            <main class="flex-1 flex flex-col overflow-hidden relative bg-[#f8fafc]">
                ${content}
            </main>
            <nav class="fixed bottom-0 left-0 right-0 mx-auto w-full sm:max-w-[28rem] bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center p-4 pb-safe z-[200]">
                ${tabs.map(tab => {
                    if (tab.central) {
                        return `
                            <div onclick="window.setState({activeTab: 'home'}, true)" class="w-16 h-16 -mt-12 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl ring-8 ring-[#f8fafc] cursor-pointer active:scale-90 transition-transform">
                                <i data-lucide="zap" class="w-7 h-7 fill-white"></i>
                            </div>
                        `;
                    }
                    return `
                        <button onclick="window.setState({activeTab: '${tab.id}'}, true)" class="p-3 ${state.activeTab === tab.id ? 'text-blue-600 scale-110' : 'text-slate-300'} transition-all flex flex-col items-center gap-1 active:scale-90">
                            <i data-lucide="${tab.icon}" class="w-6 h-6"></i>
                        </button>
                    `;
                }).join('')}
            </nav>
            <button onclick="window.setState({isAiModal: true}, false); window.renderAIModal();" class="fab-btn w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl active:scale-90 transition-transform ring-4 ring-white/5">
                <i data-lucide="bot" class="w-8 h-8"></i>
            </button>
            <div id="ai-modal-root"></div>
            ${HospitalDetailPopup()}
        `;

        if(state.activeTab === 'map') setTimeout(window.initLeafletMap, 50);
        if(state.isAiModal) window.renderAIModal();
    }
    lucide.createIcons();
}

render();
window.addEventListener('load', initApp);