<script>
    let selectedMood = '';
    const moods = [    { emoji: '😄', description: 'Fantastic!' },
    { emoji: '😊', description: 'Pretty Good' },
    { emoji: '😐', description: 'Neutral' },
    { emoji: '😕', description: 'A Bit Down' },
    { emoji: '😢', description: 'Having a Hard Time' }
];
  
    function selectMood(mood) {
      selectedMood = mood;
    }
  </script>
  
  <div class="mood-tracker">
    <h2>How You Doin'?</h2>
    <div class="mood-options">
      {#each moods as mood}
        <button 
          class:selected={selectedMood === mood} 
          on:click={() => selectMood(mood.emoji)}
          title={mood.description}
        >
          {mood.emoji}
        </button>
      {/each}
    </div>
    {#if selectedMood}
    <p class="mood-description">I'm feeling {moods.find(m => m.emoji === selectedMood).description}</p>
  {/if}
  </div>
  
  <style>
    .mood-tracker {
      background-color: #e8f4fd;
      padding: 20px;
      border-radius: 8px;
    }
  
    h2 {
      color: #2c3e50;
      margin-top: 0;
    }
  
    .mood-options {
      display: flex;
      justify-content: space-between;
    }
  
    button {
      font-size: 24px;
      background: none;
      border: 2px solid transparent;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
    }
  
    button:hover, button.selected {
      border-color: #3498db;
      transform: scale(1.1);
    }
  </style>