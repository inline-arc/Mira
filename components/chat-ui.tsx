"use client"

import { useState, useRef, useEffect } from "react"
import { ImageGen } from "./imagegen"
import ChatInput from "./chatinput"
import { ModelDropdown } from "./modeldropdown"
import { FileDropArea } from "./file-drop-area"
import ChatBox from "./chatbox"
import { updateModelProvider } from "../chat/provider"
import Image from "next/image"
import { DEFAULT_SUGGESTIONS, AISuggestion } from "./ai-suggestions"

// Define message types
interface Message {
  role: "user" | "assistant";
  content: string;
}

// Interface for the shared image generation state
interface ImageGenState {
  prompt: string;
  isGenerating: boolean;
  imageUrl: string | null;
}

export function ChatUI() {
  // Existing state
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("Stable-diffusion-xl-base-1.0")
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
  const [showFileDropArea, setShowFileDropArea] = useState(false)
  
  // Image generation state
  const [imageGenState, setImageGenState] = useState<ImageGenState>({
    prompt: "",
    isGenerating: false,
    imageUrl: null,
  })
  
  const modelButtonRef = useRef<HTMLDivElement>(null!)
  const modelSelectorRef = useRef<HTMLDivElement>(null!)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle model change
  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    updateModelProvider(modelName);
  };

  // Function to generate image based on prompt
  const generateImage = async (prompt: string) => {
    try {
      setImageGenState(prev => ({ ...prev, isGenerating: true, prompt }));
      
      try {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim() }),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.imageUrl) {
          setImageGenState({
            prompt,
            isGenerating: false,
            imageUrl: data.imageUrl,
          });
          
          return data.imageUrl;
        } else {
          throw new Error(data.error || "Failed to generate image");
        }
      } catch (error) {
        console.error("Error calling API:", error);
        throw error;
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      setImageGenState(prev => ({ ...prev, isGenerating: false }));
      return null;
    }
  };

  // Function to handle image prompt from ChatInput
  const handleImagePrompt = (prompt: string) => {
    setImageGenState(prev => ({ ...prev, prompt }));
  };

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: message }])
    setIsLoading(true)

    try {
      if (message.toLowerCase().includes("generate image") || 
          message.toLowerCase().includes("create image") || 
          message.toLowerCase().includes("draw") || 
          message.toLowerCase().startsWith("image of")) {
        
        let imagePrompt = message;
        
        if (message.toLowerCase().includes("generate image of")) {
          imagePrompt = message.split("generate image of")[1].trim();
        } else if (message.toLowerCase().includes("create image of")) {
          imagePrompt = message.split("create image of")[1].trim();
        } else if (message.toLowerCase().includes("draw")) {
          imagePrompt = message.split("draw")[1].trim();
        } else if (message.toLowerCase().startsWith("image of")) {
          imagePrompt = message.substring("image of".length).trim();
        }
        
        const imageUrl = await generateImage(imagePrompt);
        
        setMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: imageUrl 
              ? `I've generated this image for you: "${imagePrompt}"`
              : `I'm sorry, I couldn't generate an image based on "${imagePrompt}". Please try again with a different description.`
          }
        ]);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: `I'm responding to your message: "${message}"\n\nThis is a simulated response from the ${selectedModel} model.`
          }
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle suggestion click
  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };
  
  return (
    <div className="flex h-full">
      {/* Chat Panel */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col h-full">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-start justify-center h-full mt-20 px-4">
                  <div className="flex items-center mb-2">
                    <Image 
                      src="/images/orb2.png" 
                      alt="Mira Logo" 
                      width={64} 
                      height={64} 
                      className="rounded-full mr-3"
                    />
                    <h1 className="text-3xl mb-3 ml-2 font-medium text-white">Mira AI</h1>
                  </div>
                  <p className="text-gray-400 mb-8">Let's create new possibilities together</p>
                  
                  {/* Image generation suggestions */}
                  <div className="w-full">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {DEFAULT_SUGGESTIONS.slice(0, 3).map(suggestion => (
                        <button 
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="px-3 py-1.5 bg-[#2d2936] hover:bg-[#3a3545] rounded-full text-xs text-gray-300 transition-colors"
                        >
                          {suggestion.text}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_SUGGESTIONS.slice(3).map(suggestion => (
                        <button 
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="px-3 py-1.5 bg-[#2d2936] hover:bg-[#3a3545] rounded-full text-xs text-gray-300 transition-colors"
                        >
                          {suggestion.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <ChatBox 
                    key={index}
                    message={msg.content}
                    role={msg.role}
                    isLast={index === messages.length - 1}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            selectedModel={selectedModel}
            setIsModelSelectorOpen={setIsModelSelectorOpen}
            isModelSelectorOpen={isModelSelectorOpen}
            setShowFileDropArea={setShowFileDropArea}
            modelButtonRef={modelButtonRef}
            onImagePrompt={handleImagePrompt}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px bg-border" />

      {/* Image Panel */}
      <div className="w-96 min-w-80">
        <ImageGen
          state={imageGenState}
          setState={setImageGenState}
          onGenerateImage={generateImage}
          selectedModel={selectedModel}
        />
      </div>

      {/* Model Dropdown */}
      {isModelSelectorOpen && (
        <ModelDropdown
          isOpen={isModelSelectorOpen}
          setIsOpen={setIsModelSelectorOpen}
          selectedModel={selectedModel}
          setSelectedModel={handleModelChange}
          modelSelectorRef={modelSelectorRef}
        />
      )}

      {/* File Drop Area */}
      {showFileDropArea && (
        <FileDropArea onClose={() => setShowFileDropArea(false)} />
      )}
    </div>
  )
}