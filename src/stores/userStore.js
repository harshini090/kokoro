import { writable } from 'svelte/store';

function createUser() {
    const storedUser = localStorage.getItem('user');
    const defaultUser = {
        name: 'Harshini',
        daysActive: 1,
        startDate: new Date().toLocaleDateString(),
        lastActiveDate: new Date().toLocaleDateString()
    };

    const initialUser = storedUser ? JSON.parse(storedUser) : defaultUser;

    const { subscribe, set, update } = writable(initialUser);

    if (!storedUser) {
        localStorage.setItem('user', JSON.stringify(initialUser));
    }

    return {
        subscribe,
        incrementDaysActive: () => update(u => {
            const today = new Date().toLocaleDateString();
            if (today !== u.lastActiveDate) {
                u.daysActive += 1;
                u.lastActiveDate = today;
                localStorage.setItem('user', JSON.stringify(u));
            }
            return u;
        }),
        reset: () => {
            set(defaultUser);
            localStorage.setItem('user', JSON.stringify(defaultUser));
        }
    };
}

export const user = createUser();
export const mood = writable('');
export const gratitudeEntries = writable(['', '', '']);
export const goals = writable({ completed: 0, total: 0 });
export const journalEntry = writable('');