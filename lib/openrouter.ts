// Client OpenRouter (API compatible OpenAI) pour le scan photo.
// La clé est saisie dans Réglages → Assistant IA et persistée via settingsStore.

const BASE_URL = 'https://openrouter.ai/api/v1';

const APP_HEADERS = {
  'HTTP-Referer': 'https://github.com/nouhailler/todor',
  'X-Title': 'todor',
};

export interface VisionModel {
  id: string;
  name: string;
}

// PNG 1×1 utilisé pour le test de connexion (valide que le modèle accepte bien les images)
const TEST_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function authHeaders(key: string) {
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...APP_HEADERS,
  };
}

/** Liste les modèles OpenRouter capables de lire des images. */
export async function fetchVisionModels(key: string): Promise<VisionModel[]> {
  const res = await fetch(`${BASE_URL}/models`, { headers: authHeaders(key) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.data as any[])
    .filter(m => m?.architecture?.input_modalities?.includes('image'))
    .map(m => ({ id: m.id as string, name: (m.name as string) ?? m.id }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function chat(key: string, model: string, content: unknown[], maxTokens: number) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content }],
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.error) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const text: string | undefined = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('réponse vide');
  return text;
}

export interface TestResult {
  ok: boolean;
  message: string;
}

/** Envoie une mini-image au modèle pour vérifier clé + accès vision. */
export async function testOpenRouter(key: string, model: string): Promise<TestResult> {
  if (!key.trim()) return { ok: false, message: 'Saisis ta clé API.' };
  if (!model.trim()) return { ok: false, message: 'Choisis un modèle.' };
  const started = Date.now();
  try {
    await chat(
      key,
      model,
      [
        { type: 'text', text: 'Réponds uniquement « OK ».' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${TEST_PNG}` } },
      ],
      20
    );
    return { ok: true, message: `Le modèle répond (vision incluse) en ${((Date.now() - started) / 1000).toFixed(1)} s.` };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Erreur inconnue.' };
  }
}

/** Extrait le premier objet JSON d'une réponse (gère les blocs ``` éventuels). */
export function extractJson(text: string): any {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('pas de JSON dans la réponse');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Analyse une photo via OpenRouter et retourne le JSON d'articles. */
export async function analyzeWithOpenRouter(
  key: string,
  model: string,
  base64: string,
  mime: string,
  prompt: string
): Promise<{ items: { text: string; detail?: string }[] }> {
  const text = await chat(
    key,
    model,
    [
      {
        type: 'text',
        text: `${prompt}\n\nRéponds UNIQUEMENT avec un JSON valide de la forme {"items":[{"text":"…","detail":"…"}]} — "detail" est optionnel, aucun autre texte.`,
      },
      { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
    ],
    2048
  );
  return extractJson(text);
}
