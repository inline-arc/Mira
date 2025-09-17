import { InferenceClient } from "@huggingface/inference";
import { NextRequest, NextResponse } from 'next/server';

// Initialize the HuggingFace client
const client = new InferenceClient(process.env.HF_TOKEN);

// Define valid model keys as a type
type ModelKeys = "Stable-diffusion-xl-base-1.0" | "default";

// Map of image generation models with proper typing
const imageModels: Record<ModelKeys, string> = {
  "Stable-diffusion-xl-base-1.0": "stabilityai/stable-diffusion-xl-base-1.0",
  "default": "stabilityai/stable-diffusion-xl-base-1.0" // Use stable diffusion as default
};

export async function POST(req: NextRequest) {
  try {
    console.log('API route called');
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { prompt, steps = 5, model: requestedModel = "default" } = body;
    // Type-safe model selection
    const model = (Object.keys(imageModels).includes(requestedModel) 
      ? requestedModel 
      : "default") as ModelKeys;
    
    if (!prompt || typeof prompt !== 'string') {
      console.log('Invalid prompt:', prompt);
      return NextResponse.json({ error: 'Prompt is required and must be a string' }, { status: 400 });
    }

    if (!process.env.HF_TOKEN) {
      console.log('HF_TOKEN not found');
      return NextResponse.json({ error: 'HF_TOKEN not configured' }, { status: 500 });
    }
    
    console.log('Generating image with prompt:', prompt);
    console.log('Using model:', model);
  
    // Select the appropriate image model with type safety
    const selectedModel = imageModels[model];
    console.log('Selected model:', selectedModel);
    
    try {
      // Call the HuggingFace API to generate an image
      console.log('Calling HuggingFace API...');
      const imageResult = await client.textToImage({
        provider: "auto",
        model: selectedModel,
        inputs: prompt,
        parameters: { 
          num_inference_steps: steps,
          guidance_scale: 7.5,
          width: 512,
          height: 512,
        },
      });
      
      console.log('HuggingFace API call successful, processing image...');
      console.log('Response type:', typeof imageResult);
      
      let dataUrl: string;
      
      // Handle different response types
      if (typeof imageResult === 'string') {
        // If it's a string (base64 or data URL)
        dataUrl = imageResult.startsWith('data:') 
          ? imageResult 
          : `data:image/png;base64,${imageResult}`;
        console.log('Used string response directly');
      } else if (imageResult && typeof imageResult === 'object' && 'arrayBuffer' in imageResult) {
        // If it's a Blob-like object, convert it to base64
        const arrayBuffer = await (imageResult as any).arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        dataUrl = `data:image/png;base64,${base64}`;
        console.log('Processed Blob to base64, length:', base64.length);
      } else {
        throw new Error(`Unexpected response type: ${typeof imageResult}`);
      }
      
      console.log('Image processed successfully');
      
      return NextResponse.json({ 
        success: true, 
        imageUrl: dataUrl,
        model: selectedModel,
        prompt: prompt
      });
    } catch (hfError: any) {
      console.error('HuggingFace API error:', hfError);
      console.error('HF Error details:', {
        message: hfError.message,
        status: hfError.status,
        statusText: hfError.statusText,
        stack: hfError.stack
      });
      
      // More specific error handling
      if (hfError.message?.includes('401') || hfError.message?.includes('unauthorized')) {
        return NextResponse.json({ error: 'Invalid API token. Please check your HF_TOKEN.' }, { status: 401 });
      } else if (hfError.message?.includes('429') || hfError.message?.includes('rate limit')) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
      } else if (hfError.message?.includes('503') || hfError.message?.includes('model')) {
        return NextResponse.json({ error: 'Model is currently unavailable. Please try again later.' }, { status: 503 });
      }
      
      throw hfError; // Re-throw to be caught by outer catch
    }
    
  } catch (error: any) {
    console.error("General API error:", error);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during image generation',
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
}