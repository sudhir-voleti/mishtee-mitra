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

  // --- REVISED DATA LOGIC ---
  const fetchData = async (inputPhone?: string) => {
    setLoading(true);
    const targetPhone = (inputPhone || phone).trim(); // Remove any accidental whitespace
    
    try {
      // 1. Verify Agent
      const { data: agentData, error: agentErr } = await supabase
        .from('agents')
        .select('*')
        .eq('phone_number', targetPhone)
        .single();

      if (agentErr || !agentData) {
        console.error("Agent Fetch Error:", agentErr);
        throw new Error("Agent not found in database.");
      }
      setAgent(agentData);

      // 2. Fetch Order with Explicit Joins
      // We use the column 'agent_phone' in 'orders' to match 'phone_number' in 'agents'
      // We join 'customers' using the implicit foreign key defined in your schema
      const { data: task, error: taskErr } = await supabase
        .from('orders')
        .select(`
          order_id, 
          status, 
          delivery_address, 
          customers (
            full_name, 
            lat, 
            lon
          ), 
          stores (
            lat, 
            lon
          )
        `)
        .eq('agent_phone', targetPhone)
        .in('status', ['Pending', 'Assigned', 'Out for Delivery'])
        .order('created_at', { ascending: false })
        .limit(1);

      console.log("Raw Query Result:", task);

      if (taskErr) {
        console.error("Order Fetch Error:", taskErr);
        throw new Error(taskErr.message);
      }

      if (task && task.length > 0) {
        setOrderData(task[0]);
      } else {
        setOrderData(null);
      }
      
      setJobDone(false);
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('order_id', orderData.order_id);
    
    if (error) alert("Update failed: " + error.message);
    
    if (newStatus === 'Delivered') {
      setShowPoD(false);
      setJobDone(true);
      setOrderData(null);
    } else {
      fetchData();
    }
  };

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

  // UI STYLES
  const containerStyle: React.CSSProperties = { maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: BRAND.bg, fontFamily: 'sans-serif', padding: '20px', display: 'flex', flexDirection: 'column' };
  const cardStyle: React.CSSProperties = { backgroundColor: BRAND.white, borderRadius: '20px', padding: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', marginBottom: '20px' };
  const btnStyle: React.CSSProperties = { backgroundColor: BRAND.orange, color: 'white', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', width: '100%' };

  if (!agent) return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <img src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" style={{ width: '100px' }} alt="logo" />
        <h2 style={{ color: BRAND.orange }}>Mitra Login</h2>
        <input style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #DDD', margin: '20px 0', boxSizing: 'border-box' }}
          type="tel" placeholder="Enter Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button style={btnStyle} onClick={() => fetchData()}>Login</button>
      </div>
    </div>
  );

  if (jobDone) return (
    <div style={{ ...containerStyle, justifyContent: 'center', textAlign: 'center' }}>
      <h1 style={{ fontSize: '60px' }}>🎉</h1>
      <h2 style={{ color: BRAND.green }}>Job Well Done!</h2>
      <button style={{ ...btnStyle, marginTop: '20px' }} onClick={() => fetchData()}>Next Task</button>
    </div>
  );

  if (!orderData) return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <p style={{ color: '#6B7280', fontSize: '18px' }}>No active tasks found for <b>{agent.phone_number}</b>.</p>
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '10px' }}>Current Filter: Pending, Assigned, Out for Delivery</p>
        <button style={{ ...btnStyle, marginTop: '20px' }} onClick={() => fetchData()}>Refresh Status</button>
        <button onClick={() => setAgent(null)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>Logout</button>
      </div>
    </div>
  );

  const dist = calculateDistance(orderData.stores?.lat, orderData.stores?.lon, orderData.customers?.lat, orderData.customers?.lon);
  const eta = (congestion > 7 ? Math.ceil(dist * 6) + 20 : Math.ceil(dist * 6));

  return (
    <div style={containerStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ color: BRAND.orange, margin: 0 }}>Mitra: {agent.agent_id}</h3>
        <span style={{ fontWeight: 'bold', color: BRAND.green }}>● Online</span>
      </header>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#E0F2FE', color: '#0369A1' }}>{dist} km</span>
          {congestion > 7 && <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#FEE2E2', color: '#B91C1C' }}>⚠️ TRAFFIC</span>}
        </div>
        <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>RECIPIENT</p>
        <h3 style={{ margin: '2px 0 8px 0' }}>{orderData.customers?.full_name || 'Loading Name...'}</h3>
        <p style={{ fontSize: '14px', color: '#4B5563' }}>{orderData.delivery_address}</p>
      </div>

      {showPoD ? (
        <div style={cardStyle}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Recipient Signature</p>
          <canvas ref={canvasRef} width={300} height={150} style={{ border: '2px dashed #D1D5DB', borderRadius: '12px', backgroundColor: '#FFF', touchAction: 'none' }} onMouseDown={startDrawing} onTouchStart={startDrawing} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button style={{ ...btnStyle, backgroundColor: '#6B7280' }} onClick={() => setShowPoD(false)}>Back</button>
            <button style={btnStyle} onClick={() => updateStatus('Delivered')}>Finish</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ borderRadius: '20px', overflow: 'hidden', height: '200px', marginBottom: '20px', border: '1px solid #DDD' }}>
            <iframe width="100%" height="100%" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${(orderData.customers?.lon || 0)-0.01},${(orderData.customers?.lat || 0)-0.01},${(orderData.customers?.lon || 0)+0.01},${(orderData.customers?.lat || 0)+0.01}&layer=mapnik&marker=${orderData.customers?.lat},${orderData.customers?.lon}`} />
          </div>
          <button style={btnStyle} onClick={() => orderData.status === 'Out for Delivery' ? setShowPoD(true) : updateStatus('Out for Delivery')}>
            {orderData.status === 'Out for Delivery' ? 'Mark as Delivered' : 'Start Delivery'}
          </button>
        </>
      )}
    </div>
  );
}
