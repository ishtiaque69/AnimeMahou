let timer;
let timeLeft = 600; // 10 minutes in seconds

const GITHUB_TOKEN = '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'; // Replace with your GitHub token
const REPO_OWNER = 'ishtiaque69';
const REPO_NAME = 'AnimeMahou.github.io';
const FILE_PATH = 'data.json'; // Assuming the file is in the root directory of the repo

// Function to fetch leaderboard data from GitHub
async function fetchLeaderboard() {
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const content = atob(data.content); // Decode base64 content
        return JSON.parse(content).leaderboard || []; // Assuming leaderboard is stored under 'leaderboard' key
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        return []; // Return empty array if there's an error
    }
}

// Function to update leaderboard data on GitHub
async function updateLeaderboard(newEntry) {
    try {
        const leaderboard = await fetchLeaderboard();
        leaderboard.push(newEntry);

        // Fetch the SHA of the current file
        const fileResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });

        if (!fileResponse.ok) {
            throw new Error('Network response was not ok');
        }

        const fileData = await fileResponse.json();
        const updatedContent = btoa(JSON.stringify({ leaderboard })); // Encode content to base64

        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Update leaderboard',
                content: updatedContent,
                sha: fileData.sha // Provide the blob SHA to update the file
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        console.log('Leaderboard updated successfully');
    } catch (error) {
        console.error('Error updating leaderboard data:', error);
    }
}

// Start timer function
function startTimer() {
    const timerElement = document.getElementById('timer');
    timer = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timer);
            submitQuiz(); // Automatically submit quiz when time runs out
        } else {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }, 1000);
}

// Start quiz function
function startQuiz() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;

    if (!name || !phone || !email) {
        alert('Please enter your name, phone number, and email.');
        return;
    }

    const newEntry = { name, phone, email, points: 0, time: 0 }; // Initialize with basic data

    // Call updateLeaderboard to add new entry
    updateLeaderboard(newEntry);

    // Store individual items in local storage (optional, if needed)
    localStorage.setItem('userName', name);
    localStorage.setItem('userPhone', phone);
    localStorage.setItem('userEmail', email);

    // Redirect to quiz page
    window.location.href = 'quiz.html';
}

// Submit quiz function
async function submitQuiz() {
    clearInterval(timer); // Stop the timer

    const form = document.getElementById('quizForm');
    const formData = new FormData(form);
    let score = 0;

    for (let [key, value] of formData.entries()) {
        if (value === 'correct') {
            score += 1;
        } else if (value === 'wrong') {
            score -= 0.25;
        }
    }

    const timeTaken = 600 - timeLeft;
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    const newEntry = { name: userName, email: userEmail, points: score, time: timeTaken };

    // Update leaderboard
    await updateLeaderboard(newEntry);

    // Redirect to results page
    window.location.href = 'results.html';
}

// Load results function
async function loadResults() {
    const leaderboard = await fetchLeaderboard();
    const leaderboardTable = document.getElementById('leaderboard').querySelector('tbody');
    const userResultTable = document.getElementById('userResult').querySelector('tbody');
    const userName = localStorage.getItem('userName');
    let userRank, userEntry;

    // Clear existing rows
    leaderboardTable.innerHTML = '';
    userResultTable.innerHTML = '';

    // Sort leaderboard by points (descending) and time (ascending)
    leaderboard.sort((a, b) => b.points - a.points || a.time - b.time);

    // Populate the entire leaderboard
    leaderboard.forEach((entry, index) => {
        const row = document.createElement('tr');
        const minutes = Math.floor(entry.time / 60);
        const seconds = entry.time % 60;
        const timeFinal = `${minutes} min ${seconds < 10 ? '0' : ''}${seconds} sec`;

        row.innerHTML = `<td>${index + 1}</td><td>${entry.name}</td><td>${entry.points}</td><td>${timeFinal}</td><td>${entry.email}</td>`;

        if (index < 3) {
            row.classList.add('top3');
        }

        leaderboardTable.appendChild(row);

        if (entry.name === userName) {
            userRank = index + 1;
            userEntry = entry;
        }
    });

    // Populate user result table
    if (userEntry) {
        const minutes = Math.floor(userEntry.time / 60);
        const seconds = userEntry.time % 60;
        const timeFinal = `${minutes} min ${seconds < 10 ? '0' : ''}${seconds} sec`;
        const row = document.createElement('tr');

        row.innerHTML = `<td>${userRank}</td><td>${userEntry.name}</td><td>${userEntry.points}</td><td>${timeFinal}</td><td>${userEntry.email}</td>`;
        userResultTable.appendChild(row);
    }

    document.getElementById('thankYouMessage').textContent = `Thank you, ${userName}, for participating!`;
}

// Detect page and run appropriate functions
if (window.location.pathname.endsWith('quiz.html')) {
    startTimer();
} else if (window.location.pathname.endsWith('results.html')) {
    loadResults();
}

// Ensure landscape mode on mobile devices
window.addEventListener('orientationchange', () => {
    if (window.orientation !== 90 && window.orientation !== -90) {
        alert('Please rotate your device to landscape mode for the best experience.');
    }
});

if (window.orientation !== 90 && window.orientation !== -90) {
    alert('Please rotate your device to landscape mode for the best experience.');
}
