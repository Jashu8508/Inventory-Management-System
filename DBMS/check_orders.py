import db
print(db.execute_query("SELECT * FROM orders WHERE product='PRD-102'", fetch=True))
print(db.execute_query("SELECT * FROM invoices", fetch=True))
