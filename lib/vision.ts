import Anthropic from '@anthropic-ai/sdk';
import { useSettingsStore } from '../store/settingsStore';
import { analyzeWithOpenRouter } from './openrouter';

export interface PhotoItem {
  text: string;
  cat: string;
  detail?: string;
}

export type VisionProvider = 'openrouter' | 'anthropic' | null;

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const ITEMS_SCHEMA = {
  type: 'object' as const,
  properties: {
    items: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          text: { type: 'string' as const, description: "Nom court de l'article, ex. « Lait »" },
          detail: { type: 'string' as const, description: 'Précision courte, ex. « presque vide »' },
        },
        required: ['text'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
};

const PROMPT = `Analyse cette photo pour une liste de courses partagée.
Selon ce qu'elle montre :
- un frigo ou placard → liste les produits manquants, presque vides ou à racheter ;
- une liste manuscrite ou un document → retranscris chaque article ;
- des produits ou objets → liste-les simplement.
Réponds en français, noms d'articles courts (2-3 mots max), avec un détail bref quand c'est utile.
Maximum 12 articles, les plus pertinents d'abord.`;

/** Fournisseur actif : clé OpenRouter saisie dans les Réglages, sinon clé Anthropic du .env. */
export function getVisionProvider(): VisionProvider {
  const { openRouterKey, openRouterModel } = useSettingsStore.getState();
  if (openRouterKey.trim() && openRouterModel.trim()) return 'openrouter';
  if (process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

export function visionConfigured(): boolean {
  return getVisionProvider() !== null;
}

/** Variante réactive pour les composants (suit les changements de Réglages). */
export function useVisionProvider(): VisionProvider {
  const key = useSettingsStore(s => s.openRouterKey);
  const model = useSettingsStore(s => s.openRouterModel);
  if (key.trim() && model.trim()) return 'openrouter';
  if (process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

function normalizeMediaType(mime: string | undefined): ImageMediaType {
  if (mime === 'image/png' || mime === 'image/gif' || mime === 'image/webp') return mime;
  return 'image/jpeg';
}

function toPhotoItems(items: { text: string; detail?: string }[]): PhotoItem[] {
  return items
    .filter(i => i.text && i.text.trim().length > 0)
    .map(i => ({ text: i.text.trim(), cat: '', detail: i.detail?.trim() || undefined }));
}

async function analyzeWithAnthropic(base64: string, mime: string | undefined): Promise<PhotoItem[]> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('missing-api-key');

  const client = new Anthropic({
    apiKey,
    // la clé vit côté client : acceptable pour un usage perso, pas pour une app distribuée
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    output_config: {
      format: { type: 'json_schema', schema: ITEMS_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: normalizeMediaType(mime), data: base64 },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('empty-response');

  const parsed = JSON.parse(textBlock.text) as { items: { text: string; detail?: string }[] };
  return toPhotoItems(parsed.items);
}

/** Envoie la photo (base64) au fournisseur configuré et retourne les articles détectés. */
export async function analyzePhoto(base64: string, mime?: string): Promise<PhotoItem[]> {
  const provider = getVisionProvider();
  if (provider === 'openrouter') {
    const { openRouterKey, openRouterModel } = useSettingsStore.getState();
    const parsed = await analyzeWithOpenRouter(
      openRouterKey,
      openRouterModel,
      base64,
      normalizeMediaType(mime),
      PROMPT
    );
    return toPhotoItems(parsed.items ?? []);
  }
  return analyzeWithAnthropic(base64, mime);
}
