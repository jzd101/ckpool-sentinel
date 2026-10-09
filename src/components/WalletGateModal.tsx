"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Wallet, ArrowRight, Sparkles, Check, AlertCircle, X, Clipboard, ShieldCheck } from "lucide-react";
import { DEFAULT_BTC_ADDRESS } from "@/lib/constants";

interface WalletGateModalProps {
  isOpen: boolean;
  mode: "gate" | "edit";
  currentAddress?: string;
  onSave: (address: string) => void;
  onClose?: () => void;
}

// Basic Bitcoin address validation
export function validateBtcAddress(addr: string): { valid: boolean; error?: string } {
  const cleaned = addr.trim();
  if (!cleaned) {
    return { valid: false, error: "กรุณาระบุ Bitcoin Wallet Address" };
  }
  // Standard BTC address lengths typically 26 to 90 chars (Legacy, SegWit P2SH, Native SegWit bech32/bech32m)
  if (cleaned.length < 26 || cleaned.length > 90) {
    return { valid: false, error: "ความยาว Address ไม่ถูกต้อง (ปกติจะอยู่ระหว่าง 26-90 ตัวอักษร)" };
  }
  // Check for allowed characters: alphanumeric (Base58 or Bech32)
  if (!/^[a-zA-Z0-9]+$/.test(cleaned)) {
    return { valid: false, error: "Address ต้องมีเฉพาะตัวอักษรและตัวเลขเท่านั้น (ห้ามมีเว้นวรรคหรือสัญลักษณ์พิเศษ)" };
  }
  return { valid: true };
}

export default function WalletGateModal({
  isOpen,
  mode,
  currentAddress = "",
  onSave,
  onClose,
}: WalletGateModalProps) {
  const [addressInput, setAddressInput] = useState<string>(currentAddress || "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedDemo, setCopiedDemo] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAddressInput(currentAddress || "");
      setValidationError(null);
    }
  }, [isOpen, currentAddress]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = validateBtcAddress(addressInput);
    if (!result.valid) {
      setValidationError(result.error || "Address ไม่ถูกต้อง");
      return;
    }
    setValidationError(null);
    onSave(addressInput.trim());
  };

  const handleUseDemo = () => {
    setAddressInput(DEFAULT_BTC_ADDRESS);
    setValidationError(null);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAddressInput(text.trim());
        setValidationError(null);
      }
    } catch {
      // ignore clipboard permission error
    }
  };

  // Content of the input form
  const formContent = (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-400" />
              Bitcoin Wallet Address
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              (SegWit / Taproot / Legacy)
            </span>
          </label>

          <div className="relative">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="เช่น bc1qw7mwuw... หรือ 1A1zP1e... หรือ 3J98t1..."
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 rounded-xl px-4 py-3 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all pr-20"
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {addressInput && (
                <button
                  type="button"
                  onClick={() => setAddressInput("")}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                  title="ล้างข้อมูล"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePaste}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                title="วางจากคลิปบอร์ด"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Validation error message */}
          {validationError && (
            <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Demo address quick filler */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={handleUseDemo}
            className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>ใช้ Demo Wallet เริ่มต้น ({DEFAULT_BTC_ADDRESS.slice(0, 8)}...)</span>
          </button>
          {copiedDemo && (
            <span className="text-emerald-400 text-[11px] flex items-center gap-1">
              <Check className="w-3 h-3" /> ใส่ให้แล้ว
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-3">
          {mode === "edit" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium text-xs sm:text-sm transition-colors text-center"
            >
              ยกเลิก
            </button>
          )}
          <button
            type="submit"
            className={`${
              mode === "edit" ? "w-2/3" : "w-full"
            } py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 group cursor-pointer`}
          >
            <span>{mode === "gate" ? "บันทึกและเข้าสู่ Dashboard" : "บันทึกและสลับ Wallet"}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>

      {/* Persistence Note */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>
          ที่อยู่ Wallet จะถูกบันทึกไว้ในเบราว์เซอร์ของคุณอย่างปลอดภัย คุณสามารถเปลี่ยนหรือแก้ไขได้ตลอดเวลาที่หน้า Dashboard
        </span>
      </div>
    </div>
  );

  // If GATE mode (Full-page gateway screen)
  if (mode === "gate") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
        {/* Background ambient neon glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        {/* Center Gateway Card */}
        <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative z-10">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-500 rounded-t-3xl" />

          {/* Logo and Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-xl shadow-amber-500/10 mb-4">
              <Cpu className="w-9 h-9 text-amber-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              Solo Mining Sentinel
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              CKPool <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Sentinel</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm">
              ระบบตรวจสอบสถิติและสถานะการขุด Bitcoin Solo แบบเรียลไทม์ กรุณาระบุ Wallet Address เพื่อเริ่มต้น
            </p>
          </div>

          {formContent}
        </div>
      </div>
    );
  }

  // If EDIT mode (Modal overlay over dashboard)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative z-10">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-cyan-400 to-emerald-500 rounded-t-3xl" />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">แก้ไข Bitcoin Wallet Address</h2>
              <p className="text-xs text-slate-400">เปลี่ยนกระเป๋าที่ใช้ดึงข้อมูลจาก CKPool</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {formContent}
      </div>
    </div>
  );
}
