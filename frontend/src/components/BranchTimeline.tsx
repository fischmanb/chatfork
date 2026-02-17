import type { Branch, Message } from '@/types';

interface BranchTimelineProps {
  branches: Branch[];
  messages: Message[];
  activeBranchId: string;
  onSwitchBranch: (branchId: string) => void;
}

export function BranchTimeline({ branches, messages, activeBranchId, onSwitchBranch }: BranchTimelineProps) {
  // Build branch tree structure
  const buildTree = (parentId: string | null = null, depth = 0): Array<{ branch: Branch; depth: number }> => {
    const result: Array<{ branch: Branch; depth: number }> = [];
    
    const directChildren = branches.filter(b => b.parentBranchId === parentId);
    
    for (const branch of directChildren) {
      result.push({ branch, depth });
      result.push(...buildTree(branch.id, depth + 1));
    }
    
    return result;
  };

  const branchTree = buildTree(null);

  // Get message count for a branch
  const getMessageCount = (branchId: string) => {
    return messages.filter(m => m.branchId === branchId).length;
  };

  return (
    <div className="w-64 bg-[#1a1a1a] border-r border-[#333] overflow-y-auto max-h-[600px]">
      <div className="p-4 border-b border-[#333]">
        <h3 className="text-sm font-medium text-[#B7FF3A] uppercase tracking-wider">Branches</h3>
      </div>
      
      <div className="p-2 space-y-1">
        {branchTree.map(({ branch, depth }) => {
          const isActive = branch.id === activeBranchId;
          const messageCount = getMessageCount(branch.id);
          const indent = depth * 16;
          
          return (
            <button
              key={branch.id}
              onClick={() => onSwitchBranch(branch.id)}
              className={`
                w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                flex items-center gap-2
                ${isActive 
                  ? 'bg-[#B7FF3A]/20 text-[#B7FF3A] border border-[#B7FF3A]/40' 
                  : 'text-gray-400 hover:bg-[#252525] hover:text-gray-200'
                }
              `}
              style={{ marginLeft: `${indent}px` }}
            >
              {/* Branch color dot */}
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: branch.color || '#B7FF3A' }}
              />
              
              <span className="flex-1 truncate font-mono">{branch.name}</span>
              
              {/* Message count */}
              <span className="text-xs text-gray-500 bg-[#252525] px-1.5 py-0.5 rounded">
                {messageCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-[#333] mt-4">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#B7FF3A]" />
            <span>main branch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>forked branches</span>
          </div>
        </div>
      </div>
    </div>
  );
}
