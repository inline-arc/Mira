"use client";

import { motion } from 'framer-motion';
import { useAuth, useAuthState, useModal as useCampModal, CampModal, useConnect } from "@campnetwork/origin/react";
import { useModal, ParaModal, OAuthMethod } from "@getpara/react-sdk";
import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

interface WalletButtonProps {
  onClick?: () => void;
  className?: string;
}

export default function WalletButton({ 
  onClick,
  className = ""
}: WalletButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clickTimeRef = useRef<number>(0);
  const clickCountRef = useRef<number>(0);
  
  // Use proper hooks for authentication and wallet connection
  const { authenticated } = useAuthState();
  const { openModal: openCampModal } = useCampModal();
  const { connect, disconnect } = useConnect();
  const { address } = useAccount();
  
  const displayAddress = address ? 
    `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected';
  
  // Reset click counter when auth state changes
  useEffect(() => {
    clickCountRef.current = 0;
    if (error && authenticated) {
      setError(null);
    }
  }, [authenticated, error]);
  
  const handleWalletAction = async () => {
    // Double-click detection
    const now = Date.now();
    if (now - clickTimeRef.current < 500) {
      clickCountRef.current += 1;
    } else {
      clickCountRef.current = 1;
    }
    clickTimeRef.current = now;
    
    // If double click detected on connected wallet, disconnect
    if (authenticated && clickCountRef.current >= 2) {
      setLoading(true);
      try {
        await disconnect();
        clickCountRef.current = 0;
      } catch (err: any) {
        console.error("Disconnect failed:", err);
        setError("Failed to disconnect wallet");
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Normal single-click action
    if (!authenticated && !loading) {
      setLoading(true);
      try {
        openCampModal();
        if (onClick) onClick();
      } catch (err: any) {
        console.error("Connect action failed:", err);
        setError("Failed to open wallet options");
      } finally {
        setLoading(false);
      }
    }
  };
  
  return (
    <>
      <div className="mt-auto p-4 flex flex-col items-center justify-between text-gray-300 border-t border-[#1a1625]">
        <motion.button
          className={`w-full bg-[#2d2936] hover:bg-[#3a3545] text-white rounded-md py-2 font-medium flex items-center justify-center gap-2 ${className} ${loading ? 'opacity-70' : ''}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWalletAction}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              {authenticated ? "Disconnecting..." : "Connecting..."}
            </span>
          ) : authenticated ? (
            <span className="text-sm">
              {displayAddress}
            </span>
          ) : (
            <span className="text-sm">Connect Wallet</span>
          )}
        </motion.button>
        
        {authenticated && (
          <div className="text-xs text-gray-500 mt-1.5 text-center">
            Double-click to disconnect
          </div>
        )}
      </div>

      {error && (
        <div className="text-center text-sm text-red-400 bg-red-900/20 p-2 rounded-md mx-4 mb-2">
          {error}
        </div>
      )}

      <CampModal injectButton={false} />
    </>
  );
}
     