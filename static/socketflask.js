var socket = io.connect("http://" + location.hostname + ":" + location.port);

var user = getCookie("user");
socket.emit("confirmalive", user);

function getCookie(cookieName) {
    // Split the document.cookie string into individual cookies
    var cookies = document.cookie.split(";");

    // Loop through the cookies to find the desired cookie
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim(); // Remove leading/trailing spaces

        // Check if this cookie is the one we're looking for
        if (cookie.startsWith(cookieName + "=")) {
            // Extract and return the value of the cookie
            return cookie.substring(cookieName.length + 1); // Add 1 to skip '=' character
        }
    }

    // Return null if the cookie is not found
    return null;
}

// Socket event for updating room_players (similar to previous example)
socket.on("update_room_players", function (data) {
    var updatedPlayers = data.players;
    // Clear the current user list in the UI (example: assuming an element with id 'user-list')
    var userList = document.getElementById("player-list");
    userList.innerHTML = "";

    // Update the user list in the UI with the updated players
    updatedPlayers.forEach(function (player) {
        var listItem = document.createElement("li");
        listItem.textContent = player;
        userList.appendChild(listItem);
    });
});

socket.on("deadclientremoved", function (jsonDatastr) {
    var currentRoomId = getRoomId(); // Replace 'currentRoomId' with the actual room ID of the client
    jsonData = JSON.parse(jsonDatastr)
    console.log(currentRoomId)
    console.log(jsonData)

    // Iterate through the received rooms information to find the client's room
    for (var roomId in jsonData) {
        console.log(roomId)
        if (roomId === currentRoomId) {
            var updatedPlayers = jsonData[roomId]["room_players"];
            console.log(updatedPlayers)

            // Clear and update the user list in the UI (example: assuming an element with id 'player-list')
            var userList = document.getElementById("player-list");
            userList.innerHTML = "";

            updatedPlayers.forEach(function (player) {
                var listItem = document.createElement("li");
                listItem.textContent = player;
                userList.appendChild(listItem);
            });

            // Exit the loop once the client's room is found and updated
            break;
        }
    }
});

socket.on("client_disconnect", function () {
    // Usage example:
    var user = getCookie("user");
    socket.emit("confirmalive", user);
});

// get room id function
function getRoomId() {
    // Get the current URL
    var currentURL = window.location.href;
    // Extract the room ID from the URL
    var roomID = currentURL.substring(currentURL.lastIndexOf("/") + 1);

    if (roomID == "lobby" || roomID == "play" || roomID == location.hostname) {
        return "0xDB"; // this placeholder physically cannot be a room ID
    } else {
        return roomID;
    }
}

// Function to send a chat message
function sendMessage() {
    var message = document.getElementById("chat-input").value;
    var username = getCookie("user"); // Retrieve username from the cookie
    roomID = getRoomId();
    socket.emit("chat_message", {
        message: message,
        username: username,
        room: roomID,
    });
    document.getElementById("chat-input").value = ""; // Clear input after sending
}

// Function to get a specific cookie by name
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }
    return cookieValue;
}

// Handle received chat messages
socket.on("chat_message", function (data) {
    roomID = getRoomId();
    if (data.room == roomID) {
        var chatContainer = document.getElementById("chat-container");
        var messageElement = document.createElement("p");

        messageElement.classList.add("chat-message");
        messageElement.textContent = data.username + ": " + data.message;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom
    }
});

// Example function for starting the game (placeholder)
function startGame() {
    // Logic to start the game (not implemented)
}

// Example: Call joinRoom function when the page loads or based on user interaction
// var roomToJoin = '{{ room.id }}'; // Pass the room ID dynamically from Flask
// var currentUsername = getCookie('user'); // Replace this with the current user's username
// joinRoom(roomToJoin, currentUsername);
