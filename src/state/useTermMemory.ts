import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE } from '../lib/api';
import { getInitDataRaw } from '../telegram';
import { answerTerm, mergeMemory, parseMemory, type TermMemoryMap } from './termReview';

function storageKey() {
  try { const user = JSON.parse(new URLSearchParams(getInitDataRaw()).get('user') ?? '{}'); return `cnc-terms-v1:${user.id ?? 'guest'}`; }
  catch { return 'cnc-terms-v1:guest'; }
}
export function useTermMemory() {
  const [memory, setMemory] = useState<TermMemoryMap>(() => { try { return parseMemory(JSON.parse(localStorage.getItem(storageKey()) ?? '{}')); } catch { return {}; } });
  const [sync, setSync] = useState<'local' | 'saved' | 'pending' | 'storage-error'>('local');
  const current = useRef(memory);
  const busy = useRef(false);
  const persist = useCallback((next: TermMemoryMap) => {
    current.current = next; setMemory(next);
    try { localStorage.setItem(storageKey(), JSON.stringify(next)); return true; }
    catch { setSync('storage-error'); return false; }
  }, []);
  const synchronize = useCallback(async () => {
    if (!getInitDataRaw() || busy.current) return;
    busy.current = true;
    try {
      const headers = { Authorization: `tma ${getInitDataRaw()}`, 'Content-Type': 'application/json' };
      const response = await fetch(`${API_BASE}/api/terms`, { headers, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('sync');
      const remote = parseMemory(await response.json());
      const merged = mergeMemory(current.current, remote);
      const durable = persist(merged);
      const pending = Object.values(merged).filter(item => !remote[item.id] || item.updated > remote[item.id].updated);
      if (pending.length) {
        const pushed = await fetch(`${API_BASE}/api/terms`, { method: 'POST', headers, body: JSON.stringify(pending), signal: AbortSignal.timeout(10000) });
        if (!pushed.ok) throw new Error('sync');
      }
      if (durable) setSync(Object.values(current.current).some(item => item.updated > (merged[item.id]?.updated ?? 0)) ? 'pending' : 'saved');
    } catch { setSync('pending'); } finally { busy.current = false; }
  }, [persist]);
  useEffect(() => {
    void synchronize();
    const reconnect = () => void synchronize();
    window.addEventListener('online', reconnect);
    const timer = window.setInterval(reconnect, 30000);
    return () => { window.removeEventListener('online', reconnect); window.clearInterval(timer); };
  }, [synchronize]);
  const answer = (id: string, correct: boolean) => {
    const next = { ...current.current, [id]: answerTerm(current.current[id], id, correct, Date.now()) };
    const durable = persist(next);
    if (durable) setSync(getInitDataRaw() ? 'pending' : 'local');
    void synchronize();
  };
  return { memory, answer, sync };
}
