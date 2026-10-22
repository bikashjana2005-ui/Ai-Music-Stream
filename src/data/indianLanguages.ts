export interface IndianLanguage {
  id: string;
  name: string;
  nativeName: string;
  region: string;
  category: 'official' | 'regional';
  speechCode: string;
  sampleGreeting: string;
  scriptBadge: string;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  // 1. Hindi (Official language of India)
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    region: 'North & Central India (Pan-India)',
    category: 'official',
    speechCode: 'hi-IN',
    sampleGreeting: 'नमस्ते! आपका स्वागत है।',
    scriptBadge: 'देवनागरी'
  },
  // 2. Bengali (West Bengal, Tripura, Assam)
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'West Bengal, Tripura & Assam',
    category: 'official',
    speechCode: 'bn-IN',
    sampleGreeting: 'নমস্কার! এই ভিডিওটি বাংলায় শুনুন।',
    scriptBadge: 'বাংলা'
  },
  // 3. Telugu (Andhra Pradesh & Telangana)
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    region: 'Andhra Pradesh & Telangana',
    category: 'official',
    speechCode: 'te-IN',
    sampleGreeting: 'నమస్కారం! తెలుగులో చూడండి.',
    scriptBadge: 'తెలుగు'
  },
  // 4. Tamil (Tamil Nadu & Puducherry)
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'Tamil Nadu & Puducherry',
    category: 'official',
    speechCode: 'ta-IN',
    sampleGreeting: 'வணக்கம்! தமிழில் வீடியோ மொழிபெயர்ப்பு.',
    scriptBadge: 'தமிழ்'
  },
  // 5. Marathi (Maharashtra)
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    region: 'Maharashtra & Goa',
    category: 'official',
    speechCode: 'mr-IN',
    sampleGreeting: 'नमस्कार! मराठीमध्ये थेट भाषांतर सुरू आहे.',
    scriptBadge: 'देवनागरी'
  },
  // 6. Gujarati (Gujarat)
  {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    region: 'Gujarat, Daman & Diu',
    category: 'official',
    speechCode: 'gu-IN',
    sampleGreeting: 'નમસ્તે! ગુજરાતીમાં આ વિડિઓ સાંભળો.',
    scriptBadge: 'ગુજરાતી'
  },
  // 7. Kannada (Karnataka)
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    region: 'Karnataka',
    category: 'official',
    speechCode: 'kn-IN',
    sampleGreeting: 'ನಮಸ್ಕಾರ! ಕನ್ನಡದಲ್ಲಿ ವೀಡಿಯೊ ಆಲಿಸಿ.',
    scriptBadge: 'ಕನ್ನಡ'
  },
  // 8. Malayalam (Kerala)
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    region: 'Kerala & Lakshadweep',
    category: 'official',
    speechCode: 'ml-IN',
    sampleGreeting: 'നമസ്കാരം! മലയാളത്തിൽ തത്സമയ വിവർത്തനം.',
    scriptBadge: 'മലയാളം'
  },
  // 9. Odia (Odisha)
  {
    id: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    region: 'Odisha',
    category: 'official',
    speechCode: 'or-IN',
    sampleGreeting: 'ନମସ୍କାର! ଓଡ଼ିଆରେ ଏହି ଭିଡିଓ ଉପଭୋଗ କରନ୍ତୁ।',
    scriptBadge: 'ଓଡ଼ିଆ'
  },
  // 10. Punjabi (Punjab)
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    region: 'Punjab & Chandigarh',
    category: 'official',
    speechCode: 'pa-IN',
    sampleGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਪੰਜਾਬੀ ਵਿੱਚ ਸੁਣੋ।',
    scriptBadge: 'ਗੁਰਮੁਖੀ'
  },
  // 11. Assamese (Assam)
  {
    id: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    region: 'Assam & Northeast India',
    category: 'official',
    speechCode: 'as-IN',
    sampleGreeting: 'নমস্কাৰ! অসমীয়াত স্পষ্টকৈ শুনক।',
    scriptBadge: 'অসমীয়া'
  },
  // 12. Urdu (Pan-India)
  {
    id: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    region: 'Jammu & Kashmir, UP, Telangana & Bihar',
    category: 'official',
    speechCode: 'ur-IN',
    sampleGreeting: 'آداب! اردو میں لائیو ترجمہ جاری ہے۔',
    scriptBadge: 'اردو'
  },
  // 13. Maithili (Bihar & Jharkhand)
  {
    id: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    region: 'Mithila, Bihar & Jharkhand',
    category: 'official',
    speechCode: 'mai-IN',
    sampleGreeting: 'प्रणाम! मैथिली भाषा में स्वागत अछि।',
    scriptBadge: 'तिरहुता / देवनागरी'
  },
  // 14. Santali (Jharkhand, West Bengal, Odisha)
  {
    id: 'sat',
    name: 'Santali',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    region: 'Jharkhand, West Bengal, Odisha & Assam',
    category: 'official',
    speechCode: 'sat-IN',
    sampleGreeting: 'ᱡᱚᱦᱟᱨ! ᱥᱟᱱᱛᱟᱲᱤ ᱛᱮ ᱟᱧᱡᱚᱢ ᱢᱮ᱾',
    scriptBadge: 'ᱚᱞ ᱪᱤᱠᱤ'
  },
  // 15. Kashmiri (Jammu & Kashmir)
  {
    id: 'ks',
    name: 'Kashmiri',
    nativeName: 'کٲشُر',
    region: 'Kashmir Valley, J&K',
    category: 'official',
    speechCode: 'ks-IN',
    sampleGreeting: 'آداب عرض! کٲشُر زبانہِ منٛز بوزِو۔',
    scriptBadge: 'کٲشُر'
  },
  // 16. Konkani (Goa & Coastal Karnataka/Maharashtra)
  {
    id: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    region: 'Goa, Coastal Karnataka & Maharashtra',
    category: 'official',
    speechCode: 'kok-IN',
    sampleGreeting: 'नमस्कार! कोंकणींत भाशांतर सुरू आसा.',
    scriptBadge: 'देवनागरी'
  },
  // 17. Sindhi (Pan-India)
  {
    id: 'sd',
    name: 'Sindhi',
    nativeName: 'سنڌي / सिंधी',
    region: 'Gujarat, Maharashtra & Rajasthan',
    category: 'official',
    speechCode: 'sd-IN',
    sampleGreeting: 'جے جھولے لال! سنڌي ۾ ترجمو.',
    scriptBadge: 'عربي / देवनागरी'
  },
  // 18. Sanskrit (Classical & Sacred)
  {
    id: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    region: 'Pan-India (Classical Heritage)',
    category: 'official',
    speechCode: 'sa-IN',
    sampleGreeting: 'नमो नमः! संस्कृतेन श्रूयताम्।',
    scriptBadge: 'देवनागरी'
  },
  // 19. Nepali (Sikkim & West Bengal / Darjeeling)
  {
    id: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    region: 'Sikkim, Darjeeling, Uttarakhand & Assam',
    category: 'official',
    speechCode: 'ne-NP',
    sampleGreeting: 'नमस्ते! नेपालीमा प्रत्यक्ष अनुवाद सुन्नुहोस्।',
    scriptBadge: 'देवनागरी'
  },
  // 20. Bodo (Assam / Bodoland)
  {
    id: 'brx',
    name: 'Bodo',
    nativeName: 'बड़ो',
    region: 'Bodoland, Assam',
    category: 'official',
    speechCode: 'brx-IN',
    sampleGreeting: 'खुलुमबाय! बड़ो रावजों खोनासंनाय।',
    scriptBadge: 'देवनागरी'
  },
  // 21. Dogri (Jammu & Kashmir / Himachal)
  {
    id: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    region: 'Jammu region, J&K & Himachal Pradesh',
    category: 'official',
    speechCode: 'doi-IN',
    sampleGreeting: 'नमस्ते जी! डोगरी च अनुवाद सुनो।',
    scriptBadge: 'डोगरी'
  },
  // 22. Manipuri / Meitei (Manipur)
  {
    id: 'mni',
    name: 'Manipuri (Meitei)',
    nativeName: 'মৈতৈলোন্ / ꯃꯤꯇꯩꯂꯣꯟ',
    region: 'Manipur & Northeast India',
    category: 'official',
    speechCode: 'mni-IN',
    sampleGreeting: 'খুরুমজরি! মৈতৈলোন্দা তারসী।',
    scriptBadge: 'মৈতৈ ময়েক'
  },
  // 23. Bhojpuri (Bihar, UP & Jharkhand)
  {
    id: 'bho',
    name: 'Bhojpuri',
    nativeName: 'भोजपुरी',
    region: 'Bihar, Eastern Uttar Pradesh & Jharkhand',
    category: 'regional',
    speechCode: 'bho-IN',
    sampleGreeting: 'प्रणाम! भोजपुरी में वीडियो के आवाज सुनीं।',
    scriptBadge: 'देवनागरी / कैथी'
  },
  // 24. Marwari / Rajasthani (Rajasthan)
  {
    id: 'mwr',
    name: 'Marwari / Rajasthani',
    nativeName: 'मारवाड़ी / राजस्थानी',
    region: 'Rajasthan & Western India',
    category: 'regional',
    speechCode: 'mwr-IN',
    sampleGreeting: 'खम्मा घणी! मारवाड़ी में अनुवाद सुणो सा।',
    scriptBadge: 'देवनागरी'
  },
  // 25. Chhattisgarhi (Chhattisgarh)
  {
    id: 'hne',
    name: 'Chhattisgarhi',
    nativeName: 'छत्तीसगढ़ी',
    region: 'Chhattisgarh & Central India',
    category: 'regional',
    speechCode: 'hne-IN',
    sampleGreeting: 'जय जोहार! छत्तीसगढ़ी म सुने बर स्वागत हे।',
    scriptBadge: 'देवनागरी'
  },
  // 26. Haryanvi (Haryana & Delhi NCR)
  {
    id: 'bgc',
    name: 'Haryanvi',
    nativeName: 'हरियाणवी',
    region: 'Haryana & Delhi NCR',
    category: 'regional',
    speechCode: 'bgc-IN',
    sampleGreeting: 'राम राम भाई! हरियाणवी में अनुवाद सुणो।',
    scriptBadge: 'देवनागरी'
  },
  // 27. Magahi (Bihar)
  {
    id: 'mag',
    name: 'Magahi',
    nativeName: 'मगही',
    region: 'Magadh, Central Bihar',
    category: 'regional',
    speechCode: 'mag-IN',
    sampleGreeting: 'प्रणाम! मगही भाषा में सुनल जाइ।',
    scriptBadge: 'देवनागरी'
  },
  // 28. English (Indian Accent)
  {
    id: 'en-in',
    name: 'Indian English',
    nativeName: 'English (India)',
    region: 'Pan-India Corporate & Academic',
    category: 'official',
    speechCode: 'en-IN',
    sampleGreeting: 'Hello! Real-time English translation is active.',
    scriptBadge: 'Latin'
  }
];

export const getIndianLanguageById = (id: string): IndianLanguage => {
  const match = INDIAN_LANGUAGES.find(l => l.id.toLowerCase() === id.toLowerCase());
  return match || INDIAN_LANGUAGES[0]; // fallback Hindi
};
