import mysql.connector
from mysql.connector import Error
import json
import os

# --- MOCK DATA ---
MOCK_DB = {
    'departments': [
        {'dept_id': 'D01', 'dept_name': 'Storage A', 'dept_type': 'Storage', 'manager_id': 'M01'},
        {'dept_id': 'D02', 'dept_name': 'Cold Storage', 'dept_type': 'Storage', 'manager_id': 'M02'}
    ],
    'managers': [
        {'m_id': 'M01', 'm_name': 'John Doe', 'm_ph_no': '9876543210', 'm_email': 'john@freshtrack.com', 'dept_id': 'D01'},
        {'m_id': 'M02', 'm_name': 'Jane Smith', 'm_ph_no': '9123456789', 'm_email': 'jane@freshtrack.com', 'dept_id': 'D02'}
    ],
    'suppliers': [
        {'s_id': 'S01', 's_name': 'Organic Farms', 's_ph_no': '8001234567', 's_type': 'Produce', 'manager_id': 'M01'},
        {'s_id': 'S02', 's_name': 'Dairy Delights', 's_ph_no': '8007654321', 's_type': 'Dairy', 'manager_id': 'M02'}
    ],
    'products': [
        {'product_id': 'PRD-101', 'name': 'Organic Apples', 'category': 'Vegetables', 'unit': 'kg', 'description': 'Fresh organic apples', 'purchase_price': 100, 'selling_price': 150, 'quantity': 500, 'supplier_id': 'S01', 'icon': '🍎'},
        {'product_id': 'PRD-102', 'name': 'Milk 1L', 'category': 'Dairy', 'unit': 'packet', 'description': 'Whole milk', 'purchase_price': 40, 'selling_price': 60, 'quantity': 200, 'supplier_id': 'S02', 'icon': '🥛'}
    ],
    'stock': [
        {'stock_id': 'STK-001', 'product_id': 'PRD-101', 'exp_date': '2026-12-31', 'stock_status': 'In Stock', 'warehouse_id': 'W01', 'supplier_id': 'S01', 'manager_id': 'M01'},
        {'stock_id': 'STK-002', 'product_id': 'PRD-102', 'exp_date': '2026-05-15', 'stock_status': 'Expiring Soon', 'warehouse_id': 'W02', 'supplier_id': 'S02', 'manager_id': 'M02'}
    ],
    'warehouses': [
        {'w_id': 'W01', 'w_name': 'Main Warehouse', 'location': 'North Zone'},
        {'w_id': 'W02', 'w_name': 'Cold Storage A', 'location': 'South Zone'}
    ],
    'orders': [],
    'invoices': [],
    'users': [
        {'email': 'admin@freshtrack.com', 'password': 'admin', 'full_name': 'System Admin', 'is_verified': True}
    ]
}

USE_MOCK = False

def get_db_connection():
    """Connect to MySQL database."""
    global USE_MOCK
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='freshtrack'
        )
        if connection.is_connected():
            USE_MOCK = False
            return connection
    except Error as e:
        # If database doesn't exist, try connecting without database name to create it
        try:
            conn = mysql.connector.connect(
                host='localhost',
                user='root',
                password=''
            )
            cursor = conn.cursor()
            cursor.execute("CREATE DATABASE IF NOT EXISTS freshtrack")
            conn.commit()
            cursor.close()
            conn.close()
            
            # Try connecting again
            connection = mysql.connector.connect(
                host='localhost',
                user='root',
                password='',
                database='freshtrack'
            )
            USE_MOCK = False
            return connection
        except Error:
            USE_MOCK = True
            return None
    return None

def execute_query(query, params=None, fetch=False):
    """Execute a query and return results."""
    conn = get_db_connection()
    
    if USE_MOCK:
        # Very simple mock logic for GET requests (SELECT * FROM table)
        query_upper = query.upper()
        if "SELECT * FROM" in query_upper:
            table = query_upper.split("SELECT * FROM ")[1].split(" ")[0].strip().lower()
            return MOCK_DB.get(table, [])
        return []

    if not conn:
        return None
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if fetch:
            result = cursor.fetchall()
        else:
            conn.commit()
            result = cursor.lastrowid if cursor.lastrowid else cursor.rowcount
    except Error as e:
        print(f"Query error: {e}")
        result = None
    finally:
        cursor.close()
        conn.close()
    
    return result

def fetch_one(query, params=None):
    """Fetch a single row."""
    conn = get_db_connection()
    
    if USE_MOCK:
        # Simple mock logic for login/fetch
        query_upper = query.upper()
        if "FROM USERS" in query_upper:
            if params and len(params) >= 1:
                email = params[0]
                user = next((u for u in MOCK_DB['users'] if u['email'] == email), None)
                return user
        return None

    if not conn:
        return None
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        result = cursor.fetchone()
    except Error as e:
        print(f"Fetch error: {e}")
        result = None
    finally:
        cursor.close()
        conn.close()
    
    return result

