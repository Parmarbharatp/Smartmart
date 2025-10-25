import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

// Helper function to convert image to base64
const imageToBase64 = (imagePath) => {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
};

// @route   POST /api/ai/generate-description
// @desc    Generate product description from text input
// @access  Private
router.post('/generate-description', verifyToken, async (req, res) => {
  try {
    const { productName, category, features = [], currentDescription = '' } = req.body;

    if (!productName || productName.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Product name is required'
      });
    }

    // Create a prompt for description generation
    let prompt = `Generate a compelling, professional product description for "${productName}".`;
    
    if (category) {
      prompt += ` This is a ${category} product.`;
    }
    
    if (features && features.length > 0) {
      prompt += ` Key features include: ${features.join(', ')}.`;
    }
    
    if (currentDescription) {
      prompt += ` Current description: "${currentDescription}". Please improve and enhance this description.`;
    }
    
    prompt += ` Requirements:
    - Keep it between 50-150 words
    - Make it engaging and sales-focused
    - Highlight key benefits and value proposition
    - Use active voice and compelling language
    - Include relevant keywords for SEO
    - Focus on customer benefits rather than just features
    - Make it sound professional but accessible`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedDescription = response.text();

    // Clean up the response
    const cleanedDescription = generatedDescription.replace(/^\*+|^"|^'|"$|'$|\*+$/gm, '').trim();

    res.status(200).json({
      status: 'success',
      data: {
        description: cleanedDescription,
        originalPrompt: prompt
      }
    });

  } catch (error) {
    console.error('Error generating description:', error);
    
    // Enhanced fallback description if AI service fails
    const productName = req.body.productName || 'Product';
    const category = req.body.category || '';
    const features = req.body.features || [];
    
    let fallbackDescription = `Experience the perfect blend of quality and innovation with our ${productName}. `;
    
    if (category) {
      fallbackDescription += `This premium ${category.toLowerCase()} product `;
    } else {
      fallbackDescription += `This exceptional product `;
    }
    
    if (features.length > 0) {
      fallbackDescription += `features ${features.join(', ')} and `;
    }
    
    fallbackDescription += `delivers outstanding performance and reliability. Designed with attention to detail and built to last, it's the ideal choice for discerning customers who value both functionality and style. Whether you're a professional or enthusiast, this product will exceed your expectations and enhance your daily experience.`;

    res.status(200).json({
      status: 'success',
      data: {
        description: fallbackDescription,
        fallback: true,
        message: 'Generated fallback description due to AI service unavailability'
      }
    });
  }
});

// @route   POST /api/ai/analyze-image
// @desc    Analyze product image and generate description
// @access  Private
router.post('/analyze-image', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Image file is required'
      });
    }

    const { productName = '', category = '' } = req.body;
    const imagePath = req.file.path;

    try {
      // Convert image to base64
      const base64Image = imageToBase64(imagePath);
      const mimeType = req.file.mimetype;

      // Create prompt for image analysis
      let prompt = `Analyze this product image and generate a compelling product description.`;
      
      if (productName) {
        prompt += ` The product is called "${productName}".`;
      }
      
      if (category) {
        prompt += ` It belongs to the ${category} category.`;
      }
      
      prompt += ` Please provide:
      1. A detailed analysis of what you see in the image
      2. A compelling product description (50-150 words) that highlights:
         - Visual appearance and design
         - Key features visible in the image
         - Quality and craftsmanship
         - Target audience appeal
         - Value proposition
      3. Suggested product tags/keywords
      
      Format your response as:
      ANALYSIS: [your visual analysis]
      DESCRIPTION: [your product description]
      TAGS: [comma-separated tags]`;

      // Use Gemini Pro Vision for image analysis
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const analysisResult = response.text();

      // Parse the response
      const analysisMatch = analysisResult.match(/ANALYSIS:\s*(.*?)(?=DESCRIPTION:|$)/s);
      const descriptionMatch = analysisResult.match(/DESCRIPTION:\s*(.*?)(?=TAGS:|$)/s);
      const tagsMatch = analysisResult.match(/TAGS:\s*(.*?)$/s);

      const analysis = analysisMatch ? analysisMatch[1].trim() : '';
      const description = descriptionMatch ? descriptionMatch[1].trim() : analysisResult;
      const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag) : [];

      // Clean up the description
      const cleanedDescription = description.replace(/^\*+|^"|^'|"$|'$|\*+$/gm, '').trim();

      res.status(200).json({
        status: 'success',
        data: {
          analysis: analysis,
          description: cleanedDescription,
          tags: tags,
          imageProcessed: true
        }
      });

    } finally {
      // Clean up uploaded file
      fs.unlinkSync(imagePath);
    }

  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze image. Please try again or use text-based description generation.'
    });
  }
});

// @route   POST /api/ai/generate-from-image
// @desc    Generate product description from uploaded image (simplified endpoint)
// @access  Private
router.post('/generate-from-image', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Image file is required'
      });
    }

    const { productName = '' } = req.body;
    const imagePath = req.file.path;

    try {
      // Convert image to base64
      const base64Image = imageToBase64(imagePath);
      const mimeType = req.file.mimetype;

      // Simple prompt for quick description generation
      const prompt = `Analyze this product image${productName ? ` of "${productName}"` : ''} and write a compelling, professional product description (50-150 words) that highlights the product's visual appeal, quality, and benefits. Focus on what makes this product attractive to customers.`;

      // Use Gemini Pro Vision
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ]);

      const response = await result.response;
      const description = response.text().trim();

      // Clean up the description
      const cleanedDescription = description.replace(/^\*+|^"|^'|"$|'$|\*+$/gm, '').trim();

      res.status(200).json({
        status: 'success',
        data: {
          description: cleanedDescription,
          imageProcessed: true
        }
      });

    } finally {
      // Clean up uploaded file
      fs.unlinkSync(imagePath);
    }

  } catch (error) {
    console.error('Error generating description from image:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Enhanced fallback response for image analysis
    const productName = req.body.productName || 'Product';
    let fallbackDescription = `Discover the exceptional quality and innovative design of this product. `;
    
    if (productName) {
      fallbackDescription += `Our ${productName} `;
    } else {
      fallbackDescription += `This premium product `;
    }
    
    fallbackDescription += `combines style and functionality to deliver outstanding performance. Perfect for modern lifestyles, it's designed to enhance your daily experience with its superior craftsmanship and attention to detail. The product showcases excellent build quality and thoughtful design that appeals to customers seeking both aesthetics and functionality.`;
    
    res.status(200).json({
      status: 'success',
      data: {
        description: fallbackDescription,
        fallback: true,
        message: 'Generated enhanced fallback description due to AI service unavailability'
      }
    });
  }
});

export default router;
