"use client";

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Charts from './Charts';
import ControlPanel from './ControlPanel';

export default function Dashboard() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('IDLE'); // IDLE, SCANNING, COMPLETE, ERROR
  const [progress, setProgress] = useState<{stage: string, percent: number}>({ stage: '', percent: 0 });
  const [sensorData, setSensorData] = useState<any>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Connect to the backend
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to backend WebSocket');
    });

    newSocket.on('scan_progress', (data) => {
      setProgress(data);
    });

    newSocket.on('scan_data', (data) => {
      setSensorData((prev: any) => ({
        ...prev,
        [data.type]: data.data
      }));
    });

    newSocket.on('scan_complete', (data) => {
      setScanStatus('COMPLETE');
      setResult(data);
    });

    newSocket.on('scan_error', (data) => {
      setScanStatus('ERROR');
      console.error(data.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleStartScan = (batchNumber: string) => {
    if (socket) {
      setScanStatus('SCANNING');
      setProgress({ stage: 'Initializing', percent: 0 });
      setSensorData({});
      setResult(null);
      socket.emit('start_scan', { batchNumber });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-honey-400 to-amber-600 bg-clip-text text-transparent">
            Honey Quality Assessment v3.0
          </h1>
          <p className="text-slate-400 mt-1">Real-time Spectral & Thermal Analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-sm text-slate-300 font-medium">
            {socket?.connected ? 'JMAC Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ControlPanel 
            status={scanStatus}
            progress={progress}
            result={result}
            onStartScan={handleStartScan}
          />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <Charts sensorData={sensorData} />
        </div>
      </div>
    </div>
  );
}
