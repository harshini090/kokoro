<script>
    import { onMount } from 'svelte';
    import { journalEntry, mood } from '../stores/userStore.js';

    let entries = [];
    let currentMood = '';

    onMount(() => {
        const storedEntries = localStorage.getItem('journalEntries');
        if (storedEntries) {
            entries = JSON.parse(storedEntries);
        }
        const unsubscribe = mood.subscribe(value => {
            currentMood = value;
        });

        return unsubscribe;
    });
    function selectMood(moodObj) {
      selectedMood = moodObj.emoji;
      mood.set(selectedMood);
      
      if (moodObj.emoji === '😢') {
        $journalEntry = "I'm sorry you're having a hard time. Would you like to write about it?";
        previouslySelectedSad = true;
      } else if (previouslySelectedSad) {
        $journalEntry = "I'm glad you're feeling a bit better. How has your mood changed?";
        previouslySelectedSad = false;
      } else {
        $journalEntry = `You're feeling ${moodObj.description.toLowerCase()}. Want to share why?`;
      }
  
      setTimeout(() => {
        journalContainer.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    function saveJournalEntry() {
      if ($journalEntry.trim()) {
        const newEntry = {
          date: new Date().toLocaleString(),
          mood: selectedMood,
          content: $journalEntry
        };
        entries = [newEntry, ...entries];
        localStorage.setItem('journalEntries', JSON.stringify(entries));
        $journalEntry = '';
        selectedMood = '';
      }
    }

    function addEntry() {
        if ($journalEntry.trim()) {
            const newEntry = {
                date: new Date().toLocaleString(),
                mood: currentMood,
                content: $journalEntry
            };
            entries = [newEntry, ...entries];
            localStorage.setItem('journalEntries', JSON.stringify(entries));
            journalEntry.set('');
        }
    }
</script>

<div class="journal">
    <h2>Journal Entries</h2>
    <div class="new-entry">
        <textarea bind:value={$journalEntry} placeholder="Write a new entry..."></textarea>
        <button on:click={addEntry}>Add Entry</button>
    </div>
    <div class="entry-list">
        {#each entries as entry}
            <div class="entry">
                <p class="entry-date">{entry.date}</p>
                <p class="entry-mood">Mood: {entry.mood}</p>
                <p class="entry-content">{entry.content}</p>
            </div>
        {/each}
    </div>
</div>

<style>
    .journal {
        background-color: #FFF5EE;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    h2 {
        color: #8E44AD;
        margin-top: 0;
        font-size: 1.8em;
    }

    .new-entry {
        margin-bottom: 20px;
    }

    textarea {
        width: 100%;
        padding: 10px;
        border: 2px solid #FF69B4;
        border-radius: 5px;
        font-size: 1em;
        margin-bottom: 10px;
    }

    button {
        background-color: #FF69B4;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1em;
    }

    .entry-list {
        max-height: 400px;
        overflow-y: auto;
    }

    .entry {
        background-color: white;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .entry-date {
        font-weight: bold;
        color: #3498db;
    }

    .entry-mood {
        font-style: italic;
        color: #e74c3c;
    }

    .entry-content {
        margin-top: 5px;
    }
</style>