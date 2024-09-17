<svelte:head>
  <title>Kokoro | Nurture Your Heart, Mind & Spirit</title>
</svelte:head>

<script>
  import Header from './components/Header.svelte';
  import MoodTracker from './components/MoodTracker.svelte';
  import GratitudeJournal from './components/GratitudeJournal.svelte';
  import SelfCareGoals from './components/SelfCareGoals.svelte';
  import DailySummary from './components/DailySummary.svelte';
  import { user } from './stores/userStore.js';
</script>

<main>
  <Header />
  <div class="content">
    <MoodTracker />
    <GratitudeJournal />
    <SelfCareGoals />
    <DailySummary />
  </div>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #FFFAFA; /* Snow color for the main background */
  }

  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
</style>