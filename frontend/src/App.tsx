import { ArcProvider } from './providers/ArcProvider';
import { TreasuryDashboard } from './components/TreasuryDashboard';

function App() {
  return (
    <ArcProvider>
      <main style={{ padding: '24px' }}>
        <TreasuryDashboard />
      </main>
    </ArcProvider>
  );
}

export default App;

