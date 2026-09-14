import db

updates = {
    'Rice': '🍚',
    'Apple': '🍎',
    'Milk': '🥛',
    'Egg': '🥚',
    'Bread': '🍞',
    'Chicken': '🍗',
    'Meat': '🥩',
    'Tomato': '🍅',
    'Potato': '🥔',
    'Carrot': '🥕',
    'Onion': '🧅',
    'Cheese': '🧀',
    'Butter': '🧈',
    'Ice': '🍦',
    'Juice': '🥤'
}

for name, icon in updates.items():
    db.execute_query("UPDATE products SET icon = %s WHERE name LIKE %s", (icon, f"%{name}%"))

print("Successfully updated emojis for matched products.")
