import { useEffect, useState } from 'react';
import { fetchAggregatedBalances } from '../api/treasuryService';
import { AggregatedBalances } from '../types';

interface UseTreasuryDataResult {
  data: AggregatedBalances | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTreasuryData(pollInterval = 15000): UseTreasuryDataResult {
  const [data, setData] = useState<AggregatedBalances | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const balances = await fetchAggregatedBalances();
      setData(balances);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return { data, isLoading, error, refresh: fetchData };
}

