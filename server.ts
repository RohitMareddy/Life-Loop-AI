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

app.use(express.json({ limit: '5mb' }));

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

// In-memory cache for match explanations to prevent redundant Gemini API calls
interface CacheEntry {
  explanation: string;
  generatedBy: string;
  timestamp: number;
}
const explanationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Helper for timing out async operations safely
function withTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out after 15 seconds')), timeoutMs)
    ),
  ]);
}

// Endpoint: AI-Powered Smart Resource Intake Extraction
app.post('/api/gemini/extract-resource', async (req, res) => {
  const { textDescription, imageBase64, mimeType } = req.body;

  if (!textDescription && !imageBase64) {
    return res.status(400).json({ error: 'Text description or image is required.' });
  }

  // Input length security validation
  if (textDescription && typeof textDescription === 'string' && textDescription.length > 8000) {
    return res.status(400).json({ error: 'Description exceeds maximum allowed length of 8,000 characters.' });
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
"""${typeof textDescription === 'string' ? textDescription.trim() : 'See attached image'}"""
`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (imageBase64 && typeof mimeType === 'string' && mimeType.startsWith('image/')) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      });
    }
    parts.push({ text: prompt });

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction:
          'You extract structured community donation resources into valid JSON conforming strictly to the requested schema. Never hallucinate verified facts.',
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
                    description:
                      'One of: books_education, stationery, furniture, household_supplies, non_perishable, digital_devices',
                  },
                  description: { type: Type.STRING, description: 'Clear summary of what was donated' },
                  quantity: { type: Type.NUMBER, description: 'Extracted numeric quantity' },
                  unit: { type: Type.STRING, description: 'Unit e.g. notebooks, pens, kits, desks, boxes, items' },
                  condition: {
                    type: Type.STRING,
                    description: 'One of: new, good, used_functional, requires_inspection, unsuitable',
                  },
                  availableUntil: {
                    type: Type.STRING,
                    description: 'Availability deadline if mentioned, or empty string',
                  },
                  storageRequirements: {
                    type: Type.STRING,
                    description: 'Special storage or transport needs if any',
                  },
                  pickupLocation: {
                    type: Type.STRING,
                    description: 'Pickup location if specified, or empty string',
                  },
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
            donorSummary: {
              type: Type.STRING,
              description: 'Brief human-readable summary of the extraction',
            },
          },
          required: ['extractedLots'],
        },
      },
    });

    const response = await withTimeout(generatePromise, 15000);
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : 'Unknown processing error';
    const safeDetails = rawMsg.toLowerCase().includes('key') ? 'Service configuration or network error' : rawMsg.slice(0, 150);
    return res.status(500).json({
      error: 'Failed to extract resource information with Gemini AI. Fallback available.',
      details: safeDetails,
      code: 'AI_PROCESSING_ERROR',
    });
  }
});

// Endpoint: Grounded Match Explanation with Safe Caching
app.post('/api/gemini/explain-match', async (req, res) => {
  const { resource, request, compatibilityMetrics } = req.body;

  if (!resource || !request) {
    return res.status(400).json({ error: 'Resource and Request data are required.' });
  }

  const cacheKey = `${resource.id}:${request.id}:${compatibilityMetrics?.overallScore ?? 0}`;
  const cached = explanationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json({
      explanation: cached.explanation,
      generatedBy: `${cached.generatedBy} (cached)`,
    });
  }

  const fallbackText = `Deterministic Compatibility: Overall score is ${
    compatibilityMetrics?.overallScore ?? 85
  }/100. Category: ${resource.category}. Requested: ${request.requestedQuantity} ${
    request.unit
  }. Available: ${resource.availableQuantity} ${resource.unit}. Condition: ${
    resource.condition
  } meets minimum required ${request.minAcceptableCondition}.`;

  if (!ai) {
    return res.json({
      explanation: fallbackText,
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

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an objective, honest explainability engine. Adhere strictly to the facts provided.',
      },
    });

    const response = await withTimeout(generatePromise, 12000);
    const explanation =
      response.text?.trim() || 'Explanation generated based on deterministic compatibility factors.';

    explanationCache.set(cacheKey, {
      explanation,
      generatedBy: 'gemini-3.8-flash',
      timestamp: Date.now(),
    });

    return res.json({
      explanation,
      generatedBy: 'gemini-3.8-flash',
    });
  } catch (err: unknown) {
    return res.json({
      explanation: fallbackText,
      generatedBy: 'deterministic_fallback',
    });
  }
});

// Endpoint: Contextual Loop Assistant
app.post('/api/gemini/assistant', async (req, res) => {
  const { query, systemStateSnapshot } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Valid query string is required.' });
  }

  if (query.length > 1000) {
    return res.status(400).json({ error: 'Query is too long (maximum 1,000 characters).' });
  }

  if (!ai) {
    return res.json({
      reply:
        'Loop Assistant is operating in local deterministic mode (Gemini API key is not configured in secrets). I can confirm your current inventory has multiple items and community requests. You can explore the Impact Optimizer and What-If Simulator directly from the left navigation.',
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
"${query.trim()}"
`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are the calm, knowledgeable Loop Assistant for LIFELOOP AI community resource redistribution.',
      },
    });

    const response = await withTimeout(generatePromise, 15000);
    return res.json({
      reply: response.text?.trim() || 'No answer generated.',
      isFallback: false,
    });
  } catch (err: unknown) {
    return res.json({
      reply:
        'I encountered an error querying the AI service. You can continue reviewing resources and running optimization directly through the dashboard.',
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
    console.log(
      `LIFELOOP AI server running on http://0.0.0.0:${PORT} [${
        isProd ? 'production' : 'development'
      }]`
    );
  });
}

// Export app and server starter for testing and execution
export { app, startServer };

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}


