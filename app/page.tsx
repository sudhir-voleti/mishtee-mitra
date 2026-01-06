"use client";

import React, { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 1. SUPABASE CLIENT ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- 2. LOGISTICS UTILITIES ---
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

export default function MishTeeMitraApp() {
  // --- 3. STATE ---
  const [phone, setPhone] = useState('');
  const [agent, setAgent] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPoD, setShowPoD] = useState(false);
  const [jobDone, setJobDone] = useState(false);
  const [congestion] = useState(Math.floor(Math.random() * 10) + 1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const BRAND = { orange: '#FF8C00', bg: '#F3F4F6', white: '#FFFFFF', green: '#065F46' };

  // --- 4. CORE FETCHING LOGIC (STRICT SCHEMA MAPPING) ---
  const fetchData = async (inputPhone?: string) => {
    setLoading(true);
    const targetPhone = (inputPhone || phone).trim();
    
    try {
      // Step A: Find Agent by phone number to get their agent_id
      const { data: agentData, error: agentErr } = await supabase
        .from('agents')
        .select('*')
        .eq('phone_number', targetPhone)
        .single();

      if (agentErr || !agentData) throw new Error("Agent not found.");
      setAgent(agentData);

      // Step B: Fetch Order using exact column names from your CREATE TABLE statements
      const { data: task, error: taskErr } = await supabase
        .from('orders')
        .select(`
          order_id, 
          status,
          qty_kg,
          order_value_inr,
          customers (
            full_name, 
            delivery_address,
            lat, 
            lon
          ), 
          stores (
            location_name,
            lat, 
            lon
          ),
          products (
            sweet_name,
            variant_type
          )
        `)
        .eq('agent_id', agentData.agent_id) // Link to agents.agent_id
        .eq('status', 'Pending')            // Match your CHECK constraint
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (taskErr) throw new Error(taskErr.message);
      setOrderData(task || null);
      setJobDone(false);
    } catch (err: any) { 
      alert(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const completeDelivery = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Delivered' }) // Match your CHECK constraint
        .eq('order_id', orderData.order_id);
      
      if (error) throw error;
      setJobDone(true);
      setShowPoD(false);
      setOrderData(null);
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 5. SIGNATURE PAD LOGIC ---
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
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

  // --- 6. RENDERERS ---
  if (!agent) return (
    <div style={{ maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: BRAND.bg, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="https://raw.githubusercontent.com/sudhir-voleti/mishtee-magic/main/mishTee_logo.png" style={{ width: '100px', marginBottom: '20px' }} alt="logo" />
        <h2 style={{ color: BRAND.orange }}>Mitra Login</h2>
        <input style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #DDD', margin: '20px 0', boxSizing: 'border-box', fontSize: '16px' }}
          type="tel" placeholder="Enter Registered Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button style={{ backgroundColor: BRAND.orange, color: 'white', border: 'none', borderRadius: '12px', padding: '16px', fontWeight: 'bold', width: '100%', fontSize: '16px', cursor: 'pointer' }} onClick={() => fetchData()}>Login</button>
      </div>
    </div>
  );

  if (jobDone) return (
    <div style={{ maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: BRAND.bg, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '80px', margin: '0' }}>📦</h1>
      <h2 style={{ color: BRAND.green }}>Order Delivered!</h2>
      <p style={{ color: '#6B7280' }}>Great job, Mitra. The sweets reached safely.</p>
      <button style={{ backgroundColor: BRAND.orange, color: 'white', border: 'none', borderRadius: '15px', padding: '18px', fontWeight: 'bold', marginTop: '30px', cursor: 'pointer' }} onClick={() => fetchData()}>Next Task</button>
    </div>
  );

  if (!orderData) return (
    <div style={{ maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: BRAND.bg, padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ marginTop: '100px' }}>
        <p style={{ fontSize: '18px', color: '#6B7280' }}>No active tasks for your ID.</p>
        <button style={{ backgroundColor: BRAND.orange, color: 'white', border: 'none', borderRadius: '15px', padding: '16px', fontWeight: 'bold', marginTop: '20px', width: '200px', cursor: 'pointer' }} onClick={() => fetchData()}>Refresh</button>
        <button onClick={() => setAgent(null)} style={{ display: 'block', margin: '40px auto', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
      </div>
    </div>
  );

  const dist = calculateDistance(orderData.stores?.lat, orderData.stores?.lon, orderData.customers?.lat, orderData.customers?.lon);
  const eta = (congestion > 7 ? Math.ceil(dist * 6) + 20 : Math.ceil(dist * 6));

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: BRAND.bg, padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: BRAND.orange, margin: 0 }}>Mitra Dashboard</h3>
        <span style={{ color: BRAND.green, fontSize: '12px', fontWeight: 'bold' }}>● ONLINE</span>
      </div>

      <div style={{ backgroundColor: BRAND.white, borderRadius: '25px', padding: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#E0F2FE', color: '#0369A1' }}>{dist} KM</span>
          {congestion > 7 && <span style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#FEE2E2', color: '#B91C1C' }}>⚠️ TRAFFIC</span>}
        </div>
        
        <p style={{ margin: 0, fontSize: '10px', color: '#9CA3AF', fontWeight: 'bold' }}>RECIPIENT</p>
        <h3 style={{ margin: '4px 0 10px 0', fontSize: '22px' }}>{orderData.customers?.full_name}</h3>
        <p style={{ fontSize: '15px', color: '#4B5563', marginBottom: '15px' }}>{orderData.customers?.delivery_address}</p>
        
        <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '12px', marginBottom: '15px' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#9CA3AF' }}>ORDER DETAILS</p>
          <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{orderData.qty_kg}kg {orderData.products?.sweet_name} ({orderData.products?.variant_type})</p>
        </div>

        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
          <div><p style={{ margin: 0, fontSize: '10px', color: '#9CA3AF' }}>EST. TIME</p><b>{eta} MINS</b></div>
          <div><p style={{ margin: 0, fontSize: '10px', color: '#9CA3AF' }}>COLLECT</p><b>₹{orderData.order_value_inr}</b></div>
        </div>
      </div>

      {showPoD ? (
        <div style={{ backgroundColor: BRAND.white, borderRadius: '25px', padding: '25px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>Customer Signature</p>
          <canvas ref={canvasRef} width={400} height={200} style={{ border: '2px dashed #D1D5DB', borderRadius: '15px', backgroundColor: '#FAFAFA', touchAction: 'none', width: '100%' }} onMouseDown={startDrawing} onTouchStart={startDrawing} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button style={{ backgroundColor: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '15px', padding: '16px', fontWeight: 'bold', flex: 1 }} onClick={() => setShowPoD(false)}>Back</button>
            <button style={{ backgroundColor: BRAND.green, color: 'white', border: 'none', borderRadius: '15px', padding: '16px', fontWeight: 'bold', flex: 2 }} onClick={completeDelivery}>Confirm Delivery</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ borderRadius: '25px', overflow: 'hidden', height: '230px', marginBottom: '20px', border: '1px solid #E5E7EB' }}>
            <iframe width="100%" height="100%" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${(orderData.customers?.lon || 0)-0.005},${(orderData.customers?.lat || 0)-0.005},${(orderData.customers?.lon || 0)+0.005},${(orderData.customers?.lat || 0)+0.005}&layer=mapnik&marker=${orderData.customers?.lat},${orderData.customers?.lon}`} />
          </div>
          <button style={{ backgroundColor: BRAND.orange, color: 'white', border: 'none', borderRadius: '18px', padding: '20px', fontWeight: 'bold', width: '100%', fontSize: '18px' }} 
            onClick={() => setShowPoD(true)}>
            Deliver & Close Order
          </button>
        </>
      )}
    </div>
  );
}
