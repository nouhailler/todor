export interface ParsedItem {
  id: string;
  text: string;
  cat: string;
  kind: 'item' | 'task';
  meta?: string;
}

// "rappelle-moi de réserver le resto" → tâche "Réserver le resto"
const TASK_LEAD = /^(rappelle[- ]?(moi|nous)\s+(de\s+|d')|pense[rz]?\s+(à|a)\s+|je\s+dois\s+|il\s+faut\s+que\s+(je|tu|l'on|on)\s+)/i;
// "ajoute six œufs" → item "Six œufs"
const ITEM_LEAD = /^(ajoute[rz]?\s+|achète[rz]?\s+|acheter\s+|prends?\s+|prendre\s+|il\s+(me\s+)?faut\s+|n'oublie\s+pas\s+(de\s+|d')|note[rz]?\s+|met[sz]?\s+|mettre\s+)/i;
// verbe d'action en tête → c'est une tâche, pas un article
const TASK_VERB = /^(réserver|appeler|téléphoner|envoyer|payer|prévoir|organiser|préparer|vérifier|confirmer|annuler|inscrire|imprimer)/i;

const CONJUNCTION = /(?:et\s+puis|puis|ensuite|et\s+aussi|ainsi\s+que|et)/.source;
const SEPARATOR = new RegExp(`(?:\\s*[,;.]\\s*(?:${CONJUNCTION}\\s+)*|\\s+(?:${CONJUNCTION})\\s+)`, 'i');

/** Découpe une dictée libre en items/tâches individuels (heuristique simple). */
export function parseDictation(raw: string): ParsedItem[] {
  return raw
    .split(SEPARATOR)
    .map(s => s.trim())
    .filter(Boolean)
    .map((seg, i) => {
      let kind: ParsedItem['kind'] = 'item';
      let text = seg;

      const task = text.match(TASK_LEAD);
      if (task) {
        kind = 'task';
        text = text.slice(task[0].length);
      } else {
        const lead = text.match(ITEM_LEAD);
        if (lead) text = text.slice(lead[0].length);
      }
      if (kind === 'item' && TASK_VERB.test(text)) kind = 'task';

      text = text.trim();
      text = text.charAt(0).toUpperCase() + text.slice(1);
      return { id: `d${i}`, text, cat: kind === 'task' ? 'À faire' : '', kind };
    })
    .filter(p => p.text.length > 1);
}
