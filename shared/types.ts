export type PlanStatus = 'pending' | 'in_progress' | 'succeeded' | 'failed';

export type ApprovalState = 'pending' | 'approved' | 'rejected';

export interface SessionActivity {
  id: string;
  sessionId: string;
  at: string;
  actor: 'user' | 'system' | 'jules';
  type: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface JulesSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  repo: string;
  branch?: string;
  planStatus: PlanStatus;
  approval: ApprovalState;
  summary?: string;
  participants: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateSessionInput {
  repo: string;
  branch?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  participants?: string[];
}

export interface SessionDelta {
  id: string;
  previous?: JulesSession;
  current?: JulesSession;
  change: 'created' | 'updated' | 'deleted';
}
