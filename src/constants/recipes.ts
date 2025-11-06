export const CATEGORIES = ['Dessert', 'Main', 'Snack', 'Breakfast', 'Vegan', 'Italian', 'Mexican', 'Asian'] as const;

export const PREP_TIME_FILTERS = [
  { label: 'All', value: '' },
  { label: '< 15 min', value: '<15' },
  { label: '< 30 min', value: '<30' },
  { label: '< 1 hr', value: '<60' },
  { label: '> 1 hr', value: '>60' },
] as const;

export const CUISINES = ['Ukrainian', 'Italian', 'Mexican', 'Asian', 'French', 'American', 'British', 'Mediterranean'] as const;


