import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moreLikeThisTool } from '../../../src/tools/moreLikeThisTool.js';

// Mock the API function
vi.mock('../../../src/api/morelikethis.js', () => ({
  fetchMoreLikeThis: vi.fn()
}));

describe('moreLikeThisTool', () => {
  let mockFetchMoreLikeThis: any;

  beforeEach(async () => {
    const module = await import('../../../src/api/morelikethis.js');
    mockFetchMoreLikeThis = module.fetchMoreLikeThis;
    vi.clearAllMocks();
  });

  describe('Tool metadata', () => {
    it('should have correct name', () => {
      expect(moreLikeThisTool.name).toBe('more_like_this');
    });

    it('should have correct title', () => {
      expect(moreLikeThisTool.title).toBe('Find Similar Articles');
    });

    it('should have descriptive description', () => {
      expect(moreLikeThisTool.description).toContain('Find articles similar');
      expect(moreLikeThisTool.description).toContain('DOI');
      expect(moreLikeThisTool.description).toContain('NEJM Group');
    });

    it('should have correct annotations', () => {
      expect(moreLikeThisTool.annotations.readOnlyHint).toBe(true);
      expect(moreLikeThisTool.annotations.destructiveHint).toBe(false);
      expect(moreLikeThisTool.annotations.idempotentHint).toBe(true);
      expect(moreLikeThisTool.annotations.openWorldHint).toBe(true);
    });
  });

  describe('Input schema validation', () => {
    it('should validate valid DOI input', () => {
      const result = moreLikeThisTool.inputSchema.safeParse({
        doi: '10.1056/NEJMoa123456'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.doi).toBe('10.1056/NEJMoa123456');
      }
    });

    it('should reject missing doi field', () => {
      const result = moreLikeThisTool.inputSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('should reject non-string doi', () => {
      const result = moreLikeThisTool.inputSchema.safeParse({
        doi: 12345
      });

      expect(result.success).toBe(false);
    });

    it('should accept any string as doi', () => {
      const result = moreLikeThisTool.inputSchema.safeParse({
        doi: 'any-string-doi'
      });

      // Schema accepts any string - validation happens in API layer
      expect(result.success).toBe(true);
    });
  });

  describe('Handler - success cases', () => {
    it('should return formatted results on success', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1', title: 'Similar Article 1' },
        { doi: '10.1056/NEJM2', title: 'Similar Article 2' },
        { doi: '10.1056/CAT1', title: 'Similar Catalyst Article' }
      ];
      mockFetchMoreLikeThis.mockResolvedValue(mockResults);

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      expect(mockFetchMoreLikeThis).toHaveBeenCalledWith('10.1056/NEJMoa123456');
      expect(result.content).toHaveLength(3);
      expect(result.content[0].type).toBe('text');
      expect(result.content[1].type).toBe('text');
      expect(result.content[2].type).toBe('text');
      expect(result.isError).toBeUndefined();
    });

    it('should format each result as JSON', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1', title: 'Similar Article', similarity: 0.95 }
      ];
      mockFetchMoreLikeThis.mockResolvedValue(mockResults);

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.doi).toBe('10.1056/NEJM1');
      expect(parsedResult.title).toBe('Similar Article');
      expect(parsedResult.similarity).toBe(0.95);
    });

    it('should handle empty results array', async () => {
      mockFetchMoreLikeThis.mockResolvedValue([]);

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      expect(result.content).toHaveLength(0);
      expect(result.isError).toBeUndefined();
    });

    it('should format JSON with indentation', async () => {
      const mockResults = [{ doi: '10.1056/NEJM1', title: 'Article' }];
      mockFetchMoreLikeThis.mockResolvedValue(mockResults);

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      // JSON.stringify with (null, 2) creates indented output
      expect(result.content[0].text).toContain('\n');
      expect(result.content[0].text).toContain('  ');
    });

    it('should handle multiple similar articles', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1', title: 'Article 1', source: 'nejm' },
        { doi: '10.1056/CAT1', title: 'Article 2', source: 'catalyst' },
        { doi: '10.1056/EVID1', title: 'Article 3', source: 'evidence' }
      ];
      mockFetchMoreLikeThis.mockResolvedValue(mockResults);

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      expect(result.content).toHaveLength(3);
      result.content.forEach((item, index) => {
        expect(item.type).toBe('text');
        const parsed = JSON.parse(item.text);
        expect(parsed).toHaveProperty('doi');
        expect(parsed).toHaveProperty('title');
      });
    });

    it('should preserve all article fields in JSON output', async () => {
      const mockResults = [{
        doi: '10.1056/NEJM1',
        title: 'Test Article',
        abstract: 'Test abstract',
        publicationDate: '2024-01-01',
        authors: ['Author 1', 'Author 2']
      }];
      mockFetchMoreLikeThis.mockResolvedValue(mockResults);

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.doi).toBe('10.1056/NEJM1');
      expect(parsed.title).toBe('Test Article');
      expect(parsed.abstract).toBe('Test abstract');
      expect(parsed.publicationDate).toBe('2024-01-01');
      expect(parsed.authors).toEqual(['Author 1', 'Author 2']);
    });
  });

  describe('Handler - error cases', () => {
    it('should return error response on API failure', async () => {
      mockFetchMoreLikeThis.mockRejectedValue(new Error('DOI not found'));

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/InvalidDOI'
      });

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error finding similar articles');
      expect(result.content[0].text).toContain('DOI not found');
    });

    it('should handle network errors gracefully', async () => {
      mockFetchMoreLikeThis.mockRejectedValue(new Error('Network timeout'));

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Network timeout');
    });

    it('should handle API errors with status codes', async () => {
      mockFetchMoreLikeThis.mockRejectedValue(new Error('API error 404: Article not found'));

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('404');
    });

    it('should handle access denied errors', async () => {
      mockFetchMoreLikeThis.mockRejectedValue(new Error('API error 403: Access denied'));

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('403');
      expect(result.content[0].text).toContain('Access denied');
    });

    it('should never throw - always returns response object', async () => {
      mockFetchMoreLikeThis.mockRejectedValue(new Error('Unexpected error'));

      // Should not throw
      const result = await moreLikeThisTool.handler({
        doi: '10.1056/Test'
      });

      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
    });
  });

  describe('Response format', () => {
    it('should return content array with text items for each result', async () => {
      const mockResults = [
        { doi: '10.1056/NEJM1' },
        { doi: '10.1056/NEJM2' },
        { doi: '10.1056/CAT1' }
      ];
      mockFetchMoreLikeThis.mockResolvedValue(mockResults);

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/NEJMoa123456'
      });

      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(3);
      result.content.forEach(item => {
        expect(item).toHaveProperty('type', 'text');
        expect(item).toHaveProperty('text');
      });
    });

    it('should return content array with single text item on error', async () => {
      mockFetchMoreLikeThis.mockRejectedValue(new Error('Test error'));

      const result = await moreLikeThisTool.handler({
        doi: '10.1056/Test'
      });

      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });
  });
});
