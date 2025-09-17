"use client"

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Copy, ExternalLink, Clock, Tag, Info, Database, Fingerprint, Link } from 'lucide-react';
import Sidebar from '@/components/sidebar';
import { contractAddress } from '../../../../abi';
import Image from 'next/image';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: Record<string, any>;
}

export default function NFTDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cid = params?.cid as string;
  
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!cid) return;
      
      try {
        setLoading(true);
        
        // Try to get metadata from IPFS
        const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
        
        if (!response.ok) {
          // If metadata file fails, create a basic one based on the image
          const imageUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
          const mockMetadata: NFTMetadata = {
            name: "NFT Asset",
            description: "AI Generated NFT stored on IPFS",
            image: imageUrl,
            attributes: [
              { trait_type: "Source", value: "IPFS" },
              { trait_type: "CID", value: cid }
            ]
          };
          setMetadata(mockMetadata);
          return;
        }
        
        // Parse metadata if it's JSON
        try {
          const data = await response.json();
          setMetadata(data);
        } catch (e) {
          // If it's not valid JSON, it's likely just the image file itself
          const imageUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
          const mockMetadata: NFTMetadata = {
            name: "NFT Asset",
            description: "NFT stored on IPFS",
            image: imageUrl,
            attributes: [
              { trait_type: "Source", value: "IPFS" },
              { trait_type: "CID", value: cid }
            ]
          };
          setMetadata(mockMetadata);
        }
      } catch (err: any) {
        console.error("Error fetching metadata:", err);
        setError(err.message || "Failed to load NFT data");
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [cid]);

  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  // Get the correct image URL, handling ipfs:// protocol
  const getImageUrl = () => {
    if (!metadata?.image) return '';
    
    if (metadata.image.startsWith('ipfs://')) {
      const cid = metadata.image.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${cid}`;
    }
    
    return metadata.image;
  };

  // Get chain explorer URL based on contract address
  const getExplorerUrl = () => {
    // Determine network based on contract address
    // This is a simplified approach - in production you'd want to get this from wallet/chain info
    return `https://etherscan.io/address/${contractAddress}`;
  };

  return (
    <div className="flex h-screen bg-[#1a1625] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col max-h-screen">
        {/* Header */}
        <div className="border-b border-[#2d2936] p-4 md:p-6 shrink-0">
          <div className="flex items-center">
            <motion.button
              className="mr-3 p-2 rounded-lg hover:bg-[#2d2936]"
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </motion.button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-white">NFT Details</h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">View NFT information and metadata</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 px-4 md:px-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center p-6 bg-[#2d2936] rounded-lg max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <Info className="h-8 w-8 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-red-400 mb-2">Error Loading NFT</h3>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-[#3a3545] hover:bg-purple-700 text-white rounded-md"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto"
            >
              {/* NFT Title - Visible on mobile */}
              <div className="block md:hidden mb-4">
                <h2 className="text-xl font-bold text-white">
                  {metadata?.name || "Untitled NFT"}
                </h2>
                <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                  {metadata?.description || "No description available"}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side - Image */}
                <motion.div 
                  className="flex flex-col"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-[#2d2936] border border-[#3a3545] shadow-lg">
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                      </div>
                    )}
                    <img 
                      src={getImageUrl()} 
                      alt={metadata?.name || "NFT Image"} 
                      className={`w-full h-full object-contain ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>

                  {/* IPFS Information */}
                  <div className="mt-4 p-4 bg-[#2d2936] rounded-lg border border-[#3a3545] shadow-md">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-medium text-white flex items-center gap-2">
                        <Database className="h-4 w-4 text-purple-400" /> IPFS Storage
                      </h2>
                      <div>
                        <a 
                          href={`https://gateway.pinata.cloud/ipfs/${cid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-[#3a3545] rounded-md inline-flex"
                          title="View on IPFS"
                        >
                          <ExternalLink className="h-4 w-4 text-purple-400" />
                        </a>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-400 bg-[#1a1625] p-2 rounded-md">
                      <div className="truncate flex-1">
                        CID: <span className="text-gray-300 font-mono text-xs">{cid}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(cid, 'cid')}
                        className="p-1 hover:bg-[#3a3545] rounded-md"
                        title="Copy CID"
                      >
                        <Copy className={`h-3.5 w-3.5 ${copied === 'cid' ? 'text-green-400' : 'text-gray-400'}`} />
                      </button>
                    </div>

                    {/* Image URL (moved from metadata section) */}
                    {metadata?.image && (
                      <div className="mt-3 text-sm">
                        <div className="flex items-center gap-2 mb-1 text-gray-400">
                          <Link className="h-4 w-4" /> Image URL
                        </div>
                        <div className="flex items-center justify-between p-2 bg-[#1a1625] rounded-md">
                          <span className="truncate text-xs text-gray-300 font-mono max-w-[80%]">{metadata.image}</span>
                          <button 
                            onClick={() => copyToClipboard(metadata.image, 'image')}
                            className="p-1 hover:bg-[#3a3545] rounded-md"
                            title="Copy URL"
                          >
                            <Copy className={`h-3.5 w-3.5 ${copied === 'image' ? 'text-green-400' : 'text-gray-400'}`} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Right side - Metadata */}
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="flex flex-col h-full"
                >
                  <div className="p-5 bg-[#2d2936] rounded-lg border border-[#3a3545] shadow-md flex-1">
                    {/* NFT Title - Hidden on mobile, visible on larger screens */}
                    <div className="hidden md:block mb-4">
                      <h2 className="text-2xl font-bold text-white">
                        {metadata?.name || "Untitled NFT"}
                      </h2>
                      <div className="mt-2 text-gray-300">
                        {metadata?.description || "No description available"}
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      {/* Contract Info */}
                      <div className="p-4 bg-[#1a1625] rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-purple-400" /> Contract Information
                        </h3>
                        <div className="text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Address</span>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-300 truncate max-w-[160px] font-mono text-xs">{contractAddress}</span>
                              <button 
                                onClick={() => copyToClipboard(contractAddress, 'contract')}
                                className="p-1 hover:bg-[#3a3545] rounded-md"
                              >
                                <Copy className={`h-3.5 w-3.5 ${copied === 'contract' ? 'text-green-400' : 'text-gray-400'}`} />
                              </button>
                              <a 
                                href={getExplorerUrl()} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-[#3a3545] rounded-md"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-purple-400" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Creation Info */}
                      <div className="p-4 bg-[#1a1625] rounded-lg">
                        <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-400" /> Overview
                        </h3>
                        <div className="text-sm text-gray-300">
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                            <div className="text-gray-400">Status</div>
                            <div className="font-medium">Tokenized</div>
                            <div className="text-gray-400">Storage</div>
                            <div className="font-medium">IPFS</div>
                            <div className="text-gray-400">Type</div>
                            <div className="font-medium">NFT</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Attributes */}
                      {metadata?.attributes && metadata.attributes.length > 0 && (
                        <div className="p-4 bg-[#1a1625] rounded-lg">
                          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <Tag className="h-4 w-4 text-purple-400" /> Attributes
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {metadata.attributes.map((attr, idx) => (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + idx * 0.05 }}
                                className="p-2 bg-[#2d2936] rounded-md border border-[#3a3545]"
                              >
                                <div className="text-xs text-purple-400 truncate">{attr.trait_type}</div>
                                <div className="text-sm text-white mt-1 truncate font-medium">{attr.value}</div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => router.back()}
                      className="flex-1 px-4 py-2.5 bg-[#2d2936] hover:bg-[#3a3545] text-white rounded-md text-sm flex items-center justify-center gap-2 shadow-md"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                    <a
                      href={getExplorerUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-md text-sm flex items-center justify-center gap-2 shadow-md"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View on Explorer</span>
                    </a>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
