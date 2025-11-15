import { AggregatedBalances } from '../types';
import { MOCK_AGGREGATED_BALANCES } from '../data/mockBalances';

const API_BASE =
  (import.meta.env.VITE_TREASURY_SERVICE_URL as string | undefined) || '';

function buildUrl(path: string) {
  if (API_BASE) {
    return `${API_BASE.replace(/\/$/, '')}${path}`;
  }
  return path;
}

export async function fetchAggregatedBalances(): Promise<AggregatedBalances> {
  try {
    const response = await fetch(buildUrl('/api/balances'));
    if (!response.ok) {
      throw new Error(`Service responded with ${response.status}`);
    }
    const data = (await response.json()) as AggregatedBalances;
    return data;
  } catch (error) {
    console.warn(
      '[treasuryService] Using mock aggregated balance data because the Phase 5 service is unavailable.',
      error
    );
    return { ...MOCK_AGGREGATED_BALANCES, timestamp: new Date().toISOString() };
  }
}

