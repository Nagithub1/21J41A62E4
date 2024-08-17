const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 9876;
const windowSize = 10;
let numbers = [];

// Function to fetch numbers from the third-party API based on ID
async function fetchNumber(id) {
  let url = '';
  switch (id) {
    case 'p':
      url = 'https://api.prime-numbers.io/prime'; // URL for prime numbers
      break;
    case 'f':
      url = 'https://fibonacci-api.com/sequence/5'; // URL for Fibonacci numbers
      break;
    case 'e':
      url = 'https://www.random.org/integers/?num=5&min=1&max=10000&col=1&base=10&format=plain&rnd=new'; // URL for even numbers
      break;
    case 'r':
      url = 'https://www.random.org/integers/?num=5&min=1&max=10000&col=1&base=10&format=plain'; // URL for random numbers
      break;
    default:
      console.error('Invalid ID provided:', id);
      return [];
  }

  try {
    const response = await axios.get(url, { timeout: 1000 }); // Fetch data with a 1000ms timeout

    // Parse response based on ID
    if (id === 'e' || id === 'r') {
      return response.data.split('\n').map(Number).filter(n => !isNaN(n));
    }

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Error fetching number from ${url}:`, error.response ? error.response.data : error.message);
    return [];
  }
}

// Function to calculate the average of an array
function calculateAverage(arr) {
  if (arr.length === 0) return '0.00';
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return (sum / arr.length).toFixed(2); // Return average rounded to two decimal places
}

// Route to handle GET requests and process numbers
app.get('/numbers/:id', async (req, res) => {
  const { id } = req.params;

  // Validate the ID parameter
  if (!['p', 'f', 'e', 'r'].includes(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  // Fetch numbers from the third-party API
  const fetchedNumbers = await fetchNumber(id);

  // Save the previous state of numbers
  const prevState = [...numbers];

  // Update the numbers array with new unique numbers
  for (let num of fetchedNumbers) {
    if (!numbers.includes(num)) {
      if (numbers.length >= windowSize) {
        numbers.shift(); // Remove the oldest number if the window size is exceeded
      }
      numbers.push(num); // Add the new unique number to the array
    }
  }

  // Calculate the average of the current numbers
  const avg = calculateAverage(numbers);

  // Send response with previous state, current state, fetched numbers, and average
  res.json({
    windowPrevState: prevState,
    windowCurrState: numbers,
    numbers: fetchedNumbers,
    avg: avg
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle uncaught exceptions to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
