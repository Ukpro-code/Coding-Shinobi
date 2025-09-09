import { useState } from 'react'

export default function App() {
  const [testMessage, setTestMessage] = useState('App is loading...')

  return (
    <div style={{ 
      padding: '20px', 
      background: 'white', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: 'black', fontSize: '32px', marginBottom: '20px' }}>
        🚀 Simple App Test
      </h1>
      
      <div style={{
        background: '#f0f0f0',
        padding: '20px',
        border: '2px solid #ccc',
        marginBottom: '20px'
      }}>
        <p style={{ color: 'green', fontSize: '18px', margin: '0 0 15px 0' }}>
          ✅ {testMessage}
        </p>
        
        <button 
          onClick={() => {
            setTestMessage('Button clicked! React state is working!')
            console.log('Button clicked successfully')
          }}
          style={{
            background: 'blue',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          Test React State
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            background: 'green',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            borderRadius: '4px'
          }}
        >
          Reload Page
        </button>
      </div>
      
      <div style={{
        background: '#ffe6e6',
        padding: '15px',
        border: '1px solid #ff9999'
      }}>
        <h3>If you can see this text, the following are working:</h3>
        <ul>
          <li>✅ Vite development server</li>
          <li>✅ React rendering</li>
          <li>✅ TypeScript compilation</li>
          <li>✅ CSS styling</li>
        </ul>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}
