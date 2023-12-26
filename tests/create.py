import json

with open("cards.json", "r") as cardsraw:
    cardsr = json.loads(cardsraw.read())

idict = {}
for idx, item in enumerate(cardsr):
    print(f"{idx}: {item['name']}")
    idict[str(idx)] = item["name"]

with open("indexes.json", "w") as f:
    f.write(str(idict))