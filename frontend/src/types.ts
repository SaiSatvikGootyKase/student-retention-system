export interface Student {
  id: number;
  name: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  score: number;
  attendance: number;
  trend: 'up' | 'down' | 'stable' | string;
}
