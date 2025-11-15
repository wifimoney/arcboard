import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseUnits } from 'viem';
import { TREASURY_ABI, TREASURY_CONTRACT_ADDRESS } from '../../constants/treasury';

const CARD_STYLES =
  'rounded-3xl border border-slate-100 bg-white shadow-md shadow-slate-100';
const LABEL_STYLES =
  'text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500';
const INPUT_STYLES =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100';

export const SetAllocationRuleForm = () => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [cooldownDays, setCooldownDays] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('0');
  const [priority, setPriority] = useState('1');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { address } = useAccount();

  const isDisabled = useMemo(
    () => !recipientAddress || !usdcAmount || !cooldownDays,
    [recipientAddress, usdcAmount, cooldownDays]
  );

  const usdcAmountRaw = useMemo(() => {
    try {
      return usdcAmount ? parseUnits(usdcAmount, 6) : undefined;
    } catch {
      return undefined;
    }
  }, [usdcAmount]);

  const budgetLimitRaw = useMemo(() => {
    try {
      return budgetLimit ? parseUnits(budgetLimit, 6) : parseUnits('0', 6);
    } catch {
      return undefined;
    }
  }, [budgetLimit]);

  const priorityValue = useMemo(() => {
    if (!priority) return undefined;
    const numeric = Number(priority);
    if (Number.isNaN(numeric) || numeric <= 0) return undefined;
    return BigInt(numeric);
  }, [priority]);

  const frequencySeconds = useMemo(() => {
    if (!cooldownDays) return undefined;
    const daysNumber = Number(cooldownDays);
    if (Number.isNaN(daysNumber) || daysNumber <= 0) return undefined;
    return BigInt(daysNumber) * BigInt(86400);
  }, [cooldownDays]);

  const { config } = usePrepareContractWrite({
    address: TREASURY_CONTRACT_ADDRESS,
    abi: TREASURY_ABI,
    functionName: 'setAllocationRule',
    args:
      recipientAddress &&
      usdcAmountRaw !== undefined &&
      frequencySeconds !== undefined &&
      budgetLimitRaw !== undefined &&
      priorityValue !== undefined
        ? [recipientAddress as `0x${string}`, 1, usdcAmountRaw, budgetLimitRaw, priorityValue, frequencySeconds]
        : undefined,
    enabled: !isDisabled && !!address
  });

  const { write, isLoading: isWriting, isSuccess, isError, data } = useContractWrite({
    ...config,
    onMutate: () => setStatusMessage('Transaction pending...'),
    onSuccess: () => setStatusMessage('Success! Rule submitted to Arc.'),
    onError: (error: Error) => setStatusMessage(error.message)
  });

  useEffect(() => {
    if (isSuccess) {
      setRecipientAddress('');
      setUsdcAmount('');
      setCooldownDays('');
      setBudgetLimit('0');
      setPriority('1');
      setTxHash(data?.hash ?? null);
    }
  }, [isSuccess, data]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDisabled || !write) return;
    write();
  };

  const explorerBase = import.meta.env.VITE_ARC_BLOCK_EXPLORER || 'https://testnet.arcscan.app';

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${CARD_STYLES} p-6`}>
      <header className="space-y-1">
        <p className={LABEL_STYLES}>Automated Distribution</p>
        <h2 className="text-2xl font-semibold text-slate-900">Set Allocation Rule</h2>
        <p className="text-sm text-slate-500">
          Configure recurring USDC allocations backed by Arc’s predictable execution costs.
        </p>
      </header>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">Recipient Address</label>
        <input
          type="text"
          placeholder="0x..."
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          className={INPUT_STYLES}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
            value={cooldownDays}
            onChange={(e) => setCooldownDays(e.target.value)}
            className={INPUT_STYLES}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Budget Limit (USDC)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            className={INPUT_STYLES}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Priority</label>
          <input
            type="number"
            min="1"
            max="10"
            placeholder="1"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={INPUT_STYLES}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isDisabled || !write || isWriting}
        className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        {isWriting ? 'Submitting…' : 'Set Rule'}
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
              href={`${explorerBase}/tx/${txHash}`}
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