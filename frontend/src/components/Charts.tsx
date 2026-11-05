"use client";

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Thermometer, Waves } from 'lucide-react';

interface ChartsProps {
  sensorData: any;
}

export default function Charts({ sensorData }: ChartsProps) {
  const nirChartData = useMemo(() => {
    if (!sensorData.nir) return [];
    return sensorData.nir.map((val: number, i: number) => ({
      wavelength: 1350 + i * ((2500 - 1350) / 100),
      absorbance: val
    }));
  }, [sensorData.nir]);

  const visChartData = useMemo(() => {
    if (!sensorData.vis) return [];
    return sensorData.vis.map((val: number, i: number) => ({
      channel: `Ch ${i+1}`,
      intensity: val
    }));
  }, [sensorData.vis]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
          <Waves className="w-5 h-5 text-honey-400" /> NIR Spectral Signature (1350-2500 nm)
        </h2>
        <div className="h-64 w-full">
          {nirChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={nirChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="wavelength" stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickFormatter={(v) => v.toFixed(0)} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [value.toFixed(2), 'Absorbance']}
                />
                <Line type="monotone" dataKey="absorbance" stroke="#eab308" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-sm border border-dashed border-slate-700 rounded-lg">
              Waiting for NeoSpectra Micro data...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-honey-400" /> VIS Spectrum (11-Channel)
          </h2>
          <div className="h-48 w-full">
            {visChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="channel" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}/>
                  <Line type="stepAfter" dataKey="intensity" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-sm border border-dashed border-slate-700 rounded-lg">
                Waiting for AS7341 data...
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-honey-400" /> Thermal Matrix (32x24)
          </h2>
          <div className="h-48 w-full flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative">
            {sensorData.thermal ? (
              <div 
                className="w-full h-full grid"
                style={{ 
                  gridTemplateColumns: `repeat(32, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(24, minmax(0, 1fr))`
                }}
              >
                {sensorData.thermal.map((row: number[], y: number) => 
                  row.map((temp: number, x: number) => {
                    // Map temp roughly 25-28C to a color scale (blue -> red)
                    const normalized = Math.max(0, Math.min(1, (temp - 25) / 3));
                    // Simple heatmap color logic (red for hotter)
                    const r = Math.floor(normalized * 255);
                    const b = Math.floor((1 - normalized) * 255);
                    return (
                      <div 
                        key={`${x}-${y}`} 
                        style={{ backgroundColor: `rgb(${r}, 0, ${b})` }} 
                        className="w-full h-full"
                        title={`T: ${temp.toFixed(1)}°C`}
                      />
                    );
                  })
                )}
              </div>
            ) : (
              <div className="text-slate-500 font-mono text-sm">
                Waiting for MLX90640 data...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
