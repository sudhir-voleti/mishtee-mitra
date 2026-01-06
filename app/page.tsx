"use client";

import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION & CLIENT ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- UTILITIES ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

export default function MishTeeLogisticsEngine() {
  const [phone, setPhone] = useState('');
  const [agent, setAgent] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPoD, setShowPoD] = useState(false);
  const [jobDone, setJobDone] = useState(false);
  const [congestion] = useState(Math.floor(Math.random() * 10) + 1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const BRAND = { orange: '#FF8C00', bg: '#F3F4F6', white: '#FFFFFF', text: '#111827', green: '#065F46' };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: BRAND.bg, fontFamily: 'sans-serif', padding: '20px', display: 'flex', flexDirection: 'column' },
    card: { backgroundColor: BRAND.white, borderRadius: '20px', padding: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', marginBottom: '20px' },
    btn: { backgroundColor: BRAND.orange, color: 'white', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', width: '100%' },
    badge: { padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    canvas: { border: '2px dashed #D1D5DB', borderRadius: '12px', backgroundColor: '#FFF', touchAction: 'none' }
  };

  // --- REVISED DATA LOGIC ---
  const fetchData = async (inputPhone?: string) => {
    setLoading(true);
    const targetPhone = inputPhone || phone;
    try {
      // 1. Verify Agent by phone_number
      const { data: agentData, error: agentErr } = await supabase
        .from('agents')
        .select('*')
        .eq('phone_number', targetPhone)
        .single();

      if (agentErr || !agentData) throw new Error("Agent not found.");
      setAgent(agentData);

      // 2. Fetch Order with revised schema logic
      // Linking orders.agent_phone to agent.phone_number
      // Linking orders.customer_id to customers.phone (as per your schema reference)
      const { data: task, error: taskErr } = await supabase
        .from('orders')
        .select(`
          order_id, 
          status, 
          delivery_address, 
          customers!inner(full_name, lat, lon), 
          stores!inner(lat, lon)
        `)
        .eq('agent_phone', targetPhone) // Fixed: Using agent_phone
        .in('status', ['Pending', 'Assigned', 'Out for Delivery']) // Expanded status
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Prevents crash if no task is found

      setOrderData(task || null);
      setJobDone(false);
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const updateStatus = async (newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('order_id', orderData.order_id);
    if (newStatus === 'Delivered') {
      setShowPoD(false);
      setJobDone(true);
      setOrderData(null);
    } else {
      fetchData();
    }
  };

  // --- SIGNATURE DRAWING LOGIC ---
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y);
    const draw = (moveEvent: any) => {
      const mx = (moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX)) - rect.left;
      const my = (moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY)) - rect.top;
      ctx.lineTo(mx, my); ctx.stroke();
    };
    const stop = () => {
      canvas.removeEventListener('mousemove', draw); canvas.removeEventListener('touchmove', draw);
    };
    canvas.addEventListener('mousemove', draw); canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('mouseup', stop); canvas.addEventListener('touchend', stop);
  };

  if (!agent) return (
    <div style={styles.container}>
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <img src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" style={{ width: '100px' }} alt="logo" />
        <h2 style={{ color: BRAND.orange }}>Mitra Login</h2>
        <input style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #DDD', margin: '20px 0', boxSizing: 'border-box' }}
          type="tel" placeholder="10-digit Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button style={styles.btn} onClick={() => fetchData()}>Login</button>
      </div>
    </div>
  );

  if (jobDone) return (
    <div style={{ ...styles.container, justifyContent: 'center', textAlign: 'center' }}>
      <h1 style={{ fontSize: '60px' }}>🎉</h1>
      <h2 style={{ color: BRAND.green }}>Job Well Done, Mitra!</h2>
      <button style={{ ...styles.btn, marginTop: '20px' }} onClick={() => fetchData()}>Look for Next Task</button>
    </div>
  );

  if (!orderData) return (
    <div style={styles.container}>
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <p>No active tasks found for {agent.phone_number}.</p>
        <button style={{ ...styles.btn, marginTop: '20px' }} onClick={() => fetchData()}>Check Again</button>
        <button onClick={() => setAgent(null)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>Logout</button>
      </div>
    </div>
  );

  const dist = calculateDistance(orderData.stores.lat, orderData.stores.lon, orderData.customers.lat, orderData.customers.lon);
  const eta = (congestion > 7 ? Math.ceil(dist * 6) + 20 : Math.ceil(dist * 6));

  return (
    <div style={styles.container}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ color: BRAND.orange, margin: 0 }}>Mitra: {agent.agent_id}</h3>
        <span style={{ fontWeight: 'bold', color: BRAND.green }}>● Online</span>
      </header>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ ...styles.badge, backgroundColor: '#E0F2FE', color: '#0369A1' }}>{dist} km</span>
          {congestion > 7 && <span style={{ ...styles.badge, backgroundColor: '#FEE2E2', color: '#B91C1C' }}>⚠️ TRAFFIC</span>}
        </div>
        <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>RECIPIENT</p>
        <h3 style={{ margin: '2px 0 8px 0' }}>{orderData.customers.full_name}</h3>
        <p style={{ fontSize: '14px', color: '#4B5563' }}>{orderData.delivery_address}</p>
        <div style={{ marginTop: '15px', borderTop: '1px solid #EEE', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <span>ETA: <b>{eta}m</b></span>
          <span>Status: <b style={{ color: BRAND.orange }}>{orderData.status}</b></span>
        </div>
      </div>

      {showPoD ? (
        <div style={styles.card}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Recipient Signature</p>
          <canvas ref={canvasRef} width={300} height={150} style={styles.canvas} onMouseDown={startDrawing} onTouchStart={startDrawing} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button style={{ ...styles.btn, backgroundColor: '#6B7280' }} onClick={() => setShowPoD(false)}>Back</button>
            <button style={styles.btn} onClick={() => updateStatus('Delivered')}>Confirm Delivery</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ borderRadius: '20px', overflow: 'hidden', height: '200px', marginBottom: '20px', border: '1px solid #DDD' }}>
            <iframe width="100%" height="100%" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${orderData.customers.lon-0.01},${orderData.customers.lat-0.01},${orderData.customers.lon+0.01},${orderData.customers.lat+0.01}&layer=mapnik&marker=${orderData.customers.lat},${orderData.customers.lon}`} />
          </div>
          {orderData.status === 'Pending' || orderData.status === 'Assigned' ? (
            <button style={styles.btn} onClick={() => {
              updateStatus('Out for Delivery');
              window.open(`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${orderData.stores.lat},${orderData.stores.lon};${orderData.customers.lat},${orderData.customers.lon}`, '_blank');
            }}>Start Delivery</button>
          ) : (
            <button style={{ ...styles.btn, backgroundColor: BRAND.green }} onClick={() => setShowPoD(true)}>Mark as Delivered</button>
          )}
        </>
      )}
      <button onClick={() => setAgent(null)} style={{ marginTop: 'auto', background: 'none', border: 'none', color: '#9CA3AF', padding: '20px', cursor: 'pointer' }}>Logout</button>
    </div>
  );
}
