import { describe, it, expect } from 'vitest';

describe('Gemini Intake Parser & Fallback Safety', () => {
  // Test schema parsing logic that backend uses
  const parseGeminiExtraction = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.extractedLots || !Array.isArray(data.extractedLots)) {
        throw new Error('Invalid schema: extractedLots must be an array');
      }
      return {
        success: true,
        data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Malformed JSON',
        fallbackLots: [
          {
            title: 'Unclassified Resource Lot',
            category: 'stationery',
            description: 'Fallback item extracted deterministically',
            quantity: 1,
            unit: 'items',
            condition: 'good',
            missingInformation: ['Requires manual coordinator classification'],
            ambiguities: [],
            estimatedReuseValue: 10,
          },
        ],
      };
    }
  };

  it('correctly parses well-formed multi-lot Gemini output', () => {
    const validJson = JSON.stringify({
      extractedLots: [
        {
          title: 'Spiral Notebooks',
          category: 'stationery',
          description: '60 notebooks in boxes',
          quantity: 60,
          unit: 'notebooks',
          condition: 'new',
          availableUntil: '2026-10-25',
          missingInformation: [],
          ambiguities: [],
          estimatedReuseValue: 180,
        },
        {
          title: 'Ballpoint Pens',
          category: 'stationery',
          description: '35 packets of pens',
          quantity: 35,
          unit: 'packets',
          condition: 'new',
          availableUntil: '2026-10-25',
          missingInformation: [],
          ambiguities: [],
          estimatedReuseValue: 70,
        },
      ],
      donorSummary: 'Extracted 2 distinct stationery lots.',
    });

    const result = parseGeminiExtraction(validJson);
    expect(result.success).toBe(true);
    expect(result.data.extractedLots).toHaveLength(2);
    expect(result.data.extractedLots[0].title).toBe('Spiral Notebooks');
    expect(result.data.extractedLots[1].title).toBe('Ballpoint Pens');
  });

  it('handles malformed JSON with safe fallback without throwing', () => {
    const malformed = '{ invalid json here: missing quotes ';
    const result = parseGeminiExtraction(malformed);
    expect(result.success).toBe(false);
    expect(result.fallbackLots).toHaveLength(1);
    expect(result.fallbackLots[0].title).toBe('Unclassified Resource Lot');
  });

  it('rejects payload missing extractedLots array with safe fallback', () => {
    const missingArray = JSON.stringify({ donorSummary: 'Something else' });
    const result = parseGeminiExtraction(missingArray);
    expect(result.success).toBe(false);
    expect(result.fallbackLots).toBeDefined();
  });
});
