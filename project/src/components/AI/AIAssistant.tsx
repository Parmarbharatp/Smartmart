import React, { useState } from 'react';
import { Wand2, Image, Loader2 } from 'lucide-react';

interface AIAssistantProps {
  onDescriptionGenerated?: (description: string) => void;
  onImageAnalyzed?: (analysis: string) => void;
  productName?: string;
  features?: string[];
  currentDescription?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  onDescriptionGenerated,
  onImageAnalyzed,
  productName = '',
  features = [],
  currentDescription = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateDescription = async () => {
    if (!productName) return;

    setIsGenerating(true);
    try {
      const prompt = `Write a compelling and professional product description for a ${productName}${features.length > 0 ? ` with features: ${features.join(', ')}` : ''}. Make it engaging for potential customers, highlighting key benefits and value proposition. Keep it concise but informative.`;

      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };

      // In a real implementation, you would use your actual Gemini API key
      // For demo purposes, we'll simulate the response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedDescription = `Experience the perfect blend of quality and innovation with our ${productName}. ${features.length > 0 ? `Featuring ${features.join(', ')}, this product ` : 'This exceptional product '}delivers outstanding performance and reliability. Designed with attention to detail and built to last, it's the ideal choice for discerning customers who value both functionality and style. Whether you're a professional or enthusiast, this product will exceed your expectations and enhance your daily experience.`;

      onDescriptionGenerated?.(generatedDescription);
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeImage = async (imageFile: File) => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    try {
      // Convert image to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });

      const base64Data = base64.split(',')[1];
      const prompt = "Analyze this product image and provide relevant tags, categories, and a brief description that would help categorize and market this product.";

      // In a real implementation, you would call the Gemini API
      // For demo purposes, we'll simulate the response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysis = `This appears to be a high-quality product with excellent visual appeal. Based on the image analysis, I can identify key features that would appeal to customers. The product shows good craftsmanship and attention to detail. Suggested tags: premium, quality, stylish, functional. This would fit well in categories related to lifestyle and everyday essentials.`;

      onImageAnalyzed?.(analysis);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <Wand2 className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
      </div>
      
      <p className="text-gray-600 text-sm">
        Use AI to enhance your product listings with compelling descriptions and image analysis.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={generateDescription}
          disabled={isGenerating || !productName}
          className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Description
            </>
          )}
        </button>

        <label className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer">
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Image className="h-4 w-4 mr-2" />
              Analyze Image
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) analyzeImage(file);
            }}
            disabled={isAnalyzing}
          />
        </label>
      </div>

      <div className="text-xs text-gray-500">
        <p>💡 Tip: Fill in the product name and features above for better AI-generated descriptions.</p>
      </div>
    </div>
  );
};

export default AIAssistant;