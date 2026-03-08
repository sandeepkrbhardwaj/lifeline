import React, { useState, useEffect, useMemo } from 'react';
import { 
  Navigation, 
  Search, 
  MapPin, 
  Activity, 
  Hospital, 
  Package, 
  AlertCircle,
  Menu,
  Plus,
  Minus,
  ArrowRight,
  Phone,
  Languages,
  Info,
  Home,
  ShieldCheck,
  Clock,
  ChevronRight,
  X,
  Zap
} from 'lucide-react';

// --- LOCALIZATION & CONSTANTS ---
const TRANSLATIONS = {
  en: {
    appName: "Lifeline India",
    tagline: "Seconds matter. Saving lives together.",
    quickSearch: "Symptom Triage",
    medSearch: "Medicine Finder",
    liveStatus: "Live Location",
    beds: "Beds",
    wait: "Wait",
    stocks: "Stocks",
    navigate: "Notify & Navigate",
    emergency: "Helplines",
    bestMatch: "Specialized for",
    erStatus: "ER Ready",
    notifySent: "ER Notified!",
    eta: "ETA",
    inventory: "Pharmacy Stocks",
    admin: "Staff Login"
  },
  hi: {
    appName: "लाइफलाइन इंडिया",
    tagline: "हर पल कीमती है। जीवन रक्षा सर्वोपरि।",
    quickSearch: "लक्षण जांच",
    medSearch: "दवा खोजें",
    liveStatus: "लाइव लोकेशन",
    beds: "बेड",
    wait: "समय",
    stocks: "स्टॉक",
    navigate: "सूचना और रास्ता",
    emergency: "हेल्पलाइन",
    bestMatch: "विशेषज्ञता",
    erStatus: "ER तैयार है",
    notifySent: "सूचना भेजी गई!",
    eta: "पहुँचने का समय",
    inventory: "दवा भंडार",
    admin: "स्टाफ लॉगिन"
  }
};

const INITIAL_HOSPITALS = [
  { 
    id: 'h1',
    name: "AIIMS - Trauma Center", 
    beds: 4, 
    wait: 12, 
    lat: 28.5672, 
    lng: 77.2100,
    specialty: "Cardiology",
    distance: "1.2 km",
    medicines: { "Aspirin": 150, "Oxygen": 40, "Insulin": 10 }
  },
  { 
    id: 'h2',
    name: "Fortis Memorial", 
    beds: 18, 
    wait: 8, 
    lat: 28.4595, 
    lng: 77.0726,
    specialty: "Neurology",
    distance: "4.5 km",
    medicines: { "Mannitol": 30, "Antibiotics": 200 }
  },
  { 
    id: 'h3',
    name: "Apollo Hospitals", 
    beds: 0, 
    wait: 45, 
    lat: 28.5402, 
    lng: 77.2831,
    specialty: "Orthopedics",
    distance: "6.8 km",
    medicines: { "Morphine": 12, "Oxygen": 5 }
  }
];

const App = () => {
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'map', 'meds', 'triage'
  const [isAdmin, setIsAdmin] = useState(false);
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [medQuery, setMedQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const timer = setTimeout(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => console.log("Using default New Delhi coordinates")
        );
      }
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const triageResult = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q || q.length < 3) return null;
    if (q.includes('chest') || q.includes('heart') || q.includes('सीने')) 
      return { dept: lang === 'hi' ? 'हृदय रोग' : 'Cardiology', color: 'bg-red-500', urgency: 'CRITICAL' };
    if (q.includes('bone') || q.includes('accident') || q.includes('हड्डी')) 
      return { dept: lang === 'hi' ? 'अस्थि रोग' : 'Orthopedics', color: 'bg-orange-500', urgency: 'HIGH' };
    return { dept: lang === 'hi' ? 'सामान्य' : 'General', color: 'bg-blue-500', urgency: 'STABLE' };
  }, [searchQuery, lang]);

  const updateBeds = (id, delta) => {
    setHospitals(prev => prev.map(h => h.id === id ? { ...h, beds: Math.max(0, h.beds + delta) } : h));
  };

  // --- VIEWS ---

  const Header = () => (
    <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-50 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Zap className="text-white fill-white" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">{t.appName}</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span> {t.liveStatus}
          </p>
        </div>
      </div>
      <button 
        onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
        className="px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 flex items-center gap-2 hover:bg-slate-200 transition-colors"
      >
        <Languages size={14} /> {lang === 'en' ? 'हिन्दी' : 'English'}
      </button>
    </div>
  );

  const HomeView = () => (
    <div className="p-5 space-y-6 pb-24 animate-in fade-in duration-500">
      {/* State Dashboard Summary */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-2">Regional Health Index</p>
          <div className="flex items-end gap-2 mb-6">
            <h2 className="text-4xl font-black">74%</h2>
            <p className="text-xs text-slate-400 pb-1 mb-1">Bed Availability Score</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] text-slate-400 font-bold">ACTIVE ERs</p>
              <p className="text-xl font-bold">14</p>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] text-slate-400 font-bold">MEDS IN STOCK</p>
              <p className="text-xl font-bold">98%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setActiveTab('triage')} className="p-4 bg-red-50 rounded-2xl border border-red-100 text-left hover:scale-[0.98] transition-transform">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white mb-3 shadow-lg shadow-red-500/30">
            <Activity size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">{t.quickSearch}</h3>
          <p className="text-[10px] text-slate-500 mt-1 italic">Symptom matching</p>
        </button>
        <button onClick={() => setActiveTab('meds')} className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-left hover:scale-[0.98] transition-transform">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/30">
            <Package size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">{t.medSearch}</h3>
          <p className="text-[10px] text-slate-500 mt-1 italic">Stock availability</p>
        </button>
      </div>

      {/* Recommended Emergency Centers */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{lang === 'en' ? 'Priority Centers' : 'प्राथमिकता केंद्र'}</h3>
        <div className="space-y-4">
          {hospitals.slice(0, 2).map(h => (
            <div key={h.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${h.beds > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <span className="text-xl font-black">{h.beds}</span>
                <span className="text-[8px] font-bold uppercase">{t.beds}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm">{h.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><MapPin size={10} /> {h.distance}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{h.specialty}</span>
                </div>
              </div>
              <button onClick={() => { setSelectedHospital(h); setActiveTab('map'); }} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Helplines */}
      <div className="bg-red-600 p-5 rounded-3xl text-white flex justify-between items-center shadow-xl shadow-red-500/20">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{t.emergency}</p>
          <h3 className="text-xl font-black italic">102 / 108</h3>
        </div>
        <a href="tel:108" className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-600 shadow-lg active:scale-90 transition-transform">
          <Phone size={24} fill="currentColor" />
        </a>
      </div>
    </div>
  );

  const TriageView = () => (
    <div className="p-5 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl">
        <h2 className="text-2xl font-black text-slate-900 mb-2">{t.quickSearch}</h2>
        <p className="text-sm text-slate-500 mb-6">{t.tagline}</p>
        
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            autoFocus
            type="text" 
            placeholder={t.placeholder}
            className="w-full pl-12 pr-4 py-5 rounded-2xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {triageResult ? (
          <div className="space-y-4 animate-in zoom-in-95 duration-300">
            <div className={`p-6 rounded-3xl text-white ${triageResult.color} shadow-lg shadow-blue-500/20`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-1">{t.recommended}</p>
                  <p className="text-xl font-black leading-tight">{triageResult.dept}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <ShieldCheck size={24} />
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/10 -mx-6 -mb-6 p-4 px-6 mt-6 rounded-b-3xl">
                <span className="text-xs font-bold uppercase tracking-wider">{t.urgency}</span>
                <span className="text-sm font-black tracking-widest">{triageResult.urgency}</span>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4">Nearest Centers for {triageResult.dept}</p>
            {hospitals.filter(h => h.specialty === triageResult.dept || triageResult.dept === 'General').map(h => (
              <button key={h.id} onClick={() => { setSelectedHospital(h); setActiveTab('map'); }} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-left hover:bg-white hover:shadow-md transition-all">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{h.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{h.distance} away • {h.beds} Beds</p>
                </div>
                <ArrowRight size={18} className="text-slate-300" />
              </button>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-300">
            <Activity size={64} className="mx-auto mb-4 opacity-10" />
            <p className="text-sm font-medium">Start typing symptoms for AI routing</p>
          </div>
        )}
      </div>
    </div>
  );

  const MedSearchView = () => (
    <div className="p-5 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl mb-6">
        <h2 className="text-2xl font-black text-slate-900 mb-6">{t.medSearch}</h2>
        <div className="relative">
          <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search: Oxygen, Insulin, Aspirin..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 text-slate-800 focus:outline-none border-none"
            value={medQuery}
            onChange={(e) => setMedQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {hospitals.map(h => {
          const medMatch = Object.entries(h.medicines).find(([name]) => name.toLowerCase().includes(medQuery.toLowerCase()));
          if (medQuery && !medMatch) return null;
          return (
            <div key={h.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-slate-800 text-sm">{h.name}</h4>
                <span className="text-[10px] font-bold text-slate-400">{h.distance}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(h.medicines).filter(([name]) => !medQuery || name.toLowerCase().includes(medQuery.toLowerCase())).map(([name, qty]) => (
                  <div key={name} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                    <span className="text-xs font-bold text-slate-600">{name}</span>
                    <span className={`text-xs font-black px-2 py-1 rounded-lg ${qty > 10 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {qty} Units
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const MapView = () => (
    <div className="h-full flex flex-col animate-in fade-in duration-500 relative">
      {/* Map Backdrop */}
      <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
        <div className="text-center p-10">
          <div className="w-24 h-24 bg-white/50 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-4 border border-white">
            <MapPin size={40} className="text-blue-500 animate-bounce" />
          </div>
          <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Interactive Map</h3>
          <p className="text-xs text-slate-400 mt-2">Connecting to live state health database</p>
        </div>
        
        {/* Simplified Interactive Markers */}
        {hospitals.map((h, i) => (
          <div 
            key={h.id}
            onClick={() => setSelectedHospital(h)}
            className={`absolute cursor-pointer transition-all duration-300 ${selectedHospital?.id === h.id ? 'scale-125 z-20' : 'scale-100 z-10'}`}
            style={{ top: `${30 + (i * 15)}%`, left: `${20 + (i * 25)}%` }}
          >
            <div className={`p-2 rounded-full shadow-2xl ring-4 ring-white ${h.beds > 5 ? 'bg-green-500' : h.beds > 0 ? 'bg-orange-500' : 'bg-red-500'}`}>
              <Hospital size={20} className="text-white" />
            </div>
            {selectedHospital?.id === h.id && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl">
                {h.name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hospital Drawer (Slide Up) */}
      {selectedHospital && (
        <div className="absolute bottom-20 left-4 right-4 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 animate-in slide-in-from-bottom-8 duration-500 z-30">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase mb-2 inline-block">
                {t.bestMatch}: {selectedHospital.specialty}
              </span>
              <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedHospital.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-bold">
                <MapPin size={12} /> {selectedHospital.distance} • Sarita Vihar, Delhi
              </p>
            </div>
            <button onClick={() => setSelectedHospital(null)} className="p-2 bg-slate-50 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.beds}</p>
              <p className={`text-2xl font-black ${selectedHospital.beds > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedHospital.beds}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.wait}</p>
              <p className="text-2xl font-black text-slate-800">{selectedHospital.wait}m</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.erStatus}</p>
              <ShieldCheck size={24} className="text-blue-500" />
            </div>
          </div>

          <button 
            onClick={() => {
              showToast(t.notifySent);
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}`, '_blank');
            }}
            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-base shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            {t.navigate} <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );

  const AdminPortal = () => (
    <div className="p-6 bg-slate-900 h-full text-white overflow-y-auto pb-24">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black">{t.admin}</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Authorized Access Only</p>
        </div>
        <button onClick={() => setIsAdmin(false)} className="text-xs font-bold text-slate-400 underline">Logout</button>
      </div>

      <div className="space-y-6">
        {hospitals.map(h => (
          <div key={h.id} className="bg-white/5 p-6 rounded-3xl border border-white/10">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-bold text-slate-200">{h.name}</h3>
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/20"></div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5 mb-6">
              <div>
                <p className="text-3xl font-black">{h.beds}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Vacant ICU Beds</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateBeds(h.id, -1)} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-red-500/50 transition-colors">
                  <Minus size={20} />
                </button>
                <button onClick={() => updateBeds(h.id, 1)} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-green-500/50 transition-colors">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.inventory}</p>
               {Object.entries(h.medicines).map(([name, qty]) => (
                  <div key={name} className="flex justify-between items-center text-sm p-2 bg-black/20 rounded-lg">
                    <span className="text-slate-400 font-medium">{name}</span>
                    <span className="font-mono font-bold text-blue-400">{qty}u</span>
                  </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900">
      <Zap className="text-blue-500 animate-pulse mb-6" size={64} fill="currentColor" />
      <span className="text-sm font-black tracking-[0.4em] text-white uppercase animate-pulse">Initializing Lifeline</span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-[100dvh] shadow-2xl overflow-hidden font-sans bg-white relative">
      <Header />
      
      <main className="h-full overflow-hidden">
        {isAdmin ? <AdminPortal /> : (
          <>
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'map' && <MapView />}
            {activeTab === 'triage' && <TriageView />}
            {activeTab === 'meds' && <MedSearchView />}
          </>
        )}
      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-4 right-4 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <Zap size={20} fill="white" />
            <p className="font-black text-sm uppercase tracking-wider">{notification}</p>
          </div>
        </div>
      )}

      {/* Custom Bottom Navigation */}
      {!isAdmin && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center p-3 pb-6 z-[60]">
          <button onClick={() => setActiveTab('home')} className={`p-2 transition-all ${activeTab === 'home' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <Home size={22} fill={activeTab === 'home' ? "currentColor" : "none"} />
          </button>
          <button onClick={() => setActiveTab('map')} className={`p-2 transition-all ${activeTab === 'map' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <MapPin size={22} fill={activeTab === 'map' ? "currentColor" : "none"} />
          </button>
          <div className="w-12 h-12 -mt-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 active:scale-90 transition-all cursor-pointer" onClick={() => setActiveTab('triage')}>
            <Zap size={24} fill="white" />
          </div>
          <button onClick={() => setActiveTab('meds')} className={`p-2 transition-all ${activeTab === 'meds' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
            <Package size={22} fill={activeTab === 'meds' ? "currentColor" : "none"} />
          </button>
          <button onClick={() => setIsAdmin(true)} className={`p-2 transition-all text-slate-400`}>
            <Menu size={22} />
          </button>
        </nav>
      )}

      {/* Mobile Notch Bar */}
      <div className="absolute top-0 w-full h-1 bg-slate-900/5 z-[100] pointer-events-none"></div>
    </div>
  );
};

export default App;
