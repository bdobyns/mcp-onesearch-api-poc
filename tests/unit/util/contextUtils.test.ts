import { describe, it, expect } from 'vitest';
import { validateAndNormalizeContext } from '../../../src/util/contextUtils.js';

describe('validateAndNormalizeContext', () => {
  describe('NEJM context variations', () => {
    it('should normalize "New England Journal of Medicine" to nejm', () => {
      const result = validateAndNormalizeContext('New England Journal of Medicine');
      expect(result.normalizedContext).toBe('nejm');
      expect(result.objectType).toBe('nejm-article');
    });

    it('should normalize "The New England Journal of Medicine" to nejm', () => {
      const result = validateAndNormalizeContext('The New England Journal of Medicine');
      expect(result.normalizedContext).toBe('nejm');
      expect(result.objectType).toBe('nejm-article');
    });

    it('should normalize "NEJM" to nejm', () => {
      const result = validateAndNormalizeContext('NEJM');
      expect(result.normalizedContext).toBe('nejm');
      expect(result.objectType).toBe('nejm-article');
    });

    it('should normalize "nejm" to nejm', () => {
      const result = validateAndNormalizeContext('nejm');
      expect(result.normalizedContext).toBe('nejm');
      expect(result.objectType).toBe('nejm-article');
    });
  });

  describe('Catalyst context variations', () => {
    it('should normalize "NEJM Catalyst" to catalyst', () => {
      const result = validateAndNormalizeContext('NEJM Catalyst');
      expect(result.normalizedContext).toBe('catalyst');
      expect(result.objectType).toBe('catalyst-article');
    });

    it('should normalize "Catalyst" to catalyst', () => {
      const result = validateAndNormalizeContext('Catalyst');
      expect(result.normalizedContext).toBe('catalyst');
      expect(result.objectType).toBe('catalyst-article');
    });

    it('should normalize "catalyst" to catalyst', () => {
      const result = validateAndNormalizeContext('catalyst');
      expect(result.normalizedContext).toBe('catalyst');
      expect(result.objectType).toBe('catalyst-article');
    });
  });

  describe('Evidence context variations', () => {
    it('should normalize "NEJM Evidence" to evidence', () => {
      const result = validateAndNormalizeContext('NEJM Evidence');
      expect(result.normalizedContext).toBe('evidence');
      expect(result.objectType).toBe('evidence-article');
    });

    it('should normalize "Evidence" to evidence', () => {
      const result = validateAndNormalizeContext('Evidence');
      expect(result.normalizedContext).toBe('evidence');
      expect(result.objectType).toBe('evidence-article');
    });

    it('should normalize "evidence" to evidence', () => {
      const result = validateAndNormalizeContext('evidence');
      expect(result.normalizedContext).toBe('evidence');
      expect(result.objectType).toBe('evidence-article');
    });
  });

  describe('NEJM AI context variations', () => {
    it('should normalize "NEJM AI" to nejm-ai', () => {
      const result = validateAndNormalizeContext('NEJM AI');
      expect(result.normalizedContext).toBe('nejm-ai');
      expect(result.objectType).toBe('nejm-ai-article');
    });

    it('should normalize "AI" to nejm-ai', () => {
      const result = validateAndNormalizeContext('AI');
      expect(result.normalizedContext).toBe('nejm-ai');
      expect(result.objectType).toBe('nejm-ai-article');
    });

    it('should normalize "nejm-ai" to nejm-ai', () => {
      const result = validateAndNormalizeContext('nejm-ai');
      expect(result.normalizedContext).toBe('nejm-ai');
      expect(result.objectType).toBe('nejm-ai-article');
    });
  });

  describe('Clinician context variations', () => {
    it('should normalize "NEJM Clinician" to clinician', () => {
      const result = validateAndNormalizeContext('NEJM Clinician');
      expect(result.normalizedContext).toBe('clinician');
      expect(result.objectType).toBe('clinician-article');
    });

    it('should normalize "Journal Watch" to clinician', () => {
      const result = validateAndNormalizeContext('Journal Watch');
      expect(result.normalizedContext).toBe('clinician');
      expect(result.objectType).toBe('clinician-article');
    });

    it('should normalize "Clinician" to clinician', () => {
      const result = validateAndNormalizeContext('Clinician');
      expect(result.normalizedContext).toBe('clinician');
      expect(result.objectType).toBe('clinician-article');
    });

    it('should normalize "clinician" to clinician', () => {
      const result = validateAndNormalizeContext('clinician');
      expect(result.normalizedContext).toBe('clinician');
      expect(result.objectType).toBe('clinician-article');
    });
  });

  describe('Federated context variations', () => {
    it('should normalize "All" to federated', () => {
      const result = validateAndNormalizeContext('All');
      expect(result.normalizedContext).toBe('federated');
      expect(result.objectType).toBe('nejm-article;catalyst-article;evidence-article;clinician-article;nejm-ai-article;');
    });

    it('should normalize "all" to federated', () => {
      const result = validateAndNormalizeContext('all');
      expect(result.normalizedContext).toBe('federated');
      expect(result.objectType).toBe('nejm-article;catalyst-article;evidence-article;clinician-article;nejm-ai-article;');
    });

    it('should normalize "Federated" to federated', () => {
      const result = validateAndNormalizeContext('Federated');
      expect(result.normalizedContext).toBe('federated');
      expect(result.objectType).toBe('nejm-article;catalyst-article;evidence-article;clinician-article;nejm-ai-article;');
    });

    it('should normalize "federated" to federated', () => {
      const result = validateAndNormalizeContext('federated');
      expect(result.normalizedContext).toBe('federated');
      expect(result.objectType).toBe('nejm-article;catalyst-article;evidence-article;clinician-article;nejm-ai-article;');
    });
  });

  describe('Invalid context handling', () => {
    it('should throw error for invalid context', () => {
      expect(() => validateAndNormalizeContext('InvalidContext')).toThrow();
    });

    it('should include context value in error message', () => {
      expect(() => validateAndNormalizeContext('InvalidContext'))
        .toThrow(/InvalidContext/);
    });

    it('should throw error for empty string', () => {
      expect(() => validateAndNormalizeContext('')).toThrow();
    });
  });
});
