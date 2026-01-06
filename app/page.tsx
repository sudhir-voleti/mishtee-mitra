"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MitraDashboard() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Shared Styles
  const colors = {
    mishTeeOrange: '#FF8C00',
    onlineGreen: '#22c55e',
    backgroundGray: '#f9fafb',
    cardWhite: '#ffffff',
    textDark: '#1f2937',
    textMuted: '#6b7280',
  };

  useEffect(() => {
    async function fetchActiveOrder() {
      try {
        setLoading(true);
        // Logic: Fetch order for Agent A101 joined with customer full_name
        const { data, error } = await supabase
          .from('orders')
          .select(`
            delivery_address,
            customers (
              full_name
            )
          `)
          .eq('agent_id', 'A101')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error("Hydration Error:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveOrder();
  }, []);

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
      <main style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* LOGO */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <img 
            src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" 
            alt="mishTee Logo" 
            style={{ width: '80px', height: 'auto' }}
          />
        </div>

        {/* HEADER & STATUS */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: colors.mishTeeOrange, fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0' }}>
            mishTee Delivery Mitra
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#ecfdf5', padding: '4px 12px', borderRadius: '20px', border: '1px solid #d1fae5' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.onlineGreen }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#065f46' }}>Agent Online</span>
          </div>
        </div>

        {/* DELIVERY CARD (Hydrated) */}
        <div style={{
          backgroundColor: colors.cardWhite,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          border: '1px solid #f3f4f6',
        }}>
          {loading ? (
            <p style={{ color: colors.textMuted, textAlign: 'center', fontWeight: '600' }}>Loading active task...</p>
          ) : order ? (
            <>
              <p style={{ color: colors.textMuted, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Active Task</p>
              <h2 style={{ color: colors.textDark, fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0' }}>
                Deliver to {order.customers?.full_name || 'Valued Customer'}
              </h2>
              <div style={{ borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <p style={{ color: colors.textMuted, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: '0' }}>Address</p>
                <p style={{ color: colors.textDark, fontSize: '14px', lineHeight: '1.4', margin: '4px 0 0 0' }}>
                  {order.delivery_address}
                </p>
              </div>
            </>
          ) : (
            <p style={{ color: colors.textMuted, textAlign: 'center' }}>No active tasks found.</p>
          )}
        </div>

        {/* ACTION BUTTON */}
        <button 
          onClick={() => order && window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`, '_blank')}
          disabled={loading || !order}
          style={{
            backgroundColor: (loading || !order) ? '#ccc' : colors.mishTeeOrange,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '18px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: (loading || !order) ? 'not-allowed' : 'pointer',
            boxShadow: '0 10px 15px -3px rgba(255, 140, 0, 0.3)',
            width: '100%'
          }}
        >
          Open Navigation
        </button>

      </main>
    </div>
  );
}
