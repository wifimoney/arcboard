import { clsx } from 'clsx';
import { useTreasuryData } from '../hooks/useTreasuryData';
import { useArcProvider } from '../providers/ArcProvider';
import { SetRuleForm } from './SetRuleForm';

export const TreasuryDashboard = () => {
  const { data, isLoading, error, refresh } = useTreasuryData();
  const { arcGasPriceUsd, networkName } = useArcProvider();

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="badge">{networkName}</div>
          <h1 style={{ margin: '8px 0 4px', fontSize: 32 }}>Arc Treasury Control Center</h1>
          <p style={{ margin: 0, color: '#475569' }}>
            Monitor predictable USDC balances and orchestrate automated distributions across Arc.
          </p>
        </div>
        <button onClick={refresh} style={refreshButtonStyle}>
          Refresh Data
        </button>
      </header>

      <section className="grid grid-3">
        <div className="card">
          <p style={labelStyle}>Aggregated Balance</p>
          <h2 style={metricStyle}>{isLoading ? 'Loading…' : `$${data?.totalUSDC ?? '—'}`}</h2>
          <p style={mutedStyle}>Across Arc, Ethereum, Polygon, Avalanche</p>
        </div>
        <div className="card">
          <p style={labelStyle}>Arc Predictable Gas</p>
          <h2 style={metricStyle}>${arcGasPriceUsd.toFixed(2)}</h2>
          <p style={mutedStyle}>Dollar-denominated execution cost per transaction</p>
        </div>
        <div className="card">
          <p style={labelStyle}>Data Feed</p>
          <h2 style={metricStyle}>{error ? 'mocked' : 'live'}</h2>
          <p style={mutedStyle}>
            {error ? 'Using mock data until Node service is available' : 'Connected to Phase 5 Node service'}
          </p>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0 0 6px' }}>Multi-chain Balances</h2>
              <p style={mutedStyle}>Mock data aggregated by the Phase 5 Node.js service.</p>
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data?.chains.map((chain) => (
              <div
                key={`${chain.chain}-${chain.chainId}`}
                className={clsx('card')}
                style={{ padding: 16, boxShadow: 'none', borderRadius: 12 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{chain.chain.toUpperCase()}</p>
                    <small style={{ color: '#475569' }}>{chain.network}</small>
                  </div>
                  <strong style={{ fontSize: 20 }}>${chain.balance}</strong>
                </div>
                <small style={{ color: '#94a3b8' }}>
                  Updated {new Date(chain.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            )) ?? <p>No balance data available.</p>}
          </div>
        </div>
        <SetRuleForm />
      </section>
    </section>
  );
};

const labelStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontSize: 12,
  color: '#94a3b8',
  margin: 0
};

const metricStyle: React.CSSProperties = {
  margin: '8px 0',
  fontSize: 32,
  color: '#0f172a'
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b'
};

const refreshButtonStyle: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 999,
  border: '1px solid rgba(79, 70, 229, 0.2)',
  background: '#fff',
  color: '#4f46e5',
  fontWeight: 600
};

