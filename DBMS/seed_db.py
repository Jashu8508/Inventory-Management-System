import db

def seed():
    # Departments
    depts = [
        ("D001", "Cold Storage", "Storage", "M001"),
        ("D002", "Production Unit A", "Production", "M002"),
        ("D003", "Quality Control", "Quality Control", "M003"),
        ("D004", "Logistics Hub", "Logistics", "M004"),
        ("D005", "Dry Goods Store", "Storage", "M005"),
        ("D006", "Processing Plant", "Production", "M001")
    ]
    for d in depts:
        db.execute_query("INSERT IGNORE INTO departments VALUES (%s, %s, %s, %s)", d)

    # Managers
    mgrs = [
        ("M001", "Arjun Patel", "9845012345", "arjun.patel@freshtrack.in", "D001"),
        ("M002", "Priya Sharma", "9762034567", "priya.sharma@freshtrack.in", "D002"),
        ("M003", "Rahul Menon", "9834056789", "rahul.menon@freshtrack.in", "D003"),
        ("M004", "Sneha Gupta", "9901078901", "sneha.gupta@freshtrack.in", "D004"),
        ("M005", "Kiran Reddy", "9870090123", "kiran.reddy@freshtrack.in", "D005")
    ]
    for m in mgrs:
        db.execute_query("INSERT IGNORE INTO managers VALUES (%s, %s, %s, %s, %s)", m)

    # Suppliers
    sups = [
        ("S001", "GreenLeaf Farms", "8011234567", "Produce", "M001"),
        ("S002", "DairyPure Ltd.", "8022345678", "Dairy", "M002"),
        ("S003", "GrainMart Corp.", "8033456789", "Grains", "M002"),
        ("S004", "FreshMeat Co.", "8044567890", "Meat", "M003"),
        ("S005", "QuenchBev Industries", "8055678901", "Beverages", "M004"),
        ("S006", "FrostPack Frozen", "8066789012", "Frozen", "M005"),
        ("S007", "OrganicOasis", "8077890123", "Produce", "M001")
    ]
    for s in sups:
        db.execute_query("INSERT IGNORE INTO suppliers VALUES (%s, %s, %s, %s, %s)", s)

    # Products
    prods = [
        ("PRD-101", "Fresh Spinach", "Vegetables", "kg", "Tender, farm-fresh spinach leaves...", 45, 78, 150, "S001", "🥬"),
        ("PRD-102", "Full Cream Milk", "Dairy", "L", "Premium full cream milk...", 52, 68, 200, "S002", "🥛"),
        ("PRD-103", "Basmati Rice", "Grains", "kg", "Long-grain, aromatic basmati rice...", 90, 135, 500, "S003", "🌾"),
        ("PRD-104", "Chicken Breast", "Meat", "kg", "Skinless, boneless chicken breast...", 220, 290, 80, "S004", "🍗"),
        ("PRD-105", "Mango Juice", "Beverages", "L", "100% natural mango pulp juice...", 60, 95, 300, "S005", "🥭"),
        ("PRD-106", "Frozen Peas", "Frozen", "kg", "Flash-frozen garden peas...", 55, 42, 0, "S006", "🫛"),
        ("PRD-107", "Organic Tomatoes", "Vegetables", "kg", "Certified organic vine-ripened tomatoes...", 35, 58, 120, "S007", "🍅")
    ]
    for p in prods:
        db.execute_query("INSERT IGNORE INTO products VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", p)

    # Warehouses
    whs = [
        ("W001", "Alpha Cold Hub", "Chennai, TN"),
        ("W002", "Beta Grain Depot", "Coimbatore, TN"),
        ("W003", "Gamma Fresh Store", "Bengaluru, KA"),
        ("W004", "Delta Dry Goods", "Hyderabad, TS"),
        ("W005", "Epsilon Freeze Zone", "Pune, MH")
    ]
    for w in whs:
        db.execute_query("INSERT IGNORE INTO warehouses VALUES (%s, %s, %s)", w)

    # Stock
    stocks = [
        ("STK001", "PRD-101", "2026-05-10", "In Stock", "W001", "S001", "M001"),
        ("STK002", "PRD-102", "2026-04-20", "Expiring Soon", "W002", "S002", "M002"),
        ("STK003", "PRD-103", "2026-07-15", "In Stock", "W001", "S003", "M002"),
        ("STK004", "PRD-104", "2026-04-18", "Expiring Soon", "W003", "S004", "M003")
    ]
    for s in stocks:
        db.execute_query("INSERT IGNORE INTO stock VALUES (%s, %s, %s, %s, %s, %s, %s)", s)

    # Orders
    ords = [
        ("ORD001", "M001", "S001", "PRD-101", "2026-04-01", "Delivered"),
        ("ORD002", "M002", "S002", "PRD-102", "2026-04-03", "Delivered")
    ]
    for o in ords:
        db.execute_query("INSERT IGNORE INTO orders VALUES (%s, %s, %s, %s, %s, %s)", o)

    # Invoices
    invs = [
        ("INV-001", "ORD001", 11700.00, "2026-04-02", "Paid"),
        ("INV-002", "ORD002", 13600.00, "2026-04-04", "Pending")
    ]
    for i in invs:
        db.execute_query("INSERT IGNORE INTO invoices VALUES (%s, %s, %s, %s, %s)", i)

    # Users
    db.execute_query("INSERT IGNORE INTO users (email, password, full_name, role, is_verified) VALUES (%s, %s, %s, %s, TRUE)", 
                     ("admin@freshtrack.com", "admin123", "System Admin", "admin"))

    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()
