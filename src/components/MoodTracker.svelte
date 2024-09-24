<script>
    import { onMount } from 'svelte';
    import { mood, journalEntry } from '../stores/userStore.js';
  
    let selectedMood = '';
    let entries = [];
    let moodDescription = '';
  
    const moods = [
        { emoji: '😄', description: 'fantastic' },
        { emoji: '😊', description: 'good' },
        { emoji: '😐', description: 'neutral' },
        { emoji: '😕', description: 'a bit down' },
        { emoji: '😢', description: 'having a hard time' }
    ];
  
    onMount(() => {
      const storedEntries = localStorage.getItem('moodEntries');
      if (storedEntries) {
        entries = JSON.parse(storedEntries);
      }
    });
  
    function selectMood(moodObj) {
      selectedMood = moodObj.emoji;
      moodDescription = `I'm feeling ${moodObj.description}`;
      mood.set(selectedMood);
      if (moodObj.emoji === '😢') {
        journalEntry.set("I'm sorry you're having a hard time. Would you like to write about it?");
      } else {
        journalEntry.set(`You're feeling ${moodObj.description}. Want to share why?`);
      }
      
      saveMoodEntry();
  
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  
    function saveMoodEntry() {
      const newEntry = {
        date: new Date().toLocaleString(),
        mood: selectedMood,
        description: moodDescription
      };
      entries = [newEntry, ...entries];
      localStorage.setItem('moodEntries', JSON.stringify(entries));
    }
  </script>
  
  <div class="mood-tracker">
    <h2>How You Doin'?</h2>
    <div class="mood-options">
      {#each moods as moodObj}
        <button 
          class:selected={selectedMood === moodObj.emoji} 
          on:click={() => selectMood(moodObj)}
          title={moodObj.description}
        >
          {moodObj.emoji}
        </button>
      {/each}
    </div>
    {#if selectedMood}
      <p class="mood-description">{moodDescription}</p>
    {/if}
  
    <div class="entry-list">
      {#each entries as entry}
        <div class="entry">
          <p class="entry-date">{entry.date}</p>
          <p class="entry-mood">{entry.mood} {entry.description}</p>
        </div>
      {/each}
    </div>
  </div>
  
  <style>
    .mood-tracker {
      background-color: #e8f4fd;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
  
    h2 {
      color: #2c3e50;
      margin-top: 0;
      text-align: center;
    }
  
    .mood-options {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
  
    button {
      font-size: 2em;
      background: none;
      border: 2px solid transparent;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      padding: 10px;
    }
  
    button:hover, button.selected {
      border-color: #3498db;
      transform: scale(1.1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  
    .mood-description {
      text-align: center;
      margin-top: 20px;
      font-weight: bold;
      color: #4A0E4E;
    }
  
    .entry-list {
      margin-top: 20px;
      max-height: 300px;
      overflow-y: auto;
    }
  
    .entry {
      background-color: #ffffff;
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
      color: #4A0E4E;
    }
  </style>