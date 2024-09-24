<script>
  import { onMount } from 'svelte';

  let gratitudeEntries = [];
  let completedGoals = 0;
  let totalGoals = 0;

  onMount(() => {
    const storedEntries = localStorage.getItem('gratitudeEntries');
    if (storedEntries) {
      gratitudeEntries = JSON.parse(storedEntries);
    }

    const storedGoals = localStorage.getItem('selfCareGoals');
    if (storedGoals) {
      const goals = JSON.parse(storedGoals);
      totalGoals = goals.length;
      completedGoals = goals.filter(goal => goal.completed).length;
    }
  });
</script>

<div class="daily-summary">
  <h2>Daily Reflection</h2>
  <div class="summary-content">
    <div class="summary-item">
      <h3>Gratitude</h3>
      <ul>
        {#each gratitudeEntries as entry}
          {#if entry}
            <li>{entry}</li>
          {/if}
        {/each}
      </ul>
    </div>
    <div class="summary-item">
      <h3>Self-Care Goals</h3>
      <p>{completedGoals} out of {totalGoals} completed</p>
    </div>
  </div>
</div>

<style>
  .daily-summary {
    background-color: #E0FFFF; 
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

  .summary-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .summary-item {
    background-color: #FFFFFF;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  h3 {
    color: #FF69B4; /* Hot pink */
    margin-top: 0;
  }

  ul {
    padding-left: 20px;
    margin: 0;
  }

  li {
    color: #4A0E4E; /* Dark purple */
  }

  p {
    color: #4A0E4E; /* Dark purple */
    font-weight: bold;
  }
</style>