"use client";

import React, { useState } from 'react';
import { Play, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface ControlPanelProps {
  status: string;
  progress: { stage: string; percent: number };
  result: any;
  onStartScan: (batchNumber: string) => void;
}

export default function ControlPanel({ status, progress, result, onStartScan }: ControlPanelProps) {
  const [batchNumber, setBatchNumber] = useState(`BCH-${Math.floor(Math.random() * 10000)}`);

  const isScanning = status === 'SCANNING';

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
        <Play className="w-5 h-5 text-honey-400" /> Control Panel
      </h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Batch Number</label>
        <input 
          type="text" 
          value={batchNumber}
          onChange={(e) => setBatchNumber(e.target.value)}
          disabled={isScanning}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-honey-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
          placeholder="Enter batch number"
        />
      </div>

      <button
        onClick={() => onStartScan(batchNumber)}
        disabled={isScanning || !batchNumber}
        className="w-full bg-gradient-to-r from-honey-500 to-amber-600 hover:from-honey-400 hover:to-amber-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {isScanning ? 'Scan in Progress...' : 'Initialize Hardware Scan'}
      </button>

      {isScanning && (
        <div className="mt-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-honey-400 font-medium">{progress.stage}</span>
            <span className="text-slate-300">{progress.percent}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-700 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-honey-400 to-amber-500 h-3 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress.percent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {status === 'COMPLETE' && result && (
        <div className="mt-8 p-5 bg-slate-900/50 border border-slate-700 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">Analysis Complete</h3>
          
          <div className="flex items-center gap-3">
            {result.classification === 'Adulterated' ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
            <div>
              <p className="text-sm text-slate-400">Classification</p>
              <p className={`text-xl font-bold ${result.classification === 'Adulterated' ? 'text-red-400' : 'text-green-400'}`}>
                {result.classification}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400">AI Confidence</p>
            <p className="text-lg font-mono text-slate-200">{(result.confidence * 100).toFixed(2)}%</p>
          </div>

          {result.pdfUrl && (
            <a 
              href={`http://localhost:3001${result.pdfUrl}`} 
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-3 rounded-lg transition-colors mt-4 font-medium"
            >
              <FileText className="w-4 h-4" /> View PDF Report
            </a>
          )}
        </div>
      )}

      {status === 'ERROR' && (
        <div className="mt-8 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">Error connecting to hardware or processing scan. Please recalibrate the sensor array.</p>
        </div>
      )}
    </div>
  );
}
