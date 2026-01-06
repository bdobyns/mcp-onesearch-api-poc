import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchByDoiTool } from '../../../src/tools/fetchByDoiTool.js';

// Mock the API function
vi.mock('../../../src/api/fetchByDoi.js', () => ({
  fetchByDoi: vi.fn()
}));

describe('fetchByDoiTool', () => {
  let mockFetchByDoi: any;

  beforeEach(async () => {
    const module = await import('../../../src/api/fetchByDoi.js');
    mockFetchByDoi = module.fetchByDoi;
    vi.clearAllMocks();
  });

  describe('Tool metadata', () => {
    it('should have correct name', () => {
      expect(fetchByDoiTool.name).toBe('fetch_by_doi');
    });

    it('should have correct title', () => {
      expect(fetchByDoiTool.title).toBe('Fetch Article by DOI');
    });

    it('should have descriptive description', () => {
      expect(fetchByDoiTool.description).toContain('DOI');
      expect(fetchByDoiTool.description).toContain('10.1056/');
      expect(fetchByDoiTool.description).toContain('New England Journal of Medicine');
    });

    it('should have correct annotations', () => {
      expect(fetchByDoiTool.annotations.readOnlyHint).toBe(true);
      expect(fetchByDoiTool.annotations.destructiveHint).toBe(false);
      expect(fetchByDoiTool.annotations.idempotentHint).toBe(true);
      expect(fetchByDoiTool.annotations.openWorldHint).toBe(false);
    });
  });

  describe('Input schema validation', () => {
    it('should validate valid DOI input', () => {
      const result = fetchByDoiTool.inputSchema.safeParse({
        doi: '10.1056/NEJMoa123456'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.doi).toBe('10.1056/NEJMoa123456');
      }
    });

    it('should reject missing doi field', () => {
      const result = fetchByDoiTool.inputSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it('should reject non-string doi', () => {
      const result = fetchByDoiTool.inputSchema.safeParse({
        doi: 12345
      });

      expect(result.success).toBe(false);
    });

    it('should accept any string as doi', () => {
      const result = fetchByDoiTool.inputSchema.safeParse({
        doi: 'invalid-doi-format'
      });

      // Schema accepts any string - validation happens in API layer
      expect(result.success).toBe(true);
    });
  });

  describe('Handler - success cases', () => {
    it('should return article content on success', async () => {
      const mockArticle = '<article><title>Test Article</title></article>';
      mockFetchByDoi.mockResolvedValue(mockArticle);

      const result = await fetchByDoiTool.handler({ doi: '10.1056/NEJMoa123456' });

      expect(mockFetchByDoi).toHaveBeenCalledWith('10.1056/NEJMoa123456');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(mockArticle);
      expect(result.isError).toBeUndefined();
    });

    it('should handle empty article content', async () => {
      mockFetchByDoi.mockResolvedValue('');

      const result = await fetchByDoiTool.handler({ doi: '10.1056/NEJMoa123456' });

      expect(result.content[0].text).toBe('');
      expect(result.isError).toBeUndefined();
    });

    it('should handle XML article content', async () => {
      const xmlContent = '<?xml version="1.0"?><article><body>Content</body></article>';
      mockFetchByDoi.mockResolvedValue(xmlContent);

      const result = await fetchByDoiTool.handler({ doi: '10.1056/NEJMoa123456' });

      expect(result.content[0].text).toBe(xmlContent);
    });
  });

  describe('Handler - error cases', () => {
    it('should return error response on API failure', async () => {
      mockFetchByDoi.mockRejectedValue(new Error('Article not found'));

      const result = await fetchByDoiTool.handler({ doi: '10.1056/InvalidDOI' });

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error fetching article');
      expect(result.content[0].text).toContain('Article not found');
    });

    it('should handle network errors gracefully', async () => {
      mockFetchByDoi.mockRejectedValue(new Error('Network timeout'));

      const result = await fetchByDoiTool.handler({ doi: '10.1056/NEJMoa123456' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Network timeout');
    });

    it('should handle API errors with status codes', async () => {
      mockFetchByDoi.mockRejectedValue(new Error('fetchByDoi failed for 10.1056/Test (404): Not found'));

      const result = await fetchByDoiTool.handler({ doi: '10.1056/Test' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('404');
      expect(result.content[0].text).toContain('Not found');
    });

    it('should never throw - always returns response object', async () => {
      mockFetchByDoi.mockRejectedValue(new Error('Unexpected error'));

      // Should not throw
      const result = await fetchByDoiTool.handler({ doi: '10.1056/Test' });

      expect(result).toBeDefined();
      expect(result.isError).toBe(true);
    });
  });

  describe('Response format', () => {
    it('should return content array with single text item on success', async () => {
      mockFetchByDoi.mockResolvedValue('test content');

      const result = await fetchByDoiTool.handler({ doi: '10.1056/NEJMoa123456' });

      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should return content array with single text item on error', async () => {
      mockFetchByDoi.mockRejectedValue(new Error('Test error'));

      const result = await fetchByDoiTool.handler({ doi: '10.1056/Test' });

      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });
  });
});
