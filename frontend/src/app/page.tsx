"use client";

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Navbar from '@/components/Navbar';
import MarketplaceView from '@/components/MarketplaceView';
import BarcodeVerifierView from '@/components/BarcodeVerifierView';
import LabScannerView from '@/components/LabScannerView';
import MerchantPortalView from '@/components/MerchantPortalView';
import SaasAdminView from '@/components/SaasAdminView';
import CartModal from '@/components/CartModal';
import HoneyEncyclopediaModal from '@/components/HoneyEncyclopediaModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'scanner' | 'lab' | 'merchant' | 'saas'>('marketplace');
  const [currentRole, setCurrentRole] = useState<'CUSTOMER' | 'MERCHANT' | 'LAB_TECHNICIAN' | 'ADMIN'>('CUSTOMER');
  
  // Cart state
  const [cartItems, setCartItems] = useState<{ product: any; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Barcode Verifier target state
  const [selectedBarcodeForVerification, setSelectedBarcodeForVerification] = useState<string>('');

  // Encyclopedia Modal
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [encyclopediaHoneyTypeId, setEncyclopediaHoneyTypeId] = useState<string | undefined>();

  // WebSocket Live Connection
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      setIsSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAddToCart = (product: any) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleVerifyBarcode = (barcode: string) => {
    setSelectedBarcodeForVerification(barcode);
    setActiveTab('scanner');
  };

  const handleOpenEncyclopedia = (honeyTypeId?: string) => {
    setEncyclopediaHoneyTypeId(honeyTypeId);
    setIsEncyclopediaOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Top Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        isSocketConnected={isSocketConnected}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {activeTab === 'marketplace' && (
          <MarketplaceView
            onAddToCart={handleAddToCart}
            onVerifyBarcode={handleVerifyBarcode}
            onOpenEncyclopedia={handleOpenEncyclopedia}
          />
        )}

        {activeTab === 'scanner' && (
          <BarcodeVerifierView
            initialBarcode={selectedBarcodeForVerification}
            onClearInitialBarcode={() => setSelectedBarcodeForVerification('')}
          />
        )}

        {activeTab === 'lab' && (
          <LabScannerView
            onScanCompletedNavigateToMerchant={(sample) => {
              setActiveTab('merchant');
            }}
            onVerifyGeneratedBarcode={handleVerifyBarcode}
          />
        )}

        {activeTab === 'merchant' && (
          <MerchantPortalView
            onVerifyBarcode={handleVerifyBarcode}
            onNavigateToLab={() => setActiveTab('lab')}
          />
        )}

        {activeTab === 'saas' && (
          <SaasAdminView />
        )}
      </main>

      {/* Shopping Cart Drawer / Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onVerifyBarcode={handleVerifyBarcode}
      />

      {/* Honey Encyclopedia & Medical Guide Modal */}
      <HoneyEncyclopediaModal
        isOpen={isEncyclopediaOpen}
        onClose={() => setIsEncyclopediaOpen(false)}
        selectedHoneyTypeId={encyclopediaHoneyTypeId}
      />

      {/* Luxury Footer */}
      <footer className="border-t border-slate-800/80 glass-panel py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-400 font-semibold">
            <span>منظومة جودة العسل اليمني v3.0 (Web-Based Industrial Edition)</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">100% Accuracy Rate & Zero-Error Tolerance</span>
          </div>
          <p className="text-slate-500">
            مستشعرات طيفية فائقة (FT-IR, VIS 11-ch, VEML6075 UV, MLX90640 Thermal, Load Cell HX711, VOC BME688) متصلة بالمتحكم الصناعي JMAC وذكاء اصطناعي TensorFlow.js.
          </p>
          <p className="text-slate-600 text-[11px] pt-1">
            جميع الحقوق محفوظة للمنظومة المركزية لتوثيق وفحص جودة العسل الطبيعي © 2026
          </p>
        </div>
      </footer>

    </div>
  );
}
