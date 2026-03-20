import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

const apiKey = "8612405284:AAGWNk4H6SD0d0aVmYTpw33dm_YVYtqgaZg"; 

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
    viewingHospitalDetail: null,
    adminUi: {
        activeDeptId: 'gen',
        selectedShift: 'Morning',
        isEditingAssets: false,
        searchQuery: ''
    }
};

window.state = state;

function t() { 
    return TRANSLATIONS[state.lang]; 
}

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
    },
    ta: {
        gridTitle: "அவசர கட்டம்", searchPlaceholder: "நோய் அல்லது அறிகுறியைத் தேடுங்கள்...", 
        searchTitle: "மருத்துவ உதவியைத் தேடுங்கள்", bloodUnits: "இரத்த அலகுகள்", realTimeStocks: "நேரடி இருப்பு", 
        firstAid: "முதலுதவி", emergencyGuides: "6 அவசர வழிகாட்டிகள்", matchedCenters: "பொருத்தமான மையங்கள்", 
        centersFound: "மையங்கள் கண்டறியப்பட்டன", beds: "படுக்கைகள்", icuBeds: "ICU படுக்கைகள்", ventilators: "வென்டிலேட்டர்கள்", 
        doctors: "மருத்துவர்கள்", staff: "ஊழியர்கள்", liveStatus: "நேரடி நிலை", panicSOS: "அவசர SOS", 
        call108: "108 அழைக்கவும்", bloodBank: "இரத்த வங்கி", inventoryNear: "அருகிலுள்ள இருப்பு", 
        emergencyAid: "அவசர உதவி", stepsFollow: "உதவி வரும் வரை பின்பற்றவும்", 
        aiTitle: "லைஃப்லைன் AI", aiSub: "நிபுணத்துவ மருத்துவ வழிகாட்டி", aiPlaceholder: "அறிகுறிகளை விளக்கவும் (உதாரணமாக நெஞ்சுவலி)...", 
        openMaps: "கூகுள் மேப்ஸைத் திற", consultation: "ஆலோசனை", standby: "தயார்நிலை"
    },
    te: {
        gridTitle: "అత్యవసర గ్రిడ్", searchPlaceholder: "వ్యాధి లేదా లక్షణాన్ని శోధించండి...", 
        searchTitle: "వైద్య సహాయం శోధించండి", bloodUnits: "రక్త యూనిట్లు", realTimeStocks: "లైవ్ స్టాక్", 
        firstAid: "ప్రథమ చికిత్స", emergencyGuides: "6 అత్యవసర మార్గదర్శకాలు", matchedCenters: "సరిపోలిన ఆసుపత్రులు", 
        centersFound: "కేంద్రాలు కనుగొనబడ్డాయి", beds: "పడకలు", icuBeds: "ICU పడకలు", ventilators: "వెంటిలేటర్లు", 
        doctors: "వైద్యులు", staff: "సిబ్బంది", liveStatus: "లైవ్ స్టేటస్", panicSOS: "అత్యవసర SOS", 
        call108: "108 కు కాల్ చేయండి", bloodBank: "బ్లడ్ బ్యాంక్", inventoryNear: "మీ దగ్గర ఉన్న స్టాక్", 
        emergencyAid: "అత్యవసర సహాయం", stepsFollow: "సహాయం వచ్చేవరకు వీటిని పాటించండి", 
        aiTitle: "లైఫ్‌లైన్ AI", aiSub: "నిపుణుల వైద్య సలహాదారు", aiPlaceholder: "లక్షణాలను వివరించండి (ఉదాహరణకు ఛాతీ నొప్పి)...", 
        openMaps: "గూగుల్ మ్యాప్స్ తెరవండి", consultation: "సంప్రదింపులు", standby: "సిద్ధంగా ఉన్నారు"
    }
};

const FIRST_AID_GUIDES = {
    en: [
        { id: 'cpr', title: 'CPR (Adult)', steps: ['Check scene safety', 'Call 108/Emergency', 'Push hard & fast in center of chest', 'Allow full chest recoil', 'Give rescue breaths'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'Choking / Heimlich', steps: ['Stand behind the person', 'Give 5 back blows', 'Give 5 abdominal thrusts', 'Repeat until object is out'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'Severe Bleeding', steps: ['Apply firm, direct pressure', 'Use clean cloth or bandage', 'Elevate the injured area', 'Do not remove blood-soaked bandages, add more on top'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'Major Burns', steps: ['Cool the burn under cool running water for 10-20 mins', 'Remove jewelry or tight items near burn', 'Cover with sterile, non-fluffy dressing', 'Do NOT apply ice or ointments'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'Heart Attack', steps: ['Have person sit down & rest', 'Loosen tight clothing', 'Ask if they take chest pain meds', 'If conscious, chew one adult Aspirin'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'Stroke (F.A.S.T.)', steps: ['F - Face drooping? Ask them to smile', 'A - Arm weakness? Ask them to raise both arms', 'S - Speech difficulty? Ask to repeat a simple sentence', 'T - Time to call 108 immediately'], color: 'bg-purple-500', icon: 'brain' }
    ],
    hi: [
        { id: 'cpr', title: 'CPR (वयस्क)', steps: ['जगह की सुरक्षा जांचें', '108 कॉल करें', 'छाती के बीच में जोर से दबाएं', 'छाती को वापस आने दें', 'सांस दें'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'दम घुटना (Heimlich)', steps: ['व्यक्ति के पीछे खड़े हों', 'पीठ पर 5 बार थपथपाएं', 'पेट पर 5 बार दबाव दें', 'वस्तु बाहर आने तक दोहराएं'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'गंभीर रक्तस्राव', steps: ['मजबूती से सीधा दबाव डालें', 'साफ कपड़े का प्रयोग करें', 'घायल हिस्से को ऊपर उठाएं', 'खून से सने कपड़े न हटाएं, उसके ऊपर और रखें'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'गंभीर रूप से जलना', steps: ['जले हुए हिस्से को 10-20 मिनट ठंडे पानी के नीचे रखें', 'जले हुए हिस्से के पास से गहने हटाएं', 'साफ पट्टी से ढकें', 'बर्फ या मलहम न लगाएं'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'दिल का दौरा', steps: ['व्यक्ति को बैठाएं और आराम कराएं', 'तंग कपड़े ढीले करें', 'दवा के बारे में पूछें', 'अगर होश में है, तो एक एस्पिरिन चबाने को दें'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'स्ट्रोक (F.A.S.T.)', steps: ['F - चेहरा लटकना? मुस्कुराने को कहें', 'A - बांहों कमजोरी? दोनों हाथ उठाने को कहें', 'S - बोलने में दिक्कत? साधारण वाक्य दोहराने को कहें', 'T - तुरंत 108 पर कॉल करने का समय'], color: 'bg-purple-500', icon: 'brain' }
    ],
    bn: [
        { id: 'cpr', title: 'সিপিআর (প্রাপ্তবয়স্ক)', steps: ['দৃশ্যের নিরাপত্তা পরীক্ষা করুন', '১০৮ কল করুন', 'বুকের মাঝখানে জোরে চাপ দিন', 'বুক স্বাভাবিক অবস্থায় আসতে দিন', 'মুখে মুখ দিয়ে শ্বাস দিন'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'দম বন্ধ হওয়া', steps: ['ব্যক্তির পিছনে দাঁড়ান', 'পিঠে ৫ বার চাপড় দিন', 'পেটে ৫ বার ধাক্কা দিন', 'বস্তুটি বের না হওয়া পর্যন্ত পুনরাবৃত্তি করুন'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'মারাত্মক রক্তপাত', steps: ['দৃঢ়ভাবে চাপ দিন', 'পরিষ্কার কাপড় ব্যবহার করুন', 'আহত অংশ উঁচু করে রাখুন', 'রক্তভেজা ব্যান্ডেজ সরাবেন না, উপরে আরও দিন'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'মারাত্মক পোড়া', steps: ['পোড়া অংশ ১০-২০ মিনিট ঠান্ডা জলে রাখুন', 'পোড়া জায়গার কাছাকাছি গয়না সরিয়ে ফেলুন', 'জীবাণুমুক্ত ড্রেসিং দিয়ে ঢেকে দিন', 'বরফ বা মলম লাগাবেন না'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'হার্ট অ্যাটাক', steps: ['ব্যক্তিকে বসিয়ে বিশ্রাম দিন', 'আঁটসাঁট পোশাক ঢিলা করুন', 'বুকে ব্যথার ওষুধ নেন কিনা জিজ্ঞাসা করুন', 'সচেতন থাকলে, একটি অ্যাসপিরিন চিবিয়ে খেতে দিন'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'স্ট্রোক (F.A.S.T.)', steps: ['F - মুখ ঝুলে পড়েছে? হাসতে বলুন', 'A - বাহুতে দুর্বলতা? উভয় হাত তুলতে বলুন', 'S - কথা বলতে অসুবিধা? একটি বাক্য পুনরাবৃত্তি করতে বলুন', 'T - অবিলম্বে ১০৮ এ কল করার সময়'], color: 'bg-purple-500', icon: 'brain' }
    ],
    ta: [
        { id: 'cpr', title: 'CPR (வயது வந்தோர்)', steps: ['இடத்தின் பாதுகாப்பை சரிபார்க்கவும்', '108 அழைக்கவும்', 'மார்பின் மையத்தில் கடினமாக அழுத்தவும்', 'மார்பு மீண்டும் வர அனுமதிக்கவும்', 'மூச்சு கொடுக்கவும்'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'மூச்சுத்திணறல்', steps: ['நபரின் பின்னால் நிற்கவும்', 'முதுகில் 5 முறை தட்டவும்', 'வயிற்றில் 5 முறை அழுத்தவும்', 'பொருள் வெளியே வரும் வரை மீண்டும் செய்யவும்'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'கடுமையான இரத்தப்போக்கு', steps: ['நேரடியாக அழுத்தவும்', 'சுத்தமான துணியைப் பயன்படுத்தவும்', 'காயமடைந்த பகுதியை உயர்த்தவும்', 'இரத்தம் படிந்த துணியை அகற்ற வேண்டாம், மேல் மேலும் வைக்கவும்'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'கடுமையான தீக்காயங்கள்', steps: ['10-20 நிமிடம் குளிர்ந்த நீரில் வைக்கவும்', 'நகைகளை அகற்றவும்', 'சுத்தமான துணியால் மூடவும்', 'பனிக்கட்டி அல்லது களிம்புகளைப் பயன்படுத்த வேண்டாம்'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'மாரடைப்பு', steps: ['அமர வைத்து ஓய்வு கொடுக்கவும்', 'இறுக்கமான ஆடைகளை தளர்த்தவும்', 'மருந்து பற்றி கேட்கவும்', 'ஒரு ஆஸ்பிரின் மெல்ல கொடுக்கவும்'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'பக்கவாதம் (F.A.S.T.)', steps: ['F - முகம் தொங்குகிறதா? சிரிக்க சொல்லுங்கள்', 'A - கை பலவீனம்? கைகளை தூக்க சொல்லுங்கள்', 'S - பேச்சு சிரமம்? வாக்கியத்தை திரும்ப சொல்லவும்', 'T - உடனடியாக 108 ஐ அழைக்கவும்'], color: 'bg-purple-500', icon: 'brain' }
    ],
    te: [
        { id: 'cpr', title: 'CPR (వయోజనులు)', steps: ['భద్రతను తనిఖీ చేయండి', '108 కు కాల్ చేయండి', 'ఛాతీ మధ్యలో గట్టిగా నొక్కండి', 'ఛాతీ తిరిగి పైకి రానివ్వండి', 'శ్వాస అందించండి'], color: 'bg-red-500', icon: 'heart-pulse' },
        { id: 'choking', title: 'ఉక్కిరిబిక్కిరి', steps: ['వ్యక్తి వెనుక నిలబడండి', 'వీపుపై 5 సార్లు తట్టండి', 'కడుపుపై 5 సార్లు నొక్కండి', 'వస్తువు బయటకు వచ్చేవరకు పునరావృతం చేయండి'], color: 'bg-orange-500', icon: 'wind' },
        { id: 'bleeding', title: 'తీవ్రమైన రక్తస్రావం', steps: ['గట్టిగా నొక్కండి', 'శుభ్రమైన వస్త్రాన్ని వాడండి', 'గాయపడిన భాగాన్ని పైకి ఎత్తండి', 'రక్తంతో తడిసిన బ్యాండేజీని తీసివేయకండి, పైన మరొకటి పెట్టండి'], color: 'bg-rose-600', icon: 'droplet' },
        { id: 'burns', title: 'తీవ్రమైన కాలిన గాయాలు', steps: ['10-20 నిమిషాలు చల్లటి నీటిలో ఉంచండి', 'ఆభరణాలను తీసివేయండి', 'శుభ్రమైన వస్త్రంతో కప్పండి', 'మంచు లేదా లేపనాలు పూయకండి'], color: 'bg-amber-500', icon: 'flame' },
        { id: 'heart', title: 'గుండెపోటు', steps: ['కూర్చోబెట్టి విశ్రాంతి ఇవ్వండి', 'బిగుతుగా ఉన్న దుస్తులను వదులు చేయండి', 'మందుల గురించి అడగండి', 'ఆస్పిరిన్ నమలనివ్వండి'], color: 'bg-red-600', icon: 'activity' },
        { id: 'stroke', title: 'స్ట్రోక్ (F.A.S.T.)', steps: ['F - ముఖం వాలిపోతుందా? నవ్వమని అడగండి', 'A - చేతుల్లో బలహీనత ఉందా? చేతులు పైకెత్తమనండి', 'S - మాట్లాడటం కష్టమా? వాక్యం రిపీట్ చేయమనండి', 'T - వెంటనే 108 కు కాల్ చేయండి'], color: 'bg-purple-500', icon: 'brain' }
    ]
};

const SMART_SEARCH_MAP = {
    'heart': 'cardiologist', 'dil': 'cardiologist', 'chest': 'cardiologist', 'attack': 'cardiologist',
    'head': 'neurologist', 'brain': 'neurologist', 'stroke': 'neurologist', 'sir': 'neurologist',
    'bone': 'orthopedic', 'fracture': 'orthopedic', 'haddi': 'orthopedic', 'accident': 'emergency specialist',
    'child': 'pediatrician', 'kid': 'pediatrician', 'baby': 'pediatrician', 'fever': 'general physician',
    'skin': 'dermatologist', 'burn': 'dermatologist', 'rash': 'dermatologist',
    'stomach': 'gastroenterologist', 'pet': 'gastroenterologist', 'vomit': 'gastroenterologist',
    'lungs': 'pulmonologist', 'lung': 'pulmonologist', 'breath': 'pulmonologist', 'asthma': 'pulmonologist',
    'women': 'gynecologist', 'pregnancy': 'gynecologist',
    'eye': 'ophthalmologist', 'vision': 'ophthalmologist',
    'emergency': 'emergency specialist'
};

window.showToast = function(msg) {
    const container = document.getElementById('app-container');
    if (!container) return;
    const id = 't' + Date.now();
    const toastHTML = `
        <div id="${id}" class="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-full font-black text-[10px] text-center uppercase tracking-widest shadow-2xl border border-slate-700 animate-in whitespace-nowrap">
            ${msg}
        </div>
    `;
    container.insertAdjacentHTML('beforeend', toastHTML);
    setTimeout(() => document.getElementById(id)?.remove(), 3500);
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
        const idx = merged.findIndex(h => h.id === fbH.id || normalize(h.name) === fbName);
        if (idx > -1) {
            merged[idx] = { ...merged[idx], ...fbH, isCloudSynced: true, id: fbH.id };
        } else {
            merged.push({ ...fbH, isCloudSynced: true });
        }
    });
    merged = merged.filter(h => h.distance <= 100);
    merged.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    state.hospitals = merged;
}

function listenToFirebase() {
    const hospitalsRef = collection(db, 'artifacts', appId, 'public', 'data', 'hospitals');
    onSnapshot(hospitalsRef, (snapshot) => {
        state.firebaseHospitals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        mergeHospitals();
        window.updateLiveDOM();
    });
}

async function initApp() {
    listenToFirebase();
    const fallbackTimer = setTimeout(() => {
        mergeHospitals();
        setState({ loading: false });
    }, 5000);
    try { 
        await signInAnonymously(auth); 
    } catch (e) {}
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        state.location = { lat: latitude, lng: longitude, granted: true, name: "GPS Active" };
        try {
            const osmQuery = `[out:json];node["amenity"="hospital"](around:100000,${latitude},${longitude});out body;`;
            const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(osmQuery)}`);
            const data = await res.json();
            const elements = data.elements.slice(0, 100); 
            state.osmHospitals = elements.map(h => {
                return {
                    id: h.id.toString(), 
                    name: h.tags.name || "Medical Center", 
                    lat: h.lat, 
                    lng: h.lon,
                    distance: calculateDistance(latitude, longitude, h.lat, h.lon),
                    beds: 0, 
                    icuBeds: 0, 
                    ventilators: 0, 
                    ambulances: 0,
                    cost: 0, 
                    specialty: "General",
                    blood: {}, 
                    medicines: {},
                    doctorsList: [],
                    phone: h.tags['contact:phone'] || h.tags.phone || '',
                    isAutoPilot: false,
                    isCloudSynced: false
                };
            });
            mergeHospitals();
            clearTimeout(fallbackTimer);
            setState({ loading: false });
        } catch (e) {
            clearTimeout(fallbackTimer);
            setState({ loading: false });
        }
    }, () => {
        clearTimeout(fallbackTimer);
        setState({ loading: false });
    }, { timeout: 5000, enableHighAccuracy: true });
}

window.updateLiveDOM = () => {
    if (state.view === 'user') {
        if (state.activeTab === 'home') {
            const el = document.getElementById('hlist');
            if(el) { el.innerHTML = window.renderList(); lucide.createIcons(); }
        } else if (state.activeTab === 'blood') {
            const el = document.getElementById('blood-list-container');
            if(el) { el.innerHTML = window.renderBloodList(); lucide.createIcons(); }
        } else if (state.activeTab === 'map') {
            if(window.updateMapMarkers) window.updateMapMarkers();
        }
        if (state.viewingHospitalDetail) {
            const popupContent = document.getElementById('popup-internal-content');
            if(popupContent) {
                popupContent.innerHTML = window.renderPopupInnerHtml();
                lucide.createIcons();
            }
        }
    } else if (state.view === 'admin') {
        const h = state.hospitals.find(x => x.id === state.adminHospitalId);
        if (h) {
            if (!state.adminUi.isEditingAssets) {
                const icuText = document.getElementById(`val-icuBeds`);
                if (icuText) icuText.innerText = `${h.icuBeds} / ${h.assetTotals?.icuBeds || 0}`;
                const ventText = document.getElementById(`val-ventilators`);
                if (ventText) ventText.innerText = `${h.ventilators} / ${h.assetTotals?.ventilators || 0}`;
            }
            const phoneInp = document.getElementById(`admin-phone-${h.id}`);
            if (phoneInp && document.activeElement !== phoneInp) phoneInp.value = h.phone || '';
            const bedsInp = document.getElementById(`admin-beds-${h.id}`);
            if (bedsInp && document.activeElement !== bedsInp) bedsInp.value = h.beds || 0;
            const ambInp = document.getElementById(`admin-amb-${h.id}`);
            if (ambInp && document.activeElement !== ambInp) ambInp.value = h.ambulances || 0;
            const staffActive = document.getElementById('stat-active-staff');
            if(staffActive && h.doctorsList) staffActive.innerText = h.doctorsList.filter(s => s.present).length;
            const icuUsage = document.getElementById('stat-icu-usage');
            if(icuUsage && h.assetTotals && h.assetTotals.icuBeds > 0) {
                icuUsage.innerText = `${Math.round((h.icuBeds / h.assetTotals.icuBeds) * 100)}%`;
            }
            const bloodBankList = document.getElementById('blood-bank-list');
            if(bloodBankList) {
                bloodBankList.innerHTML = Object.entries(h.blood || {}).map(([type, units]) => `
                    <div class="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span class="text-[10px] font-black text-slate-400">${type}</span>
                        <div class="flex items-center gap-2">
                            <button onclick="window.adjBloodAdmin('${type}', -1)" class="text-slate-300 hover:text-red-500 font-bold">-</button>
                            <span class="text-xs font-black ${units < 5 ? 'text-red-600 animate-pulse' : 'text-slate-700'}">${units}</span>
                            <button onclick="window.adjBloodAdmin('${type}', 1)" class="text-slate-300 hover:text-green-500 font-bold">+</button>
                        </div>
                    </div>
                `).join('');
            }
            window.renderDoctorGrid();
        }
    }
};

window.debounceTimer = null;
window.triggerAutoSave = (hId) => {
    clearTimeout(window.debounceTimer);
    window.debounceTimer = setTimeout(async () => {
        const h = state.hospitals.find(x => x.id === hId);
        if (h) {
            try {
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hospitals', h.id), h, { merge: true });
            } catch(e) {}
        }
    }, 1500); 
};

window.autoPilotInterval = null;
window.toggleAutoPilot = (hId) => {
    const h = state.hospitals.find(x => x.id === hId);
    if (!h) return;
    h.isAutoPilot = !h.isAutoPilot;
    if (h.isAutoPilot) {
        window.showToast("HIS Auto-Pilot Enabled");
        window.autoPilotInterval = setInterval(async () => {
            const currentH = state.hospitals.find(x => x.id === hId);
            if(!currentH || !currentH.isAutoPilot) {
                clearInterval(window.autoPilotInterval);
                return;
            }
            if(Math.random() > 0.5 && currentH.beds > 0) currentH.beds--;
            else if(Math.random() > 0.5 && currentH.beds < (currentH.assetTotals?.beds || 200)) currentH.beds++;
            if(Math.random() > 0.7 && currentH.icuBeds > 0) currentH.icuBeds--;
            else if(Math.random() > 0.7 && currentH.icuBeds < (currentH.assetTotals?.icuBeds || 50)) currentH.icuBeds++;
            const bloodTypes = Object.keys(currentH.blood || {});
            if(bloodTypes.length > 0) {
                const randBlood = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
                if(Math.random() > 0.5) currentH.blood[randBlood]++;
                else if(currentH.blood[randBlood] > 0) currentH.blood[randBlood]--;
            }
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hospitals', hId), currentH, { merge: true });
        }, 5000); 
    } else {
        clearInterval(window.autoPilotInterval);
        window.showToast("HIS Auto-Pilot Disabled");
    }
    render();
    window.triggerAutoSave(hId);
};

window.handleLogin = async () => {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    let admin = state.firebaseHospitals.find(a => a.adminUser === user && a.adminPass === pass);
    if (admin) {
        setState({ view: 'admin', adminHospitalId: admin.id });
        window.showToast("Cloud Connection Secured.");
        if(admin.isAutoPilot) window.toggleAutoPilot(admin.id); 
    } else {
        window.showToast("Invalid Credentials.");
    }
};

window.handleLogout = () => {
    if(window.autoPilotInterval) {
        clearInterval(window.autoPilotInterval);
    }
    const h = state.hospitals.find(h => h.id === state.adminHospitalId);
    if(h) {
        h.isAutoPilot = false;
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hospitals', h.id), h, { merge: true });
    }
    setState({view: 'user', adminHospitalId: null});
}

window.handleRegister = async () => {
    const name = document.getElementById('reg-name').value;
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    const address = document.getElementById('reg-address').value || state.location.name;
    const lat = parseFloat(document.getElementById('reg-lat').value) || state.location.lat;
    const lng = parseFloat(document.getElementById('reg-lng').value) || state.location.lng;
    const phoneInput = document.getElementById('reg-phone');
    const phone = phoneInput ? phoneInput.value : '';
    if(!name || !user || !pass) return window.showToast("Required fields missing");
    const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameQuery = normalize(name);
    const existingHospital = state.hospitals.find(h => normalize(h.name) === nameQuery);
    const targetId = existingHospital ? existingHospital.id : 'h-' + Date.now();
    const newHospital = {
        id: targetId, 
        name: existingHospital ? existingHospital.name : name, 
        address: address, 
        adminUser: user, 
        adminPass: pass, 
        lat: lat, 
        lng: lng, 
        distance: calculateDistance(state.location.lat, state.location.lng, lat, lng),
        beds: existingHospital ? existingHospital.beds : 50, 
        icuBeds: existingHospital ? existingHospital.icuBeds : 10, 
        ventilators: existingHospital ? existingHospital.ventilators : 5, 
        ambulances: existingHospital ? existingHospital.ambulances : 2,
        cost: existingHospital ? existingHospital.cost : 500, 
        specialty: existingHospital ? existingHospital.specialty : "Multispecialty",
        blood: existingHospital ? existingHospital.blood : { 'O+': 20, 'O-': 5, 'A+': 15, 'A-': 5, 'B+': 10, 'B-': 5, 'AB+': 5, 'AB-': 2 }, 
        medicines: existingHospital ? existingHospital.medicines : { "Oxygen Cylinders": 30 },
        doctorsList: existingHospital && existingHospital.doctorsList ? existingHospital.doctorsList : [{ id: Date.now(), name: `Dr. ${user}`, dept: 'gen', present: true, type: 'General Physician', shift: 'Morning', lastActive: 'Now', price: 500 }],
        phone: existingHospital && existingHospital.phone && !phone ? existingHospital.phone : phone || '',
        isAutoPilot: false,
        departments: [
            { id: 'cardio', name: 'Cardiology', icon: 'fa-heart-pulse' },
            { id: 'neuro', name: 'Neurology', icon: 'fa-brain' },
            { id: 'ortho', name: 'Orthopedics', icon: 'fa-bone' },
            { id: 'gen', name: 'General Medicine', icon: 'fa-stethoscope' }
        ],
        assetTotals: { beds: 50, icuBeds: 20, ventilators: 10 }
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
        window.showToast("Hospital Secured");
    } catch (e) {}
};

window.setActiveDept = (id) => {
    state.adminUi.activeDeptId = id;
    render();
}

window.adjResourceAdmin = (key, delta) => {
    const h = state.hospitals.find(x => x.id === state.adminHospitalId);
    if (!h) return;
    if(!h.assetTotals) h.assetTotals = {icuBeds: 20, ventilators: 10};
    if(key === 'icuBeds') {
        h.icuBeds = Math.max(0, Math.min(h.assetTotals.icuBeds, h.icuBeds + delta));
    } else if(key === 'ventilators') {
        h.ventilators = Math.max(0, Math.min(h.assetTotals.ventilators, h.ventilators + delta));
    }
    window.triggerAutoSave(h.id);
    render();
}

window.setCapacity = (key, val) => {
    const h = state.hospitals.find(x => x.id === state.adminHospitalId);
    if (!h) return;
    const num = parseInt(val) || 0;
    if(!h.assetTotals) h.assetTotals = {icuBeds: 20, ventilators: 10};
    h.assetTotals[key] = num;
    if(key === 'icuBeds') h.icuBeds = Math.min(h.icuBeds, num);
    if(key === 'ventilators') h.ventilators = Math.min(h.ventilators, num);
    window.triggerAutoSave(h.id);
    render();
}

window.toggleAssetEdit = () => {
    state.adminUi.isEditingAssets = !state.adminUi.isEditingAssets;
    render();
}

window.adjBloodAdmin = (type, delta) => {
    const h = state.hospitals.find(x => x.id === state.adminHospitalId);
    if (!h) return;
    if(!h.blood) h.blood = {};
    h.blood[type] = Math.max(0, (h.blood[type] || 0) + delta);
    window.triggerAutoSave(h.id);
    window.updateLiveDOM();
}

window.toggleStaffPresence = (staffId) => {
    const h = state.hospitals.find(x => x.id === state.adminHospitalId);
    if (!h || !h.doctorsList) return;
    const doc = h.doctorsList.find(d => d.id === staffId);
    if (doc) {
        doc.present = !doc.present;
        doc.lastActive = 'Now';
        window.triggerAutoSave(h.id);
        window.renderDoctorGrid();
        window.updateLiveDOM(); 
    }
}

window.removeStaff = (staffId) => {
    const h = state.hospitals.find(x => x.id === state.adminHospitalId);
    if (!h || !h.doctorsList) return;
    h.doctorsList = h.doctorsList.filter(d => d.id !== staffId);
    window.triggerAutoSave(h.id);
    window.renderDoctorGrid();
    window.updateLiveDOM();
}

window.toggleModal = (id, show) => {
    const modal = document.getElementById(id);
    if(modal) {
        if(show) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (id === 'staff-modal') {
                const h = state.hospitals.find(x => x.id === state.adminHospitalId);
                const dept = h?.departments?.find(d => d.id === state.adminUi.activeDeptId);
                const contextEl = document.getElementById('modal-dept-context');
                if(contextEl) contextEl.innerText = `Assigning to ${dept?.name || 'Unit'}`;
                const inp = document.getElementById('new-staff-name');
                if(inp) { inp.value = ''; inp.focus(); }
            }
            if (id === 'dept-modal') {
                const inp = document.getElementById('new-dept-name');
                if(inp) { inp.value = ''; inp.focus(); }
            }
        } else {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }
}

window.selectShift = (btn, shiftName) => {
    document.querySelectorAll('.shift-btn').forEach(b => {
        b.className = 'shift-btn p-3 rounded-xl border text-xs font-bold transition-all bg-white text-slate-600 border-slate-200';
    });
    btn.className = 'shift-btn p-3 rounded-xl border text-xs font-bold transition-all bg-emerald-600 text-white border-emerald-600';
    state.adminUi.selectedShift = shiftName;
}

window.addStaff = () => {
    const h = state.hospitals.find(x => x.id === state.adminHospitalId);
    if (!h) return;
    const nameInput = document.getElementById('new-staff-name');
    const name = nameInput.value.trim();
    if (!name) return;

    if(!h.doctorsList) h.doctorsList = [];
    const deptObj = (h.departments || []).find(d => d.id === state.adminUi.activeDeptId);
    
    h.doctorsList.push({
        id: Date.now(),
        name: name,
        dept: state.adminUi.activeDeptId,
        type: deptObj ? deptObj.name : 'Specialist',
        price: 500,
        present: true,
        shift: state.adminUi.selectedShift,
        lastActive: 'Joined Now'
    });

    window.triggerAutoSave(h.id);
    window.toggleModal('staff-modal', false);
    render(); 
}

window.addDepartment = () => {
    const h = state.hospitals.find(x => x.id === state.adminHospitalId);
    if (!h) return;
    const nameInput = document.getElementById('new-dept-name');
    const name = nameInput.value.trim();
    if (!name) return;

    const id = name.toLowerCase().replace(/\s+/g, '-');
    if(!h.departments) h.departments = [];
    h.departments.push({
        id: id,
        name: name,
        icon: 'fa-microscope'
    });

    state.adminUi.activeDeptId = id;
    window.triggerAutoSave(h.id);
    window.toggleModal('dept-modal', false);
    render();
}

window.updateDoctorPrice = (hId, docId, val) => {
    const h = state.hospitals.find(x => x.id === hId);
    if (h && h.doctorsList) {
        const doc = h.doctorsList.find(d => d.id === docId);
        if(doc) {
            doc.price = parseInt(val) || 0;
            window.triggerAutoSave(hId);
        }
    }
}

window.renderDoctorGrid = () => {
    const h = state.hospitals.find(x => x.id === state.adminHospitalId);
    if (!h) return;
    const grid = document.getElementById('doctor-grid');
    if(!grid) return;
    
    const searchInp = document.getElementById('staff-search');
    const search = searchInp ? searchInp.value.toLowerCase() : '';
    
    const filtered = (h.doctorsList || []).filter(doc => 
        doc.dept === state.adminUi.activeDeptId && 
        doc.name.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 bg-white border border-dashed border-slate-200 rounded-[3rem]">
                <i class="fa-solid fa-user-doctor text-5xl mb-4 opacity-10"></i>
                <p class="font-bold">No unit staff detected</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(doc => `
        <div onclick="window.toggleStaffPresence(${doc.id})" class="group relative cursor-pointer p-6 rounded-[2.5rem] border transition-all duration-300 hover:shadow-xl ${doc.present ? 'bg-white border-green-100' : 'bg-slate-100 border-slate-200 opacity-60 grayscale shadow-inner'}">
            <button onclick="event.stopPropagation(); window.removeStaff(${doc.id})" class="absolute top-5 right-5 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
            <div class="flex justify-between items-start mb-6">
                <div class="p-4 rounded-2xl ${doc.present ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-400'}">
                    <i class="fa-solid fa-user-doctor text-2xl"></i>
                </div>
                <div class="text-right">
                    <div class="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-2 ${doc.present ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}">
                        ${doc.present ? 'Active' : 'Standby'}
                    </div>
                    <p class="text-[9px] text-slate-400 font-bold">L-SYNC: ${doc.lastActive || 'Now'}</p>
                </div>
            </div>
            <h3 class="font-extrabold text-lg text-slate-800 leading-tight mb-1">${doc.name}</h3>
            <p class="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-5">${doc.shift || 'General'} Duty</p>
            <div class="flex items-center justify-between pt-4 border-t border-slate-50" onclick="event.stopPropagation()">
                <span class="text-xs font-bold text-slate-500">Consultation Fee</span>
                <div class="flex items-center gap-1">
                    <span class="text-xs font-bold text-slate-400">₹</span>
                    <input type="number" value="${doc.price || 0}" onchange="window.updateDoctorPrice('${h.id}', ${doc.id}, this.value)" class="w-16 p-1 bg-slate-50 rounded border border-slate-200 text-xs font-bold text-slate-800 text-center focus:outline-none">
                </div>
            </div>
        </div>
    `).join('');
}

window.handleAdminPublish = async () => {
    const h = state.hospitals.find(h => h.id === state.adminHospitalId);
    if (!h) return;
    try {
        window.showToast("Syncing Live Updates...");
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hospitals', h.id), h, { merge: true });
        window.showToast("Live Updates Uploaded");
    } catch(e) {}
};

window.updateHospitalString = (hId, key, val) => {
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
    const userHtml = `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,1)] animate-pulse"></div>`;
    const userIcon = L.divIcon({className: '', html: userHtml, iconSize: [16, 16], iconAnchor: [8,8]});
    L.marker([state.location.lat, state.location.lng], {icon: userIcon, zIndexOffset: 1000})
        .addTo(window.mapInstance)
        .bindPopup('<b>Your Location</b>');
    window.hospLayer = L.layerGroup().addTo(window.mapInstance);
    window.updateMapMarkers();
    
    const activeAmbulances = state.hospitals.reduce((acc, h) => acc + (h.ambulances || 0), 0) || 3;
    const ambHtml = `<div class="w-6 h-6 bg-white rounded-full border-2 border-blue-600 shadow-[0_0_10px_rgba(255,255,255,1)] flex items-center justify-center text-[10px] amb-marker">🚑</div>`;
    const ambIcon = L.divIcon({className: '', html: ambHtml, iconSize: [24, 24], iconAnchor: [12,12]});
    
    if(window.ambMapInterval) clearInterval(window.ambMapInterval);
    
    let ambs = [];
    for(let i=0; i < Math.min(activeAmbulances, 10); i++) {
        const offsetLat = (Math.random() - 0.5) * 0.02;
        const offsetLng = (Math.random() - 0.5) * 0.02;
        const m = L.marker([state.location.lat + offsetLat, state.location.lng + offsetLng], {icon: ambIcon}).addTo(window.mapInstance);
        m.bindPopup(`
            <div class="p-1 min-w-[140px]">
                <div class="text-xs font-black text-blue-900">Emergency Response</div>
                <div class="text-[11px] font-black text-green-600 mt-2">Call 108</div>
            </div>
        `);
        ambs.push({ marker: m, angle: Math.random() * Math.PI * 2, radius: 0.005 + Math.random() * 0.01 });
    }

    window.ambMapInterval = setInterval(() => {
        ambs.forEach(a => {
            a.angle += 0.02;
            a.marker.setLatLng([
                state.location.lat + Math.sin(a.angle) * a.radius, 
                state.location.lng + Math.cos(a.angle) * a.radius
            ]);
        });
    }, 1000);
};

window.updateMapMarkers = () => {
    if(!window.mapInstance || !window.hospLayer) return;
    window.hospLayer.clearLayers();
    const hospHtml = `<div class="w-8 h-8 bg-red-600 rounded-xl border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">H</div>`;
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

window.handleNavigation = (hId) => {
    const h = state.hospitals.find(x => x.id === hId);
    if (!h) return;
    const destLat = parseFloat(h.lat);
    const destLng = parseFloat(h.lng);
    if (isNaN(destLat) || isNaN(destLng)) return window.showToast("Invalid coordinates.");
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

function Header() {
    const langs = ['en', 'hi', 'bn', 'ta', 'te'];
    const nextLang = langs[(langs.indexOf(state.lang) + 1) % langs.length];
    return `
        <header class="bg-white/95 backdrop-blur-xl p-4 pt-safe flex justify-between items-center z-[100] border-b border-slate-100 flex-shrink-0">
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
                <button onclick="window.setState({lang: '${nextLang}'})" class="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-600 active:scale-95 transition-transform flex items-center gap-1">
                    <i data-lucide="globe" class="w-3 h-3"></i> ${state.lang.toUpperCase()}
                </button>
                <button onclick="window.setState({view: 'login'})" class="p-2 bg-slate-900 rounded-xl text-white active:scale-95 transition-all shadow-lg flex items-center gap-1">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                </button>
            </div>
        </header>
    `;
}

window.renderList = () => {
    let query = (state.searchQuery || '').toLowerCase().trim();
    let mappedQuery = query;
    for (let key in SMART_SEARCH_MAP) {
        if (query.includes(key)) { mappedQuery = SMART_SEARCH_MAP[key]; break; }
    }
    const filtered = state.hospitals.filter(h => {
        if (!query) return true;
        const nameMatch = (h.name || '').toLowerCase().includes(query);
        const specMatch = (h.specialty || '').toLowerCase().includes(query) || (h.specialty || '').toLowerCase().includes(mappedQuery);
        const docMatch = (h.doctorsList || []).some(d => (d.type || '').toLowerCase().includes(query) || (d.type || '').toLowerCase().includes(mappedQuery) || (d.name || '').toLowerCase().includes(query));
        return nameMatch || specMatch || docMatch;
    });
    let html = `
        <div class="flex justify-between items-center px-1">
            <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${t().matchedCenters}</h3>
            <span class="text-[10px] font-bold text-blue-600">${filtered.length} ${t().centersFound}</span>
        </div>
    `;
    if (filtered.length === 0) {
        html += `<div class="p-6 text-center text-slate-400 font-bold bg-white rounded-[2rem] border border-slate-100 shadow-sm">No centers found matching criteria.</div>`;
    }
    html += filtered.map(h => `
        <div onclick="window.setState({viewingHospitalDetail: '${h.id}'}, true)" class="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden active:scale-95 transition-all cursor-pointer">
            ${h.isCloudSynced ? `<div class="absolute top-0 right-0 bg-blue-500 text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-md">Live Verified</div>` : ''}
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 ${h.isCloudSynced ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'} rounded-2xl flex items-center justify-center">
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
                <span class="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase">${h.ambulances || 0} AMB</span>
            </div>
        </div>
    `).join('');
    return html;
};

function UserHomeView() {
    return `
        <div class="p-4 space-y-6 pb-24 overflow-y-auto flex-1 hide-scrollbar">
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
            <div class="grid grid-cols-4 gap-2">
                ${Object.entries(h.blood||{'O+':0,'O-':0,'A+':0,'A-':0,'B+':0,'B-':0,'AB+':0,'AB-':0}).map(([type,q])=>`
                    <div class="p-2 bg-slate-50 rounded-xl text-center border border-slate-100">
                        <p class="text-[10px] font-black text-slate-800">${type}</p>
                        <p class="text-[9px] font-bold ${q>0 && h.isCloudSynced ? 'text-green-600' : 'text-slate-400'}">${q}u</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
};

function BloodBankView() {
    return `
        <div class="p-4 pb-24 animate-in flex-1 overflow-y-auto hide-scrollbar space-y-4">
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
        <div class="p-4 pb-24 animate-in flex-1 overflow-y-auto hide-scrollbar space-y-4">
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
    const docs = (h.doctorsList || []).filter(d => d.present);
    
    return `
        <div class="p-6 ${h.isCloudSynced ? 'bg-blue-600' : 'bg-slate-800'} text-white relative">
            <button onclick="window.setState({viewingHospitalDetail: null}, true)" class="absolute right-6 top-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <div class="flex items-center gap-2 mb-2">
                ${h.isCloudSynced 
                    ? `<span class="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-white/20 rounded-md live-badge">Live Sync</span>`
                    : `<span class="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-white/20 rounded-md text-slate-300">Unverified Facility</span>`
                }
            </div>
            <h2 class="text-2xl font-black leading-tight mb-1">${h.name || 'Hospital Details'}</h2>
            <p class="text-sm font-medium opacity-90 flex items-center gap-1">
                <i data-lucide="map-pin" class="w-3 h-3"></i> ${(h.distance || 0).toFixed(2)} km away
            </p>
            <p class="text-[10px] font-medium opacity-80 mt-1 flex items-start gap-1">
                <i data-lucide="map" class="w-3 h-3 mt-0.5 shrink-0"></i> ${h.address || 'Address details not available'}
            </p>
        </div>
        <div class="p-6 space-y-6">
            
            <div class="mt-2 space-y-4">
                <div>
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Emergency Contact</h4>
                    <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span class="text-xs font-bold text-slate-700">Hospital Desk</span>
                        <span class="text-xs font-black ${h.phone ? 'text-blue-600' : 'text-slate-400'}">${h.phone || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-4 gap-2">
                <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-black text-blue-600">${h.beds || 0}</span>
                    <span class="text-[8px] font-black uppercase text-slate-400 mt-1">${t().beds}</span>
                </div>
                <div class="p-3 bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-black text-red-600">${h.icuBeds || 0}</span>
                    <span class="text-[8px] font-black uppercase text-slate-400 mt-1">${t().icuBeds}</span>
                </div>
                <div class="p-3 bg-teal-50 rounded-2xl border border-teal-100 flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-black text-teal-600">${h.ventilators || 0}</span>
                    <span class="text-[8px] font-black uppercase text-slate-400 mt-1">${t().ventilators}</span>
                </div>
                <div class="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-black text-amber-600">${h.ambulances || 0}</span>
                    <span class="text-[8px] font-black uppercase text-slate-400 mt-1">Ambulance</span>
                </div>
            </div>

            <div class="mt-6">
                <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <i data-lucide="stethoscope" class="w-3 h-3"></i> Available Doctors
                </h4>
                <div class="space-y-2">
                    ${docs.length > 0 ? docs.map(d => `
                        <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p class="text-xs font-bold text-slate-800">${d.name}</p>
                                <p class="text-[9px] font-bold text-slate-400">${d.type || 'Specialist'}</p>
                            </div>
                            <span class="text-xs font-black text-green-600">₹${d.price}</span>
                        </div>
                    `).join('') : `
                        <div class="p-4 text-center border border-dashed border-slate-200 rounded-xl">
                            <p class="text-xs font-bold text-slate-400">No active doctors found.</p>
                        </div>
                    `}
                </div>
            </div>

            <div class="space-y-4">
                <div>
                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">${t().bloodBank}</h4>
                    <div class="grid grid-cols-4 gap-2">
                        ${Object.entries(h.blood || {'O+':0,'O-':0,'A+':0,'A-':0,'B+':0,'B-':0,'AB+':0,'AB-':0}).map(([type, qty]) => `
                            <div class="p-2 bg-slate-50 rounded-xl text-center border border-slate-100">
                                <p class="text-[10px] font-black text-slate-800">${type}</p>
                                <p class="text-[9px] font-bold ${qty > 0 && h.isCloudSynced ? 'text-green-600' : 'text-slate-400'}">${qty}u</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="flex gap-3 pt-4 pb-safe">
                <a href="tel:${h.phone || '108'}" class="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-center text-sm uppercase active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-red-500/30">
                    <i data-lucide="phone" class="w-4 h-4"></i> Call
                </a>
                <button onclick="window.handleNavigation('${h.id}')" class="flex-[1.5] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
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
        window.showToast("API Key Missing.");
        return;
    }
    if (!text.trim()) return;
    
    const msgs = [...state.aiMessages, { role: 'user', text }];
    setState({ aiMessages: msgs, isAiThinking: true }, false);
    window.renderAIModal();

    const topHospitals = state.hospitals.slice(0, 3).map(h => `${h.name} (${h.beds} beds)`).join(', ');
    const langNames = {en: 'English', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu'};
    const currentLang = langNames[state.lang] || 'English';

    const sysPrompt = `
        You are Lifeline AI, an advanced, empathetic, and highly capable medical support and triage assistant for India. 
        Your primary goal is to provide immediate, actionable first-aid advice, assess symptom severity, and guide patients to the nearest appropriate medical facility.
        1. Always maintain a professional, calm, and highly detailed medical tone.
        2. If symptoms indicate a severe life-threatening emergency, immediately instruct them to CALL 108.
        3. You have access to their live location and nearby hospitals. User Location: ${state.location.name}. 
        Top hospitals nearby based on live data: ${topHospitals}.
        4. Respond entirely and fluently in ${currentLang}.
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
        const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "Call 108 immediately.";
        state.aiMessages = [...msgs, { role: 'ai', text: aiText }];
        state.isAiThinking = false;
        window.renderAIModal();
    } catch (e) {
        state.aiMessages = [...msgs, { role: 'ai', text: "Connection error. Please call 108 directly." }];
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
        <div class="flex flex-col md:flex-row min-h-[100dvh] w-full bg-slate-50 animate-in relative">
            <aside class="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col shrink-0 overflow-y-auto custom-scrollbar md:h-[100dvh]">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-emerald-600 rounded-lg text-white shadow-lg shadow-emerald-200">
                            <i class="fa-solid fa-wave-square"></i>
                        </div>
                        <div>
                            <h1 class="text-xl font-extrabold tracking-tight text-slate-800 uppercase italic leading-none">Command</h1>
                            <p class="text-[10px] text-slate-400 font-mono mt-1 w-[130px] truncate" id="sync-time">${h.name}</p>
                        </div>
                    </div>
                    <button onclick="window.handleLogout()" class="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                        <i class="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>

                <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl shadow-sm flex justify-between items-center mb-6">
                    <div>
                        <h3 class="font-black text-indigo-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <i class="fa-solid fa-robot text-indigo-600"></i> Auto-Pilot
                        </h3>
                    </div>
                    <button onclick="window.toggleAutoPilot('${h.id}')" class="w-12 h-6 rounded-full transition-colors relative shadow-inner ${h.isAutoPilot ? 'bg-indigo-600' : 'bg-slate-300'}">
                        <div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-md ${h.isAutoPilot ? 'left-7' : 'left-1'}"></div>
                    </button>
                </div>

                <div class="space-y-1 mb-8">
                    <div class="flex items-center justify-between mb-3 px-2">
                        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Depts</p>
                        <button onclick="window.toggleModal('dept-modal', true)" class="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                            <i class="fa-solid fa-plus text-sm"></i>
                        </button>
                    </div>
                    <div id="dept-list" class="space-y-1">
                        ${(h.departments || []).map(dept => {
                            const count = (h.doctorsList || []).filter(d => d.dept === dept.id && d.present).length;
                            const isActive = state.adminUi.activeDeptId === dept.id;
                            return `
                                <button onclick="window.setActiveDept('${dept.id}')" class="w-full flex items-center justify-between p-3 rounded-xl transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'hover:bg-slate-50 text-slate-600'}">
                                    <div class="flex items-center gap-3">
                                        <i class="fa-solid ${dept.icon} text-sm ${isActive ? 'text-emerald-600' : 'text-slate-400'}"></i>
                                        <span class="font-bold text-sm tracking-tight">${dept.name}</span>
                                    </div>
                                    <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${count === 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}">
                                        ${count}
                                    </span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="space-y-4 pt-6 border-t border-slate-100">
                    <div class="flex items-center justify-between px-2">
                        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Assets</p>
                        <button onclick="window.toggleAssetEdit()" id="edit-assets-btn" class="p-1 ${state.adminUi.isEditingAssets ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-100'} rounded-md transition-colors">
                            <i class="fa-solid fa-sliders text-sm"></i>
                        </button>
                    </div>
                    
                    <div class="p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                        <div class="space-y-4" id="resource-container">
                            ${[
                                { id: 'icuBeds', label: 'ICU BEDS', icon: 'fa-bed-pulse', color: 'blue', current: h.icuBeds, total: h.assetTotals?.icuBeds || 0 },
                                { id: 'ventilators', label: 'VENTILATORS', icon: 'fa-wind', color: 'cyan', current: h.ventilators, total: h.assetTotals?.ventilators || 0 }
                            ].map(item => {
                                const pct = item.total > 0 ? (item.current / item.total) * 100 : 0;
                                const isCritical = item.current < (item.id === 'icuBeds' ? 5 : 3);
                                return `
                                    <div>
                                        <div class="flex justify-between text-[11px] mb-1.5 font-bold tracking-tight">
                                            <span class="flex items-center gap-2 text-${item.color}-400">
                                                <i class="fa-solid ${item.icon}"></i> ${item.label}
                                            </span>
                                            ${state.adminUi.isEditingAssets ? `
                                                <div class="flex items-center gap-1">
                                                    <span class="text-[8px] text-slate-500 uppercase">Max:</span>
                                                    <input type="number" value="${item.total}" onchange="window.setCapacity('${item.id}', this.value)" class="bg-slate-800 text-white w-10 text-center rounded text-[10px] border border-slate-700 outline-none">
                                                </div>
                                            ` : `
                                                <span id="val-${item.id}" class="${isCritical ? 'text-red-400 animate-pulse' : 'text-slate-400'}">${item.current} / ${item.total}</span>
                                            `}
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <div class="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div class="h-full bg-${isCritical ? 'red' : item.color}-500 transition-all duration-500" style="width: ${pct}%"></div>
                                            </div>
                                            ${!state.adminUi.isEditingAssets ? `
                                                <div class="flex gap-1.5">
                                                    <button onclick="window.adjResourceAdmin('${item.id}', -1)" class="text-slate-500 hover:text-red-400 transition-colors"><i class="fa-solid fa-circle-minus"></i></button>
                                                    <button onclick="window.adjResourceAdmin('${item.id}', 1)" class="text-slate-500 hover:text-green-400 transition-colors"><i class="fa-solid fa-circle-plus"></i></button>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="bg-white border border-slate-200 rounded-2xl p-4">
                        <div class="flex items-center gap-2 mb-4">
                            <i class="fa-solid fa-droplet text-red-500 text-xs"></i>
                            <span class="text-xs font-bold text-slate-800">Blood Bank</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2" id="blood-bank-list">
                            ${Object.entries(h.blood || {}).map(([type, units]) => `
                                <div class="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                                    <span class="text-[10px] font-black text-slate-400">${type}</span>
                                    <div class="flex items-center gap-2">
                                        <button onclick="window.adjBloodAdmin('${type}', -1)" class="text-slate-300 hover:text-red-500 font-bold">-</button>
                                        <span class="text-xs font-black ${units < 5 ? 'text-red-600 animate-pulse' : 'text-slate-700'}">${units}</span>
                                        <button onclick="window.adjBloodAdmin('${type}', 1)" class="text-slate-300 hover:text-green-500 font-bold">+</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </aside>

            <main class="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar bg-slate-50 md:h-[100dvh]">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                        <div class="flex justify-between items-start mb-2 text-slate-400">
                            <i class="fa-solid fa-phone text-lg"></i>
                            <span class="text-[8px] font-bold tracking-widest uppercase">Contact</span>
                        </div>
                        <input id="admin-phone-${h.id}" type="tel" value="${h.phone || ''}" oninput="window.updateHospitalString('${h.id}', 'phone', this.value)" class="text-sm font-extrabold w-full bg-transparent outline-none text-slate-800 border-b border-dashed border-slate-200 pb-1" placeholder="Add Phone">
                    </div>
                    <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                        <div class="flex justify-between items-start mb-2 text-blue-500">
                            <i class="fa-solid fa-bed text-lg"></i>
                            <span class="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Gen Ward</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <input id="admin-beds-${h.id}" type="number" value="${h.beds}" oninput="window.updateHospitalStat('${h.id}', 'beds', this.value)" class="text-2xl font-extrabold w-16 bg-transparent outline-none text-slate-800">
                            <span class="text-[10px] text-slate-400 uppercase font-bold">Beds</span>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                        <div class="flex justify-between items-start mb-2 text-amber-500">
                            <i class="fa-solid fa-truck-medical text-lg"></i>
                            <span class="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Emergency</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <input id="admin-amb-${h.id}" type="number" value="${h.ambulances || 0}" oninput="window.updateHospitalStat('${h.id}', 'ambulances', this.value)" class="text-2xl font-extrabold w-16 bg-transparent outline-none text-slate-800">
                            <span class="text-[10px] text-slate-400 uppercase font-bold">Ambulance</span>
                        </div>
                    </div>
                    <div class="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                        <div class="flex justify-between items-start mb-3 text-red-500">
                            <i class="fa-solid fa-heart-pulse text-xl"></i>
                            <span class="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Capacity</span>
                        </div>
                        <p class="text-2xl font-extrabold" id="stat-icu-usage">${h.assetTotals && h.assetTotals.icuBeds > 0 ? Math.round((h.icuBeds / h.assetTotals.icuBeds) * 100) : 0}%</p>
                        <p class="text-[10px] text-slate-400 uppercase font-bold mt-1">ICU Occupancy</p>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div class="flex items-center gap-4">
                        <h2 class="text-3xl font-extrabold tracking-tight" id="active-dept-title">${(h.departments || []).find(d => d.id === state.adminUi.activeDeptId)?.name || 'Unit'}</h2>
                        <div class="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                            <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span class="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Live Roster</span>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                        <div class="relative grow md:grow-0">
                            <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                            <input type="text" id="staff-search" oninput="window.renderDoctorGrid()" placeholder="Search staff..." class="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64 text-sm shadow-sm">
                        </div>
                        <button onclick="window.toggleModal('staff-modal', true)" class="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 text-sm shrink-0">
                            <i class="fa-solid fa-user-plus"></i>
                            <span>Add Personnel</span>
                        </button>
                    </div>
                </div>

                <div id="doctor-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pb-20"></div>
            </main>
        </div>

        <div id="staff-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] items-center justify-center p-4">
            <div class="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20 modal-enter" onclick="event.stopPropagation()">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30">
                    <div>
                        <h3 class="text-xl font-bold">Onboard Staff</h3>
                        <p class="text-xs text-slate-400 font-medium" id="modal-dept-context">Assigning to Unit</p>
                    </div>
                    <button onclick="window.toggleModal('staff-modal', false)" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                <div class="p-8 space-y-6">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Full Name</label>
                        <input id="new-staff-name" type="text" placeholder="Dr. Jane Smith" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Shift Assignment</label>
                        <div class="grid grid-cols-2 gap-2" id="shift-selector">
                            <button onclick="window.selectShift(this, 'Morning')" class="shift-btn p-3 rounded-xl border text-xs font-bold transition-all bg-emerald-600 text-white border-emerald-600">Morning</button>
                            <button onclick="window.selectShift(this, 'Afternoon')" class="shift-btn p-3 rounded-xl border text-xs font-bold transition-all bg-white text-slate-600 border-slate-200">Afternoon</button>
                            <button onclick="window.selectShift(this, 'Evening')" class="shift-btn p-3 rounded-xl border text-xs font-bold transition-all bg-white text-slate-600 border-slate-200">Evening</button>
                            <button onclick="window.selectShift(this, 'Night')" class="shift-btn p-3 rounded-xl border text-xs font-bold transition-all bg-white text-slate-600 border-slate-200">Night</button>
                        </div>
                    </div>
                    <div class="pt-4 flex gap-3">
                        <button onclick="window.toggleModal('staff-modal', false)" class="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                        <button onclick="window.addStaff()" class="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs">Authorize</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="dept-modal" class="hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] items-center justify-center p-4">
            <div class="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/20 modal-enter" onclick="event.stopPropagation()">
                <div class="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-50/30">
                    <div>
                        <h3 class="text-xl font-bold">New Department</h3>
                        <p class="text-xs text-slate-400 font-medium">Expand Capability</p>
                    </div>
                    <button onclick="window.toggleModal('dept-modal', false)" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                <div class="p-8 space-y-6">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Unit Name</label>
                        <input id="new-dept-name" type="text" placeholder="e.g. Oncology" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold">
                    </div>
                    <div class="pt-4 flex gap-3">
                        <button onclick="window.toggleModal('dept-modal', false)" class="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                        <button onclick="window.addDepartment()" class="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 uppercase tracking-widest text-xs">Create Unit</button>
                    </div>
                </div>
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
        <div class="h-full bg-slate-900 flex flex-col justify-center p-8 animate-in overflow-y-auto relative custom-scrollbar">
            <button onclick="window.setState({view: 'login'})" class="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white z-10 hover:bg-white/20 transition-colors">
                <i data-lucide="arrow-left" class="w-6 h-6"></i>
            </button>
            <div class="mb-8 text-center mt-24 sm:mt-12">
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
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Hospital Phone Number</label>
                    <input id="reg-phone" type="tel" placeholder="e.g. +91-9876543210" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold text-sm">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Admin Username *</label>
                        <input id="reg-user" type="text" placeholder="Choose Username" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold text-sm">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Admin Passcode *</label>
                        <input id="reg-pass" type="password" placeholder="Create Passcode" class="w-full p-4 bg-slate-800 text-white rounded-2xl outline-none font-bold text-sm tracking-widest">
                    </div>
                </div>
                <div class="pt-4 pb-12">
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
    if(!container) return;
    
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
        window.renderDoctorGrid();
    } else {
        let content = '';
        if(state.activeTab === 'home') content = UserHomeView();
        else if(state.activeTab === 'map') content = `<div id="leaflet-map" class="w-full flex-1 relative animate-in z-10 min-h-[400px]"></div>`;
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
            <nav class="absolute bottom-0 w-full bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex justify-around items-center p-4 pb-safe z-[200]">
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
            ${HospitalDetailPopup()}
        `;

        if(state.activeTab === 'map') setTimeout(window.initLeafletMap, 50);
        if(state.isAiModal) window.renderAIModal();
    }
    lucide.createIcons();
}

render();
window.addEventListener('load', initApp);
