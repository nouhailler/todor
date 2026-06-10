// Assistant IA de l'onglet ✨ — branché sur OpenRouter (clé des Réglages).
import { useSettingsStore } from '../store/settingsStore';
import { getAllProjects } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { chatCompletion, type ChatMessage } from './openrouter';

export interface AssistantTurn {
  who: 'me' | 'ai';
  text: string;
}

export interface AssistantReply {
  text: string;
  add: string[] | null;
}

export function assistantConfigured(): boolean {
  const { openRouterKey, openRouterModel } = useSettingsStore.getState();
  return !!(openRouterKey.trim() && openRouterModel.trim());
}

/** Résumé compact des listes/tâches injecté dans le prompt système. */
function buildContext(): string {
  const projects = getAllProjects();
  const tasks = useTaskStore.getState().tasks.filter(t => !t.archived);
  const lines: string[] = [];
  for (const p of projects) {
    const list = tasks.filter(t => t.project === p.id);
    const active = list.filter(t => !t.done);
    lines.push(`- ${p.emoji} ${p.name} (${p.kind === 'list' ? 'liste' : 'projet'}) : ${active.length} en cours / ${list.length}`);
    for (const t of active.slice(0, 15)) {
      lines.push(`    • ${t.text}${t.done ? ' (fait)' : ''}`);
    }
  }
  return lines.join('\n');
}

function systemPrompt(): string {
  return `Tu es l'assistant de todor, une app de listes et tâches partagées (famille).
Tu réponds en français, de façon brève et concrète (2-4 phrases), ton chaleureux, tutoiement.
Tu aides sur : compléter une liste de courses, quantités et cuisine, idées recettes, répartir et organiser les tâches.

Voici les listes actuelles de l'utilisateur :
${buildContext()}

Quand tu proposes des articles ou tâches à AJOUTER, termine ta réponse par un bloc exactement de cette forme (un tableau JSON de chaînes courtes), sans le mentionner dans ton texte :
<add>
["Article 1", "Article 2"]
</add>
N'utilise ce bloc que pour de vraies suggestions d'ajout, jamais pour autre chose.`;
}

/** Sépare le texte de la réponse du bloc <add> éventuel. */
export function parseReply(raw: string): AssistantReply {
  const match = raw.match(/<add>([\s\S]*?)<\/add>/i);
  let add: string[] | null = null;
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        add = parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
        if (add.length === 0) add = null;
      }
    } catch {
      add = null;
    }
  }
  const text = raw.replace(/<add>[\s\S]*?<\/add>/gi, '').replace(/```/g, '').trim();
  return { text: text || '…', add };
}

/** Envoie la conversation à OpenRouter et retourne la réponse parée. */
export async function askAssistant(history: AssistantTurn[]): Promise<AssistantReply> {
  const { openRouterKey, openRouterModel } = useSettingsStore.getState();
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt() },
    // les 12 derniers tours suffisent comme contexte
    ...history.slice(-12).map((m): ChatMessage => ({
      role: m.who === 'me' ? 'user' : 'assistant',
      content: m.text,
    })),
  ];
  const raw = await chatCompletion(openRouterKey.trim(), openRouterModel.trim(), messages, 1024);
  return parseReply(raw);
}
