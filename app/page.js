import SignalCard from './components/SignalCard';
import { fetchSignals } from '../lib/fetchSignals';

export const revalidate = 300; // Cache for 5 minutes

export default async function Home() {
  let signals = [];
  try {
    signals = await fetchSignals();
  } catch (err) {
    console.error(err);
  }

  return (
    <main className="container">
      <header className="header">
        <h1 className="title">Karpathy Signal</h1>
        <p className="subtitle">AI-curated insights from Andrej Karpathy's posts</p>
      </header>

      <section className="grid">
        {signals && signals.length > 0 ? (
          signals.map((signal, index) => (
            <SignalCard 
              key={signal.id} 
              signal={signal} 
              index={index} 
            />
          ))
        ) : (
          <div className="status-box">
            <p>No signals found, or failed to fetch. Make sure the Nitter proxy is online!</p>
          </div>
        )}
      </section>
    </main>
  );
}
