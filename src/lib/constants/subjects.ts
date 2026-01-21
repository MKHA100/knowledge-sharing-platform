// Subject Constants for O-Level Sri Lankan Curriculum
// All 52 subjects as a flat list (no categories)

export interface Subject {
  id: string;
  displayName: string;
  searchTerms: string[];
}

export const SUBJECTS: Subject[] = [
  // Religion subjects
  {
    id: "buddhism",
    displayName: "Buddhism",
    searchTerms: ["buddhism", "buddha", "dharma"],
  },
  {
    id: "catholicism",
    displayName: "Catholicism",
    searchTerms: ["catholicism", "catholic"],
  },
  {
    id: "saivanery",
    displayName: "Saivanery",
    searchTerms: ["saivanery", "saiva", "hindu"],
  },
  {
    id: "christianity",
    displayName: "Christianity",
    searchTerms: ["christianity", "christian", "bible"],
  },
  {
    id: "islam",
    displayName: "Islam",
    searchTerms: ["islam", "muslim", "quran"],
  },

  // Core subjects
  { id: "english", displayName: "English", searchTerms: ["english", "eng"] },
  {
    id: "sinhala_language_literature",
    displayName: "Sinhala Language & Literature",
    searchTerms: ["sinhala", "sinhala language", "sinhala literature"],
  },
  {
    id: "tamil_language_literature",
    displayName: "Tamil Language & Literature",
    searchTerms: ["tamil", "tamil language", "tamil literature"],
  },
  {
    id: "mathematics",
    displayName: "Mathematics",
    searchTerms: ["mathematics", "maths", "math"],
  },
  { id: "history", displayName: "History", searchTerms: ["history"] },
  {
    id: "science",
    displayName: "Science",
    searchTerms: ["science", "general science"],
  },

  // Category I subjects
  {
    id: "civic_education",
    displayName: "Civic Education",
    searchTerms: ["civic education", "civics"],
  },
  {
    id: "business_accounting",
    displayName: "Business & Accounting Studies",
    searchTerms: ["business", "accounting", "commerce"],
  },
  {
    id: "geography",
    displayName: "Geography",
    searchTerms: ["geography", "geo"],
  },
  {
    id: "entrepreneurship",
    displayName: "Entrepreneurship Studies",
    searchTerms: ["entrepreneurship", "business studies"],
  },
  {
    id: "second_language_sinhala",
    displayName: "Second Language (Sinhala)",
    searchTerms: ["second language sinhala", "sinhala second"],
  },
  {
    id: "second_language_tamil",
    displayName: "Second Language (Tamil)",
    searchTerms: ["second language tamil", "tamil second"],
  },
  { id: "pali", displayName: "Pali", searchTerms: ["pali"] },
  { id: "sanskrit", displayName: "Sanskrit", searchTerms: ["sanskrit"] },
  { id: "french", displayName: "French", searchTerms: ["french"] },
  { id: "german", displayName: "German", searchTerms: ["german"] },
  { id: "hindi", displayName: "Hindi", searchTerms: ["hindi"] },
  { id: "japanese", displayName: "Japanese", searchTerms: ["japanese"] },
  { id: "arabic", displayName: "Arabic", searchTerms: ["arabic"] },
  { id: "korean", displayName: "Korean", searchTerms: ["korean"] },
  { id: "chinese", displayName: "Chinese", searchTerms: ["chinese"] },
  { id: "russian", displayName: "Russian", searchTerms: ["russian"] },

  // Category II subjects
  {
    id: "music_oriental",
    displayName: "Music (Oriental)",
    searchTerms: ["music oriental", "oriental music"],
  },
  {
    id: "music_western",
    displayName: "Music (Western)",
    searchTerms: ["music western", "western music"],
  },
  {
    id: "music_carnatic",
    displayName: "Music (Carnatic)",
    searchTerms: ["music carnatic", "carnatic music"],
  },
  {
    id: "dancing_oriental",
    displayName: "Art Dancing (Oriental)",
    searchTerms: ["dancing oriental", "oriental dancing", "art dancing"],
  },
  {
    id: "dancing_bharata",
    displayName: "Dancing (Bharata)",
    searchTerms: ["dancing bharata", "bharata dancing", "bharatanatyam"],
  },
  {
    id: "english_literary_texts",
    displayName: "Appreciation of English Literary Texts",
    searchTerms: ["english literature", "english literary texts"],
  },
  {
    id: "sinhala_literary_texts",
    displayName: "Appreciation of Sinhala Literary Texts",
    searchTerms: ["sinhala literature", "sinhala literary texts"],
  },
  {
    id: "tamil_literary_texts",
    displayName: "Appreciation of Tamil Literary Texts",
    searchTerms: ["tamil literature", "tamil literary texts"],
  },
  {
    id: "arabic_literary_texts",
    displayName: "Appreciation of Arabic Literary Texts",
    searchTerms: ["arabic literature", "arabic literary texts"],
  },
  {
    id: "drama_theatre",
    displayName: "Drama and Theatre",
    searchTerms: ["drama", "theatre", "drama and theatre"],
  },

  // Category III subjects
  {
    id: "ict",
    displayName: "Information & Communication Technology",
    searchTerms: ["ict", "information technology", "computer", "computing"],
  },
  {
    id: "agriculture_food_technology",
    displayName: "Agriculture & Food Technology",
    searchTerms: ["agriculture", "food technology", "farming"],
  },
  {
    id: "aquatic_bioresources",
    displayName: "Aquatic Bioresources Technology",
    searchTerms: [
      "aquatic bioresources",
      "aquatic resources",
      "marine biology",
    ],
  },
  {
    id: "art_crafts",
    displayName: "Art & Crafts",
    searchTerms: ["art and crafts", "arts", "crafts"],
  },
  {
    id: "home_economics",
    displayName: "Home Economics",
    searchTerms: ["home economics", "home science"],
  },
  {
    id: "health_physical_education",
    displayName: "Health & Physical Education",
    searchTerms: [
      "health and physical education",
      "physical education",
      "sports",
      "pe",
    ],
  },
  {
    id: "communication_media",
    displayName: "Communication & Media Studies",
    searchTerms: ["communication and media", "media studies"],
  },
  {
    id: "design_construction",
    displayName: "Design & Construction Technology",
    searchTerms: ["design and construction", "construction technology"],
  },
  {
    id: "design_mechanical",
    displayName: "Design & Mechanical Technology",
    searchTerms: ["design and mechanical", "mechanical technology"],
  },
  {
    id: "design_electrical_electronic",
    displayName: "Design, Electrical & Electronic Technology",
    searchTerms: [
      "design electrical electronic",
      "electrical technology",
      "electronic technology",
      "electronics",
    ],
  },
];

// Helper functions
export function getSubjectById(id: string): Subject | undefined {
  return SUBJECTS.find((subject) => subject.id === id);
}

export function getSubjectDisplayName(id: string): string {
  const subject = getSubjectById(id);
  return subject?.displayName || id;
}

export function searchSubjects(query: string): Subject[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return SUBJECTS;

  return SUBJECTS.filter(
    (subject) =>
      subject.displayName.toLowerCase().includes(normalizedQuery) ||
      subject.id.includes(normalizedQuery) ||
      subject.searchTerms.some((term) => term.includes(normalizedQuery)),
  );
}

// Export all subject IDs as a union type for TypeScript validation
export type SubjectId = (typeof SUBJECTS)[number]["id"];

// All valid subject IDs as an array for validation
export const SUBJECT_IDS = SUBJECTS.map((s) => s.id);

// Subject validation
export function isValidSubject(id: string): id is SubjectId {
  return SUBJECTS.some((subject) => subject.id === id);
}
