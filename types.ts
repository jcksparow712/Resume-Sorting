
export interface CandidateResult {
  fileName: string;
  markdown: string;
  score: number; // 0-100 rating based on JD alignment
  name: string;
  currentRole: string;
  originalFile: File;
}

export interface AppState {
  files: File[];
  jobDescriptionText: string;
  isProcessing: boolean;
  results: CandidateResult[];
  error: string | null;
}
