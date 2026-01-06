import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { setupTestEnv, cleanupTestEnv } from '../../helpers/mockEnv.js';

describe('fetchMoreLikeThis', () => {
  let mock: MockAdapter;
  let apiClient: any;
  let fetchMoreLikeThis: any;

  beforeEach(async () => {
    vi.resetModules();
    setupTestEnv();

    const clientModule = await import('../../../src/api/client.js');
    const mltModule = await import('../../../src/api/morelikethis.js');

    apiClient = clientModule.apiClient;
    fetchMoreLikeThis = mltModule.fetchMoreLikeThis;

    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
    cleanupTestEnv();
  });

  describe('Successful fetches', () => {
    it('should return results array for successful fetch', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1', title: 'Similar Article 1' },
        { doi: '10.1056/NEJM2', title: 'Similar Article 2' },
        { doi: '10.1056/CAT1', title: 'Similar Article 3' }
      ];

      mock.onGet('/morelikethis').reply(200, {
        results: mockResults
      });

      const result = await fetchMoreLikeThis('10.1056/NEJMoa123456');

      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when results are missing', async () => {
      mock.onGet('/morelikethis').reply(200, {});

      const result = await fetchMoreLikeThis('10.1056/NEJMoa123456');

      expect(result).toEqual([]);
    });

    it('should return empty array when results are null', async () => {
      mock.onGet('/morelikethis').reply(200, {
        results: null
      });

      const result = await fetchMoreLikeThis('10.1056/NEJMoa123456');

      expect(result).toEqual([]);
    });
  });

  describe('Request parameters', () => {
    beforeEach(() => {
      mock.onGet('/morelikethis').reply(200, { results: [] });
    });

    it('should use federated context', async () => {
      await fetchMoreLikeThis('10.1056/NEJMoa123456');

      expect(mock.history.get[0].params.context).toBe('federated');
    });

    it('should include all article types in objectType', async () => {
      await fetchMoreLikeThis('10.1056/NEJMoa123456');

      const objectType = mock.history.get[0].params.objectType;
      expect(objectType).toContain('nejm-article');
      expect(objectType).toContain('catalyst-article');
      expect(objectType).toContain('evidence-article');
      expect(objectType).toContain('clinician-article');
      expect(objectType).toContain('nejm-ai-article');
    });

    it('should set showResults to full', async () => {
      await fetchMoreLikeThis('10.1056/NEJMoa123456');

      expect(mock.history.get[0].params.showResults).toBe('full');
    });

    it('should pass DOI parameter', async () => {
      const testDoi = '10.1056/NEJMoa987654';
      await fetchMoreLikeThis(testDoi);

      expect(mock.history.get[0].params.doi).toBe(testDoi);
    });

    it('should handle DOI with special characters', async () => {
      const testDoi = '10.1056/NEJM-special.123';
      await fetchMoreLikeThis(testDoi);

      expect(mock.history.get[0].params.doi).toBe(testDoi);
    });
  });

  describe('Error handling', () => {
    it('should throw error with status for API errors', async () => {
      mock.onGet('/morelikethis').reply(500, {
        error: 'Internal server error'
      });

      await expect(fetchMoreLikeThis('10.1056/NEJMoa123456'))
        .rejects.toThrow(/API error 500/);
    });

    it('should throw error for 404', async () => {
      mock.onGet('/morelikethis').reply(404, {
        message: 'DOI not found'
      });

      await expect(fetchMoreLikeThis('10.1056/InvalidDOI'))
        .rejects.toThrow(/404/);
    });

    it('should handle network errors', async () => {
      mock.onGet('/morelikethis').networkError();

      await expect(fetchMoreLikeThis('10.1056/NEJMoa123456'))
        .rejects.toThrow(/Axios error/);
    });

    it('should handle timeout', async () => {
      mock.onGet('/morelikethis').timeout();

      await expect(fetchMoreLikeThis('10.1056/NEJMoa123456'))
        .rejects.toThrow();
    });

    it('should include error details in message', async () => {
      mock.onGet('/morelikethis').reply(403, {
        message: 'Access denied'
      });

      await expect(fetchMoreLikeThis('10.1056/NEJMoa123456'))
        .rejects.toThrow(/Access denied/);
    });
  });
});
