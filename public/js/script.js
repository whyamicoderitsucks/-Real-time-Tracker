const socket = io();

// Elements
const connectBtn = document.getElementById("connectBtn");
const mapDiv = document.getElementById("map");
const connectmodal = document.getElementById("connectModal");
const saveProfileBtn = document.getElementById("saveProfile");
const usernameInput = document.getElementById("username");
const markerColorInput = document.getElementById("markerColor");
const activeUsersDiv = document.getElementById("activeUsers");

//Elements of Login 
const loginNav = document.getElementById("loginNav");
const profileIcon = document.getElementById("profileIcon");
const profileModal = document.getElementById("profileModal");
const profileName = document.getElementById("profileName");
const profileDevice = document.getElementById("profileDevice");
const disconnectBtn = document.getElementById("disconnectBtn");
const saveDeviceBtn = document.getElementById("saveDeviceBtn");

// Global vars
let map, marker, count = 0;
let userProfile = { name: "Anonymous",device: "Unknown Device", color: "#4f8cff" };


window.addEventListener("load", async () => {
  try {
    const res = await fetch("/session");
    const data = await res.json();

    if (data.connected) {
      userProfile = data.userProfile;
      showProfileNav();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(({ coords }) => {
          mapDiv.classList.remove("hidden");
          initMap(coords.latitude, coords.longitude, userProfile.username, userProfile.markerColor);
          connectBtn.textContent = `${userProfile.username} (Connected)`;
          connectBtn.disabled = true;
        });
      }
    }
  } catch (err) {
    console.error("Session check failed", err);
  }
});


//open the pop up after clicking on 
connectBtn.addEventListener("click", () => {
  connectmodal.classList.remove("hideDiv"); // show modal
});

// STEP 2: On save, send data + show map
saveProfileBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const devicename = document.getElementById("devicename").value.trim();
  const markerColor = document.getElementById("markerColor").value;
  if (!username) {
    alert("Please enter your name");
    return;
  }

  // update global object
  userProfile = {
    name: username,
    device: devicename,
    color: markerColor
  };
  
  // Increment and display active users count
  activeUsersDiv.textContent = ++count; 
  // Show profile in nav
    showProfileNav();

  // Hide modal
    connectmodal.classList.add("hideDiv");

  // Now get location and show map
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        mapDiv.classList.remove("hidden");
        initMap(latitude, longitude, username, markerColor); // pass user info
        connectBtn.textContent = `${username} (Connected)`;
        connectBtn.disabled = true;
      },
      (err) => {
        alert("Location permission denied. Please enable location to continue.");
        console.error(err);
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }

});

// Initialize Leaflet map
function initMap(lat, lng) {
   const name = usernameInput.value.trim();
  const color = markerColorInput.value;
  map = L.map("map").setView([lat, lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  marker = L.marker([lat, lng]).addTo(map)
    .bindPopup(`${name} (You)`)
    .openPopup();
}

// After successful connection show profile in nav
function showProfileNav() {
  // Hide "Login"
  loginNav.style.display = "none";
  profileIcon.style.display = "inline"; // not flex
  profileName.textContent += userProfile.name;
  profileDevice.textContent  += userProfile.device;
}


// Disconnect
disconnectBtn.addEventListener("click", async () => {
  await fetch("/disconnect", { method: "POST" });

  // Reset frontend state
  userProfile = {};
  mapDiv.classList.add("hidden");  // hide the map
  if (map) {
    map.remove(); // remove Leaflet map instance
    map = null;
  }

  // Decrement and display active users count
  activeUsersDiv.textContent = --count; 

  profileModal.classList.add("hideDiv");
  profileIcon.style.display = "none";
  loginNav.style.display = "inline";
  connectBtn.textContent = "Connect your device";
  profileName.textContent = "";
  profileDevice.textContent = "";
  connectBtn.disabled = false;
});



//Login popup open when clicked on login
profileIcon.addEventListener("click", () => {
  profileModal.classList.remove("hideDiv");
});

// Close modals when clicking outside content
window.addEventListener("click", (e) => {
  if (e.target === connectmodal) {
    connectmodal.classList.add("hideDiv");
  }
  if (e.target === profileModal) {
    profileModal.classList.add("hideDiv");
  }
});


// STEP 2: On save, send data + show map
saveDeviceBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const devicename = document.getElementById("devicename").value.trim();
  const markerColor = document.getElementById("markerColor").value;

  if (!username) {
    alert("Please enter your name");
    return;
  }

  // Send to backend
  try {
    await fetch("/saveDevice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, devicename, markerColor }),
    });

    // ✅ move this *inside* after success
    saveDeviceBtn.textContent = "Saved ✅";
  } catch (err) {
    console.error("Error sending to backend:", err);
  }
});
