// Chatfork - Git-style branching chat types

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  branchId: string;
  parentId?: string;
}

export interface Branch {
  id: string;
  name: string;
  parentBranchId?: string;
  parentMessageId?: string;
  createdAt: number;
  color?: string;
}

export interface ChatState {
  branches: Branch[];
  messages: Message[];
  activeBranchId: string;
}

export interface MergeConflict {
  messageId: string;
  sourceContent: string;
  targetContent: string;
  resolved: boolean;
  resolution?: string;
}

export interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  mergedMessages: Message[];
}

// UI Types
export interface BranchNode {
  branch: Branch;
  children: BranchNode[];
  depth: number;
}

export interface DiffEntry {
  type: 'added' | 'removed' | 'unchanged';
  message: Message;
}
