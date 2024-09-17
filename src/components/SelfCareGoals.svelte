<script>
    import { onMount } from 'svelte';
  
    let goals = [];
    let newGoalText = '';
  
    onMount(() => {
      // Load goals from local storage on component mount
      const storedGoals = localStorage.getItem('selfCareGoals');
      if (storedGoals) {
        goals = JSON.parse(storedGoals);
      }
    });
  
    function addGoal() {
      if (newGoalText.trim()) {
        goals = [...goals, { text: newGoalText, completed: false }];
        newGoalText = '';
        saveGoals();
      }
    }
  
    function toggleGoal(index) {
      goals[index].completed = !goals[index].completed;
      goals = [...goals];
      saveGoals();
    }
  
    function removeGoal(index) {
      goals = goals.filter((_, i) => i !== index);
      saveGoals();
    }
  
    function saveGoals() {
      localStorage.setItem('selfCareGoals', JSON.stringify(goals));
    }
  
    $: completedGoals = goals.filter(goal => goal.completed).length;
    $: progress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
  </script>
  
  <div class="self-care-goals">
    <h2>Self-Care Goals</h2>
    
    <div class="add-goal">
      <input
        type="text"
        bind:value={newGoalText}
        placeholder="Enter a new self-care goal"
        on:keypress={(e) => e.key === 'Enter' && addGoal()}
      />
      <button on:click={addGoal}>Add Goal</button>
    </div>
  
    <ul class="goal-list">
      {#each goals as goal, index}
        <li class:completed={goal.completed}>
          <input
            type="checkbox"
            checked={goal.completed}
            on:change={() => toggleGoal(index)}
          />
          <span>{goal.text}</span>
          <button class="remove-btn" on:click={() => removeGoal(index)}>×</button>
        </li>
      {/each}
    </ul>
  
    <div class="progress-bar">
      <div class="progress" style="width: {progress}%"></div>
    </div>
    <p class="progress-text">{completedGoals} out of {goals.length} goals completed</p>
  </div>
  
  <style>
    .self-care-goals {
      background-color: #e8f4fd;
      padding: 20px;
      border-radius: 8px;
    }
  
    h2 {
      color: #2c3e50;
      margin-top: 0;
    }
  
    .add-goal {
      display: flex;
      margin-bottom: 15px;
    }
  
    input[type="text"] {
      flex-grow: 1;
      padding: 8px;
      border: 1px solid #bdc3c7;
      border-radius: 4px;
      margin-right: 10px;
    }
  
    button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
  
    button:hover {
      background-color: #2980b9;
    }
  
    .goal-list {
      list-style-type: none;
      padding: 0;
    }
  
    .goal-list li {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      background-color: white;
      padding: 10px;
      border-radius: 4px;
      transition: background-color 0.3s ease;
    }
  
    .goal-list li.completed {
      background-color: #e8f8f5;
      text-decoration: line-through;
      color: #7f8c8d;
    }
  
    .goal-list li input[type="checkbox"] {
      margin-right: 10px;
    }
  
    .remove-btn {
      margin-left: auto;
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s ease;
    }
  
    .remove-btn:hover {
      background-color: #c0392b;
    }
  
    .progress-bar {
      height: 20px;
      background-color: #ecf0f1;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 20px;
    }
  
    .progress {
      height: 100%;
      background-color: #2ecc71;
      transition: width 0.3s ease;
    }
  
    .progress-text {
      text-align: center;
      color: #34495e;
      margin-top: 10px;
    }
  </style>