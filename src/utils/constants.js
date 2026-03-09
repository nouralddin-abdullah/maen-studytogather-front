/**
 * Application-wide constants.
 */
export const APP_NAME = "معاً";
export const APP_NAME_EN = "Maen";
export const APP_TAGLINE = "ادرس مع أصدقائك";
export const APP_DESCRIPTION = "منصة للدراسة الجماعية — تواصل، تعاون، تفوّق";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  USER: "user",
  THEME: "theme",
};

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  DISCOVER: "/discover",
  FRIENDS: "/friends",
  CREATE_ROOM: "/create-room",
  PROFILE: (id) => `/user/${id}`,
  MY_PROFILE: "/user/me",
  ROOM: (id) => `/room/${id}`,
};

/**
 * Country code → label lookup (for display on profile etc.).
 */
export const COUNTRY_LABELS = Object.fromEntries([
  ["SA", "🇸🇦 السعودية"],
  ["EG", "🇪🇬 مصر"],
  ["AE", "🇦🇪 الإمارات"],
  ["JO", "🇯🇴 الأردن"],
  ["KW", "🇰🇼 الكويت"],
  ["BH", "🇧🇭 البحرين"],
  ["QA", "🇶🇦 قطر"],
  ["OM", "🇴🇲 عُمان"],
  ["IQ", "🇮🇶 العراق"],
  ["SY", "🇸🇾 سوريا"],
  ["LB", "🇱🇧 لبنان"],
  ["PS", "🇵🇸 فلسطين"],
  ["YE", "🇾🇪 اليمن"],
  ["LY", "🇱🇾 ليبيا"],
  ["TN", "🇹🇳 تونس"],
  ["DZ", "🇩🇿 الجزائر"],
  ["MA", "🇲🇦 المغرب"],
  ["SD", "🇸🇩 السودان"],
  ["MR", "🇲🇷 موريتانيا"],
  ["SO", "🇸🇴 الصومال"],
  ["DJ", "🇩🇯 جيبوتي"],
  ["KM", "🇰🇲 جزر القمر"],
  ["TR", "🇹🇷 تركيا"],
  ["PK", "🇵🇰 باكستان"],
  ["MY", "🇲🇾 ماليزيا"],
  ["ID", "🇮🇩 إندونيسيا"],
  ["US", "🇺🇸 الولايات المتحدة"],
  ["GB", "🇬🇧 المملكة المتحدة"],
  ["CA", "🇨🇦 كندا"],
  ["DE", "🇩🇪 ألمانيا"],
  ["FR", "🇫🇷 فرنسا"],
  ["AU", "🇦🇺 أستراليا"],
]);

/**
 * Enums matching backend shared types.
 */
export const FIELDS = {
  PHYSICS: "PHYSICS",
  CHEMISTRY: "CHEMISTRY",
  BIOLOGY: "BIOLOGY",
  MATHEMATICS: "MATHEMATICS",
  MEDICINE: "MEDICINE",
  DENTISTRY: "DENTISTRY",
  NURSING: "NURSING",
  PHARMACY: "PHARMACY",
  ENGINEERING: "ENGINEERING",
  COMPUTER_SCIENCE: "COMPUTER_SCIENCE",
  LAW: "LAW",
  VETERINARY_MEDICINE: "VETERINARY_MEDICINE",
  BUSINESS: "BUSINESS",
  POLITICS: "POLITICS",
  PUBLIC_ADMINISTRATION: "PUBLIC_ADMINISTRATION",
  JOURNALISM: "JOURNALISM",
  PSYCHOLOGY: "PSYCHOLOGY",
  EDUCATION: "EDUCATION",
  ARTS: "ARTS",
  SCHOOL: "SCHOOL",
};

export const FIELD_LABELS = {
  PHYSICS: "⚛️  الفيزياء",
  CHEMISTRY: "🧪  الكيمياء",
  BIOLOGY: "🧬  الأحياء",
  MATHEMATICS: "📐  الرياضيات",
  MEDICINE: "🩺  الطب",
  DENTISTRY: "🦷  طب الأسنان",
  NURSING: "💉  التمريض",
  PHARMACY: "💊  الصيدلة",
  ENGINEERING: "⚙️  الهندسة",
  COMPUTER_SCIENCE: "💻  علوم الحاسب",
  LAW: "⚖️  القانون",
  VETERINARY_MEDICINE: "🐾  الطب البيطري",
  BUSINESS: "📊  إدارة الأعمال",
  POLITICS: "🏛️  العلوم السياسية",
  PUBLIC_ADMINISTRATION: "🏢  الإدارة العامة",
  JOURNALISM: "📰  الإعلام",
  PSYCHOLOGY: "🧠  علم النفس",
  EDUCATION: "📚  التعليم",
  ARTS: "🎨  الفنون",
  SCHOOL: "🏫  مدرسة",
};

export const SEX = {
  MALE: "male",
  FEMALE: "female",
};

export const SEX_LABELS = {
  male: "👨  ذكر",
  female: "👩  أنثى",
};

// ── Room Enums ──────────────────────────────────

export const ROOM_THEMES = {
  CLASSIC: "CLASSIC",
  NIGHT_CITY: "NIGHT_CITY",
};

export const TIMER_PHASES = {
  IDLE: "IDLE",
  FOCUS: "FOCUS",
  BREAK: "BREAK",
  PAUSED: "PAUSED",
};

export const TIMER_PHASE_LABELS = {
  IDLE: "في الانتظار",
  FOCUS: "تركيز",
  BREAK: "استراحة",
  PAUSED: "متوقف مؤقتاً",
};

export const AMBIENT_SOUNDS = {
  RAIN: "RAIN",
  LOFIC_MUSIC: "LOFIC_MUSIC",
  SEA: "SEA",
  NONE: "NONE",
};

export const AMBIENT_SOUND_LABELS = {
  RAIN: "🌧️ مطر",
  LOFIC_MUSIC: "🎵 لوفي",
  SEA: "🌊 بحر",
  NONE: "🔇 بدون صوت",
};

// ── Sound Tracks (R2 hosted) ────────────────────
export const R2_SOUNDS_BASE =
  "https://pub-2da766ccb48c485895ae36b58be35142.r2.dev/assets/sounds";

export const SOUND_TRACKS = {
  RAIN: [
    { id: "rain-1", label: "🌧️ مطر هادئ", file: "chilling-rain-sound.mp3" },
    { id: "rain-2", label: "🌧️ مطر لطيف", file: "gentle-rain.mp3" },
    { id: "rain-3", label: "🌙 مطر منتصف الليل", file: "midnight-rainsound.mp3" },
    { id: "rain-4", label: "⛈️ مطر غزير", file: "rain-sound.mp3" },
  ],
  SEA: [
    { id: "sea-1", label: "🌊 أمواج المحيط", file: "ocean-waves.mp3" },
    { id: "sea-2", label: "🌊 أمواج متكسرة", file: "crachsing-waves.mp3" },
  ],
};

/**
 * Countries list — curated Arabic-speaking & common countries with flag emojis.
 * ISO 3166-1 alpha-2 codes.
 */
export const COUNTRIES = [
  { value: "SA", label: "🇸🇦  السعودية" },
  { value: "EG", label: "🇪🇬  مصر" },
  { value: "AE", label: "🇦🇪  الإمارات" },
  { value: "JO", label: "🇯🇴  الأردن" },
  { value: "KW", label: "🇰🇼  الكويت" },
  { value: "BH", label: "🇧🇭  البحرين" },
  { value: "QA", label: "🇶🇦  قطر" },
  { value: "OM", label: "🇴🇲  عُمان" },
  { value: "IQ", label: "🇮🇶  العراق" },
  { value: "SY", label: "🇸🇾  سوريا" },
  { value: "LB", label: "🇱🇧  لبنان" },
  { value: "PS", label: "🇵🇸  فلسطين" },
  { value: "YE", label: "🇾🇪  اليمن" },
  { value: "LY", label: "🇱🇾  ليبيا" },
  { value: "TN", label: "🇹🇳  تونس" },
  { value: "DZ", label: "🇩🇿  الجزائر" },
  { value: "MA", label: "🇲🇦  المغرب" },
  { value: "SD", label: "🇸🇩  السودان" },
  { value: "MR", label: "🇲🇷  موريتانيا" },
  { value: "SO", label: "🇸🇴  الصومال" },
  { value: "DJ", label: "🇩🇯  جيبوتي" },
  { value: "KM", label: "🇰🇲  جزر القمر" },
  { value: "TR", label: "🇹🇷  تركيا" },
  { value: "PK", label: "🇵🇰  باكستان" },
  { value: "MY", label: "🇲🇾  ماليزيا" },
  { value: "ID", label: "🇮🇩  إندونيسيا" },
  { value: "US", label: "🇺🇸  الولايات المتحدة" },
  { value: "GB", label: "🇬🇧  المملكة المتحدة" },
  { value: "CA", label: "🇨🇦  كندا" },
  { value: "DE", label: "🇩🇪  ألمانيا" },
  { value: "FR", label: "🇫🇷  فرنسا" },
  { value: "AU", label: "🇦🇺  أستراليا" },
];
