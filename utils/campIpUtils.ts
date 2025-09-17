/**
 * Helper function to safely mint an NFT using Camp Network
 */
export const mintNFT = async (origin: any, file: any, meta: any) => {
  if (!origin || !file || !meta) {
    console.error("Missing required parameters for minting");
    return null;
  }
  
  try {
    // Step 1: Clean the metadata completely by manually creating a new clean object
      const cleanMeta = {
        name: String(meta.name || ""),
        description: String(meta.description || ""),
        properties: {} as Record<string, any>
      };
    
    // Step 2: Add properties one by one to ensure they're clean
    if (meta.properties) {
      Object.keys(meta.properties).forEach(key => {
        const value = meta.properties[key];
        
        // Convert each property to a safe value
        if (typeof value === 'bigint') {
          cleanMeta.properties[key] = value.toString();
        } else if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
          cleanMeta.properties[key] = value;
        } else if (value === null || value === undefined) {
          cleanMeta.properties[key] = null;
        } else if (Array.isArray(value)) {
          // Convert array items to strings
          cleanMeta.properties[key] = value.map(item => String(item));
        } else if (typeof value === 'object') {
          // Convert object to JSON and back to remove any non-serializable values
          try {
            cleanMeta.properties[key] = JSON.parse(JSON.stringify(value));
          } catch {
            cleanMeta.properties[key] = String(value);
          }
        } else {
          cleanMeta.properties[key] = String(value);
        }
      });
    }
    
    // Final safety check - make sure it's serializable
    JSON.stringify(cleanMeta);
    
    // Use a direct function call approach to minimize serialization risks
    return await origin.mintFile(
      file,              // The file to mint
      cleanMeta,         // Clean metadata with no BigInt values
      {                  // Direct literal object for license to avoid variable serialization
        price: BigInt(0),
        duration: BigInt(0),
        royaltyBps: 0,
        paymentToken: "0x0000000000000000000000000000000000000000"
      },
      BigInt(4)          // Directly use BigInt literal for parentId
    );
  } catch (error) {
    // More detailed error logging
    console.error("Error in mintNFT helper:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Check for specific error patterns
      if (error.message.includes("BigInt")) {
        console.error("BigInt serialization issue detected");
      }
      
      if (error.message.includes("wallet") || error.message.includes("connect")) {
        console.error("Wallet connection issue detected");
      }
    }
    
    throw new Error("Minting failed. Please try again or use a different wallet.");
  }
};

/**
 * Safely create image metadata with no BigInt values
 */
export const createSafeMeta = (name: string, description: string, properties: Record<string, any> = {}) => {
  // Create a completely new object with only primitive values
  const safeMeta = {
    name: String(name || ""),
    description: String(description || ""),
    properties: {} as Record<string, any>
  };
  
  // Manually copy each property to ensure they're clean
  Object.keys(properties).forEach(key => {
    const value = properties[key];
    
    if (value === null || value === undefined) {
      safeMeta.properties[key] = null;
    } else if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
      safeMeta.properties[key] = value;
    } else {
      safeMeta.properties[key] = String(value);
    }
  });
  
  return safeMeta;
};
