// app/page.js
import React from 'react';

export default function MitraDashboard() {
  // Shared Color Palette
  const colors = {
    mishTeeOrange: '#FF8C00',
    onlineGreen: '#22c55e',
    backgroundGray: '#f9fafb',
    cardWhite: '#ffffff',
    textDark: '#1f2937',
    textMuted: '#6b7280',
  };

  return (
    <div style={{
      backgroundColor: colors.backgroundGray,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
    }}>
      {/* MOBILE CONTAINER CONSTRAINT */}
      <main style={{
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        
        {/* LOGO SECTION */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <img 
            src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" 
            alt="mishTee Logo" 
            style={{ width: '80px', height: 'auto' }}
          />
        </div>

        {/* HEADER & STATUS */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            color: colors.mishTeeOrange,
            fontSize: '24px',
            fontWeight: '800',
            margin: '0 0 8px 0',
          }}>
            mishTee Delivery Mitra
          </h1>
          
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: '#ecfdf5',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid #d1fae5'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.onlineGreen,
            }} />
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#065f46' 
            }}>
              Agent Online
            </span>
          </div>
        </div>

        {/* DELIVERY CARD */}
        <div style={{
          backgroundColor: colors.cardWhite,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #f3f4f6',
        }}>
          <p style={{
            color: colors.textMuted,
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 4px 0'
          }}>
            Current Mission
          </p>
          <h2 style={{
            color: colors.textDark,
            fontSize: '18px',
            fontWeight: '700',
            margin: '0'
          }}>
            Active Task: Deliver to Arjun Mehta
          </h2>
        </div>

        {/* ACTION BUTTON */}
        <button 
          type="button"
          style={{
            backgroundColor: colors.mishTeeOrange,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '18px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(255, 140, 0, 0.3)',
            transition: 'transform 0.1s ease',
            width: '100%'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Open Navigation
        </button>

      </main>
    </div>
  );
}
