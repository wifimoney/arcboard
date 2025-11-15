import { FormEvent, useState } from 'react';
import { ethers } from 'ethers';
import { useArcProvider } from '../providers/ArcProvider';

const ALLOCATION_TYPES = [
  { label: 'Percentage of Balance', value: 0, helper: 'Basis points (e.g., 500 = 5%)' },
  { label: 'Fixed Amount', value: 1, helper: 'USDC amount' },
  { label: 'Balance Threshold', value: 2, helper: 'USDC threshold' }
];

export const SetRuleForm = () => {
  const { contract, connectWallet, account, isConnecting } = useArcProvider();
  const [recipient, setRecipient] = useState('');
  const [allocationType, setAllocationType] = useState(0);
  const [value, setValue] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [priority, setPriority] = useState(1);
  const [cooldown, setCooldown] = useState(86400);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setTxHash(null);

    try {
      if (!contract) {
        await connectWallet();
      }

      if (!recipient || !value) {
        setStatus('Recipient and value are required.');
        return;
      }

      setIsSubmitting(true);
      const formattedValue =
        allocationType === 0
          ? Math.round(Number(value) * 100) // convert % to basis points
          : ethers.utils.parseUnits(value, 6);

      const formattedBudget = budgetLimit
        ? ethers.utils.parseUnits(budgetLimit, 6)
        : ethers.constants.Zero;

      const tx = await contract?.setAllocationRule(
        recipient,
        allocationType,
        formattedValue,
        formattedBudget,
        priority,
        cooldown
      );

      setStatus('Submitting transaction to Arc...');
      const receipt = await tx.wait();
      setTxHash(receipt.transactionHash);
      setStatus('Rule set successfully.');
    } catch (error) {
      console.error(error);
      setStatus((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 6px' }}>Automation Control</h2>
          <p style={{ margin: 0, color: '#475569' }}>Define predictable, automated USDC allocations.</p>
        </div>
        <button
          onClick={connectWallet}
          disabled={!!account || isConnecting}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: '#4f46e5',
            color: '#fff',
            fontWeight: 600
          }}
        >
          {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 24 }} className="grid grid-2">
        <label>
          <span>Recipient</span>
          <input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label>
          <span>Allocation Type</span>
          <select
            value={allocationType}
            onChange={(e) => setAllocationType(Number(e.target.value))}
            style={{ ...inputStyle, background: '#fff' }}
          >
            {ALLOCATION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <small style={{ color: '#475569' }}>{ALLOCATION_TYPES[allocationType].helper}</small>
        </label>

        <label>
          <span>Value</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g., 12.5"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            style={inputStyle}
          />
        </label>

        <label>
          <span>Budget Limit (USDC)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Optional"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          <span>Priority</span>
          <input
            type="number"
            min="1"
            max="10"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            style={inputStyle}
          />
        </label>

        <label>
          <span>Cooldown (seconds)</span>
          <input
            type="number"
            min="60"
            value={cooldown}
            onChange={(e) => setCooldown(Number(e.target.value))}
            style={inputStyle}
          />
        </label>

        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: '#0ea5e9',
              color: '#fff',
              fontWeight: 600,
              minWidth: 160
            }}
          >
            {isSubmitting ? 'Setting Rule…' : 'Set Rule'}
          </button>
          {status && <span style={{ color: '#475569' }}>{status}</span>}
        </div>
        {txHash && (
          <div style={{ gridColumn: '1 / -1', color: '#0f172a', fontSize: 14 }}>
            Transaction:{' '}
            <a
              href={`https://explorer.arc.network/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#4f46e5' }}
            >
              {txHash.slice(0, 10)}…
            </a>
          </div>
        )}
      </form>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 8,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(15, 23, 42, 0.12)',
  fontSize: 15
};

