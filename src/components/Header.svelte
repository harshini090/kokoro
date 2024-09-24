<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/userStore.js';

  let daysSinceStart = 0;

  onMount(() => {
      user.incrementDaysActive();
  });

  $: {
      if ($user && $user.startDate) {
          const startDate = new Date($user.startDate);
          const today = new Date();
          daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      }
  }
</script>

<header>
  <h1>Kokoro</h1>
  <p class="tagline">Nurture Your Heart, Mind & Spirit</p>
  <div class="user-info">
      <p>Welcome, {$user.name}</p>
      <p>Days since start: {daysSinceStart}</p>
      <p>Days active: {$user.daysActive}</p>
  </div>
</header>

<style>
  header {
      background-color: #FFF0F5;
      padding: 20px 0;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      width: 100%;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  h1 {
      color: #FF69B4;
      margin: 0 0 10px 0;
      font-size: 3em;
      font-weight: bold;
      font-family: 'Arial', sans-serif;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }

  .tagline {
      color: #20B2AA;
      font-style: italic;
      margin-bottom: 15px;
      font-size: 1.2em;
  }

  .user-info {
      display: flex;
      justify-content: space-between;
      background-color: #FFFFFF;
      padding: 10px;
      border-radius: 5px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .user-info p {
      margin: 0;
      color: #4B0082;
      font-weight: 500;
  }
</style>