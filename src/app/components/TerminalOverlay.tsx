const TerminalOverlay = () => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <div className="relative bg-cyber-terminal-bg backdrop-blur-sm border border-border rounded-lg p-3 overflow-hidden font-mono">
        {/* Status bar */}
        <div className="flex items-center justify-between mb-2 border-b border-border pb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <p className="text-xs text-primary">SYSTEM ACTIVE</p>
          </div>
          <p className="text-xs text-muted-foreground">ID: 78412.93</p>
        </div>

        <p className="text-sm text-foreground mb-2 tracking-tight">
          <span className="text-primary">/</span> CAREER ANALYSIS COMPLETE
        </p>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className="text-primary mr-2">01</div>
            <span>Optimize resume formatting and layout</span>
          </div>
          <div className="flex items-center">
            <div className="text-primary mr-2">02</div>
            <span>Highlight key skills and achievements</span>
          </div>
          <div className="flex items-center">
            <div className="text-primary mr-2">03</div>
            <span>Update LinkedIn profile and portfolio projects</span>
          </div>
          <div className="flex items-center">
            <div className="text-primary mr-2">04</div>
            <span>Prepare for interviews (technical & behavioral)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalOverlay;