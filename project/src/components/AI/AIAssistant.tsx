import React, { useState } from 'react';
import { Wand2, Image, Loader2, Sparkles } from 'lucide-react';
import { apiService } from '../../services/api';

interface AIAssistantProps {
  onDescriptionGenerated?: (description: string) => void;
  onImageAnalyzed?: (analysis: string) => void;
  productName?: string;
  features?: string[];
  currentDescription?: string;
  category?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  onDescriptionGenerated,
  onImageAnalyzed,
  productName = '',
  features = [],
  currentDescription = '',
  category = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDescription = async () => {
    if (!productName.trim()) {
      setError('Please enter a product name first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await apiService.generateProductDescription({
        productName: productName.trim(),
        category,
        features,
        currentDescription
      });

      onDescriptionGenerated?.(result.description);
      
      if (result.fallback) {
        setError('AI service is currently unavailable. Generated a fallback description.');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      setError('Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeImage = async (imageFile: File) => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await apiService.generateDescriptionFromImage(imageFile, productName);
      
      if (result.description) {
        onDescriptionGenerated?.(result.description);
      }
      
      if (result.fallback) {
        setError('AI service is currently unavailable. Generated a fallback description.');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError('Failed to analyze image. Please try again or use text-based description generation.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Description Generator</h3>
      </div>
      
      <p className="text-gray-600 text-sm">
        Use AI to generate compelling product descriptions from text or analyze product images for automatic description generation.
      </p>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={generateDescription}
          disabled={isGenerating || isAnalyzing || !productName.trim()}
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
              Generate from Text
            </>
          )}
        </button>

        <label className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer">
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Image...
            </>
          ) : (
            <>
              <Image className="h-4 w-4 mr-2" />
              Generate from Image
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
            disabled={isGenerating || isAnalyzing}
          />
        </label>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Text Generation:</strong> Enter product name and category for AI-powered description generation.</p>
        <p>📸 <strong>Image Analysis:</strong> Upload a product image to automatically generate a description based on visual analysis.</p>
      </div>
    </div>
  );
};

export default AIAssistant;