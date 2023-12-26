var socket = io.connect('http://' + document.domain + ':' + location.port);

var user = getCookie('user');
console.log('Value of "user" cookie:', user);
socket.emit("confirmalive", user);

// Function to join a room (similar to previous example)
function joinRoom(roomId, username) {
    socket.emit('join_room', { room_id: roomId, username: username });
}

function getCookie(cookieName) {
    // Split the document.cookie string into individual cookies
    var cookies = document.cookie.split(';');

    // Loop through the cookies to find the desired cookie
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim(); // Remove leading/trailing spaces

        // Check if this cookie is the one we're looking for
        if (cookie.startsWith(cookieName + '=')) {
            // Extract and return the value of the cookie
            return cookie.substring(cookieName.length + 1); // Add 1 to skip '=' character
        }
    }

    // Return null if the cookie is not found
    return null;
}

// Socket event for updating room_players (similar to previous example)
socket.on('update_room_players', function(data) {
    // Update room_players in the UI
    var playerList = document.getElementById('player-list');
    playerList.innerHTML = '';
    data.players.forEach(function(player) {
        var li = document.createElement('li');
        li.textContent = player;
        playerList.appendChild(li);
    });
});

socket.on("client_disconnect", function() {
    // Usage example:
    var user = getCookie('user');
    console.log('Value of "user" cookie:', user);
    socket.emit("confirmalive", user);
});

// get room id function
function getRoomId() {
    // Get the current URL
    var currentURL = window.location.href;
    // Extract the room ID from the URL
    var roomID = currentURL.substring(currentURL.lastIndexOf('/') + 1);
    return roomID
}

// Function to send a chat message
function sendMessage() {
    var message = document.getElementById('chat-input').value;
    var username = getCookie('user'); // Retrieve username from the cookie
    roomID = getRoomId()
    socket.emit('chat_message', { message: message, username: username, room: roomID});
    document.getElementById('chat-input').value = ''; // Clear input after sending
}

// Function to get a specific cookie by name
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Handle received chat messages
socket.on('chat_message', function(data) {
    roomID = getRoomId()
    console.log(roomID)
    console.log(data.room)
    if (data.room == roomID) {
        var chatContainer = document.getElementById('chat-container');
        var messageElement = document.createElement('p');
        
        messageElement.classList.add('chat-message');
        messageElement.textContent = data.username + ': ' + data.message;
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to the bottom

    } else {
        console.log(data)
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