import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';

interface BalanceResponse {
  aggregatedUSDC: string;
}

interface UseAggregatedBalanceReturn {
  balance: string | null;
  isLoading: boolean;
  isError: boolean;
}

export function useAggregatedBalance(): UseAggregatedBalanceReturn {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBalance = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/treasury/balance');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: BalanceResponse = await response.json();
        const formatted = formatUnits(BigInt(data.aggregatedUSDC), 6);

        if (isMounted) {
          setBalance(formatted);
          setIsError(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsError(true);
          setBalance(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBalance();

    return () => {
      isMounted = false;
    };
  }, []);

    return { balance, isLoading, isError };
}

