import { analyzeWordPhonetics, cleanWord } from './syllables';

// Curated vocabulary of Spanish rap, hip-hop, battle rap, urban, expressive, and poetic lyrics
const BASE_DICTIONARY = [
  // -ino / -inos
  'camino', 'destino', 'divino', 'remolino', 'asesino', 'vecino', 'cristalino', 'padrino', 'genuino', 'submarino',
  'torbellino', 'clandestino', 'remitino', 'inquilino', 'desatino', 'femenino', 'masculino', 'platino',

  // -eza / -ezas
  'fuerza', 'cabeza', 'certeza', 'belleza', 'pureza', 'tristeza', 'destreza', 'riqueza', 'promesa', 'nobleza',
  'grandeza', 'torpeza', 'limpieza', 'pobreza', 'alteza', 'rudeza', 'fiereza', 'aspereza',

  // -ente / -entes
  'mente', 'frente', 'presente', 'valiente', 'frecuente', 'latente', 'potente', 'ardiente', 'brillante', 'corriente',
  'cliente', 'consciente', 'incidente', 'diferente', 'elocuente', 'decente', 'urgente', 'viviente', 'prudente',
  'indiferente', 'permanente', 'insolente', 'transparente', 'imponente', 'valiente', 'caliente',

  // -ura / -uras
  'locura', 'altura', 'armadura', 'amargura', 'escritura', 'cordura', 'hermosura', 'aventura', 'fractura', 'tortura',
  'figura', 'penumbra', 'cultura', 'pespuntura', 'moldura', 'censura', 'fisura', 'postura', 'dulzura',

  // -ando / -ado / -ados
  'volando', 'soñando', 'buscando', 'luchando', 'cantando', 'cambiando', 'soltando', 'sangrando', 'quebrando', 'avanzando',
  'disparando', 'pesado', 'grabado', 'pasado', 'marcado', 'olvidado', 'cansado', 'armado', 'atrapado', 'condenado',
  'arriesgado', 'encerrado', 'liberado', 'desesperado', 'blindado', 'sagrado', 'quebrantado', 'resucitado',

  // -ero / -eros / -era
  'sendero', 'guerrero', 'acero', 'primero', 'certero', 'viajero', 'fuego', 'cenicero', 'dinero', 'sincero',
  'callejero', 'frontero', 'heredero', 'altanero', 'pasajero', 'prisionero', 'puntero', 'mortero', 'cajero',
  'trinchera', 'barrera', 'frontera', 'hoguera', 'manera', 'bandera', 'carrera', 'quimera',

  // -on / -ones
  'corazón', 'razón', 'pasión', 'prisión', 'canción', 'misión', 'presión', 'visión', 'lección', 'revolución',
  'traición', 'constitución', 'devoción', 'conexión', 'acción', 'dimensión', 'opresión', 'ilusión', 'tensión',
  'atracción', 'creación', 'obsesión', 'dirección', 'reacción', 'emoción', 'precisión', 'explosión', 'perdición',

  // -al / -ales
  'real', 'leal', 'letal', 'fatal', 'moral', 'vital', 'brutal', 'mental', 'carnal', 'señal',
  'final', 'canal', 'portal', 'espiral', 'universal', 'infernal', 'caudal', 'puñal', 'rival', 'arsenal',
  'visual', 'actual', 'ancestral', 'abismal',

  // -ar / -ares
  'hablar', 'caminar', 'gritar', 'llegar', 'volar', 'rimar', 'parar', 'brillar', 'ganar', 'pelear',
  'sangrar', 'calmar', 'soñar', 'escapar', 'reinar', 'chocar', 'marcar', 'grabar', 'armar', 'quemar',
  'sanar', 'fallar', 'callar', 'estallar', 'despertar', 'enterrar', 'soltar',

  // -ido / -ida / -idos
  'vida', 'herida', 'salida', 'partida', 'medida', 'perdida', 'huida', 'mordida', 'dormido', 'sonido',
  'vencido', 'latido', 'rugido', 'gemido', 'sentido', 'desconocido', 'reducido', 'hundido', 'fundido', 'nacido',
  'agradecido', 'distinguido',

  // -ega / -egra / -edra / -eza (multisilábicas de cadencia e-a)
  'ciega', 'entrega', 'pega', 'niega', 'despliega', 'negra', 'regla', 'niebla', 'piedra', 'tierra',
  'guerra', 'furia', 'pluma', 'cuna', 'lluvia', 'tregua', 'cueva', 'hiedra', 'siembra', 'senda',

  // -iento / -ento
  'viento', 'momento', 'lamento', 'talento', 'sentimiento', 'juramento', 'movimiento', 'cimiento', 'pensamiento',
  'argumento', 'tormento', 'aliento', 'fundamento', 'descontento', 'elemento', 'monumento',

  // -ante / -antes
  'constante', 'gigante', 'cantante', 'distante', 'diamante', 'mutante', 'adelante', 'bastante', 'comediante',
  'caminante', 'elegante', 'desafiante', 'triunfante', 'vigilante', 'palpitante',

  // -ivo / -iva
  'activo', 'vivo', 'furtivo', 'masivo', 'nocivo', 'instinto', 'motivo', 'adictivo', 'agresivo', 'explosivo',
  'decisivo', 'ofensivo', 'defensivo', 'fugitivo',

  // -ano / -ana
  'humano', 'hermano', 'tirano', 'temprano', 'lejano', 'llano', 'verano', 'anciano', 'profano', 'vano',
  'urbano', 'veterano', 'soberano',

  // -ario / -aria
  'adversario', 'escenario', 'diario', 'sudario', 'solitario', 'calvario', 'legendario', 'misterio', 'criterio',
  'sanitario', 'mercenario', 'vocabulario', 'revolucionario',

  // -eño / -eña
  'sueño', 'empeño', 'diseño', 'pequeño', 'dueño', 'risueño', 'norteño',

  // -illo / -illa
  'cuchillo', 'brillo', 'sencillo', 'astilla', 'pesadilla', 'semilla', 'maravilla', 'orilla', 'guerrilla', 'muralla',

  // -or / -ores
  'dolor', 'amor', 'temor', 'sudor', 'olor', 'calor', 'vapor', 'valor', 'honor', 'rencor',
  'terror', 'resplandor', 'ardor', 'motor', 'creador', 'vencedor', 'luchador', 'traidor',

  // -uz / -as
  'luz', 'cruz', 'capuz', 'paz', 'compás', 'detrás', 'jamás', 'capaz', 'disfraz', 'sagaz', 'tenaz', 'voraz',

  // Rap, Hip-Hop & Battle MC specific terms
  'flow', 'rap', 'hiphop', 'beat', 'micro', 'tarima', 'verso', 'pluma', 'tinta', 'calle',
  'barrio', 'asfalto', 'ritmo', 'bombo', 'caja', 'scratch', 'compás', 'acorde', 'barra', 'cuarteto',
  'punchline', 'freestyle', 'estilo', 'métrica', 'cadencia', 'batalla', 'corona', 'trono', 'rima', 'cima',
  'clima', 'estima', 'abismo', 'espejo', 'reflejo', 'consejo', 'pellejo', 'complejo', 'lírica', 'mística',
  'crítica', 'táctica', 'práctica', 'código', 'mensaje', 'paisaje', 'viaje', 'homenaje', 'linaje', 'coraje',
  'bloque', 'golpe', 'toque', 'choque', 'noche', 'derroche', 'broche'
];

export interface RhymeSuggestion {
  word: string;
  type: 'consonante' | 'multisilábica' | 'asonante';
  syllables: number;
  highlight: string;
}

/**
 * Searches for rhymes for a given target word
 */
export function findRhymes(targetWord: string): RhymeSuggestion[] {
  const clean = cleanWord(targetWord);
  if (!clean || clean.length < 2) return [];

  const targetInfo = analyzeWordPhonetics(clean);
  const targetConsonant = targetInfo.rhymeKernelConsonant;
  const targetAssonant = targetInfo.rhymeKernelAssonant;

  const results: RhymeSuggestion[] = [];
  const seen = new Set<string>();

  for (const dictWord of BASE_DICTIONARY) {
    if (dictWord === clean || seen.has(dictWord)) continue;

    const candInfo = analyzeWordPhonetics(dictWord);

    // 1. Check Consonant Rhyme (matching stressed vowel + subsequent consonants/vowels)
    if (
      targetConsonant &&
      candInfo.rhymeKernelConsonant &&
      targetConsonant.length >= 2 &&
      targetConsonant === candInfo.rhymeKernelConsonant
    ) {
      results.push({
        word: dictWord,
        type: 'consonante',
        syllables: candInfo.count,
        highlight: `-${targetConsonant}`
      });
      seen.add(dictWord);
      continue;
    }

    // 2. Check Multisyllabic Rhyme (matching at least 2 consecutive phonetic vowels from tonic cadence)
    const targetVowels = targetInfo.accentVowels.flat().join('-');
    const candVowels = candInfo.accentVowels.flat().join('-');

    if (
      candInfo.count >= 2 &&
      targetInfo.count >= 2 &&
      targetAssonant === candInfo.rhymeKernelAssonant &&
      targetInfo.accentVowels.length >= 2 &&
      candInfo.accentVowels.length >= 2
    ) {
      results.push({
        word: dictWord,
        type: 'multisilábica',
        syllables: candInfo.count,
        highlight: `[${candInfo.rhymeKernelAssonant}]`
      });
      seen.add(dictWord);
      continue;
    }

    // 3. Check Assonant Rhyme (same tonic vowel sequence to word end)
    if (
      targetAssonant &&
      candInfo.rhymeKernelAssonant &&
      targetAssonant === candInfo.rhymeKernelAssonant
    ) {
      results.push({
        word: dictWord,
        type: 'asonante',
        syllables: candInfo.count,
        highlight: `[${targetAssonant}]`
      });
      seen.add(dictWord);
    }
  }

  // Sort: Consonantes and Multisilábicas first, then by syllable count
  return results.sort((a, b) => {
    const priority = { consonante: 1, multisilábica: 2, asonante: 3 };
    if (priority[a.type] !== priority[b.type]) {
      return priority[a.type] - priority[b.type];
    }
    return a.syllables - b.syllables;
  });
}
