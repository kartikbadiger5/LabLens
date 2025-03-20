// src/app/lib/types/report.ts
export interface LabReport {
    id: string;
    summary: string;
    riskLevel: "low" | "medium" | "high";
    biomarkers: Record<string, number>;
    recommendations: string[];
    date: string;
  }
  
  export interface TrendData {
    testName: string;
    values: number[];
    dates: string[];
    units: string;
  }