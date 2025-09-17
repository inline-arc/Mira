"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount, useConnect, useWriteContract } from "wagmi";
import { contractABI, contractAddress } from "@../../abi";
import { PinataSDK } from "pinata";
import { dataURLtoFile } from "../utils/imageUtils";
import { Wallet } from "lucide-react";

interface MintButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  imageId?: string;
  imageUrl?: string;
  prompt?: string;
  model?: string;
}

export function MintButton({ 
  onClick, 
  disabled = false,
  loading: externalLoading = false,
  className = "",
  imageUrl,
  prompt = "AI Generated Image",
  model = "AI Model",
  imageId
}: MintButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cid, setCid] = useState<string | null>(null);
  
  // Wallet connection hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  
  // Contract interaction hook
  const { writeContractAsync, isPending } = useWriteContract();
  
  // Combined loading state
  const loading = externalLoading || internalLoading || isPending || isConnecting;

  const handleConnect = async () => {
    try {
      // Get the first available connector (usually injected/MetaMask)
      const connector = connectors[0];
      if (connector) {
        await connect({ connector });
      } else {
        setError("No wallet connectors available");
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setError(`Wallet connection failed: ${error.message || "Unknown error"}`);
    }
  };

  const handleMint = async () => {
    if (disabled || loading) return;
    setError(null);
    setSuccess(false);
    
    try {
      // Check wallet connection
      if (!isConnected) {
        handleConnect();
        return;
      }

      setInternalLoading(true);
      
      // Check if we have an image
      if (!imageUrl) {
        setError("No image available to mint");
        return;
      }
      
      // Convert the image URL to a file
      const file = dataURLtoFile(imageUrl, `ai-generated-${Date.now()}.png`);
      if (!file) {
        setError("Could not process image for minting");
        return;
      }
      
      // Initialize Pinata SDK
      const pinata = new PinataSDK({
        pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
      });
      
      // Upload the image to IPFS
      console.log("Uploading to IPFS...");
      const uploadResult = await pinata.upload.public.file(file, {
        metadata: {
           name: `${prompt?.substring(0, 20) || "ai-image"}-${Date.now()}.png`,}
      });

      // Log the full upload result for inspection
      console.log("Pinata upload result:", uploadResult);
      
      // Get the CID from the result
      const tokenURI = `ipfs://${uploadResult.cid}`;
      setCid(uploadResult.cid);
      
      console.log("CID:", uploadResult.cid);
      console.log("Full tokenURI to be used for minting:", tokenURI);
      console.log("IPFS gateway URL:", `https://gateway.pinata.cloud/ipfs/${uploadResult.cid}`);
      
      // Mint the NFT using the contract
      console.log("Minting NFT with tokenURI:", tokenURI);
      console.log("Connected wallet address:", address);
      
      try {
        const tx = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: contractABI,
          functionName: 'mintToken',
          args: [tokenURI],
        });
        
        console.log("Mint transaction successful:", tx);
        
        // Show success message
        setSuccess(true);
        
        // Call the success callback if provided
        if (onClick) onClick();
      } catch (contractError: any) {
        console.error("Contract interaction failed:", contractError);
        console.log("Contract address used:", contractAddress);
        console.log("Function called:", 'mintToken');
        console.log("Arguments passed:", [tokenURI]);
        throw contractError;
      }
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      setError(`Failed to mint: ${error.message || "Unknown error"}`);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <>
      <motion.button
        className={`w-full bg-white hover:bg-gray-100 
          text-[#3a3349] font-medium py-3 px-6 rounded-lg flex items-center justify-center
          shadow-md shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed 
          border border-gray-200 transition-colors ${className}`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={isConnected ? handleMint : handleConnect}
        disabled={disabled || loading}
      >
        <span className="tracking-wide flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-[#3a3349]/30 border-t-[#3a3349] animate-spin"></div>
              {isPending ? "Confirming..." : (isConnecting ? "Connecting..." : "Minting...")}
            </div>
          ) : (
            success ? (
              "Minted!"
            ) : (
              isConnected ? (
                "Mint NFT"
              ) : (
                <>
                  
                  Connect Wallet
                </>
              )
            )
          )}
        </span>
      </motion.button>
      
      {error && (
        <div className="mt-2 text-center text-sm text-red-400 bg-red-900/20 p-2 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 text-center text-sm text-green-400 bg-green-900/20 p-2 rounded-md">
          <p>Successfully minted NFT!</p>
          {cid && (
            <p className="text-xs mt-1 break-all">
              <span className="font-semibold">IPFS:</span> ipfs://{cid}
            </p>
          )}
        </div>
      )}
      
      {isConnected && address && (
        <div className="mt-1 text-center text-xs text-gray-400">
          Connected: {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </div>
      )}
    </>
  );
}