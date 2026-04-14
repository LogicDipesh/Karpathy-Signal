import React from 'react';

export default function SignalCard({ signal, index }) {
  // Format the date
  const dateObj = new Date(signal.date_time);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <article 
      className="glass-card"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="card-header">
        <span className="card-date">{formattedDate} • {formattedTime}</span>
      </div>
      
      {/* Title (if present / usually Nitter uses the tweet text as title, but let's just use it if short) */}
      <div className="card-summary">
        {/* We prefix with a small tag or icon to show it's AI generated */}
        <strong style={{color: 'var(--accent)', display: 'block', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em'}}>✨ AI Insight</strong>
        {signal.summary}
      </div>

      <div className="card-original">
        "{signal.original_text}"
      </div>
      
      <a 
        href={signal.link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="card-link"
      >
        View Original Post
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </article>
  );
}
