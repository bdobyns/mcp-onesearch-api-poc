import { describe, it, expect, vi, beforeEach } from 'vitest';
import { simpleQueryTool } from '../../../src/tools/simpleQueryTool.js';

// Mock the API function
vi.mock('../../../src/api/simplequery.js', () => ({
  fetchSimpleQuery: vi.fn()
}));

describe('simpleQueryTool', () => {
  let mockFetchSimpleQuery: any;

  beforeEach(async () => {
    const module = await import('../../../src/api/simplequery.js');
    mockFetchSimpleQuery = module.fetchSimpleQuery;
    vi.clearAllMocks();
  });

  describe('Tool metadata', () => {
    it('should have correct name', () => {
      expect(simpleQueryTool.name).toBe('simple_query');
    });

    it('should have correct title', () => {
      expect(simpleQueryTool.title).toBe('Query Articles');
    });

    it('should have descriptive description', () => {
      expect(simpleQueryTool.description).toContain('Query NEJM Group articles');
      expect(simpleQueryTool.description).toContain('context');
      expect(simpleQueryTool.description).toContain('All');
    });

    it('should have correct annotations', () => {
      expect(simpleQueryTool.annotations.readOnlyHint).toBe(true);
      expect(simpleQueryTool.annotations.destructiveHint).toBe(false);
      expect(simpleQueryTool.annotations.idempotentHint).toBe(true);
      expect(simpleQueryTool.annotations.openWorldHint).toBe(true);
    });
  });

  describe('Input schema validation', () => {
    it('should validate valid input with context and query', () => {
      const result = simpleQueryTool.inputSchema.safeParse({
        context: 'nejm',
        query: 'diabetes treatment'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context).toBe('nejm');
        expect(result.data.query).toBe('diabetes treatment');
      }
    });

    it('should reject missing context field', () => {
      const result = simpleQueryTool.inputSchema.safeParse({
        query: 'test'
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing query field', () => {
      const result = simpleQueryTool.inputSchema.safeParse({
        context: 'nejm'
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-string context', () => {
      const result = simpleQueryTool.inputSchema.safeParse({
        context: 123,
        query: 'test'
      });

      expect(result.success).toBe(false);
    });

    it('should reject non-string query', () => {
      const result = simpleQueryTool.inputSchema.safeParse({
        context: 'nejm',
        query: 123
      });

      expect(result.success).toBe(false);
    });

    it('should accept empty query string', () => {
      const result = simpleQueryTool.inputSchema.safeParse({
        context: 'nejm',
        query: ''
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Handler - success cases', () => {
    it('should return formatted results on success', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1', title: 'Article 1' },
        { doi: '10.1056/NEJM2', title: 'Article 2' }
      ];
      mockFetchSimpleQuery.mockResolvedValue(mockResults);

      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'diabetes'
      });

      expect(mockFetchSimpleQuery).toHaveBeenCalledWith({
        context: 'nejm',
        query: 'diabetes'
      });
      expect(result.content).toHaveLength(2);
      expect(result.content[0].type).toBe('text');
      expect(result.content[1].type).toBe('text');
      expect(result.isError).toBeUndefined();
    });

    it('should format each result as JSON', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1', title: 'Test Article' }
      ];
      mockFetchSimpleQuery.mockResolvedValue(mockResults);

      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'test'
      });

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.doi).toBe('10.1056/NEJM1');
      expect(parsedResult.title).toBe('Test Article');
    });

    it('should handle empty results array', async () => {
      mockFetchSimpleQuery.mockResolvedValue([]);

      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'nonexistent query'
      });

      expect(result.content).toHaveLength(0);
      expect(result.isError).toBeUndefined();
    });

    it('should format JSON with indentation', async () => {
      const mockResults = [{ doi: '10.1056/NEJM1', title: 'Article' }];
      mockFetchSimpleQuery.mockResolvedValue(mockResults);

      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'test'
      });

      // JSON.stringify with (null, 2) creates indented output
      expect(result.content[0].text).toContain('\n');
      expect(result.content[0].text).toContain('  ');
    });

    it('should handle multiple results', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1', title: 'Article 1' },
        { doi: '10.1056/NEJM2', title: 'Article 2' },
        { doi: '10.1056/NEJM3', title: 'Article 3' }
      ];
      mockFetchSimpleQuery.mockResolvedValue(mockResults);

      const result = await simpleQueryTool.handler({
        context: 'All',
        query: 'test'
      });

      expect(result.content).toHaveLength(3);
      result.content.forEach((item, index) => {
        expect(item.type).toBe('text');
        const parsed = JSON.parse(item.text);
        expect(parsed.doi).toBe(`10.1056/NEJM${index + 1}`);
      });
    });
  });

  describe('Handler - error cases', () => {
    it('should return error response on API failure', async () => {
      mockFetchSimpleQuery.mockRejectedValue(new Error('Invalid context'));

      const result = await simpleQueryTool.handler({
        context: 'invalid',
        query: 'test'
      });

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error querying articles');
      expect(result.content[0].text).toContain('Invalid context');
    });

    it('should handle network errors gracefully', async () => {
      mockFetchSimpleQuery.mockRejectedValue(new Error('Network timeout'));

      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'test'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Network timeout');
    });

    it('should handle API errors with status codes', async () => {
      mockFetchSimpleQuery.mockRejectedValue(new Error('API error 500: Internal server error'));

      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'test'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('500');
    });

    it('should never throw - always returns response object', async () => {
      mockFetchSimpleQuery.mockRejectedValue(new Error('Unexpected error'));

      // Should not throw
      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'test'
      });

      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
    });
  });

  describe('Response format', () => {
    it('should return content array with text items for each result', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1' },
        { doi: '10.1056/NEJM2' }
      ];
      mockFetchSimpleQuery.mockResolvedValue(mockResults);

      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'test'
      });

      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(2);
      result.content.forEach(item => {
        expect(item).toHaveProperty('type', 'text');
        expect(item).toHaveProperty('text');
      });
    });

    it('should return content array with single text item on error', async () => {
      mockFetchSimpleQuery.mockRejectedValue(new Error('Test error'));

      const result = await simpleQueryTool.handler({
        context: 'nejm',
        query: 'test'
      });

      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });
  });
});
