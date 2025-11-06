export const formatDate = (input: any): string => {
  try {
    const date = typeof input?.toDate === 'function' ? input.toDate() : new Date(input);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US');
  } catch {
    return '';
  }
};


