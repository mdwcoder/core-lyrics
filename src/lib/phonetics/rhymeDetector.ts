import {
  cleanWord,
  isVowel,
  analyzeWordPhonetics,
  countVerseSyllables,
  SyllableInfo,
  normalizePhonetics,
  getPhoneticVowels
} from './syllables';

export type FlowMarker = 'default' | 'triplet' | 'double_tempo' | 'pause' | 'melodic';

export interface RhymeColorDefinition {
  id: string; // 'A', 'B', 'C', ...
  bg: string;
  border: string;
  text: string;
  hex: string;
  name: string;
}

export const RHYME_PALETTE: RhymeColorDefinition[] = [
  { id: 'A', bg: 'rgba(245, 158, 11, 0.22)', border: '#f59e0b', text: '#fbbf24', hex: '#f59e0b', name: 'Oro Ámbar' },
  { id: 'B', bg: 'rgba(6, 182, 212, 0.22)', border: '#06b6d4', text: '#22d3ee', hex: '#06b6d4', name: 'Cian Neón' },
  { id: 'C', bg: 'rgba(236, 72, 153, 0.22)', border: '#ec4899', text: '#f472b6', hex: '#ec4899', name: 'Rosa Punch' },
  { id: 'D', bg: 'rgba(16, 185, 129, 0.22)', border: '#10b981', text: '#34d399', hex: '#10b981', name: 'Verde Ácido' },
  { id: 'E', bg: 'rgba(139, 92, 246, 0.22)', border: '#8b5cf6', text: '#a78bfa', hex: '#8b5cf6', name: 'Violeta Eléctrico' },
  { id: 'F', bg: 'rgba(249, 115, 22, 0.22)', border: '#f97316', text: '#fb923c', hex: '#f97316', name: 'Naranja Llama' },
  { id: 'G', bg: 'rgba(20, 184, 166, 0.22)', border: '#14b8a6', text: '#2dd4bf', hex: '#14b8a6', name: 'Turquesa Trap' },
  { id: 'H', bg: 'rgba(225, 29, 72, 0.22)', border: '#e11d48', text: '#fb7185', hex: '#e11d48', name: 'Carmesí Drill' },
  { id: 'I', bg: 'rgba(234, 179, 8, 0.22)', border: '#eab308', text: '#fde047', hex: '#eab308', name: 'Amarillo Flow' },
  { id: 'J', bg: 'rgba(59, 130, 246, 0.22)', border: '#3b82f6', text: '#60a5fa', hex: '#3b82f6', name: 'Azul BoomBap' },
  { id: 'K', bg: 'rgba(168, 85, 247, 0.22)', border: '#a855f7', text: '#c084fc', hex: '#a855f7', name: 'Lavanda Rap' },
  { id: 'L', bg: 'rgba(132, 204, 22, 0.22)', border: '#84cc16', text: '#a3e635', hex: '#84cc16', name: 'Lima Freestyle' }
];

export interface HighlightSpan {
  start: number;
  end: number;
  text: string;
  letter: string;
  color: RhymeColorDefinition;
  type: 'multisyllabic' | 'consonant' | 'assonant' | 'repetition' | 'internal';
  pattern: string;
  tooltip: string;
}

export interface LineWordRef {
  text: string;
  clean: string;
  startIndex: number;
  endIndex: number;
  info: SyllableInfo;
}

export interface AlliterationMatch {
  sound: string;
  count: number;
  words: string[];
}

export interface MirrorVerseMatch {
  type: 'retruécano' | 'quiasmo_rima';
  partnerLine: number;
  detail: string;
}

export interface LineAnalysis {
  lineIndex: number;
  barNumber: number;
  rawText: string;
  pureSyllables: number;
  metricSyllables: number;
  lastStressAdjustment: number;
  flowMarker: FlowMarker;
  rhymeLetter: string | null;
  rhymeColor: RhymeColorDefinition | null;
  rhymeType: 'multisyllabic' | 'consonant' | 'assonant' | 'repetition' | null;
  rhymeDetail: string | null;
  barScheme: string; // e.g. "CB", "BC", "AA", "A"
  alliteration: AlliterationMatch | null;
  mirrorVerse: MirrorVerseMatch | null; // Retruécano / Quiasmo
  highlightSpans: HighlightSpan[];
  words: LineWordRef[];
  stanzaIndex: number;
  barInStanza: number;
}

export interface StanzaAnalysis {
  stanzaIndex: number;
  barStart: number;
  barEnd: number;
  barCount: number;
  totalMetricSyllables: number;
  averageSyllables: number;
  scheme: string; // e.g. "CB BC AA AA" or "A A B B"
  lines: LineAnalysis[];
}

export interface SongAnalysis {
  lines: LineAnalysis[];
  stanzas: StanzaAnalysis[];
  rhymeFamilies: {
    letter: string;
    color: RhymeColorDefinition;
    type: 'multisyllabic' | 'consonant' | 'assonant' | 'repetition';
    pattern: string;
    wordCount: number;
    lines: number[];
    sampleWords: string[];
  }[];
  totalBars: number;
  totalSyllables: number;
  averageSyllablesPerBar: number;
  multisyllabicCount: number;
  consonantCount: number;
  assonantCount: number;
  alliterationsCount: number;
  mirrorVersesCount: number;
}

// Consonant onset patterns and clusters for alliteration in Spanish rap
const ALLITERATION_PATTERNS = [
  'tr', 'pr', 'br', 'cr', 'kr', 'gr', 'fr', 'dr',
  'pl', 'bl', 'cl', 'kl', 'gl', 'fl',
  'ch', 'll', 'rr', 'r', 's', 'p', 't', 'k', 'm', 'b', 'f'
];

/**
 * Detects alliteration in a line (sound repetition like 'tr', 'r', 's' >= 3 times)
 */
function detectAlliteration(words: LineWordRef[]): AlliterationMatch | null {
  if (words.length < 3) return null;

  const patternCounts: Record<string, { count: number; matchedWords: string[] }> = {};

  for (const word of words) {
    const clean = word.clean;
    if (clean.length < 2) continue;

    for (const pat of ALLITERATION_PATTERNS) {
      // Check if word starts with pat or contains strong repetition
      const regex = new RegExp(`\\b${pat}|${pat}`, 'g');
      const matches = clean.match(regex);
      if (matches && matches.length > 0) {
        if (!patternCounts[pat]) {
          patternCounts[pat] = { count: 0, matchedWords: [] };
        }
        patternCounts[pat].count += matches.length;
        patternCounts[pat].matchedWords.push(word.text);
      }
    }
  }

  // Find pattern with >= 3 occurrences across words
  let bestPattern: string | null = null;
  let maxCount = 2; // threshold is 3+

  for (const pat of Object.keys(patternCounts)) {
    const data = patternCounts[pat];
    // Must be in at least 2 distinct words and count >= 3
    const distinctWords = new Set(data.matchedWords).size;
    if (data.count >= 3 && distinctWords >= 2) {
      // Prefer multi-consonant clusters like 'tr', 'cr', 'br' over single letters
      const weight = pat.length > 1 ? data.count * 1.5 : data.count;
      if (weight > maxCount) {
        maxCount = weight;
        bestPattern = pat;
      }
    }
  }

  if (bestPattern) {
    return {
      sound: bestPattern,
      count: patternCounts[bestPattern].count,
      words: Array.from(new Set(patternCounts[bestPattern].matchedWords))
    };
  }

  return null;
}

/**
 * Extracts the cadence of the last 2-4 vowels from a verse's ending
 */
function extractVowelCadence(words: LineWordRef[], count: number = 3): { vowels: string; textSpan: string } {
  if (words.length === 0) return { vowels: '', textSpan: '' };

  const collectedVowels: string[] = [];
  const matchedWords: string[] = [];

  for (let w = words.length - 1; w >= 0; w--) {
    const word = words[w];
    matchedWords.unshift(word.text);
    const wVowels = getPhoneticVowels(word.clean, true);

    for (let vi = wVowels.length - 1; vi >= 0; vi--) {
      collectedVowels.unshift(wVowels[vi]);
      if (collectedVowels.length >= count) {
        return {
          vowels: collectedVowels.join('-'),
          textSpan: matchedWords.join(' ')
        };
      }
    }
  }

  return {
    vowels: collectedVowels.join('-'),
    textSpan: matchedWords.join(' ')
  };
}

/**
 * Checks if two verse endings form a multi-syllabic rhyme (2, 3 or 4 vowels in common cadence)
 */
function getMultisyllabicScore(wordsA: LineWordRef[], wordsB: LineWordRef[]): {
  isMulti: boolean;
  syllableDepth: number;
  cadence: string;
} {
  if (wordsA.length === 0 || wordsB.length === 0) {
    return { isMulti: false, syllableDepth: 0, cadence: '' };
  }

  for (const depth of [4, 3, 2]) {
    const cadA = extractVowelCadence(wordsA, depth);
    const cadB = extractVowelCadence(wordsB, depth);

    if (
      cadA.vowels &&
      cadB.vowels &&
      cadA.vowels === cadB.vowels &&
      cadA.vowels.split('-').length >= depth
    ) {
      return { isMulti: true, syllableDepth: depth, cadence: cadA.vowels };
    }
  }

  return { isMulti: false, syllableDepth: 0, cadence: '' };
}

/**
 * Analyzes full song lyrics text and detects rhymes, syllables, stanzas, and schemes
 */
export function analyzeSongLyrics(
  text: string,
  customFlowMarkers: Record<number, FlowMarker> = {}
): SongAnalysis {
  const rawLines = text.split('\n');
  const lineAnalyses: LineAnalysis[] = [];

  let currentBar = 1;
  let currentStanza = 0;
  let barInStanza = 1;

  // 1. First pass: tokenize and extract metrics for each line
  for (let idx = 0; idx < rawLines.length; idx++) {
    const lineText = rawLines[idx];
    const isBlank = lineText.trim().length === 0;

    if (isBlank) {
      if (lineAnalyses.length > 0 && lineAnalyses[lineAnalyses.length - 1].rawText.trim().length > 0) {
        currentStanza++;
        barInStanza = 1;
      }
      continue;
    }

    if (barInStanza > 8) {
      currentStanza++;
      barInStanza = 1;
    }

    const metric = countVerseSyllables(lineText);

    // Extract word positions in line
    const wordRefs: LineWordRef[] = [];
    const regex = /[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineText)) !== null) {
      const wordStr = match[0];
      const clean = cleanWord(wordStr);
      if (clean) {
        wordRefs.push({
          text: wordStr,
          clean,
          startIndex: match.index,
          endIndex: match.index + wordStr.length,
          info: analyzeWordPhonetics(wordStr)
        });
      }
    }

    // Detect alliteration in this line
    const allit = detectAlliteration(wordRefs);

    lineAnalyses.push({
      lineIndex: idx,
      barNumber: currentBar++,
      rawText: lineText,
      pureSyllables: metric.pureSyllables,
      metricSyllables: metric.metricSyllables,
      lastStressAdjustment: metric.lastStressAdjustment,
      flowMarker: customFlowMarkers[idx] || 'default',
      rhymeLetter: null,
      rhymeColor: null,
      rhymeType: null,
      rhymeDetail: null,
      barScheme: '',
      alliteration: allit,
      mirrorVerse: null,
      highlightSpans: [],
      words: wordRefs,
      stanzaIndex: currentStanza,
      barInStanza: barInStanza++
    });
  }

  // 2. Second pass: Match rhymes between line endings and internal lines
  const familyMap: Map<number, {
    letter: string;
    color: RhymeColorDefinition;
    type: 'multisyllabic' | 'consonant' | 'assonant' | 'repetition';
    pattern: string;
  }> = new Map();

  let paletteIndex = 0;

  for (let i = 0; i < lineAnalyses.length; i++) {
    const lineA = lineAnalyses[i];
    if (lineA.words.length === 0) continue;

    const lastWordA = lineA.words[lineA.words.length - 1];

    for (let j = i + 1; j < lineAnalyses.length; j++) {
      const lineB = lineAnalyses[j];
      if (lineB.words.length === 0) continue;

      if (j - i > 12) continue;

      const lastWordB = lineB.words[lineB.words.length - 1];

      const famA = familyMap.get(i);
      const famB = familyMap.get(j);

      const isRepetition = lastWordA.clean === lastWordB.clean && lastWordA.clean.length > 2;
      const multi = getMultisyllabicScore(lineA.words, lineB.words);

      const isConsonant =
        lastWordA.info.rhymeKernelConsonant &&
        lastWordA.info.rhymeKernelConsonant.length >= 2 &&
        lastWordA.info.rhymeKernelConsonant === lastWordB.info.rhymeKernelConsonant;

      const isAssonant =
        lastWordA.info.rhymeKernelAssonant &&
        lastWordA.info.rhymeKernelAssonant.length >= 1 &&
        lastWordA.info.rhymeKernelAssonant === lastWordB.info.rhymeKernelAssonant;

      if (isRepetition || multi.isMulti || isConsonant || isAssonant) {
        let rhymeType: 'multisyllabic' | 'consonant' | 'assonant' | 'repetition' = 'assonant';
        let pattern = '';

        if (multi.isMulti && multi.syllableDepth >= 3) {
          rhymeType = 'multisyllabic';
          pattern = `Multi ${multi.syllableDepth}s [${multi.cadence}]`;
        } else if (isConsonant) {
          rhymeType = 'consonant';
          pattern = `Consonante -${lastWordA.info.rhymeKernelConsonant}`;
        } else if (multi.isMulti && multi.syllableDepth === 2) {
          rhymeType = 'multisyllabic';
          pattern = `Multi 2s [${multi.cadence}]`;
        } else if (isRepetition) {
          rhymeType = 'repetition';
          pattern = `Repetición: "${lastWordA.clean}"`;
        } else {
          rhymeType = 'assonant';
          pattern = `Asonante [${lastWordA.info.rhymeKernelAssonant}]`;
        }

        let targetFamily = famA || famB;
        if (!targetFamily) {
          const colorDef = RHYME_PALETTE[paletteIndex % RHYME_PALETTE.length];
          const letter = colorDef.id;
          paletteIndex++;
          targetFamily = {
            letter,
            color: colorDef,
            type: rhymeType,
            pattern
          };
        }

        familyMap.set(i, targetFamily);
        familyMap.set(j, targetFamily);
      }
    }
  }

  // 3. Third pass: apply families and build highlight spans
  const rhymeFamiliesSummary: SongAnalysis['rhymeFamilies'] = [];
  const familyBuckets: Record<string, {
    letter: string;
    color: RhymeColorDefinition;
    type: 'multisyllabic' | 'consonant' | 'assonant' | 'repetition';
    pattern: string;
    wordCount: number;
    lines: number[];
    sampleWords: Set<string>;
  }> = {};

  for (let i = 0; i < lineAnalyses.length; i++) {
    const line = lineAnalyses[i];
    const fam = familyMap.get(i);

    const internalLetters: string[] = [];

    if (fam && line.words.length > 0) {
      line.rhymeLetter = fam.letter;
      line.rhymeColor = fam.color;
      line.rhymeType = fam.type;
      line.rhymeDetail = fam.pattern;

      const lastWord = line.words[line.words.length - 1];
      const spanWords = fam.type === 'multisyllabic' && line.words.length >= 2
        ? line.words.slice(-2)
        : [lastWord];

      const start = spanWords[0].startIndex;
      const end = spanWords[spanWords.length - 1].endIndex;
      const spanText = line.rawText.substring(start, end);

      line.highlightSpans.push({
        start,
        end,
        text: spanText,
        letter: fam.letter,
        color: fam.color,
        type: fam.type,
        pattern: fam.pattern,
        tooltip: `${fam.letter} · ${fam.pattern}`
      });

      // Also detect potential internal rhymes within the line matching any known family or line ending
      for (let w = 0; w < line.words.length - spanWords.length; w++) {
        const iw = line.words[w];
        if (iw.clean.length <= 2) continue;

        // Check against current line ending
        const isMatchCurrent =
          iw.clean === lastWord.clean ||
          (iw.info.rhymeKernelConsonant && iw.info.rhymeKernelConsonant === lastWord.info.rhymeKernelConsonant) ||
          (iw.info.rhymeKernelAssonant && iw.info.rhymeKernelAssonant.length >= 2 && iw.info.rhymeKernelAssonant === lastWord.info.rhymeKernelAssonant);

        if (isMatchCurrent) {
          line.highlightSpans.push({
            start: iw.startIndex,
            end: iw.endIndex,
            text: iw.text,
            letter: fam.letter,
            color: fam.color,
            type: 'internal',
            pattern: `Rima interna con ${lastWord.text}`,
            tooltip: `Rima interna [${fam.letter}]`
          });
          internalLetters.push(fam.letter);
        } else {
          // Check if iw matches any other line's rhyme family!
          for (let otherIdx = 0; otherIdx < lineAnalyses.length; otherIdx++) {
            if (otherIdx === i) continue;
            const otherFam = familyMap.get(otherIdx);
            const otherLine = lineAnalyses[otherIdx];
            if (!otherFam || otherLine.words.length === 0) continue;
            const otherLastWord = otherLine.words[otherLine.words.length - 1];

            const isMatchOther =
              iw.clean === otherLastWord.clean ||
              (iw.info.rhymeKernelConsonant && iw.info.rhymeKernelConsonant === otherLastWord.info.rhymeKernelConsonant) ||
              (iw.info.rhymeKernelAssonant && iw.info.rhymeKernelAssonant.length >= 2 && iw.info.rhymeKernelAssonant === otherLastWord.info.rhymeKernelAssonant);

            if (isMatchOther && otherFam.letter !== fam.letter) {
              line.highlightSpans.push({
                start: iw.startIndex,
                end: iw.endIndex,
                text: iw.text,
                letter: otherFam.letter,
                color: otherFam.color,
                type: 'internal',
                pattern: `Rima interna cruzada con barra #${otherLine.barNumber}`,
                tooltip: `Rima interna cruzada [${otherFam.letter}]`
              });
              internalLetters.push(otherFam.letter);
              break;
            }
          }
        }
      }

      // Compute compound barScheme (e.g. "CB", "BC", "AA", or just "A")
      if (internalLetters.length > 0) {
        line.barScheme = `${internalLetters[0]}${fam.letter}`;
      } else {
        line.barScheme = fam.letter;
      }

      // Summary collection
      if (!familyBuckets[fam.letter]) {
        familyBuckets[fam.letter] = {
          letter: fam.letter,
          color: fam.color,
          type: fam.type,
          pattern: fam.pattern,
          wordCount: 0,
          lines: [],
          sampleWords: new Set()
        };
      }
      familyBuckets[fam.letter].wordCount++;
      familyBuckets[fam.letter].lines.push(line.barNumber);
      familyBuckets[fam.letter].sampleWords.add(lastWord.clean);
    } else {
      line.barScheme = '-';
    }
  }

  // 4. Fourth pass: Detect "Versos al revés" (Retruécano / Quiasmo / Mirror Rhymes)
  // Technique 1: Chiasmus of compound bar schemes (e.g. CB followed by BC, or AB followed by BA)
  // Technique 2: Word-level Retruécano (e.g. "vivo ... rimar" / "rimo ... vivir")
  let mirrorVersesCount = 0;

  for (let i = 0; i < lineAnalyses.length - 1; i++) {
    const l1 = lineAnalyses[i];
    const l2 = lineAnalyses[i + 1];

    if (l1.words.length === 0 || l2.words.length === 0) continue;

    // Check 1: Scheme Inversion (e.g. "CB" and "BC", or "AB" and "BA")
    if (
      l1.barScheme.length === 2 &&
      l2.barScheme.length === 2 &&
      l1.barScheme[0] === l2.barScheme[1] &&
      l1.barScheme[1] === l2.barScheme[0] &&
      l1.barScheme[0] !== l1.barScheme[1]
    ) {
      const detail = `Quiasmo de rimas: ${l1.barScheme} ⇄ ${l2.barScheme}`;
      l1.mirrorVerse = { type: 'quiasmo_rima', partnerLine: l2.barNumber, detail };
      l2.mirrorVerse = { type: 'quiasmo_rima', partnerLine: l1.barNumber, detail };
      mirrorVersesCount++;
      continue;
    }

    // Check 2: Word-level Retruécano (inverted meaningful words)
    // Find two distinct words in l1 that appear in l2 in reversed order
    const words1 = l1.words.map(w => w.clean).filter(w => w.length > 3);
    const words2 = l2.words.map(w => w.clean).filter(w => w.length > 3);

    let foundRetruecano = false;
    for (let wA = 0; wA < words1.length; wA++) {
      for (let wB = wA + 1; wB < words1.length; wB++) {
        const rootA = words1[wA].slice(0, 4);
        const rootB = words1[wB].slice(0, 4);

        // Look for rootB before rootA in words2
        const posBIn2 = words2.findIndex(w => w.startsWith(rootB));
        const posAIn2 = words2.findIndex(w => w.startsWith(rootA));

        if (posBIn2 !== -1 && posAIn2 !== -1 && posBIn2 < posAIn2) {
          const detail = `Retruécano: "${words1[wA]}... ${words1[wB]}" ⇄ "${words2[posBIn2]}... ${words2[posAIn2]}"`;
          l1.mirrorVerse = { type: 'retruécano', partnerLine: l2.barNumber, detail };
          l2.mirrorVerse = { type: 'retruécano', partnerLine: l1.barNumber, detail };
          mirrorVersesCount++;
          foundRetruecano = true;
          break;
        }
      }
      if (foundRetruecano) break;
    }
  }

  // 5. Stanza grouping and scheme formatting (e.g. CB BC AA AA)
  const stanzasMap: Map<number, LineAnalysis[]> = new Map();
  for (const line of lineAnalyses) {
    if (!stanzasMap.has(line.stanzaIndex)) {
      stanzasMap.set(line.stanzaIndex, []);
    }
    stanzasMap.get(line.stanzaIndex)!.push(line);
  }

  const stanzas: StanzaAnalysis[] = [];
  for (const [stzIdx, sLines] of stanzasMap.entries()) {
    const barStart = sLines[0]?.barNumber || 1;
    const barEnd = sLines[sLines.length - 1]?.barNumber || 1;
    const totalMetric = sLines.reduce((acc, l) => acc + l.metricSyllables, 0);
    const avg = sLines.length > 0 ? +(totalMetric / sLines.length).toFixed(1) : 0;

    // Use barScheme (e.g. CB BC AA AA)
    const schemeParts = sLines.map(l => l.barScheme || '-');
    const scheme = schemeParts.join(' ');

    stanzas.push({
      stanzaIndex: stzIdx,
      barStart,
      barEnd,
      barCount: sLines.length,
      totalMetricSyllables: totalMetric,
      averageSyllables: avg,
      scheme,
      lines: sLines
    });
  }

  for (const key of Object.keys(familyBuckets).sort()) {
    const item = familyBuckets[key];
    rhymeFamiliesSummary.push({
      letter: item.letter,
      color: item.color,
      type: item.type,
      pattern: item.pattern,
      wordCount: item.wordCount,
      lines: item.lines,
      sampleWords: Array.from(item.sampleWords).slice(0, 5)
    });
  }

  const totalSyllables = lineAnalyses.reduce((acc, l) => acc + l.metricSyllables, 0);
  const averageSyllablesPerBar = lineAnalyses.length > 0 ? +(totalSyllables / lineAnalyses.length).toFixed(1) : 0;
  const alliterationsCount = lineAnalyses.filter(l => l.alliteration !== null).length;

  return {
    lines: lineAnalyses,
    stanzas,
    rhymeFamilies: rhymeFamiliesSummary,
    totalBars: lineAnalyses.length,
    totalSyllables,
    averageSyllablesPerBar,
    multisyllabicCount: rhymeFamiliesSummary.filter(f => f.type === 'multisyllabic').length,
    consonantCount: rhymeFamiliesSummary.filter(f => f.type === 'consonant').length,
    assonantCount: rhymeFamiliesSummary.filter(f => f.type === 'assonant').length,
    alliterationsCount,
    mirrorVersesCount
  };
}
