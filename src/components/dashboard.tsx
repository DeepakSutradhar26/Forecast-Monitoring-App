"use client"

import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";

// Converting input to correct time format
function convertToISO(date:string,time:number){
    let hour = String(time);
    if(hour.length < 2) hour = String(0).concat(hour);
    return `${date}T${hour}:00:00Z`;
}

function formatAxisTime(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

export default function Dashboard(){
  const [startDate, setStartDate] = useState("2025-01-02");
  const [startTime, setStartTime] = useState(0);

  const [endDate, setEndDate] = useState("2025-01-03");
  const [endTime, setEndTime] = useState(0);

  const [horizon, setHorizon] = useState(4);

  const [data, setData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  // Using memo avoid countinuosly fetching of api
  const query = useMemo(()=>{
    return `/api/wind-data?start=${convertToISO(startDate,startTime)}&end=${convertToISO(endDate,endTime)}&horizon=${horizon}`;
  }, [startDate, startTime, endDate, endTime, horizon]);

  useEffect(()=>{
      async function fetchData(){
        try{
          const data = await fetch(query);
          const res = await data.json();

          const forecastMap = new Map<string,any>();

          // Keeping track of latest predicted power which is >= horizon + publishTime
          res.generated.forEach((item : any)=>{
            const key = new Date(item.startTime).toISOString();
            const start = new Date(item.startTime).getTime();
            const publish = new Date(item.publishTime).getTime();
            const horizonMs = horizon * 60 * 60 * 1000;

            if(start - publish >= horizonMs){
              if(!forecastMap.has(key)){
                forecastMap.set(key, item);
              }else{
                const existing = forecastMap.get(key);
                if(new Date(item.publishTime) > new Date(existing.publishTime)){
                  forecastMap.set(key, item);
                }
              }
            }
          });

          const map = new Map();

          // Adding actual power plot also solving resolution problem
          res.actual.forEach((item : any)=>{
            const key = new Date(item.startTime).toISOString();

            const d = new Date(item.startTime);
            d.setUTCMinutes(0,0,0);
            const hourKey = d.toISOString();

            map.set(key, {
              time : key,
              actual : item.generation,
              forecast : forecastMap.get(hourKey)?.generation ?? null
            });
          });

          const chartData = Array.from(map.values()).sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
          );
          setData(chartData);
        }catch(err:any){
          console.log(err);
        }
      }
      fetchData();
  },[query, tick]);

   const inputStyle = {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "white",
    padding: "8px 12px",
    fontSize: 14,
    outline: "none",
    colorScheme: "dark" as const,
  };
 
  const labelStyle = {
    display: "block",
    fontSize: 11,
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  };
 
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
 
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "white" }}>
          Forecast Monitoring App
        </h1>
        <button
          onClick={() => setTick(t => t + 1)}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
          >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
 
      {/* Controls */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-end",
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: "20px 24px",
      }}>
        {/* Start */}
        <div>
          <label style={labelStyle}>Start Time</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            <input type="number" min={0} max={23} value={startTime} onChange={e => setStartTime(Number(e.target.value))} style={{ ...inputStyle, width: 70 }} />
          </div>
        </div>
 
        {/* End */}
        <div>
          <label style={labelStyle}>End Time</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
            <input type="number" min={0} max={23} value={endTime} onChange={e => setEndTime(Number(e.target.value))} style={{ ...inputStyle, width: 70 }} />
          </div>
        </div>
 
        {/* Horizon */}
        <div style={{ minWidth: 200 }}>
          <label style={labelStyle}>
            Forecast Horizon: <span style={{ color: "#60a5fa" }}>{horizon}h</span>
          </label>
          <input
            type="range" min={0} max={48} value={horizon}
            onChange={e => setHorizon(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#3b82f6" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginTop: 4 }}>
            <span>0h</span><span>24h</span><span>48h</span>
          </div>
        </div>
      </div>
 
      {/* Chart */}
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: "20px 16px 16px",
        position: "relative",
      }}>
        {loading && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 12,
            background: "rgba(15,23,42,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10,
          }}>
            <span style={{ color: "#64748b", fontSize: 14 }}>Loading...</span>
          </div>
        )}
        <div style={{ width: "100%", height: 450 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 24, left: 8, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                tickFormatter={formatAxisTime}
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                interval="preserveStartEnd"
                label={{ value: "Target Time (UTC)", position: "insideBottom", offset: -14, fontSize: 12, fill: "#475569" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={{ stroke: "#1e293b" }}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                label={{ value: "Power (MW)", angle: -90, position: "insideLeft", offset: 16, fontSize: 12, fill: "#475569" }}
              />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "white" }}
                labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                labelFormatter={(label: any) => formatAxisTime(label)}
                formatter={(val: any) => [`${val?.toLocaleString()} MW`]}
              />
              <Legend verticalAlign="top" wrapperStyle={{ color: "#94a3b8", fontSize: 13, paddingBottom: 8 }} />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={false} name="Actual" connectNulls={false} />
              <Line type="monotone" dataKey="forecast" stroke="#22c55e" strokeWidth={2} dot={false} name="Forecast" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
 
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}