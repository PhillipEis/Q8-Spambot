function getRandomEmail() {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${randomString}@johndoe.dk`;
}

let skipCount = 0;

const commonHeaders = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "en-DK,en;q=0.9",
  "content-type": "application/json;charset=UTF-8",
  "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": "\"Windows\"",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin"
};

const referrer = "https://game.scratcher.io/sommerspil?utm_campaign=Newsletter_July_2024&utm_content=email&utm_medium=email&utm_source=apsis&pc_pid=";
const referrerPolicy = "strict-origin-when-cross-origin";

async function getToken() {
  try {
    const response = await fetch("https://game.scratcher.io/sommerspil/visit", {
      headers: commonHeaders,
      referrer,
      referrerPolicy,
      body: JSON.stringify({ s_source: null }),
      method: "POST",
      mode: "cors",
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const token = data.token;
    await registerUser(token);
  } catch (error) {
    console.error('Error fetching token:', error);
  }
}

async function registerUser(token) {
  try {
    const email = getRandomEmail();
    const response = await fetch("https://game.scratcher.io/sommerspil/register", {
      headers: commonHeaders,
      referrer,
      referrerPolicy,
      body: JSON.stringify({
        token,
        full_name: "John Doe",
        email,
        cb_konkurrencebetingelser: "1",
        __qp_: {
          utm_campaign: "Newsletter_July_2024",
          utm_content: "email",
          utm_medium: "email",
          utm_source: "apsis",
          pc_pid: ""
        },
        s_source: null
      }),
      method: "POST",
      mode: "cors",
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const iconUrls = [
      "https://cdn.scratcher.io/images/251530/3704576c-c0b1-4425-9a42-95152c306234_128x128-1.png",
      "https://cdn.scratcher.io/images/251532/40497c1c-aa1e-41f9-9828-39c4cbefb1e5_128x128-1.png",
      "https://cdn.scratcher.io/images/251529/0e593d8f-ab09-4b8f-8320-bb31421603b6_128x128-1.png",
      "https://cdn.scratcher.io/images/251519/4800aa80-d970-43c8-8fcd-1818a8aab76a_128x128-1.png"
    ];

    let found = iconUrls.some(iconUrl => data.game.icons.filter(icon => icon === iconUrl).length >= 3);

    if (found) {
      skipCount++;
      displayWinnings();
      await getToken();
      return;
    }

    await finishGame(token);
  } catch (error) {
    console.error('Error registering user:', error);
  }
}

async function finishGame(token) {
  try {
    const response = await fetch("https://game.scratcher.io/sommerspil/finish", {
      headers: {
        ...commonHeaders,
        "x-scratcher-login": "d4f17673-eda8-45f4-996d-dd8fb65181f4"
      },
      referrer,
      referrerPolicy,
      body: JSON.stringify({
        data: {
          playing_time: 11236
        },
        token,
        s_source: null
      }),
      method: "POST",
      mode: "cors",
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    updateWinnings(data);
  } catch (error) {
    console.error('Error finishing game:', error);
  }
}

const winnings = {};
let totalAttempts = 0;
let totalWins = 0;

function updateWinnings(data) {
  totalAttempts++;
  if (data.winner) {
    totalWins++;
    const prizeName = data.prize_name;
    if (!winnings[prizeName]) {
      winnings[prizeName] = 0;
    }
    winnings[prizeName]++;
  }
}

function displayWinnings() {
  console.clear();
  console.log('Winnings so far:');
  for (const prize in winnings) {
    console.log(`${prize}: ${winnings[prize]} times`);
  }
  const winRate = (totalWins / totalAttempts) * 100;
  console.log(`Total Attempts: ${totalAttempts}`);
  console.log(`Total Wins: ${totalWins}`);
  console.log(`Win Rate: ${winRate.toFixed(2)}%`);
  console.log(`Total Skips: ${skipCount}`);
}

async function loopRequests() {
  while (true) {
    getToken();
    await new Promise(resolve => setTimeout(resolve, 250));
    displayWinnings();
  }
}

loopRequests();