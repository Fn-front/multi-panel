'use client';

import { useState } from 'react';

export default function TestFunctionsPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testFunction = async (functionName: string, body?: object) => {
    console.log('testFunction called:', functionName, body);
    setLoading(true);
    setResult('実行中...');

    try {
      console.log('Invoking function:', functionName);

      // 直接fetchで呼び出し
      const response = await fetch(
        `https://thqnjduwbfpbxoifovui.supabase.co/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(body || {}),
        }
      );

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Result:', data);

      if (!response.ok) {
        setResult(`エラー (${response.status}): ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error('Exception:', err);
      setResult(`例外: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Functions テスト</h1>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => testFunction('fetch-channel-streams')}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          fetch-channel-streams
        </button>

        <button
          onClick={() =>
            testFunction('fetch-past-streams', { daysAgo: 7 })
          }
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          fetch-past-streams (7日)
        </button>

        <button
          onClick={() =>
            testFunction('cleanup-old-events', { retentionDays: 365 })
          }
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          cleanup-old-events (365日)
        </button>
      </div>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          minHeight: '200px',
        }}
      >
        {result || '関数を実行してください'}
      </div>
    </div>
  );
}
