"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Image as ImageIcon, Download, Share2 } from "lucide-react"
import { MintButton } from "./mintbtn"
import { PinataSDK } from "pinata"

interface ImageGenProps {
  state: {
    prompt: string;
    isGenerating: boolean;
    imageUrl: string | null;
  };
  setState: (state: any) => void;
  onGenerateImage: (prompt: string) => Promise<string | null>;
  selectedModel: string;
}

export function ImageGen({ state, setState, onGenerateImage, selectedModel }: ImageGenProps) {
  const [minting, setMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Create a unique ID for the generated image
  const imageId = state.imageUrl ? `gen-img-${Date.now()}` : undefined;
  
  // Convert base64 to file object
  const getImageFileFromBase64 = () => {
    if (!state.imageUrl) return null;
    
    if (state.imageUrl.startsWith('data:')) {
      const arr = state.imageUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], `generated-image-${Date.now()}.png`, { type: mime });
    }
    
    return null;
  };
  
  // Handle download action with Pinata upload
  const handleDownload = async () => {
    if (!state.imageUrl) return;
    
    try {
      setUploading(true);
      setUploadError(null);
      
      // Get file object from base64
      const imageFile = getImageFileFromBase64();
      
      if (!imageFile) {
        throw new Error("Failed to convert image to file");
      }
      
      // Initialize Pinata SDK
      const pinata = new PinataSDK({
        pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
        pinataGateway: "amaranth-keen-tern-765.mypinata.cloud", // Adjust if you have a custom gateway
      });
      
      // Upload to Pinata
      const metadata = {
        name: `Generated Image: ${state.prompt?.substring(0, 30) || "Untitled"}`,
        description: state.prompt || "AI generated image",
        model: selectedModel
      };
      
      const upload = await pinata.upload.public.file(imageFile, {
        metadata: {
          name: metadata.name,
        },
      });
      
      console.log("Pinata upload success:", upload);
      
      // Also download locally
      const link = document.createElement('a');
      link.href = state.imageUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShareMessage("Image uploaded to IPFS and saved locally!");
      setTimeout(() => setShareMessage(null), 3000);
      
    } catch (error) {
      console.error("Error uploading to Pinata:", error);
      setUploadError("Failed to upload to IPFS. Saved locally only.");
      
      // Fallback to local download only
      const link = document.createElement('a');
      link.href = state.imageUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  // Handle successful mint
  const handleMintSuccess = () => {
    setMinting(false);
    setMintSuccess(true);
    
    // Reset after showing success for a while
    setTimeout(() => setMintSuccess(false), 5000);
  };

  // Handle share action
  const handleShare = async () => {
    if (!state.imageUrl) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `AI Generated Image: ${state.prompt || ""}`,
          text: `Check out this AI generated image: "${state.prompt || ""}". Generated with ${selectedModel}.`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareMessage("Link copied to clipboard");
        setTimeout(() => setShareMessage(null), 2000);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Convert base64 to file object for NFT minting
  const getImageFile = () => {
    if (!state.imageUrl) return null;
    
    if (state.imageUrl.startsWith('data:')) {
      const arr = state.imageUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], `generated-image-${Date.now()}.png`, { type: mime });
    }
    
    return null;
  };
  
  // Create metadata for NFT
  const getMetadata = () => {
    if (!state.prompt) return null;
    
    return {
      name: `AI Generated: ${state.prompt.substring(0, 30)}...`,
      description: state.prompt,
      properties: {
        model: selectedModel,
        timestamp: new Date().toISOString(),
        generated_by: "AgentZk"
      }
    };
  };

  return (
    <div className="h-full bg-[#1c1b22]">
      <div className="p-2 h-full flex flex-col">
        {/* Current Model Display */}
        <div className="mb-4 p-3 bg-[#2d2936]/50 rounded-lg border border-[#3a3545]">
          <div className="text-sm text-gray-400">Current Model:</div>
          <div className="text-sm text-gray-300 font-medium">{selectedModel}</div>
        </div>

        {/* Image area */}
        <div className="flex-1 flex flex-col w-full items-center justify-center border-2 border-solid border-[#3a3545] rounded-lg bg-[#14121a]/50 mb-4 overflow-hidden">
          {state.isGenerating ? (
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">Generating Image...</h3>
              <p className="text-sm text-gray-400 text-center">
                Creating: "{state.prompt}"
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Using: {selectedModel}
              </p>
              <div className="mt-3">
                <div className="w-48 h-1 bg-[#2d2936] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : state.imageUrl ? (
            <div className="w-full h-full flex flex-col p-2">
              <div className="flex-1 flex items-center justify-center">
                <img 
                  src={state.imageUrl} 
                  alt="Generated image" 
                  className="max-w-full max-h-full object-contain rounded-lg border border-[#3a3545]"
                />
              </div>
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-400 px-2 italic">
                  "{state.prompt}"
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Generated with: {selectedModel}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-[#2d2936] rounded-lg mx-auto mb-4 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-purple-400/50" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                Ready to create
              </h3>
              <p className="text-sm text-gray-400 mb-2">
                Use chat input to generate images
              </p>
              <div className="text-xs text-gray-500 mt-4 p-3 bg-[#2d2936]/50 rounded">
                <p className="mb-2"><strong>Examples:</strong></p>
                <p>• "generate image of a sunset over mountains"</p>
                <p className="mt-2 text-purple-400">Select model first, then type your prompt!</p>
              </div>
            </div>
          )}
        </div>

        {/* Mint button - show when image exists */}
        {state.imageUrl && (
          <div className="mb-3">
            <MintButton 
              onClick={handleMintSuccess}
              disabled={state.isGenerating} 
              loading={minting}
              imageUrl={state.imageUrl}
              prompt={state.prompt}
              model={selectedModel}
              imageId={imageId}
            />
          </div>
        )}

        {/* Action buttons - only show when image exists */}
        {state.imageUrl && (
          <div className="flex gap-3">
            <motion.button
              className="flex-1 bg-[#2d2936] hover:bg-[#3a3545] text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              disabled={state.isGenerating || uploading}
            >
              <Download className={`h-4 w-4 ${uploading ? "animate-bounce" : ""}`} />
              <span>{uploading ? "Uploading..." : "Save to IPFS"}</span>
            </motion.button>
            <motion.button
              className="flex-1 bg-[#2d2936] hover:bg-[#3a3545] text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              disabled={state.isGenerating}
            >
              <Share2 className="h-4 w-4" />
              <span>Share Zora</span>
            </motion.button>
          </div>
        )}
        
        {shareMessage && (
          <div className="mt-2 text-center text-sm text-green-400">
            {shareMessage}
          </div>
        )}
        
        {uploadError && (
          <div className="mt-2 text-center text-sm text-red-400">
            {uploadError}
          </div>
        )}
      </div>
    </div>
  )
}
