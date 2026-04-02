export function generateFollowupSuggestions(staleDeals) {
  return staleDeals
    .map((deal) => {
      const daysInactive = deal.last_activity_date
        ? Math.floor((Date.now() - new Date(deal.last_activity_date)) / (1000 * 60 * 60 * 24))
        : 5;

      const stageAction = {
        lead: 'Send a short credibility message with one sharp reason to continue the conversation.',
        proposal: 'Follow up on the proposal with a clear decision date and a simple yes-or-no next step.',
        meeting: 'Lock the next call while the context is still warm and summarize the decision blockers.',
        contracted: 'Confirm onboarding details and move quickly into delivery to avoid drift.',
        negotiating: 'Clarify the tradeoff, restate value, and ask which point is actually blocking signature.',
      };

      let urgency = 'low';
      if (daysInactive >= 7 || deal.stage === 'negotiating') {
        urgency = 'high';
      } else if (daysInactive >= 4 || deal.stage === 'proposal') {
        urgency = 'medium';
      }

      return {
        deal_title: deal.title,
        action: stageAction[deal.stage] || 'Send a concise follow-up and ask for the next concrete step.',
        urgency,
      };
    })
    .slice(0, 6);
}

export function generateWeeklyReview(summary) {
  const completionRate = summary.tasks_total > 0
    ? Math.round((summary.tasks_done / summary.tasks_total) * 100)
    : 0;
  const score = Math.max(
    1,
    Math.min(
      10,
      Math.round(
        completionRate / 15 +
        summary.habit_completion_rate / 20 +
        Math.min(summary.journals_written, 5) / 2
      )
    )
  );

  const whatWorked = completionRate >= 60
    ? 'Execution stayed relatively consistent and tasks were being closed instead of endlessly carried forward.'
    : 'You still maintained movement, but the week did not convert enough intent into completed work.';

  const improve =
    summary.habit_completion_rate >= 70
      ? 'The main gap is prioritization. Protect the few tasks that actually change outcomes instead of spreading effort too thin.'
      : 'Your routines slipped. Tighten the daily floor first so the week has a stronger execution rhythm.';

  const focus =
    summary.overdue_items > 0
      ? 'Clear overdue commitments early next week, then reserve uninterrupted time for your highest-leverage project.'
      : 'Keep the same cadence, but reduce context switching and push one meaningful project over the line.';

  return {
    what_worked: whatWorked,
    what_to_improve: improve,
    next_week_focus: focus,
    overall_score: score,
  };
}
