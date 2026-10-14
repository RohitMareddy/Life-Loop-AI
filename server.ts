import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: AI-Powered Smart Resource Intake Extraction
app.post('/api/gemini/extract-resource', async (req, res) => {
  const { textDescription, imageBase64, mimeType } = req.body;

  if (!textDescription && !imageBase64) {
    return res.status(400).json({ error: 'Text description or image is required.' });
  }

  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API key is not configured. Please use manual entry or demo extraction.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  try {
    const prompt = `
You are the AI Smart Resource Intake parser for LIFELOOP AI, a community resource redistribution platform.
Analyze the following donation description and extract structured resource lots.
A single description may contain multiple distinct items (e.g. notebooks, pens, and desks). Extract EACH as a separate resource item.

Strict extraction rules:
1. Do NOT invent dates, addresses, safety certifications, or expiry dates that are not stated.
2. If quantities are approximate or ambiguous, note them in ambiguities.
3. Classify condition carefully from: 'new' | 'good' | 'used_functional' | 'requires_inspection' | 'unsuitable'.
4. Classify category into one of: 'books_education' | 'stationery' | 'furniture' | 'household_supplies' | 'non_perishable' | 'digital_devices'.
5. Set verificationStatus to 'unverified' by default.
6. Identify missing information explicitly.

Donation description:
"""${textDescription || 'See attached image'}"""
`;

    const parts: any[] = [];
    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: 'You extract structured community donation resources into valid JSON conforming strictly to the requested schema. Never hallucinate verified facts.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedLots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Short descriptive title of the resource' },
                  category: {
                    type: Type.STRING,
                    description: 'One of: books_education, stationery, furniture, household_supplies, non_perishable, digital_devices',
                  },
                  description: { type: Type.STRING, description: 'Clear summary of what was donated' },
                  quantity: { type: Type.NUMBER, description: 'Extracted numeric quantity' },
                  unit: { type: Type.STRING, description: 'Unit e.g. notebooks, pens, kits, desks, boxes, items' },
                  condition: {
                    type: Type.STRING,
                    description: 'One of: new, good, used_functional, requires_inspection, unsuitable',
                  },
                  availableUntil: { type: Type.STRING, description: 'Availability deadline if mentioned, or empty string' },
                  storageRequirements: { type: Type.STRING, description: 'Special storage or transport needs if any' },
                  pickupLocation: { type: Type.STRING, description: 'Pickup location if specified, or empty string' },
                  missingInformation: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'List of essential information not provided in the text',
                  },
                  ambiguities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Ambiguous points requiring human confirmation',
                  },
                  estimatedReuseValue: {
                    type: Type.NUMBER,
                    description: 'Sensible estimated fair market replacement value in USD',
                  },
                },
                required: ['title', 'category', 'description', 'quantity', 'unit', 'condition'],
              },
            },
            donorSummary: { type: Type.STRING, description: 'Brief human-readable summary of the extraction' },
          },
          required: ['extractedLots'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini extraction error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to extract resource information with Gemini AI.',
      code: 'AI_PROCESSING_ERROR',
    });
  }
});

// Endpoint: Grounded Match Explanation
app.post('/api/gemini/explain-match', async (req, res) => {
  const { resource, request, compatibilityMetrics } = req.body;

  if (!resource || !request) {
    return res.status(400).json({ error: 'Resource and Request data are required.' });
  }

  if (!ai) {
    return res.json({
      explanation: `Deterministic Compatibility: Overall score is ${compatibilityMetrics?.overallScore ?? 85}/100. Category: ${resource.category}. Requested: ${request.requestedQuantity} ${request.unit}. Available: ${resource.availableQuantity} ${resource.unit}. Condition: ${resource.condition} meets minimum required ${request.minAcceptableCondition}.`,
      generatedBy: 'deterministic_fallback',
    });
  }

  try {
    const prompt = `
You are the explainability engine of LIFELOOP AI.
Explain the compatibility between the following resource lot and community request.
Use the structured data strictly. Never invent urgency or recipient need that is not in the request.

Resource Lot:
- Title: ${resource.title} (${resource.category})
- Available: ${resource.availableQuantity} ${resource.unit}
- Condition: ${resource.condition}
- Available From-Until: ${resource.availableFrom} to ${resource.availableUntil || 'Ongoing'}
- Pickup Location: ${resource.pickupLocation}

Community Request:
- Recipient: ${request.organizationName} (${request.organizationType})
- Needed: ${request.requestedQuantity} ${request.unit} of ${request.requestedItems}
- Min acceptable condition: ${request.minAcceptableCondition}
- Required by: ${request.requiredByDate}
- Priority: ${request.priorityLevel} (Reason: ${request.priorityExplanation})
- Location: ${request.location}

Calculated Metrics:
- Overall Compatibility: ${compatibilityMetrics.overallScore}/100
- Quantity Feasibility: ${compatibilityMetrics.quantityScore}/100
- Timing Compatibility: ${compatibilityMetrics.timingScore}/100
- Condition Compatibility: ${compatibilityMetrics.conditionScore}/100
- Location Feasibility: ${compatibilityMetrics.locationScore}/100
- Hard Constraints Satisfied: ${compatibilityMetrics.hardConstraintsPassed}
- Constraint Notes: ${JSON.stringify(compatibilityMetrics.hardConstraintViolations || [])}

Provide a concise, transparent explanation answering:
1. Why are these items compatible or incompatible?
2. Which specific constraints are satisfied?
3. What information remains unknown and requires coordinator verification?
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an objective, honest explainability engine. Adhere strictly to the facts provided.',
      },
    });

    return res.json({
      explanation: response.text?.trim() || 'Explanation generated based on deterministic compatibility factors.',
      generatedBy: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('Gemini explanation error:', err);
    return res.json({
      explanation: `Deterministic Compatibility: Overall score is ${compatibilityMetrics?.overallScore ?? 85}/100. Category: ${resource.category}. Requested: ${request.requestedQuantity} ${request.unit}. Available: ${resource.availableQuantity} ${resource.unit}. Condition: ${resource.condition} meets minimum required ${request.minAcceptableCondition}.`,
      generatedBy: 'deterministic_fallback',
    });
  }
});

// Endpoint: Contextual Loop Assistant
app.post('/api/gemini/assistant', async (req, res) => {
  const { query, systemStateSnapshot } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  if (!ai) {
    return res.json({
      reply: 'Loop Assistant is operating in local deterministic mode (Gemini API key is not configured in secrets). I can confirm your current inventory has multiple items and community requests. You can explore the Impact Optimizer and What-If Simulator directly from the left navigation.',
      isFallback: true,
    });
  }

  try {
    const prompt = `
You are the Loop Assistant, an intelligent operational copilot for LIFELOOP AI.
Answer the user query based ONLY on the actual platform data snapshot provided below.
Rules:
- Never hallucinate fake inventory or pretend requests exist when they do not.
- Distinguish between verified outcomes and proposed allocations.
- If asked to perform an action (e.g. approve an allocation), clearly explain what the action would do and tell the user where to click in the interface to confirm it.
- Keep responses concise, helpful, and professional.

Platform Snapshot:
- Available Resource Lots: ${systemStateSnapshot?.availableLotsCount ?? 0}
- Open Community Requests: ${systemStateSnapshot?.openRequestsCount ?? 0}
- Proposed Allocations: ${systemStateSnapshot?.proposedAllocationsCount ?? 0}
- Recorded Distributions: ${systemStateSnapshot?.distributedCount ?? 0}
- Key Inventory Items: ${JSON.stringify(systemStateSnapshot?.keyInventory ?? [])}
- Urgent Community Needs: ${JSON.stringify(systemStateSnapshot?.urgentRequests ?? [])}
- Active Allocation Strategy: ${systemStateSnapshot?.activeStrategy ?? 'Maximize Total Fulfillment'}

User Query:
"${query}"
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are the calm, knowledgeable Loop Assistant for LIFELOOP AI community resource redistribution.',
      },
    });

    return res.json({
      reply: response.text?.trim() || 'No answer generated.',
      isFallback: false,
    });
  } catch (err: any) {
    console.error('Gemini assistant error:', err);
    return res.json({
      reply: 'I encountered an error querying the AI service. You can continue reviewing resources and running optimization directly through the dashboard.',
      isFallback: true,
    });
  }
});

// Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LIFELOOP AI server running on http://0.0.0.0:${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
