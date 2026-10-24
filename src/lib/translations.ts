export interface Translations {
  appName: string;
  tagline: string;
  footerTagline: string;
  scanEquipment: string;
  browseLibrary: string;
  demoMode: string;
  howItWorks: string;
  online: string;
  offline: string;
  searchPlaceholder: string;
  allCategories: string;
  categories: {
    Measurement: string;
    Electronics: string;
    Mechanical: string;
    Robotics: string;
    'Safety Gear': string;
  };
  tabs: {
    specs: string;
    steps: string;
    safety: string;
    more: string;
  };
  safetyFirstNotice: string;
  safetyFirstPrompt: string;
  iUnderstand: string;
  unlockedSteps: string;
  stepPrefix: string;
  prevStep: string;
  nextStep: string;
  finishSteps: string;
  hazardLevels: {
    low: string;
    medium: string;
    high: string;
  };
  commonMistakes: string;
  staffReviewed: string;
  verifiedBy: string;
  readAloud: string;
  stopAudio: string;
  freezeFrame: string;
  resumeCamera: string;
  switchCamera: string;
  toggleTorch: string;
  lowConfidenceTitle: string;
  topMatchesPrompt: string;
  manualSearch: string;
  history: string;
  bookmarks: string;
  adminTitle: string;
  addNewInstrument: string;
  modelLoading: string;
  cameraAccessDenied: string;
  cameraNotFound: string;
}

export const TRANSLATIONS: Record<'en' | 'hi', Translations> = {
  en: {
    appName: 'LabLens',
    tagline: 'AR Guide for Every Lab Instrument',
    footerTagline: 'Think Big. Innovate Bigger.',
    scanEquipment: 'Scan Equipment',
    browseLibrary: 'Browse Equipment Library',
    demoMode: 'Demo Mode (No Camera)',
    howItWorks: 'How it Works',
    online: 'Online',
    offline: 'Offline Ready',
    searchPlaceholder: 'Search 15+ instruments by name, specs, or aliases...',
    allCategories: 'All Instruments',
    categories: {
      Measurement: 'Measurement',
      Electronics: 'Electronics',
      Mechanical: 'Mechanical',
      Robotics: 'Robotics',
      'Safety Gear': 'Safety Gear',
    },
    tabs: {
      specs: 'Specs',
      steps: 'Steps',
      safety: 'Safety',
      more: 'More',
    },
    safetyFirstNotice: 'SAFETY PRECAUTIONS REQUIRED',
    safetyFirstPrompt: 'Read the safety hazards & required PPE before operating this equipment.',
    iUnderstand: 'I Understand & Will Comply',
    unlockedSteps: 'Safety Acknowledged • Steps Unlocked',
    stepPrefix: 'Step',
    prevStep: 'Previous',
    nextStep: 'Next Step',
    finishSteps: 'Finish Guide',
    hazardLevels: {
      low: 'Low Risk',
      medium: 'Medium Caution',
      high: 'High Danger',
    },
    commonMistakes: 'Common Student Mistakes',
    staffReviewed: 'Staff Reviewed',
    verifiedBy: 'Verified by',
    readAloud: 'Read Aloud (TTS)',
    stopAudio: 'Stop Audio',
    freezeFrame: 'Freeze Frame',
    resumeCamera: 'Resume Camera',
    switchCamera: 'Switch Camera',
    toggleTorch: 'Flashlight',
    lowConfidenceTitle: 'Not sure. Try better lighting or move closer.',
    topMatchesPrompt: 'Did you mean one of these instruments? Tap to confirm:',
    manualSearch: 'Search Manually',
    history: 'Scan History',
    bookmarks: 'Saved Bookmarks',
    adminTitle: 'Instructor & Admin Portal',
    addNewInstrument: '+ Add Instrument',
    modelLoading: 'Loading AI recognition model...',
    cameraAccessDenied: 'Camera permission was denied. Please allow camera access in your browser settings.',
    cameraNotFound: 'No video capture device detected on this system.',
  },
  hi: {
    appName: 'लैबलेंस (LabLens)',
    tagline: 'हर प्रयोगशाला उपकरण के लिए एआर गाइड',
    footerTagline: 'Think Big. Innovate Bigger.',
    scanEquipment: 'उपकरण स्कैन करें',
    browseLibrary: 'उपकरण लाइब्रेरी ब्राउज़ करें',
    demoMode: 'डेमो मोड (बिना कैमरे के)',
    howItWorks: 'यह कैसे काम करता है',
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन सक्रिय',
    searchPlaceholder: 'उपकरण, रेटिंग या विनिर्देश खोजें...',
    allCategories: 'सभी उपकरण',
    categories: {
      Measurement: 'माप उपकरण',
      Electronics: 'इलेक्ट्रॉनिक्स',
      Mechanical: 'मैकेनिकल',
      Robotics: 'रोबोटिक्स',
      'Safety Gear': 'सुरक्षा उपकरण',
    },
    tabs: {
      specs: 'विवरण',
      steps: 'निर्देश',
      safety: 'सुरक्षा',
      more: 'अतिरिक्त',
    },
    safetyFirstNotice: 'सुरक्षा सावधानियां अनिवार्य हैं',
    safetyFirstPrompt: 'उपकरण का उपयोग करने से पहले खतरे और आवश्यक पीपीई ध्यान से पढ़ें।',
    iUnderstand: 'मैंने समझ लिया है और पालन करूंगा',
    unlockedSteps: 'सुरक्षा स्वीकृत • निर्देश अनलॉक',
    stepPrefix: 'चरण',
    prevStep: 'पिछला',
    nextStep: 'अगला चरण',
    finishSteps: 'समाप्त करें',
    hazardLevels: {
      low: 'कम जोखिम',
      medium: 'मध्यम सावधानी',
      high: 'अत्यधिक खतरा',
    },
    commonMistakes: 'छात्रों द्वारा सामान्य गलतियाँ',
    staffReviewed: 'स्टाफ द्वारा प्रमाणित',
    verifiedBy: 'द्वारा सत्यापित',
    readAloud: 'बोलकर सुनाएं',
    stopAudio: 'ध्वनि रोकें',
    freezeFrame: 'फ्रेम रोकें',
    resumeCamera: 'कैमरा फिर से शुरू करें',
    switchCamera: 'कैमरा बदलें',
    toggleTorch: 'टॉर्च',
    lowConfidenceTitle: 'स्पष्ट नहीं है। कृपया बेहतर रोशनी में लाएं या पास जाएं।',
    topMatchesPrompt: 'क्या आपका मतलब इनमें से कोई उपकरण है? पुष्टि करने के लिए टैप करें:',
    manualSearch: 'मैन्युअल रूप से खोजें',
    history: 'स्कैन इतिहास',
    bookmarks: 'सुरक्षित बुकमार्क',
    adminTitle: 'प्रशिक्षक और एडमिन पोर्टल',
    addNewInstrument: '+ नया उपकरण जोड़ें',
    modelLoading: 'एआई मॉडल लोड हो रहा है...',
    cameraAccessDenied: 'कैमरा अनुमति अस्वीकृत हुई। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।',
    cameraNotFound: 'कोई कैमरा नहीं मिला।',
  }
};
