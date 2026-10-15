/**
 * CORE-LYRICS · Motor Fonético y de Métricas Poéticas en Español
 * Algoritmo avanzado de silabeo, acentuación tónica, sinalefas y kernels de rima para rap.
 */

const VOWELS_STRONG = new Set(['a', 'e', 'o', 'á', 'é', 'ó']);
const VOWELS_WEAK = new Set(['i', 'u', 'ü']);
const VOWELS_WEAK_ACCENTED = new Set(['í', 'ú']);
const ALL_VOWELS = new Set(['a', 'e', 'o', 'á', 'é', 'ó', 'i', 'u', 'ü', 'í', 'ú']);

// Inseparable consonant onset blends in Spanish
const INSEPARABLE_ONSET = [
  'pr', 'br', 'tr', 'dr', 'cr', 'kr', 'gr', 'fr',
  'pl', 'bl', 'cl', 'kl', 'gl', 'fl',
  'ch', 'll', 'rr', 'qu', 'gu'
];

export interface SyllableInfo {
  syllables: string[];
  count: number;
  tonicIndex: number; // 0-indexed from left
  stressType: 'aguda' | 'llana' | 'esdrujula' | 'sobresdrujula';
  accentVowels: string[];
  rhymeKernelConsonant: string;
  rhymeKernelAssonant: string;
}

/**
 * Clean a word for phonetic processing (lowercase, remove punctuation, keep accents/ñ/ü)
 */
export function cleanWord(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-záéíóúüñ]/g, '');
}

/**
 * Checks if a character is a Spanish vowel
 */
export function isVowel(char: string): boolean {
  return ALL_VOWELS.has(char.toLowerCase());
}

/**
 * Checks if a character or phoneme behaves as a vowel sound (including final 'y')
 */
export function isVowelSound(char: string): boolean {
  const c = char.toLowerCase();
  return ALL_VOWELS.has(c) || c === 'y';
}

/**
 * Normalizes sounds for rap phonetics (seseo, yeísmo, b/v equality, silent h, silent u in qu/gu)
 */
export function normalizePhonetics(text: string): string {
  let s = text.toLowerCase();

  // Normalize silent u in qu and gu (unless written with dieresis ü)
  s = s.replace(/qu([eéií])/g, 'k$1');
  s = s.replace(/gu([eéií])/g, 'g$1');
  s = s.replace(/gü([eéií])/g, 'gu$1');

  // Word-final 'y' or isolated 'y' sounds like 'i'
  s = s.replace(/y(\b|[^\wáéíóú])/g, 'i$1');

  return s
    .replace(/[bv]/g, 'b')
    .replace(/[zc]/g, (m, offset, full) => {
      if (m === 'c') {
        const next = full[offset + 1];
        if (next === 'e' || next === 'i' || next === 'é' || next === 'í') return 's';
        return 'k';
      }
      return 's';
    })
    .replace(/k/g, 'k')
    .replace(/ll/g, 'y')
    .replace(/h/g, '') // Silent h in Spanish
    .replace(/w/g, 'u');
}

/**
 * Extracts phonetic vowels from a word, eliminating silent 'u' in qu/gu and converting final 'y'
 */
export function getPhoneticVowels(word: string, stripAccents: boolean = true): string[] {
  let s = cleanWord(word);
  if (!s) return [];

  // Handle silent u in que, qui, gue, gui (keeping gü)
  s = s.replace(/qu([eéií])/g, 'k$1');
  s = s.replace(/gu([eéií])/g, 'g$1');
  s = s.replace(/gü([eéií])/g, 'gu$1');
  s = s.replace(/y$/g, 'i');
  if (s === 'y') s = 'i';

  const chars = s.split('');
  const vowels: string[] = [];

  for (const c of chars) {
    if (ALL_VOWELS.has(c)) {
      if (stripAccents) {
        vowels.push(c.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      } else {
        vowels.push(c);
      }
    }
  }

  return vowels;
}

/**
 * Divides a Spanish word into orthographic syllables
 */
export function syllabify(rawWord: string): string[] {
  const word = cleanWord(rawWord);
  if (!word) return [];
  if (word.length <= 2) return [word];

  const chars = word.split('');
  const n = chars.length;
  const cuts: number[] = []; // indices after which a cut occurs

  let i = 0;
  while (i < n) {
    // Check if current position is a vowel (or silent u in qu/gu)
    const isSilentU =
      i > 0 &&
      chars[i] === 'u' &&
      (chars[i - 1] === 'q' || chars[i - 1] === 'g') &&
      i + 1 < n &&
      ['e', 'i', 'é', 'í'].includes(chars[i + 1]);

    if (!isVowel(chars[i]) || isSilentU) {
      i++;
      continue;
    }

    // Found a vowel nucleus or diphthong/triphthong cluster
    const vStart = i;
    while (i < n) {
      const isCurSilentU =
        i > 0 &&
        chars[i] === 'u' &&
        (chars[i - 1] === 'q' || chars[i - 1] === 'g') &&
        i + 1 < n &&
        ['e', 'i', 'é', 'í'].includes(chars[i + 1]);

      if (!isVowel(chars[i]) || isCurSilentU) {
        break;
      }

      // Check for hiatus (strong + strong, or strong + tonic weak, or tonic weak + strong)
      if (i > vStart) {
        const prev = chars[i - 1];
        const curr = chars[i];

        const isPrevStrong = VOWELS_STRONG.has(prev) || VOWELS_WEAK_ACCENTED.has(prev);
        const isCurrStrong = VOWELS_STRONG.has(curr) || VOWELS_WEAK_ACCENTED.has(curr);

        if (isPrevStrong && isCurrStrong) {
          // Hiatus! Cut between the two vowels
          cuts.push(i - 1);
        }
      }
      i++;
    }

    // Count consonants between this nucleus and the next vowel
    const cStart = i;
    while (i < n && (!isVowel(chars[i]) || (
      chars[i] === 'u' &&
      i > 0 &&
      (chars[i - 1] === 'q' || chars[i - 1] === 'g') &&
      i + 1 < n &&
      ['e', 'i', 'é', 'í'].includes(chars[i + 1])
    ))) {
      i++;
    }
    const cEnd = i;
    const cCount = cEnd - cStart;

    if (cCount === 0) {
      continue;
    }

    if (i >= n) {
      // Word ended in consonants, they attach to current syllable
      break;
    }

    // We have consonants between two vowels: V C... V
    const cGroup = chars.slice(cStart, cEnd).join('');

    if (cCount === 1) {
      // Single consonant goes with next syllable
      cuts.push(cStart - 1);
    } else if (cCount === 2) {
      // Check if it's an inseparable onset group
      if (INSEPARABLE_ONSET.includes(cGroup)) {
        cuts.push(cStart - 1);
      } else {
        cuts.push(cStart);
      }
    } else if (cCount === 3) {
      // Check if last two form an inseparable onset
      const lastTwo = cGroup.slice(1);
      if (INSEPARABLE_ONSET.includes(lastTwo)) {
        cuts.push(cStart);
      } else {
        cuts.push(cStart + 1);
      }
    } else {
      // 4 consonants: usually two and two (e.g., cons-truir)
      cuts.push(cStart + 1);
    }
  }

  // Build syllable array from cut points
  const result: string[] = [];
  let prevCut = 0;
  const sortedCuts = Array.from(new Set(cuts)).sort((a, b) => a - b);

  for (const cut of sortedCuts) {
    if (cut >= prevCut && cut < n - 1) {
      result.push(word.slice(prevCut, cut + 1));
      prevCut = cut + 1;
    }
  }
  if (prevCut < n) {
    result.push(word.slice(prevCut));
  }

  return result.length > 0 ? result : [word];
}

/**
 * Determines stress position (tonic syllable) and extracts rhyme kernels
 */
export function analyzeWordPhonetics(rawWord: string): SyllableInfo {
  const word = cleanWord(rawWord);
  const syllables = syllabify(word);
  const count = syllables.length;

  if (count === 0) {
    return {
      syllables: [],
      count: 0,
      tonicIndex: -1,
      stressType: 'llana',
      accentVowels: [],
      rhymeKernelConsonant: '',
      rhymeKernelAssonant: ''
    };
  }

  // 1. Look for explicit tilde (á, é, í, ó, ú)
  let tonicIndex = -1;
  for (let s = 0; s < count; s++) {
    if (/[áéíóú]/.test(syllables[s])) {
      tonicIndex = s;
      break;
    }
  }

  // 2. Default stress rules if no tilde
  if (tonicIndex === -1) {
    const lastChar = word.slice(-1);
    if (['a', 'e', 'i', 'o', 'u', 'n', 's'].includes(lastChar)) {
      // Llana (penultimate) if word has >= 2 syllables, else aguda
      tonicIndex = count >= 2 ? count - 2 : count - 1;
    } else {
      // Aguda (last) - includes words ending in 'y' like rey, estoy, convoy
      tonicIndex = count - 1;
    }
  }

  // Determine stress classification
  const fromEnd = count - 1 - tonicIndex;
  let stressType: SyllableInfo['stressType'] = 'llana';
  if (fromEnd === 0) stressType = 'aguda';
  else if (fromEnd === 1) stressType = 'llana';
  else if (fromEnd === 2) stressType = 'esdrujula';
  else stressType = 'sobresdrujula';

  // Extract from tonic vowel to end of word
  const tonicSyl = syllables[tonicIndex];

  // In tonic syllable, find the tonic vowel index:
  // - If there is an accented vowel (á, é, í, ó, ú), that's it.
  // - In diphthongs without accent (e.g. cie, fue), the strong vowel (a, e, o) carries the stress.
  // - Otherwise, first vowel.
  let tonicVowelSubIndex = -1;
  for (let c = 0; c < tonicSyl.length; c++) {
    if (/[áéíóú]/.test(tonicSyl[c])) {
      tonicVowelSubIndex = c;
      break;
    }
  }

  if (tonicVowelSubIndex === -1) {
    for (let c = 0; c < tonicSyl.length; c++) {
      if (VOWELS_STRONG.has(tonicSyl[c])) {
        tonicVowelSubIndex = c;
        break;
      }
    }
  }

  if (tonicVowelSubIndex === -1) {
    for (let c = 0; c < tonicSyl.length; c++) {
      if (isVowel(tonicSyl[c])) {
        tonicVowelSubIndex = c;
        break;
      }
    }
  }

  const tonicRemainder = tonicVowelSubIndex >= 0 ? tonicSyl.slice(tonicVowelSubIndex) : tonicSyl;
  const subsequentSyllables = syllables.slice(tonicIndex + 1).join('');
  const fullRhymeEnding = (tonicRemainder + subsequentSyllables).toLowerCase();

  // Normalize phonetic consonant kernel
  const normalizedConsonant = normalizePhonetics(fullRhymeEnding);

  // Extract assonant vowel kernel (from tonic vowel to end, normalized and without silent u)
  const phoneticVowels = getPhoneticVowels(fullRhymeEnding, true);
  const vowelsOnly = phoneticVowels.join('-');

  // Extract all vowels in word per syllable
  const accentVowels = syllables.map(s => {
    return getPhoneticVowels(s, true).join('');
  });

  return {
    syllables,
    count,
    tonicIndex,
    stressType,
    accentVowels,
    rhymeKernelConsonant: normalizedConsonant,
    rhymeKernelAssonant: vowelsOnly
  };
}

/**
 * Counts syllables of an entire verse/line, with poetic sinalefas and stress adjustments
 */
export function countVerseSyllables(line: string): {
  pureSyllables: number;
  metricSyllables: number;
  wordCount: number;
  lastStressAdjustment: number;
  words: { text: string; count: number; info: SyllableInfo }[];
} {
  const trimmed = line.trim();
  if (!trimmed) {
    return {
      pureSyllables: 0,
      metricSyllables: 0,
      wordCount: 0,
      lastStressAdjustment: 0,
      words: []
    };
  }

  // Tokenize words
  const rawWords = trimmed.split(/\s+/).filter(w => cleanWord(w).length > 0);
  let pureSyllables = 0;
  let sinalefas = 0;

  const analyzedWords = rawWords.map(w => {
    const info = analyzeWordPhonetics(w);
    pureSyllables += info.count;
    return { text: w, count: info.count, info };
  });

  // Check for sinalefa between adjacent words
  for (let i = 0; i < analyzedWords.length - 1; i++) {
    const rawCurrent = analyzedWords[i].text;
    const currentWord = cleanWord(rawCurrent);
    const nextWord = cleanWord(analyzedWords[i + 1].text);

    // Strong punctuation breaks poetic sinalefa (period, semicolon, colon, question/exclamation)
    const hasStrongBreak = /[.;:!?]$/.test(rawCurrent.trim());
    if (hasStrongBreak) continue;

    if (currentWord && nextWord) {
      const endsInVowel = isVowel(currentWord.slice(-1)) || currentWord.endsWith('y');
      const startsWithVowel =
        isVowel(nextWord[0]) ||
        (nextWord[0] === 'h' && nextWord[1] && isVowel(nextWord[1])) ||
        nextWord === 'y' ||
        (nextWord.startsWith('y') && !isVowel(nextWord[1] || ''));

      if (endsInVowel && startsWithVowel) {
        sinalefas++;
      }
    }
  }

  // Metric adjustment based on the final word's stress (Ley de Métrica Española)
  let lastStressAdjustment = 0;
  if (analyzedWords.length > 0) {
    const lastWord = analyzedWords[analyzedWords.length - 1];
    if (lastWord.info.stressType === 'aguda') {
      lastStressAdjustment = +1;
    } else if (lastWord.info.stressType === 'esdrujula') {
      lastStressAdjustment = -1;
    } else if (lastWord.info.stressType === 'sobresdrujula') {
      lastStressAdjustment = -2;
    }
  }

  const metricSyllables = Math.max(1, pureSyllables - sinalefas + lastStressAdjustment);

  return {
    pureSyllables,
    metricSyllables,
    wordCount: analyzedWords.length,
    lastStressAdjustment,
    words: analyzedWords
  };
}
