// The "Get to know you" quiz. Answers personalize each story's "Why it matters to you".
// They stay on the phone; only the readable lines from profileLines() are sent to the
// personalization service when you read the day's stories.

export type Question = {
  id: string;
  title: string; // the question, shown big
  subtitle?: string;
  kind: 'single' | 'multi' | 'text';
  options?: string[];
  placeholder?: string; // for text questions
  label: string; // how the answer is described to the AI, e.g. "Age: 18–22"
};

export type Answers = Record<string, string | string[]>;

export const QUESTIONS: Question[] = [
  {
    id: 'age',
    title: 'How old are you?',
    kind: 'single',
    options: ['Under 18', '18–22', '23–29', '30–44', '45–64', '65+'],
    label: 'Age',
  },
  {
    id: 'home',
    title: 'Where do you live right now?',
    subtitle: 'Your city, and your state or country. We’ll add its local news for you.',
    kind: 'text',
    placeholder: 'e.g. Columbia, Missouri or Manchester, UK',
    label: 'Lives in',
  },
  {
    id: 'hometown',
    title: 'Where did you grow up?',
    subtitle: 'Hometown news hits different.',
    kind: 'text',
    placeholder: 'e.g. Lagos, Nigeria',
    label: 'Grew up in',
  },
  {
    id: 'day',
    title: 'What does a normal week look like?',
    subtitle: 'Pick all that fit.',
    kind: 'multi',
    options: [
      'College student',
      'High school student',
      'Working full-time',
      'Working part-time',
      'Running a business',
      'Looking for work',
      'Caring for kids or family',
      'Retired',
    ],
    label: 'Day to day',
  },
  {
    id: 'field',
    title: 'What do you study or do for work?',
    subtitle: 'Be as specific as you like.',
    kind: 'text',
    placeholder: 'e.g. Finance student, nurse, electrician, teacher',
    label: 'Studies or works in',
  },
  {
    id: 'housing',
    title: 'Where do you sleep at night?',
    kind: 'single',
    options: ['Dorm or campus housing', 'Renting a place', 'Living with family', 'Own my home'],
    label: 'Housing',
  },
  {
    id: 'money',
    title: 'What’s on your mind money-wise?',
    subtitle: 'Pick all that fit.',
    kind: 'multi',
    options: [
      'Paying rent',
      'Student loans',
      'Saving up',
      'Investing in stocks',
      'Credit card debt',
      'Buying a car',
      'Buying a home someday',
      'Taxes',
      'Prices at the store and gas pump',
    ],
    label: 'Money on their mind',
  },
  {
    id: 'health',
    title: 'How do you get health insurance?',
    kind: 'single',
    subtitle: 'This helps with stories about health costs and care.',
    options: [
      'Public or national health care',
      'Through my job',
      'Through a parent or partner',
      'Through school',
      'A plan I buy myself',
      'Government aid program',
      'None or not sure',
      'Prefer not to say',
    ],
    label: 'Health coverage',
  },
  {
    id: 'transport',
    title: 'How do you get around?',
    subtitle: 'Pick all that fit.',
    kind: 'multi',
    options: ['My own car', 'Bus, train, or metro', 'Bike or walk', 'Rideshare or taxi', 'Motorbike or scooter'],
    label: 'Gets around by',
  },
  {
    id: 'vote',
    title: 'Do you vote where you live?',
    kind: 'single',
    options: [
      'Yes',
      'I vote somewhere else',
      'Not yet',
      'Too young to vote',
      'Can’t vote where I live',
      'Prefer not to say',
    ],
    label: 'Voting',
  },
  {
    id: 'kids',
    title: 'Any kids?',
    kind: 'single',
    options: ['No kids', 'Have kids', 'Expecting', 'Prefer not to say'],
    label: 'Kids',
  },
  {
    id: 'issues',
    title: 'Which issues do you care about most?',
    subtitle: 'Pick up to 5. We’ll never assume your politics.',
    kind: 'multi',
    options: [
      'Jobs and careers',
      'Cost of living',
      'Housing',
      'Education',
      'Healthcare',
      'Public safety',
      'Environment and climate',
      'Tech and AI',
      'Taxes',
      'Immigration',
      'Guns',
      'Civil rights',
    ],
    label: 'Cares most about',
  },
  {
    id: 'goals',
    title: 'What are you working toward in the next few years?',
    subtitle: 'Pick all that fit.',
    kind: 'multi',
    options: [
      'Graduate',
      'Land an internship or first job',
      'Get a raise or promotion',
      'Change careers',
      'Move to a new city',
      'Buy a home',
      'Start a family',
      'Start a business',
      'Retire comfortably',
    ],
    label: 'Goals for the next few years',
  },
  {
    id: 'extra',
    title: 'Anything else that changes how the news hits you?',
    subtitle: 'Optional, but this is where it gets really personal.',
    kind: 'text',
    placeholder: 'e.g. My dad farms soybeans. I’m saving for grad school. I work at Boeing.',
    label: 'Also',
  },
];

// The answers as readable lines for the AI, skipping blanks and "Prefer not to say".
export function profileLines(answers: Answers): string[] {
  return QUESTIONS.flatMap((q) => {
    const raw = answers[q.id];
    const values = (Array.isArray(raw) ? raw : [raw ?? ''])
      .map((v) => v.trim())
      .filter((v) => v && v !== 'Prefer not to say');
    return values.length ? [`${q.label}: ${values.join(', ')}`.slice(0, 300)] : [];
  });
}
