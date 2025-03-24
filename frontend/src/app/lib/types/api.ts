export interface Report {
    id: string;
    user_id: string;
    date: string;
    type: string;
    metrics: {
      cholesterol: number;
      glucose: number;
      hemoglobin: number;
    };
    status: 'Analyzed' | 'Pending';
  }
  
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    created_at: string;
}