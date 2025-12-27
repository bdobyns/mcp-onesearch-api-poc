// ../util/contextUtils.ts

export type ValidContext = 'nejm' | 'catalyst' | 'evidence' | 'clinician' | 'nejm-ai' | 'federated';

export interface ContextConfig {
  normalizedContext: ValidContext;
  objectType: string;
}

/**
 * Validates and normalizes a context string to a valid API context value
 * @param context - The context string to validate (can be human-readable or normalized)
 * @returns ContextConfig object with normalized context and corresponding object type
 * @throws Error if context is invalid
 */
export function validateAndNormalizeContext(context: string): ContextConfig {
  let normalizedContext: ValidContext;

  switch (context) {
    case 'New England Journal of Medicine':
    case 'The New England Journal of Medicine':
    case 'NEJM':
    case 'nejm':
      normalizedContext = 'nejm';
      break;
    case 'NEJM Catalyst':
    case 'Catalyst':
    case 'catalyst':
      normalizedContext = 'catalyst';
      break;
    case 'NEJM Evidence':
    case 'Evidence':
    case 'evidence':
      normalizedContext = 'evidence';
      break;
    case 'NEJM AI':
    case 'AI':
    case 'nejm-ai':
      normalizedContext = 'nejm-ai';
      break;
    case 'NEJM Clinician':
    case 'Clinician':
    case 'NEJM Journal Watch':
    case 'Journal Watch':
    case 'clinician':
      normalizedContext = 'clinician';
      break;
    case 'All':
    case 'all':
    case 'Federated':
    case 'federated':
      normalizedContext = 'federated'; 
      break;
    default:
      throw new Error(`Invalid context: ${context}`);
  }

  let objectType: string;
  if (normalizedContext === 'federated') {
    objectType = 'nejm-article;catalyst-article;evidence-article;clinician-article;nejm-ai-article;'; 
  } else {
    objectType = `${normalizedContext}-article`;
  }

  return {
    normalizedContext,
    objectType,
  };
}
