export interface AnalysisResult {
  markdown: string;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult | null;
}
