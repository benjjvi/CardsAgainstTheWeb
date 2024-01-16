import json
from flask import Flask, render_template, request, make_response, redirect, url_for
from flask_socketio import SocketIO, emit
import random
import secrets
import string
import threading
import time

# 1. load cards and indexes
with open("cards.json", "r") as cardsraw:
    cards = json.loads(cardsraw.read())

with open("indexes.json", "r") as indexesraw:
    indexes = json.loads(indexesraw.read())
    print(indexes)

# 2. load flask application
app = Flask(__name__)
app.config["SECRET_KEY"] = secrets.token_hex(16)
socketio = SocketIO(app, manage_session=True)

# 3. room and user dictionary setup
rooms = {}
allusers = []
confirmed = []
dead = []
threadRunning = False


def removeDeadPlayers(allusers, deadusers):
    for room in rooms:
        for player in rooms[room]["room_players"]:
            if player in deadusers:
                rooms[room]["room_players"].remove(player)

    allusers = list(set(allusers) - set(deadusers))

    return allusers

def check_users_presence():
    global confirmed, threadRunning, allusers, dead
    threadRunning = True
    time.sleep(2.5)  # Wait for 2 seconds to collect responses
    not_confirmed = list(set(allusers) - set(confirmed))

    print("Users who haven't confirmed:", not_confirmed)

    threadRunning = False
    confirmed = []

    allusers = removeDeadPlayers(allusers, not_confirmed)

    dead = not_confirmed
    return not_confirmed

# 4. set up routes
@socketio.on("connect")
def handle_connect():
    print(f"Client {request.sid} connected")


@socketio.on("disconnect")
def handle_disconnect():
    print(f"Client {request.sid} disconnected")
    if not threadRunning:
        emit("client_disconnect", "a", broadcast=True)
        t = threading.Thread(target=check_users_presence)
        t.start()
        t.join()
        if len(dead) != 0:
            emit("deadclientremoved", json.dumps(rooms), broadcast=True)
            dead = []
    else:
        print("Tried to check thread, but thread already alive.")

@socketio.on("confirmalive")
def confirmalive(username):
    print(f"User {username} confirmed alive.")
    confirmed.append(username)
    if username not in allusers:
        allusers.append(username)


@socketio.on("message_from_client")
def handle_message(message):
    print("Received message:", message)
    # Broadcast the received message to all clients
    emit("message_from_server", message, broadcast=True)


@socketio.on("join_room")
def handle_join_room(data):
    room_id = data["room_id"]
    username = data["username"]

    # Add the user to the room (for demonstration purposes)
    if room_id in rooms:
        print(rooms[room_id])
        #rooms[room_id]["room_players"].append(username)
        emit(
            "update_room_players",
            {"room_id": room_id, "players": rooms[room_id]["room_players"]},
            broadcast=True,
        )


@socketio.on("create_room")
def handle_create_room(data):
    room_name = data["room_name"]
    username = data["username"]  # Get the username from the client
    # Generate a unique room ID (for example purposes, you may use a different method)
    random_chars = "".join(random.choices(string.ascii_letters, k=2))

    # Generate two random digits
    random_digits = "".join(random.choices(string.digits, k=2))

    # Combine the characters and digits following the pattern 'x0x0'
    new_room_id = (
        f"{random_chars[0]}{random_digits[0]}{random_chars[1]}{random_digits[1]}"
    )
    new_room = {
        "roomname": room_name,
        "room_players": [username],
        "max": 8,
        "setsactive": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    }
    rooms[new_room_id] = new_room
    emit(
        "room_created",
        {"room_id": new_room_id, "room_name": room_name, "host": username},
        broadcast=True,
    )


@socketio.on("chat_message")  # Add this event listener for chat messages
def handle_chat_message(data):
    print(rooms)
    # Process the message or broadcast it to others in the room
    # For example:
    emit(
        "chat_message",
        {
            "message": data["message"],
            "username": data["username"],
            "room": data["room"],
        },
        broadcast=True,
    )


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        text = request.form.get("textbox")
        # Create a response object
        response = make_response(redirect("/lobby"))  # Redirect to the '/play' route
        # Set the cookie using set_cookie method before redirection
        response.set_cookie(
            "user", text, max_age=21600
        )  # 'my_cookie' is the name, 'cookie_value' is the value

        allusers.append(text)

        return response
    else:
        username = request.cookies.get('user')
        if username is None:
            return render_template("index.html")
        else:
            return redirect("/lobby")


@app.route("/lobby")
def lobby():
    return render_template("lobby.html", rooms=rooms)


@app.route("/play/<room_id>")
def play(room_id):
    # Retrieve room details for the selected room_id
    room = rooms.get(room_id)

    username = request.cookies.get('user')
    print(room)

    if username not in room["room_players"]:
        room["room_players"].append(username)

    print(room)
    if room:
        return render_template("play.html", room=room)
    else:
        return "Room not found", 404


# test routes
"""@app.route("/black")
def blacktest():
    c = random.randint(0,len(indexes)-1)
    print(f"Using pack index {c} for black card.")
    while len(cards[c]["black"]) == 0:
        print(f"Pack index {c} has 0 black cards.")
        c = random.randint(0,len(indexes)-1)
        print(f"Using pack index {c} for black card.")

    brc = random.randint(0, len(cards[c]["black"])-1)
    black = cards[c]["black"][brc]
    return render_template('black_card.html', content=black["text"], deck=indexes[str(c)])


@app.route("/white")
def whitetest():
    return render_template('white_card.html', content='This is a white card', deck='White Deck')

@app.route("/test")
def test():
    c = random.randint(0,len(indexes)-1)
    print(f"Using pack index {c} for black card.")
    while len(cards[c]["black"]) == 0:
        print(f"Pack index {c} has 0 black cards.")
        c = random.randint(0,len(indexes)-1)
        print(f"Using pack index {c} for black card.")

    brc = random.randint(0, len(cards[c]["black"])-1)
    black = cards[c]["black"][brc]

    whites = []
    for i in range(0,7):
        c = random.randint(0,len(indexes)-1)
        print(f"Using pack index {c} for white card {i}.")
        while len(cards[c]["white"]) == 0:
            print(f"Pack index {c} has 0 white cards.")
            c = random.randint(0,len(indexes)-1)
            print(f"Using pack index {c} for white card {i}.")

        whites.append(cards[c]["white"][random.randint(0, len(cards[c]["white"])-1)])

    return render_template("test.html", whites=whites, brc=brc, black=black)
"""  # broken test. move tests folder contents to templates folder.


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=80)
