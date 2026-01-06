import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { setupTestEnv, cleanupTestEnv } from '../../helpers/mockEnv.js';

describe('fetchSimpleQuery', () => {
  let mock: MockAdapter;
  let apiClient: any;
  let fetchSimpleQuery: any;

  beforeEach(async () => {
    vi.resetModules();
    setupTestEnv();

    const clientModule = await import('../../../src/api/client.js');
    const queryModule = await import('../../../src/api/simplequery.js');

    apiClient = clientModule.apiClient;
    fetchSimpleQuery = queryModule.fetchSimpleQuery;

    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
    cleanupTestEnv();
  });

  describe('Successful queries', () => {
    it('should return results array for successful query', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1', title: 'Article 1' },
        { doi: '10.1056/NEJM2', title: 'Article 2' }
      ];

      mock.onGet('/simple').reply(200, {
        results: mockResults
      });

      const result = await fetchSimpleQuery({
        context: 'nejm',
        query: 'test query'
      });

      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when results are missing', async () => {
      mock.onGet('/simple').reply(200, {});

      const result = await fetchSimpleQuery({
        context: 'nejm',
        query: 'test query'
      });

      expect(result).toEqual([]);
    });

    it('should return empty array when results are null', async () => {
      mock.onGet('/simple').reply(200, {
        results: null
      });

      const result = await fetchSimpleQuery({
        context: 'nejm',
        query: 'test query'
      });

      expect(result).toEqual([]);
    });
  });

  describe('Context normalization integration', () => {
    beforeEach(() => {
      mock.onGet('/simple').reply(200, { results: [] });
    });

    it('should normalize NEJM context', async () => {
      await fetchSimpleQuery({
        context: 'New England Journal of Medicine',
        query: 'test'
      });

      expect(mock.history.get[0].params.context).toBe('nejm');
      expect(mock.history.get[0].params.objectType).toBe('nejm-article');
    });

    it('should normalize Catalyst context', async () => {
      await fetchSimpleQuery({
        context: 'NEJM Catalyst',
        query: 'test'
      });

      expect(mock.history.get[0].params.context).toBe('catalyst');
      expect(mock.history.get[0].params.objectType).toBe('catalyst-article');
    });

    it('should handle federated context', async () => {
      await fetchSimpleQuery({
        context: 'All',
        query: 'test'
      });

      expect(mock.history.get[0].params.context).toBe('federated');
      expect(mock.history.get[0].params.objectType).toContain('nejm-article');
      expect(mock.history.get[0].params.objectType).toContain('catalyst-article');
    });
  });

  describe('Query parameters', () => {
    beforeEach(() => {
      mock.onGet('/simple').reply(200, { results: [] });
    });

    it('should pass all required parameters', async () => {
      await fetchSimpleQuery({
        context: 'nejm',
        query: 'diabetes treatment'
      });

      const params = mock.history.get[0].params;
      expect(params.context).toBe('nejm');
      expect(params.query).toBe('diabetes treatment');
      expect(params.objectType).toBe('nejm-article');
      expect(params.showResults).toBe('full');
    });

    it('should preserve query string with special characters', async () => {
      const queryWithSpecialChars = 'COVID-19 & treatment: "latest research"';

      await fetchSimpleQuery({
        context: 'nejm',
        query: queryWithSpecialChars
      });

      expect(mock.history.get[0].params.query).toBe(queryWithSpecialChars);
    });
  });

  describe('Error handling', () => {
    it('should throw error with status for API errors', async () => {
      mock.onGet('/simple').reply(500, {
        error: 'Internal server error'
      });

      await expect(fetchSimpleQuery({
        context: 'nejm',
        query: 'test'
      })).rejects.toThrow(/API error 500/);
    });

    it('should throw error for 404', async () => {
      mock.onGet('/simple').reply(404);

      await expect(fetchSimpleQuery({
        context: 'nejm',
        query: 'test'
      })).rejects.toThrow(/404/);
    });

    it('should handle network errors', async () => {
      mock.onGet('/simple').networkError();

      await expect(fetchSimpleQuery({
        context: 'nejm',
        query: 'test'
      })).rejects.toThrow(/Axios error/);
    });

    it('should handle timeout', async () => {
      mock.onGet('/simple').timeout();

      await expect(fetchSimpleQuery({
        context: 'nejm',
        query: 'test'
      })).rejects.toThrow();
    });

    it('should throw error for invalid context', async () => {
      await expect(fetchSimpleQuery({
        context: 'InvalidContext',
        query: 'test'
      })).rejects.toThrow(/Invalid context/);
    });
  });
});
