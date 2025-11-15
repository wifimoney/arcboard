import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseUnits } from 'viem';
import { TREASURY_ABI, TREASURY_CONTRACT_ADDRESS } from '../../constants/treasury';

export const SetAllocationRuleForm = () => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [frequencyDays, setFrequencyDays] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address } = useAccount();

  const isDisabled = useMemo(
    () => !recipientAddress || !usdcAmount || !frequencyDays,
    [recipientAddress, usdcAmount, frequencyDays]
  );

  const usdcAmountRaw = useMemo(() => {
    try {
      return usdcAmount ? parseUnits(usdcAmount, 6) : undefined;
    } catch {
      return undefined;
    }
  }, [usdcAmount]);

  const frequencySeconds = useMemo(() => {
    if (!frequencyDays) return undefined;
    const daysNumber = Number(frequencyDays);
    if (Number.isNaN(daysNumber) || daysNumber <= 0) return undefined;
    return BigInt(daysNumber) * BigInt(86400);
  }, [frequencyDays]);

  const { config } = usePrepareContractWrite({
    address: TREASURY_CONTRACT_ADDRESS,
    abi: TREASURY_ABI,
    functionName: 'setAllocationRule',
    args:
      recipientAddress && usdcAmountRaw !== undefined && frequencySeconds !== undefined
        ? [recipientAddress as `0x${string}`, 1, usdcAmountRaw, BigInt(0), 1, frequencySeconds]
        : undefined,
    enabled: !isDisabled && !!address
  });

  const { write, isLoading: isWriting, isSuccess, isError, data } = useContractWrite({
    ...config,
    onMutate: () => setStatusMessage('Transaction pending...'),
    onSuccess: () => setStatusMessage('Success! Rule submitted to Arc.'),
    onError: (error) => setStatusMessage(error.message)
  });

  useEffect(() => {
    if (isSuccess) {
      setRecipientAddress('');
      setUsdcAmount('');
      setFrequencyDays('');
      setTxHash(data?.hash ?? null);
    }
  }, [isSuccess, data]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDisabled || !write) return;
    write();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Automation</p>
        <h2 className="text-2xl font-semibold text-slate-900">Set Allocation Rule</h2>
        <p className="text-sm text-slate-500">
          Configure recurring USDC allocations that execute automatically on Arc.
        </p>
      </header>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Recipient Address</label>
        <input
          type="text"
          placeholder="0x..."
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">USDC Amount</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
            USDC
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={usdcAmount}
            onChange={(e) => setUsdcAmount(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-14 py-3 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Frequency (Days)</label>
        <input
          type="number"
          min="1"
          placeholder="e.g., 30"
          value={frequencyDays}
          onChange={(e) => setFrequencyDays(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <button
        type="submit"
        disabled={isDisabled || !write || isWriting}
        className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        {isWriting ? 'Submitting...' : 'Set Rule'}
      </button>
      {statusMessage && (
        <p className="text-center text-sm text-slate-500">
          {statusMessage}
          {isError && ' Please try again.'}
        </p>
      )}
      {isSuccess && (
        <div className="space-y-1 text-center text-sm text-slate-500">
          <p className="font-semibold text-emerald-600">Transaction confirmed on Arc!</p>
          {txHash && (
            <a
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 underline"
            >
              View on ArcScan
            </a>
          )}
        </div>
      )}
    </form>
  );
};

