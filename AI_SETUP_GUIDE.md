# AI Product Description Generator Setup Guide

This guide will help you set up the AI-powered product description generation feature for your SmartMart shop owner dashboard.

## Features Implemented

✅ **Text-based Description Generation**: Generate compelling product descriptions from product name, category, and features
✅ **Image Analysis**: Upload product images to automatically generate descriptions based on visual analysis
✅ **Fallback System**: Graceful fallback when AI services are unavailable
✅ **Real-time Integration**: Seamlessly integrated into the product management form

## Prerequisites

1. **Google Gemini API Key**: You need a Google AI Studio API key for Gemini Pro and Gemini Pro Vision models
2. **Node.js**: Version 16 or higher
3. **MongoDB**: Database connection (already configured)

## Setup Instructions

### Step 1: Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Configure Environment Variables

1. Open `backend/config.env`
2. Replace `your-gemini-api-key-here` with your actual API key:

```env
# Google Gemini AI Configuration
GEMINI_API_KEY=your-actual-gemini-api-key-here
```

### Step 3: Install Dependencies

The required dependencies are already added to `package.json`. Install them:

```bash
cd backend
npm install
```

### Step 4: Start the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
cd project
npm run dev
```

## How to Use

### For Shop Owners

1. **Navigate to Shop Dashboard**: Log in as a shop owner and go to your shop dashboard
2. **Add/Edit Product**: Click "Add Product" or edit an existing product
3. **Fill Basic Info**: Enter product name and select category
4. **Generate Description**: Use one of two AI options:

   **Option A: Text-based Generation**
   - Fill in the product name and category
   - Click "Generate from Text" button
   - AI will create a compelling description based on the product name and category

   **Option B: Image-based Generation**
   - Upload a product image first
   - Click "Generate from Image" button
   - AI will analyze the image and generate a description based on what it sees

5. **Review and Edit**: The generated description will appear in the description field
6. **Save Product**: Complete the form and save your product

## API Endpoints

The following new API endpoints have been added:

- `POST /api/ai/generate-description` - Generate description from text
- `POST /api/ai/analyze-image` - Analyze image and generate description
- `POST /api/ai/generate-from-image` - Simplified image-based generation

## Technical Details

### Backend Implementation

- **AI Service**: Google Gemini Pro and Gemini Pro Vision
- **Image Processing**: Multer for file uploads with automatic cleanup
- **Error Handling**: Comprehensive error handling with fallback responses
- **Security**: Authentication required for all AI endpoints

### Frontend Implementation

- **Real-time Integration**: AI assistant component integrated into product form
- **User Experience**: Loading states, error messages, and success feedback
- **Image Upload**: Drag-and-drop image upload with preview
- **Responsive Design**: Works on desktop and mobile devices

## Troubleshooting

### Common Issues

1. **"AI service is currently unavailable"**
   - ✅ **FIXED**: The system now uses the correct model names (`gemini-2.0-flash`)
   - Check if your Gemini API key is correctly set in `config.env`
   - Verify the API key is valid and has sufficient quota
   - Check backend logs for detailed error messages

2. **Model not found errors (404)**
   - ✅ **RESOLVED**: Updated to use `gemini-2.0-flash` which is available in all regions
   - The system automatically detects available models and uses the best one

2. **"Failed to analyze image"**
   - Ensure the image file is in a supported format (JPEG, PNG, WebP)
   - Check file size (max 10MB)
   - Verify image is not corrupted

3. **"Please enter a product name first"**
   - Make sure to fill in the product name field before using AI generation

### API Key Issues

If you encounter API key issues:

1. Verify the key is correctly copied (no extra spaces or characters)
2. Check if the key has the necessary permissions for Gemini API
3. Ensure your Google AI Studio account has sufficient quota

### Fallback System

The system includes a fallback mechanism that generates basic descriptions when the AI service is unavailable. This ensures the application continues to work even without AI functionality.

## Cost Considerations

- **Gemini Pro**: Text generation is generally very cost-effective
- **Gemini Pro Vision**: Image analysis has slightly higher costs
- **Free Tier**: Google AI Studio provides free tier usage
- **Monitoring**: Consider implementing usage monitoring for production use

## Security Notes

- API keys are stored in environment variables (not in code)
- All AI endpoints require authentication
- Uploaded images are automatically deleted after processing
- Rate limiting is applied to prevent abuse

## Future Enhancements

Potential improvements you could implement:

1. **Batch Processing**: Generate descriptions for multiple products at once
2. **Custom Prompts**: Allow shop owners to customize AI prompts
3. **Language Support**: Multi-language description generation
4. **A/B Testing**: Test different AI-generated descriptions
5. **Analytics**: Track which AI-generated descriptions perform better

## Support

If you encounter any issues:

1. Check the browser console for frontend errors
2. Check the backend logs for server errors
3. Verify all environment variables are correctly set
4. Ensure all dependencies are installed

The AI description generator is now fully integrated and ready to help shop owners create compelling product descriptions with minimal effort!
