export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** lucide-react icon name (mapped on the client). */
  icon: string;
  earned: boolean;
  earnedAt: string | null;
}
