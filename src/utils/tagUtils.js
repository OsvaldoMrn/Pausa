const SHORT_WHITELIST = new Set([
  'ia', 'ux', 'ui', 'ml', 'qa', 'fe', 'be', 'api', 'db', 'sql', 'app', 
  'web', 'gym', 'cv', 'ceo', 'cto', 'pm', 'fan', 'bus', 'mar', 'sol', 'luz'
]);

const TIME_MARKERS = new Set([
  'hoy', 'ayer', 'mañana', 'ahora', 'despues', 'antes', 'luego', 'pronto', 'tarde', 'noche', 'dia', 'semana', 'mes', 'año',
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  'fin', 'inicio', 'principio', 'mitad'
]);

const QUANTIFIERS = new Set([
  'muy', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca', 'pocos', 'pocas',
  'bastante', 'demasiado', 'mas', 'menos', 'tan', 'tanto', 'tanta', 'tantos',
  'todo', 'toda', 'todos', 'todas', 'nada', 'algo', 'casi', 'apenas', 'solo', 'solamente'
]);

const STRUCTURAL_STOPWORDS = new Set([
  'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'segun', 'sin', 'so', 'sobre', 'tras', 'via',
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al', 'del',
  'y', 'o', 'pero', 'mas', 'sino', 'aunque', 'porque', 'pues', 'que', 'si', 'no', 'ni', 'o', 'u',
  'yo', 'tu', 'el', 'ella', 'nosotros', 'ustedes', 'ellos', 'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'me', 'te', 'se', 'nos', 'os', 'le', 'les',
  'esto', 'eso', 'aquello', 'este', 'ese', 'aquel', 'esta', 'esa', 'aquella', 'estos', 'esos', 'aquellos',
  'como', 'cuando', 'donde', 'quien', 'cual', 'cuyo'
]);

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

const TAG_SYNONYMS = {
  escuela: ['universidad', 'facultad', 'prepa', 'clases', 'examen', 'semestre', 'profesor', 'profe', 'tesis', 'materia', 'tarea', 'estudio', 'estudiar'],
  trabajo: ['empleo', 'oficina', 'jefe', 'empresa', 'negocio', 'cliente', 'reunion', 'proyecto', 'codigo', 'programar', 'junta', 'compañero'],
  familia: ['mama', 'papa', 'hermano', 'hermana', 'abuela', 'abuelo', 'tia', 'tio', 'primo', 'prima', 'hijo', 'hija', 'padres'],
  pareja: ['novio', 'novia', 'esposo', 'esposa', 'amor', 'relacion', 'cita'],
  salud: ['enfermedad', 'doctor', 'medico', 'hospital', 'medicina', 'terapia', 'psicologo', 'dolor', 'gripe'],
  casa: ['hogar', 'departamento', 'depa', 'limpieza', 'mudanza', 'cuarto'],
  dinero: ['pago', 'sueldo', 'deuda', 'ahorro', 'banco', 'gastos', 'compra', 'compras', 'precio']
};

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


export const extractTags = (text) => {
  if (!text) return [];

  const clean = normalize(text)
    .replace(/[^a-z0-9ñ\s]/g, ' ') 
    .split(/\s+/);

  const tags = clean
    .filter(word => {
      if (!word) return false;

      if (word.length <= 3 && !SHORT_WHITELIST.has(word)) return false;

      if (STRUCTURAL_STOPWORDS.has(word)) return false;
      if (QUANTIFIERS.has(word)) return false; 
      if (TIME_MARKERS.has(word)) return false; 
      if (COMMON_VERBS.has(word)) return false; 

      return true;
    })
    .map(mapSemanticTag); 

  return [...new Set(tags)];
};