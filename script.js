const URL = "https://the-trivia-api.com/v2/questions";

const current_question = document.querySelector("#question");
const next_btn = document.querySelector(".next_btn");
const current_options = document.querySelectorAll(".box");
const score_card = document.querySelector("#score_board");
const Loader = document.querySelector(".notLoading");

// Modal elements
const modal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const submitUsernameButton = document.getElementById("submitUsername");
const closeBtn = document.querySelector(".close");
const leaderboardList = document.getElementById("leaderboard-list");

let questions = [];
let count = 0;
let score = 0;
let username = "";
let timer;

// Show modal for username input
function showModal() {
    modal.style.display = "block";
}

function hideModal() {
    modal.style.display = "none";
}

// Close modal on clicking 'x'
closeBtn.onclick = function() {
    hideModal();
};

// Close modal if clicking outside modal content
window.onclick = function(event) {
    if (event.target === modal) {
        hideModal();
    }
};

// Submit username and start game
submitUsernameButton.addEventListener("click", function() {
    username = usernameInput.value.trim();
    if (username) {
        hideModal();
        startGame();
    } else {
        alert("Please enter a username.");
    }
});

function reset_timer_animation() {
    Loader.classList.remove("Loading");
    void Loader.offsetWidth;
    Loader.classList.add("Loading");
}

next_btn.addEventListener("click", () => {
    if (count < questions.length) {
        current_options.forEach(opt => {
            opt.style.pointerEvents = "auto";
            opt.id = "";
        });
        clearInterval(timer);
        reset_timer_animation();
        timer = setInterval(timeup, 10000);
    } else {
        current_question.innerText = `No More Questions (Refresh)`;
        current_options.forEach(option => {
            option.innerText = "";
            option.style.pointerEvents = "none";
            option.id = "";
        });
        next_btn.style.pointerEvents = "none";
        Loader.classList.remove("Loading");
        storeScore();
    }
});

const get_data = async () => {
    const response = await fetch(URL);
    questions = await response.json();
};

const display_question = async () => {
    await get_data();
    console.log(questions);

    next_btn.addEventListener("click", () => {
        if (count < questions.length) {
            current_question.innerText = `Q${count + 1}. ${questions[count].question.text}`;
            display_options();
            count++;
        } else {
            console.log("No More Questions");
        }
    });
};

function shuffle_options(array) {
    for (let i = array.length; i > 0; i--) {
        const random_index = Math.floor(Math.random() * i);
        const temp = array[random_index];
        array[random_index] = array[i - 1];
        array[i - 1] = temp;
    }
}

const display_options = () => {
    let options = [];
    options.push(...questions[count].incorrectAnswers);
    options.push(questions[count].correctAnswer);

    shuffle_options(options);

    for (let i = 0; i < 4; i++) {
        current_options[i].innerText = options[i];
    }
};

function timeup() {
    reset_timer_animation();
    if (count < questions.length) {
        current_options.forEach(opt => {
            opt.style.pointerEvents = "auto";
            opt.id = "";
        });
        current_question.innerText = `Q${count + 1}. ${questions[count].question.text}`;
        display_options();
        count++;
        reset_timer_animation();
    } else {
        current_question.innerText = `No More Questions (Refresh)`;
        current_options.forEach(option => {
            option.innerText = "";
            option.style.pointerEvents = "none";
            option.id = "";
        });
        next_btn.style.pointerEvents = "none";
        Loader.classList.remove("Loading");
        storeScore();
    }
}

function result(res, ans) {
    if (res === "correct") {
        ans.id = "correct";
        score++;
        score_card.innerText = `Score : ${score}`;
    } else {
        ans.id = "incorrect";
        score--;
        score_card.innerText = `Score : ${score}`;
    }
}

current_options.forEach(option => {
    option.addEventListener("click", () => {
        const isCorrect = option.innerText === questions[count - 1].correctAnswer;
        result(isCorrect ? "correct" : "incorrect", option);

        // Disable further clicks after one selection
        current_options.forEach(opt => opt.style.pointerEvents = "none");
    });
});

// Store score in backend MongoDB
const storeScore = async () => {
    const data = {
        username,
        score
    };

    try {
        const response = await fetch('https://trivia-4bb4.onrender.com/api/scores', { // Adjust if backend URL differs
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('Score stored successfully');
            fetchLeaderboard();
        } else {
            console.error('Failed to store score');
        }
    } catch (error) {
        console.error('Error storing score:', error);
    }
};

// Fetch leaderboard from backend
const fetchLeaderboard = async () => {
    try {
        const response = await fetch('https://trivia-4bb4.onrender.com/api/leaderboard');

        const leaderboardData = await response.json();

        leaderboardData.sort((a, b) => b.score - a.score);

        leaderboardList.innerHTML = '';

        leaderboardData.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${entry.username}: ${entry.score}`;
            leaderboardList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        leaderboardList.innerHTML = '<li>Error fetching leaderboard</li>';
    }
};

function startGame() {
    display_question();
    timer = setInterval(timeup, 10000);
    fetchLeaderboard();
}

// Show username modal on page load
window.onload = function() {
    showModal();
};
