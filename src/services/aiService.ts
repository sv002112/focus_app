import { EnergyLevel, AISuggestion, BrainDumpItem } from '../types';

/**
 * Auto-detects recommended Vertical Battery Energy level based on task description.
 * User can manually tap the vertical battery bar to override anytime!
 */
export const detectEnergyLevel = (text: string): EnergyLevel => {
  const lower = text.toLowerCase();
  
  // High Focus keywords (4 Bars - Soft Orange)
  if (
    lower.match(/\b(study|code|program|essay|tax|budget|research|design|write report|exam|math|finance|analysis)\b/)
  ) {
    return 4;
  }
  
  // Moderate Focus keywords (3 Bars - Warm Yellow)
  if (
    lower.match(/\b(review|plan|organize|read|prepare|summary|schedule|practice|workout|exercise)\b/)
  ) {
    return 3;
  }
  
  // Easy / Low Energy keywords (1 or 2 Bars - Soft Green)
  if (
    lower.match(/\b(water|drink|trash|call|text|pick up|buy|mail|sweep|mug|bed|snack|stretch)\b/)
  ) {
    return 1;
  }
  
  return 2; // Default light effort
};

/**
 * AI "Break-It-Down" Magic Function
 * Generates 3 to 5 micro sub-steps for daunting tasks.
 */
export const breakDownTaskAI = (taskTitle: string): string[] => {
  const lower = taskTitle.toLowerCase();
  
  if (lower.includes('clean') || lower.includes('room') || lower.includes('house') || lower.includes('desk')) {
    return [
      'Pick up 3 visible loose items',
      'Wipe down main surface area',
      'Take out trash or recycling',
      'Put away remaining items in drawers',
    ];
  }
  
  if (lower.includes('study') || lower.includes('read') || lower.includes('exam') || lower.includes('chapter')) {
    return [
      'Set up quiet workspace & water bottle',
      'Read headings & chapter summary first',
      'Read main text for 15 minutes',
      'Jot down 3 main key takeaways',
    ];
  }

  if (lower.includes('tax') || lower.includes('bill') || lower.includes('budget') || lower.includes('finance')) {
    return [
      'Gather documents & receipts in one spot',
      'Log into portal / open spreadsheet',
      'Input top 3 main income/expense items',
      'Save progress & schedule next session',
    ];
  }
  
  if (lower.includes('grocery') || lower.includes('buy') || lower.includes('shop')) {
    return [
      'Check fridge & pantry for missing items',
      'Write quick 5-item shopping list',
      'Grab reusable bags & wallet',
      'Get top 3 essential items first',
    ];
  }

  // General fallback decomposition
  return [
    `Set up tools needed for ${taskTitle}`,
    `Complete first 5 minutes of effort`,
    `Review progress & wrap up main step`,
  ];
};

/**
 * AI Brain Dump Vault Organizer
 * Analyzes raw items (text, link+note, photo+note, audio) and generates structured task/note proposal.
 */
export const organizeBrainDumpAI = (item: BrainDumpItem): AISuggestion => {
  const combinedText = `${item.content} ${item.contextNote || ''}`.trim();
  const lower = combinedText.toLowerCase();

  // Check if it sounds like an actionable task
  const isActionable = lower.match(/\b(buy|call|clean|finish|send|email|schedule|meet|pay|remind|todo|pick up|water)\b/);

  if (isActionable) {
    const energy = detectEnergyLevel(combinedText);
    const suggestedSubTasks = breakDownTaskAI(combinedText);
    const isRoutine = lower.match(/\b(every|daily|weekly|each week|habit|routine|always)\b/);

    return {
      itemType: 'task',
      title: item.contextNote || item.content.slice(0, 40),
      description: item.type === 'link' ? `Reference Link: ${item.content}` : item.content,
      isRecurring: !!isRoutine,
      repeatFrequency: isRoutine ? 'weekly' : undefined,
      energyLevel: energy,
      suggestedSubTasks: suggestedSubTasks.slice(0, 3),
    };
  }

  // Otherwise convert to a Google Keep Note
  const colors = ['#FFF9C4', '#E8F5E9', '#E1F5FE', '#FFE0B2', '#F3E5F5'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  let category = 'Ideas';
  if (lower.includes('buy') || lower.includes('shop') || lower.includes('store')) {
    category = 'Shopping';
  } else if (lower.includes('work') || lower.includes('code') || lower.includes('project')) {
    category = 'Work';
  } else if (lower.includes('health') || lower.includes('gym') || lower.includes('doctor')) {
    category = 'Health';
  }

  return {
    itemType: 'note',
    title: item.contextNote ? item.contextNote : (item.title || 'Brain Dump Idea'),
    description: item.content,
    noteColor: randomColor,
    category,
    noteType: item.content.includes('\n') ? 'checklist' : 'text',
  };
};
