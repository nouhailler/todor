// Version native : pas de reconnaissance vocale sans development build
// (la vraie implémentation web est dans speech.web.ts, résolue par Metro).
import type { DictationHandle, DictationOptions } from './speech.web';

export type { DictationHandle, DictationOptions };

export function speechSupported(): boolean {
  return false;
}

export function startDictation(_opts: DictationOptions): DictationHandle | null {
  return null;
}
