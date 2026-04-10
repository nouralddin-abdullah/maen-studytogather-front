import { useState, useRef, useEffect } from "react";

/**
 * GoalsPanel — displays goals for each room participant.
 * Users can view their own goals and other participants' goals.
 * Only the current user can create/toggle goals.
 *
 * Props: glassClass, themeCfg, userId, participants, roomGoals,
 *        isGoalsLoading, createGoal, toggleGoal
 */
function GoalsPanel({
  glassClass,
  themeCfg,
  userId,
  participants,
  roomGoals,
  isGoalsLoading,
  createGoal,
  toggleGoal,
  updateGoalTitle,
  deleteGoal,
  isMobileFullHeight,
}) {
  const [activeTab, setActiveTab] = useState(userId); // userId of selected tab
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [addingSubGoalFor, setAddingSubGoalFor] = useState(null); // parentId
  const [subGoalTitle, setSubGoalTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState({}); // { goalId: bool }
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const inputRef = useRef(null);
  const subInputRef = useRef(null);
  const tabsRef = useRef(null);
  const pickerRef = useRef(null);

  // Focus sub-goal input when opening
  useEffect(() => {
    if (addingSubGoalFor && subInputRef.current) {
      subInputRef.current.focus();
    }
  }, [addingSubGoalFor]);

  // Close user picker on outside click
  useEffect(() => {
    if (!showUserPicker) return;
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowUserPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showUserPicker]);

  // Auto-switch back to own tab if the currently viewed participant leaves
  useEffect(() => {
    if (activeTab !== userId) {
      const isStillInRoom = participants.some((p) => p.id === activeTab);
      if (!isStillInRoom) {
        setActiveTab(userId);
      }
    }
  }, [activeTab, participants, userId]);

  // Get goals for the active tab
  const activeEntry = roomGoals.find((pg) => pg.id === activeTab);
  const activeGoals = activeEntry?.goals || [];
  const isOwnTab = activeTab === userId;

  // Completed / total counts
  const totalParent = activeGoals.length;
  const completedParent = activeGoals.filter((g) => g.isCompleted).length;

  // Toggle expand/collapse for a goal's children
  const toggleExpand = (goalId) => {
    setExpandedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  // Create top-level goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || newGoalTitle.trim().length < 3) return;
    setIsCreating(true);
    try {
      await createGoal(newGoalTitle.trim());
      setNewGoalTitle("");
    } catch {
      // error logged in store
    } finally {
      setIsCreating(false);
    }
  };

  // Create sub-goal
  const handleCreateSubGoal = async (e, parentId) => {
    e.preventDefault();
    if (!subGoalTitle.trim() || subGoalTitle.trim().length < 3) return;
    setIsCreating(true);
    try {
      await createGoal(subGoalTitle.trim(), parentId);
      setSubGoalTitle("");
      setAddingSubGoalFor(null);
      // Auto-expand parent
      setExpandedGoals((prev) => ({ ...prev, [parentId]: true }));
    } catch {
      // error logged in store
    } finally {
      setIsCreating(false);
    }
  };

  // Handle toggle with loading state per-goal
  const handleToggle = async (goalId, currentState) => {
    try {
      await toggleGoal(goalId, !currentState);
    } catch {
      // error logged in store
    }
  };

  // Start editing a goal title
  const startEditing = (goalId, currentTitle) => {
    setEditingGoalId(goalId);
    setEditTitle(currentTitle);
  };

  // Save edited title
  const saveEdit = async (goalId) => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed.length < 3) {
      setEditingGoalId(null);
      return;
    }
    try {
      await updateGoalTitle(goalId, trimmed);
    } catch {
      // error logged in store
    }
    setEditingGoalId(null);
  };

  // Delete a goal
  const handleDelete = async (goalId) => {
    try {
      await deleteGoal(goalId);
    } catch {
      // error logged in store
    }
  };

  // Get participant display name
  const getParticipantName = (pId) => {
    if (pId === userId) return "أهدافي";
    const p = participants.find((pp) => pp.id === pId);
    return p?.nickName || p?.username || "مستخدم";
  };

  // Build tab list: current user first, then others
  const tabUsers = [
    userId,
    ...participants
      .filter((p) => p.id !== userId)
      .map((p) => p.id),
  ];

  /* ═══════════════════════════════════════════════════
     Checkbox component
     ═══════════════════════════════════════════════════ */
  const Checkbox = ({ checked, onClick, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
        checked
          ? "border border-emerald-400 bg-emerald-400/20 text-emerald-400"
          : "border border-white/30 hover:border-white/60"
      }`}
    >
      {checked && (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      )}
    </button>
  );

  return (
    <div
      className={`${glassClass} rounded-3xl flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "h-[52px]" : "flex-1 min-h-[200px]"}`}
    >
      {/* ── Header ── */}
      <div
        className={`p-4 ${themeCfg.accentBg} border-b border-white/5 flex justify-between items-center`}
      >
        {/* Clickable title with dropdown */}
        <div className="relative">
          <button
            onClick={() => participants.length > 1 && setShowUserPicker((v) => !v)}
            className={`font-bold text-white text-sm flex items-center gap-1.5 ${
              participants.length > 1
                ? "cursor-pointer hover:text-white/80 transition-colors"
                : ""
            }`}
          >
            {isOwnTab ? "أهدافي" : `أهداف ${getParticipantName(activeTab)}`}
            {participants.length > 1 && (
              <svg
                className={`w-3 h-3 text-white/50 transition-transform ${showUserPicker ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </button>

          {/* Dropdown */}
          {showUserPicker && (
            <div
              ref={pickerRef}
              className="absolute top-full mt-1.5 start-0 min-w-[160px] bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in z-50"
            >
              {tabUsers.map((pId) => {
                const isActive = activeTab === pId;
                const p = participants.find((pp) => pp.id === pId);
                const name = pId === userId ? "أهدافي" : (p?.nickName || p?.username || "مستخدم");
                return (
                  <button
                    key={pId}
                    onClick={() => {
                      setActiveTab(pId);
                      setShowUserPicker(false);
                    }}
                    className={`w-full text-start px-3 py-2 text-xs transition-colors cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? "bg-white/15 text-white font-bold"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                    {!isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
                    )}
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!isMobileFullHeight && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/40 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-90" : "-rotate-90"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Goal list ── */}
      {!isCollapsed && (
        <div className="px-1.5 py-2 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
          {/* Loading */}
        {isGoalsLoading && activeGoals.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isGoalsLoading && activeGoals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <svg
              className="w-8 h-8 text-white/15"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
              />
            </svg>
            <p className="text-white/30 text-xs text-center">
              {isOwnTab ? "لا توجد أهداف بعد" : "لا توجد أهداف"}
            </p>
          </div>
        )}

        {/* Goals */}
        {activeGoals.map((goal) => {
          const hasChildren = goal.children && goal.children.length > 0;
          const isExpanded =
            expandedGoals[goal.id] !== undefined
              ? expandedGoals[goal.id]
              : true; // default expanded
          const childCompleted = hasChildren
            ? goal.children.filter((c) => c.isCompleted).length
            : 0;

          return (
            <div key={goal.id} className="animate-fade-in">
              {/* Parent goal row */}
              <div className="group flex items-start gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors">
                {/* Expand/collapse toggle */}
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(goal.id)}
                    className="mt-0.5 w-5 h-5 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer flex-shrink-0"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                ) : (
                  <div className="w-5 flex-shrink-0" />
                )}

                {/* Checkbox */}
                {isOwnTab ? (
                  <Checkbox
                    checked={goal.isCompleted}
                    onClick={() => handleToggle(goal.id, goal.isCompleted)}
                    disabled={hasChildren && !goal.children.every((c) => c.isCompleted)}
                  />
                ) : (
                  <Checkbox checked={goal.isCompleted} disabled />
                )}

                {/* Title */}
                <div className="flex-1 min-w-0">
                  {editingGoalId === goal.id && isOwnTab ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveEdit(goal.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(goal.id);
                        if (e.key === "Escape") setEditingGoalId(null);
                      }}
                      className="w-full bg-white/5 border border-white/15 rounded px-1.5 py-0.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                      maxLength={200}
                    />
                  ) : (
                    <p
                      className={`text-sm leading-relaxed ${
                        goal.isCompleted
                          ? "text-white/40 line-through decoration-white/20"
                          : "text-white"
                      } ${isOwnTab ? "cursor-pointer" : ""}`}
                      onDoubleClick={() =>
                        isOwnTab && startEditing(goal.id, goal.title)
                      }
                    >
                      {goal.title}
                    </p>
                  )}
                  {hasChildren && (
                    <span className="text-[10px] text-white/30 font-mono">
                      {childCompleted}/{goal.children.length}
                    </span>
                  )}
                </div>

                {/* Add sub-goal button (own tab, parent goals only) */}
                {isOwnTab && !goal.isCompleted && (
                  <button
                    onClick={() => {
                      setAddingSubGoalFor(
                        addingSubGoalFor === goal.id ? null : goal.id,
                      );
                      setSubGoalTitle("");
                      if (!expandedGoals[goal.id]) {
                        setExpandedGoals((prev) => ({
                          ...prev,
                          [goal.id]: true,
                        }));
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 mt-0.5 w-5 h-5 flex items-center justify-center text-white/30 hover:text-white/60 transition-all cursor-pointer flex-shrink-0"
                    title="إضافة هدف فرعي"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </button>
                )}

                {/* Delete goal button (own tab only) */}
                {isOwnTab && (
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="opacity-0 group-hover:opacity-100 mt-0.5 w-5 h-5 flex items-center justify-center text-white/30 hover:text-red-400 transition-all cursor-pointer flex-shrink-0"
                    title="حذف الهدف"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Children goals */}
              {hasChildren && isExpanded && (
                <div className="ms-10 border-s border-white/10 ps-3 flex flex-col gap-0.5">
                  {goal.children.map((child) => (
                    <div
                      key={child.id}
                      className="group flex items-start gap-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors animate-fade-in"
                    >
                      {isOwnTab ? (
                        <Checkbox
                          checked={child.isCompleted}
                          onClick={() =>
                            handleToggle(child.id, child.isCompleted)
                          }
                        />
                      ) : (
                        <Checkbox checked={child.isCompleted} disabled />
                      )}
                      {editingGoalId === child.id && isOwnTab ? (
                        <input
                          autoFocus
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveEdit(child.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(child.id);
                            if (e.key === "Escape") setEditingGoalId(null);
                          }}
                          className="flex-1 bg-white/5 border border-white/15 rounded px-1.5 py-0.5 text-[13px] text-white focus:outline-none focus:border-white/30 transition-colors"
                          maxLength={200}
                        />
                      ) : (
                        <p
                          className={`text-[13px] leading-relaxed ${
                            child.isCompleted
                              ? "text-white/40 line-through decoration-white/20"
                              : "text-white/80"
                          } ${isOwnTab ? "cursor-pointer" : ""}`}
                          onDoubleClick={() =>
                            isOwnTab && startEditing(child.id, child.title)
                          }
                        >
                          {child.title}
                        </p>
                      )}

                      {/* Delete child goal */}
                      {isOwnTab && (
                        <button
                          onClick={() => handleDelete(child.id)}
                          className="opacity-0 group-hover:opacity-100 mt-0.5 w-4 h-4 flex items-center justify-center text-white/30 hover:text-red-400 transition-all cursor-pointer flex-shrink-0 ms-auto"
                          title="حذف"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Inline sub-goal input */}
                  {isOwnTab && addingSubGoalFor === goal.id && (
                    <form
                      onSubmit={(e) => handleCreateSubGoal(e, goal.id)}
                      className="flex items-center gap-2 p-1.5 animate-fade-in"
                    >
                      <input
                        ref={subInputRef}
                        type="text"
                        value={subGoalTitle}
                        onChange={(e) => setSubGoalTitle(e.target.value)}
                        placeholder="هدف فرعي..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/25 transition-colors"
                        maxLength={200}
                        disabled={isCreating}
                      />
                      <button
                        type="submit"
                        disabled={
                          isCreating ||
                          !subGoalTitle.trim() ||
                          subGoalTitle.trim().length < 3
                        }
                        className={`w-7 h-7 rounded-lg ${themeCfg.accent} ${themeCfg.accentHover} text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer flex-shrink-0`}
                      >
                        {isCreating ? (
                          <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Sub-goal input when parent has no children yet */}
              {isOwnTab &&
                addingSubGoalFor === goal.id &&
                !hasChildren && (
                  <div className="ms-10 border-s border-white/10 ps-3">
                    <form
                      onSubmit={(e) => handleCreateSubGoal(e, goal.id)}
                      className="flex items-center gap-2 p-1.5 animate-fade-in"
                    >
                      <input
                        ref={subInputRef}
                        type="text"
                        value={subGoalTitle}
                        onChange={(e) => setSubGoalTitle(e.target.value)}
                        placeholder="هدف فرعي..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white/25 transition-colors"
                        maxLength={200}
                        disabled={isCreating}
                      />
                      <button
                        type="submit"
                        disabled={
                          isCreating ||
                          !subGoalTitle.trim() ||
                          subGoalTitle.trim().length < 3
                        }
                        className={`w-7 h-7 rounded-lg ${themeCfg.accent} ${themeCfg.accentHover} text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer flex-shrink-0`}
                      >
                        {isCreating ? (
                          <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                )}
            </div>
          );
        })}

        {/* ── Add goal (own tab only) ── */}
        {isOwnTab && (
          <form
            onSubmit={handleCreateGoal}
            className="mt-2 flex items-center gap-2 px-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="إضافة هدف جديد..."
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-white/40 focus:outline-none"
              maxLength={200}
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={
                isCreating ||
                !newGoalTitle.trim() ||
                newGoalTitle.trim().length < 3
              }
              className={`w-7 h-7 rounded-lg ${themeCfg.accent} ${themeCfg.accentHover} text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer flex-shrink-0`}
            >
              {isCreating ? (
                <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              )}
            </button>
          </form>
        )}
        </div>
      )}
    </div>
  );
}

export default GoalsPanel;
