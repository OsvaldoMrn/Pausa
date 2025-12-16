// src/utils/tagUtils.js

// 1. PALABRAS CORTAS PERMITIDAS (La única "Lista Blanca")
// Si la palabra tiene 3 letras o menos, DEBE estar aquí para sobrevivir.
const SHORT_WHITELIST = new Set([
  'ia', 'ux', 'ui', 'ml', 'qa', 'fe', 'be', 'api', 'db', 'sql', 'app', 
  'web', 'gym', 'cv', 'ceo', 'cto', 'pm', 'fan', 'bus', 'mar', 'sol', 'luz'
]);

// 2. FILTRO TEMPORAL (Los días/meses ya están en la fecha, no son temas)
const TIME_MARKERS = new Set([
  'hoy', 'ayer', 'mañana', 'ahora', 'despues', 'antes', 'luego', 'pronto', 'tarde', 'noche', 'dia', 'semana', 'mes', 'año',
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  'fin', 'inicio', 'principio', 'mitad'
]);

// 3. CUANTIFICADORES Y ADVERBIOS (El problema de "Tan", "Mucha", "Mas")
const QUANTIFIERS = new Set([
  'muy', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca', 'pocos', 'pocas',
  'bastante', 'demasiado', 'mas', 'menos', 'tan', 'tanto', 'tanta', 'tantos',
  'todo', 'toda', 'todos', 'todas', 'nada', 'algo', 'casi', 'apenas', 'solo', 'solamente'
]);

// 4. STOPWORDS ESTRUCTURALES (Preposiciones, pronombres, conectores)
const STRUCTURAL_STOPWORDS = new Set([
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'segun', 'sin', 'so', 'sobre', 'tras', 'via',
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al', 'del',
  'y', 'o', 'pero', 'mas', 'sino', 'aunque', 'porque', 'pues', 'que', 'si', 'no', 'ni', 'o', 'u',
  'yo', 'tu', 'el', 'ella', 'nosotros', 'ustedes', 'ellos', 'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'me', 'te', 'se', 'nos', 'os', 'le', 'les',
  'esto', 'eso', 'aquello', 'este', 'ese', 'aquel', 'esta', 'esa', 'aquella', 'estos', 'esos', 'aquellos',
  'como', 'cuando', 'donde', 'quien', 'cual', 'cuyo'
]);

// 5. VERBOS COMUNES (Lista negra de acciones genéricas)
const COMMON_VERBS = new Set([
  'ser', 'soy', 'eres', 'es', 'somos', 'son', 'fui', 'fue', 'era', 'eran', 'sido',
  'estar', 'estoy', 'estas', 'esta', 'estamos', 'estan', 'estuve', 'estuvo', 'estado',
  'haber', 'he', 'has', 'ha', 'hemos', 'han', 'habia', 'hubo',
  'tener', 'tengo', 'tienes', 'tiene', 'tenemos', 'tienen', 'tuve', 'tenia',
  'hacer', 'hago', 'haces', 'hace', 'hacemos', 'hacen', 'hice', 'hizo', 'hecho',
  'ir', 'voy', 'vas', 'va', 'vamos', 'van', 'fui', 'iba', 'ido',
  'decir', 'dije', 'digo', 'dice', 'dicho',
  'poder', 'puedo', 'puede', 'podia', 'pude',
  'ver', 'veo', 'visto', 'vi',
  'dar', 'doy', 'da', 'dimos',
  'saber', 'se', 'sabes', 'sabe', 'supe',
  'querer', 'quiero', 'quiere', 'quise',
  'creer', 'creo', 'cree',
  'sentir', 'siento', 'siente', 'senti',
  'pensar', 'pienso', 'piensa', 'pense',
  'pasar', 'paso', 'pasa'
]);

// 6. MAPEO SEMÁNTICO (Sinónimos -> Categoría)
const TAG_SYNONYMS = {
  escuela: ['universidad', 'facultad', 'prepa', 'clases', 'examen', 'semestre', 'profesor', 'profe', 'tesis', 'materia', 'tarea', 'estudio', 'estudiar'],
  trabajo: ['empleo', 'oficina', 'jefe', 'empresa', 'negocio', 'cliente', 'reunion', 'proyecto', 'codigo', 'programar', 'junta', 'compañero'],
  familia: ['mama', 'papa', 'hermano', 'hermana', 'abuela', 'abuelo', 'tia', 'tio', 'primo', 'prima', 'hijo', 'hija', 'padres'],
  pareja: ['novio', 'novia', 'esposo', 'esposa', 'amor', 'relacion', 'cita'],
  salud: ['enfermedad', 'doctor', 'medico', 'hospital', 'medicina', 'terapia', 'psicologo', 'dolor', 'gripe'],
  casa: ['hogar', 'departamento', 'depa', 'limpieza', 'mudanza', 'cuarto'],
  dinero: ['pago', 'sueldo', 'deuda', 'ahorro', 'banco', 'gastos', 'compra', 'compras', 'precio']
};

// -------- UTILS --------

// Normaliza: minúsculas y quita acentos (más -> mas)
const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); 

const mapSemanticTag = (word) => {
  for (const [category, synonyms] of Object.entries(TAG_SYNONYMS)) {
    if (category === word || synonyms.includes(word)) {
      return category;
    }
  }
  return word;
};

// -------- MAIN ENGINE --------

export const extractTags = (text) => {
  if (!text) return [];

  // 1. Limpieza agresiva
  const clean = normalize(text)
    .replace(/[^a-z0-9ñ\s]/g, ' ') // Solo letras, números y espacios
    .split(/\s+/); // Dividir por espacios

  // 2. Filtrado Inteligente
  const tags = clean
    .filter(word => {
      // Regla 0: No vacío
      if (!word) return false;

      // Regla 1: Longitud (El filtro más potente contra "tan", "mas", "muy")
      // Si tiene 3 letras o menos, SOLO pasa si está en la lista blanca explícita.
      if (word.length <= 3 && !SHORT_WHITELIST.has(word)) return false;

      // Regla 2: Filtros Categóricos
      if (STRUCTURAL_STOPWORDS.has(word)) return false;
      if (QUANTIFIERS.has(word)) return false; // Adiós "mucha", "bastante"
      if (TIME_MARKERS.has(word)) return false; // Adiós "domingo", "hoy"
      if (COMMON_VERBS.has(word)) return false; // Adiós "estaba", "tengo"

      return true;
    })
    .map(mapSemanticTag); // Unificamos sinónimos

  // 3. Retornar únicos
  return [...new Set(tags)];
};