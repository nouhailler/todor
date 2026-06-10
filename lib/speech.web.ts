// Reconnaissance vocale via la Web Speech API (Chrome/Edge/Safari).
export interface DictationHandle {
  /** Arrête l'écoute proprement (déclenche onEnd). */
  stop(): void;
  /** Abandonne sans déclencher onEnd (fermeture du sheet). */
  cancel(): void;
}

export interface DictationOptions {
  lang?: string;
  /** Appelé à chaque résultat : texte confirmé + texte provisoire en cours. */
  onResult(finalText: string, interimText: string): void;
  /** Fin d'écoute (silence prolongé ou stop()). */
  onEnd(): void;
  onError(code: string): void;
}

function getRecognition(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function speechSupported(): boolean {
  return getRecognition() !== null;
}

export function startDictation(opts: DictationOptions): DictationHandle | null {
  const SR = getRecognition();
  if (!SR) return null;

  const rec = new SR();
  rec.lang = opts.lang ?? 'fr-FR';
  rec.continuous = true;
  rec.interimResults = true;

  let finals = '';
  let cancelled = false;

  rec.onresult = (e: any) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finals += r[0].transcript + ' ';
      else interim += r[0].transcript;
    }
    opts.onResult(finals.trim(), interim.trim());
  };
  rec.onerror = (e: any) => {
    if (!cancelled) opts.onError(e?.error ?? 'unknown');
  };
  rec.onend = () => {
    if (!cancelled) opts.onEnd();
  };

  rec.start();

  return {
    stop() {
      rec.stop();
    },
    cancel() {
      cancelled = true;
      rec.abort();
    },
  };
}
