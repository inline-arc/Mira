/**
 * Utilities for handling images and metadata when minting NFTs
 */

/**
 * Creates a completely new File object to avoid any potential hidden properties
 * @param originalFile Original file to clean
 */
export function createCleanFileObject(originalFile: File): File {
  try {
    // Create a completely new File object without any potential hidden properties
    return new File(
      [originalFile], 
      originalFile.name, 
      { 
        type: originalFile.type,
        lastModified: originalFile.lastModified 
      }
    );
  } catch (error) {
    console.error("Error creating clean file:", error);
    return originalFile; // Fall back to original if cleanup fails
  }
}


export function createCleanMetadata(metadata: any): any {
  // Start with essential properties only
  const cleanMeta = {
    name: String(metadata?.name || "AI Generated Image"),
    description: String(metadata?.description || ""),
    properties: {} as Record<string, string>
  };
  
  // Only add simple, primitive properties
  if (metadata?.properties) {
    // Safe property keys to include
    const safeKeys = ["model", "timestamp", "generatedAt", "generated_by"];
    
    safeKeys.forEach(key => {
      if (metadata.properties[key] !== undefined) {
        // Ensure all values are strings or simple primitives
        cleanMeta.properties[key] = String(metadata.properties[key]);
      }
    });
  }
  
  // Add a timestamp if not present
  if (!cleanMeta.properties["timestamp"]) {
    cleanMeta.properties["timestamp"] = new Date().toISOString();
  }
  
  return cleanMeta;
}


export function prepareImageForMinting(file: File, metadata: any) {
  // Create clean file object
  const preparedFile = createCleanFileObject(file);
  
  // Create clean metadata with only primitive values
  const simplifiedMeta = createCleanMetadata(metadata);
  
  // Double-check the metadata is serializable by running it through JSON cycle
  try {
    const metaString = JSON.stringify(simplifiedMeta);
    const preparedMeta = JSON.parse(metaString);
    return { preparedFile, preparedMeta };
  } catch (error) {
    console.error("Error serializing metadata:", error);
    // Ultimate fallback - absolute minimum metadata
    const fallbackMeta = {
      name: "AI Generated Image",
      description: "Generated with AI",
      properties: {
        timestamp: new Date().toISOString()
      }
    };
    return { preparedFile, preparedMeta: fallbackMeta };
  }
}

/**
 * Converts a data URL to a File object
 */
export function dataURLtoFile(dataUrl: string, filename: string): File | null {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null;
  }

  try {
    // Convert base64/URLEncoded data to a file
    const arr = dataUrl.split(',');
    const match = arr[0].match(/:(.*?);/);
    
    if (!match) {
      return null;
    }
    
    const mime = match[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    console.error('Error converting data URL to file:', e);
    return null;
  }
}

/**
 * Creates a new clean metadata object for NFT minting
 */
export function createNFTMetadata(prompt: string, model: string) {
  return {
    name: prompt ? `AI Generated: ${prompt.substring(0, 30)}...` : "AI Generated Image",
    description: prompt || "Generated with AI",
    attributes: [
      {
        trait_type: "Model",
        value: model
      },
      {
        trait_type: "Created",
        value: new Date().toISOString().split('T')[0]
      }
    ]
  };
}

/**
 * Formats a string to show only partial view
 * like 0x1234...5678
 */
export function formatAddress(address: string, frontChars = 6, endChars = 4): string {
  if (!address || address.length < (frontChars + endChars)) {
    return address;
  }
  
  return `${address.substring(0, frontChars)}...${address.substring(address.length - endChars)}`;
}
