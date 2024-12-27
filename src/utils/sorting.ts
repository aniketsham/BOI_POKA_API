import { SortOrder } from 'mongoose';

interface SortOptions {
  sortBy?: 'addedAt' | 'author' | 'genre';
  order?: SortOrder;
}

export const getSortOptions = (
  options: SortOptions = {}
): Record<string, SortOrder> => {
  const { sortBy = 'addedAt', order = -1 } = options;
  const validOrder = order === 1 || order === -1 ? order : -1;
  return { [sortBy]: validOrder };
};
