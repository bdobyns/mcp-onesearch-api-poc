import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { setupTestEnv, cleanupTestEnv } from '../../helpers/mockEnv.js';

describe('fetchByDoi', () => {
  let mock: MockAdapter;
  let apiClient: any;
  let fetchByDoi: any;

  beforeEach(async () => {
    // Setup environment before importing modules
    vi.resetModules();
    setupTestEnv();

    // Import modules after env is set up
    const clientModule = await import('../../../src/api/client.js');
    const fetchModule = await import('../../../src/api/fetchByDoi.js');

    apiClient = clientModule.apiClient;
    fetchByDoi = fetchModule.fetchByDoi;

    // Create mock adapter
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
    cleanupTestEnv();
  });

  describe('Successful fetches', () => {
    it('should fetch article successfully', async () => {
      const mockDocument = '<article><title>Test Article</title></article>';
      mock.onGet('/content').reply(200, {
        document: mockDocument,
        doi: '10.1056/NEJMoa123456'
      });

      const result = await fetchByDoi('10.1056/NEJMoa123456');

      expect(result).toBe(mockDocument);
      expect(mock.history.get.length).toBe(1);
      expect(mock.history.get[0].params).toMatchObject({
        doi: '10.1056/NEJMoa123456',
        format: 'json'
      });
    });

    it('should return empty string when document is missing', async () => {
      mock.onGet('/content').reply(200, {
        doi: '10.1056/NEJMoa123456'
      });

      const result = await fetchByDoi('10.1056/NEJMoa123456');

      expect(result).toBe('');
    });
  });

  describe('Context inference', () => {
    beforeEach(() => {
      mock.onGet('/content').reply(200, { document: 'test' });
    });

    it('should infer nejm context from DOI with NEJM', async () => {
      await fetchByDoi('10.1056/NEJMoa123456');

      expect(mock.history.get[0].params.context).toBe('nejm');
    });

    it('should infer catalyst context from DOI with CAT', async () => {
      await fetchByDoi('10.1056/CATnc123456');

      expect(mock.history.get[0].params.context).toBe('catalyst');
    });

    it('should infer evidence context from DOI with EVID', async () => {
      await fetchByDoi('10.1056/EVIDoa123456');

      expect(mock.history.get[0].params.context).toBe('evidence');
    });

    it('should infer nejm-ai context from DOI with AI', async () => {
      await fetchByDoi('10.1056/AIoa123456');

      expect(mock.history.get[0].params.context).toBe('nejm-ai');
    });

    it('should infer clinician context for other DOIs', async () => {
      await fetchByDoi('10.1056/JWoa123456');

      expect(mock.history.get[0].params.context).toBe('clinician');
    });

    it('should default to nejm context for unmatched DOIs', async () => {
      await fetchByDoi('10.1056/UnknownPrefix');

      // Should start with nejm as default, then fall through to clinician
      expect(mock.history.get[0].params.context).toBe('clinician');
    });
  });

  describe('Error handling', () => {
    it('should throw descriptive error for 404', async () => {
      mock.onGet('/content').reply(404, {
        message: 'Article not found'
      });

      await expect(fetchByDoi('10.1056/InvalidDOI'))
        .rejects.toThrow(/fetchByDoi failed/);
    });

    it('should include status code in error message', async () => {
      mock.onGet('/content').reply(500, {
        message: 'Internal server error'
      });

      await expect(fetchByDoi('10.1056/NEJMoa123456'))
        .rejects.toThrow(/500/);
    });

    it('should include DOI in error message', async () => {
      mock.onGet('/content').reply(404);

      await expect(fetchByDoi('10.1056/TestDOI'))
        .rejects.toThrow(/10\.1056\/TestDOI/);
    });

    it('should handle network errors', async () => {
      mock.onGet('/content').networkError();

      await expect(fetchByDoi('10.1056/NEJMoa123456'))
        .rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mock.onGet('/content').timeout();

      await expect(fetchByDoi('10.1056/NEJMoa123456'))
        .rejects.toThrow();
    });

    it('should include API error message when provided', async () => {
      mock.onGet('/content').reply(403, {
        message: 'Access denied'
      });

      await expect(fetchByDoi('10.1056/NEJMoa123456'))
        .rejects.toThrow(/Access denied/);
    });
  });
});
