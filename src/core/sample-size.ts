/** Sample-size confidence categories — a simple heuristic for trust. */

export type SampleSizeConfidence = "low" | "moderate" | "good" | "high";

export const sampleSizeConfidence = (n: number): SampleSizeConfidence => {
  if (n < 30) return "low";
  if (n < 100) return "moderate";
  if (n < 500) return "good";
  return "high";
};

export type SampleSizeAssessment = {
  n: number;
  confidence: SampleSizeConfidence;
  message: string;
};

export const assessSampleSize = (n: number): SampleSizeAssessment => {
  const confidence = sampleSizeConfidence(n);
  const message = {
    low: `Sample muito pequeno (${n}) — números pouco confiáveis.`,
    moderate: `Sample moderado (${n}) — confie com cautela.`,
    good: `Sample bom (${n}) — dado confiável.`,
    high: `Sample alto (${n}) — alta confiança no dado.`,
  }[confidence];
  return { n, confidence, message };
};
