import { writable } from 'svelte/store';

export const user = writable({
  name: 'Harshini',
  daysActive: 1,
  startDate: new Date().toLocaleDateString()
});