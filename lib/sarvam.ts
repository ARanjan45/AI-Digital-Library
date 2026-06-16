const SARVAM_API_KEY = process.env.SARVAM_API_KEY!;
const SARVAM_BASE_URL = "https://api.sarvam.ai";

export const SUPPORTED_LANGUAGES = [
  { code: "en-IN", name: "English", nativeName: "English" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिंदी" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as-IN", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur-IN", name: "Urdu", nativeName: "اردو" },
];

export async function textToSpeech(
  text: string,
  languageCode: string = "hi-IN",
  speaker: string = "meera"
): Promise<Buffer | null> {
  try {
    const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: [text.slice(0, 500)],
        target_language_code: languageCode,
        speaker,
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v1",
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.audios?.[0]) return null;

    const audioBase64 = data.audios[0];
    return Buffer.from(audioBase64, "base64");
  } catch {
    return null;
  }
}

export async function translateText(
  text: string,
  targetLanguageCode: string,
  sourceLanguageCode: string = "en-IN"
): Promise<string> {
  try {
    const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text.slice(0, 1000),
        source_language_code: sourceLanguageCode,
        target_language_code: targetLanguageCode,
        speaker_gender: "Female",
        mode: "formal",
        model: "mayura:v1",
        enable_preprocessing: false,
      }),
    });

    if (!response.ok) return text;

    const data = await response.json();
    return data.translated_text || text;
  } catch {
    return text;
  }
}
