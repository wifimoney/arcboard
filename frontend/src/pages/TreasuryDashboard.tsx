import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useMemo } from 'react';
import { useAggregatedBalance } from '../hooks/useAggregatedBalance';
import { SetAllocationRuleForm } from '../components/Treasury/SetAllocationRuleForm';

export const TreasuryDashboard = () => {
  const { address, isConnecting } = useAccount();
  const { connect, connectors, isLoading: isConnectLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const { balance, isLoading, isError } = useAggregatedBalance();

  const primaryConnector = useMemo(() => connectors[0], [connectors]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">Arc Network</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Treasury Automation Dashboard</h1>
            <p className="mt-1 text-slate-500">
              Review aggregated balance intelligence and configure predictable USDC allocation rules.
            </p>
          </div>
          <div>
            {address ? (
              <button
                onClick={() => disconnect()}
                className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                Connected: {address.slice(0, 6)}…{address.slice(-4)}
              </button>
            ) : (
              <button
                onClick={() => primaryConnector && connect({ connector: primaryConnector })}
                disabled={!primaryConnector || isConnecting || isConnectLoading}
                className="inline-flex items-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnecting || isConnectLoading
                  ? pendingConnector?.name
                    ? `Connecting ${pendingConnector.name}…`
                    : 'Connecting…'
                  : 'Connect Wallet'}
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Total Balance</p>
                <h2 className="mt-3 text-4xl font-semibold text-slate-900">
                  {isLoading && 'Loading…'}
                  {isError && !isLoading && 'Error fetching data'}
                  {!isLoading && !isError && balance ? `$${Number(balance).toLocaleString()}` : null}
                </h2>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                Aggregated USDC Balance
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {isError
                ? 'Unable to reach aggregated balance service. Please verify the mock API is running.'
                : 'This card displays the aggregated USDC balance provided by the Phase 5 Node service.'}
            </p>
          </article>

          <SetAllocationRuleForm />
        </section>
      </div>
    </main>
  );
};

