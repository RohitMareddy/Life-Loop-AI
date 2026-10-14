import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('Server Backend API Endpoints & Security', () => {
  it('GET /api/health returns 200 with operational status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.aiConfigured).toBe('boolean');
    expect(res.body.timestamp).toBeDefined();
  });

  describe('POST /api/gemini/extract-resource', () => {
    it('returns 400 if neither textDescription nor imageBase64 is provided', async () => {
      const res = await request(app)
        .post('/api/gemini/extract-resource')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Text description or image is required');
    });

    it('returns 400 if textDescription exceeds security threshold (>8000 chars)', async () => {
      const oversizedText = 'a'.repeat(8001);
      const res = await request(app)
        .post('/api/gemini/extract-resource')
        .send({ textDescription: oversizedText });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('exceeds maximum allowed length');
    });
  });

  describe('POST /api/gemini/explain-match', () => {
    it('returns 400 when missing resource or request payload', async () => {
      const res = await request(app)
        .post('/api/gemini/explain-match')
        .send({ resource: null });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('returns valid explanation with deterministic fallback when AI is unavailable', async () => {
      const sampleResource = {
        id: 'res-test-endpoint',
        title: 'Notebooks',
        category: 'stationery',
        availableQuantity: 50,
        unit: 'notebooks',
        condition: 'new',
      };
      const sampleRequest = {
        id: 'req-test-endpoint',
        category: 'stationery',
        requestedQuantity: 30,
        unit: 'notebooks',
        minAcceptableCondition: 'good',
      };

      const res = await request(app)
        .post('/api/gemini/explain-match')
        .send({
          resource: sampleResource,
          request: sampleRequest,
          compatibilityMetrics: { overallScore: 92 },
        });

      expect(res.status).toBe(200);
      expect(res.body.explanation).toBeDefined();
      expect(res.body.generatedBy).toBeDefined();
    });
  });

  describe('POST /api/gemini/assistant', () => {
    it('returns 400 when query is missing or whitespace', async () => {
      const res = await request(app)
        .post('/api/gemini/assistant')
        .send({ query: '   ' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('query is required');
    });

    it('returns 400 when query exceeds length limit', async () => {
      const longQuery = 'x'.repeat(4001);
      const res = await request(app)
        .post('/api/gemini/assistant')
        .send({ query: longQuery });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('maximum allowed length');
    });

    it('handles assistant queries with safe fallback', async () => {
      const res = await request(app)
        .post('/api/gemini/assistant')
        .send({
          query: 'Which school has urgent stationery needs?',
          systemStateSnapshot: {
            availableLotsCount: 5,
            openRequestsCount: 3,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.reply).toBeDefined();
      expect(typeof res.body.isFallback).toBe('boolean');
    });
  });
});
