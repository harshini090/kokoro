<script>
    import { onMount } from 'svelte';
  
    let gratitudeEntries = ['', '', ''];
    
    onMount(() => {
      const storedEntries = localStorage.getItem('gratitudeEntries');
      if (storedEntries) {
        gratitudeEntries = JSON.parse(storedEntries);
      }
    });
  
    function saveEntries() {
      localStorage.setItem('gratitudeEntries', JSON.stringify(gratitudeEntries));
    }
  </script>
  
  <div class="gratitude-journal">
    <h2>Gratitude Journal</h2>
    <p class="subtitle">List three things you're grateful for today:</p>
    {#each gratitudeEntries as entry, i}
      <div class="entry">
        <span class="number">{i + 1}.</span>
        <input
          type="text"
          bind:value={gratitudeEntries[i]}
          placeholder="I'm grateful for..."
          on:input={saveEntries}
        />
      </div>
    {/each}
  </div>
  
  <style>
    .gratitude-journal {
      background-color: #F0E68C; /* Khaki background */
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  
    h2 {
      color: #8E44AD; /* Dark purple for the title */
      margin-top: 0;
      font-size: 1.8em;
      text-align: center;
    }
  
    .subtitle {
      color: #4A0E4E; /* Dark purple */
      text-align: center;
      margin-bottom: 20px;
    }
  
    .entry {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
  
    .number {
      font-size: 1.2em;
      font-weight: bold;
      color: #FF69B4; /* Hot pink */
      margin-right: 10px;
    }
  
    input {
      flex-grow: 1;
      padding: 10px;
      border: 2px solid #FF69B4; /* Hot pink */
      border-radius: 5px;
      font-size: 1em;
    }
  
    input:focus {
      outline: none;
      box-shadow: 0 0 5px #FF69B4; /* Hot pink glow on focus */
    }
  </style>