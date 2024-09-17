<script>
    import { user } from '../stores/userStore.js';
    let currentDate = new Date().toLocaleDateString();
  </script>
  
  <header>
    <h1>Kokoro</h1>
    <p class="tagline">Nurture Your Heart, Mind & Spirit</p>
    <div class="user-info">
      <p>Welcome, {$user.name}</p>
      <p>Today: {currentDate}</p>
      <p>Days of growth: {$user.daysActive}</p>
    </div>
  </header>
  
  <style>
    header {
      background-color: #FFF0F5; /* Light pink background */
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  
    h1 {
      color: #FF69B4; /* Hot pink for the main title */
      margin: 0 0 10px 0;
      font-size: 3em;
      font-weight: bold;
      font-family: 'Arial', sans-serif;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }
  
    .tagline {
      color: #20B2AA; /* Light sea green for the tagline */
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
      color: #4B0082; /* Indigo for user info */
      font-weight: 500;
    }
  </style>