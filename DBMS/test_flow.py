import requests
import time

base_url = 'http://localhost:5000'

# 1. Update product quantity to be above limit
print("Setting quantity to 500, limit to 25")
data = {"product_id": "PRD-103", "name": "Basmati Rice", "category": "Grains", "unit": "kg", "purchase_price": 90.00, "selling_price": 135.00, "quantity": 500, "min_limit": 25, "icon": "🍚", "description": "Long-grain, aromatic basmati rice...", "supplier_id": "S003"}
r = requests.post(f"{base_url}/api/products", json=data)
print("Update response:", r.json())

# 2. Delete any existing pending orders for this product to reset state
import db
db.execute_query("DELETE FROM orders WHERE product='PRD-103' AND status='Pending'")
db.execute_query("DELETE FROM invoices WHERE order_id NOT IN (SELECT order_id FROM orders)")

# 3. Call /api/data to clear any pending state
requests.get(f"{base_url}/api/data")

# 4. Now simulate user changing limit to 600 (quantity is 500)
print("\nUser changes limit to 600 (quantity is 500)")
data["min_limit"] = 600
r = requests.post(f"{base_url}/api/products", json=data)
print("Update response:", r.json())

# 5. Call /api/data which should trigger auto-reorder
print("\nCalling /api/data to trigger reorder")
r = requests.get(f"{base_url}/api/data")
resp = r.json()
print("Auto-reorder summary:", resp.get("auto_reorder_summary"))

# 6. Check if order and invoice were created
orders = [o for o in resp["orders"] if o["product"] == "PRD-103" and o["status"] == "Pending"]
print("\nNew Orders for PRD-103:", orders)

if orders:
    order_id = orders[0]["order_id"]
    invoices = [i for i in resp["invoices"] if i["order_id"] == order_id]
    print("New Invoices for the order:", invoices)
