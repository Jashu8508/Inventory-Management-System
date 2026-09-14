from db import get_db_connection
from mysql.connector import Error

def init_db():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database.")
        return
    
    cursor = conn.cursor()
    
    tables = [
        """
        CREATE TABLE IF NOT EXISTS departments (
            dept_id VARCHAR(10) PRIMARY KEY,
            dept_name VARCHAR(100) NOT NULL,
            dept_type VARCHAR(50),
            manager_id VARCHAR(10)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS managers (
            m_id VARCHAR(10) PRIMARY KEY,
            m_name VARCHAR(100) NOT NULL,
            m_ph_no VARCHAR(15),
            m_email VARCHAR(100),
            dept_id VARCHAR(10)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS suppliers (
            s_id VARCHAR(10) PRIMARY KEY,
            s_name VARCHAR(100) NOT NULL,
            s_ph_no VARCHAR(15),
            s_type VARCHAR(50),
            manager_id VARCHAR(10)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS products (
            product_id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            category VARCHAR(50),
            unit VARCHAR(20),
            description TEXT,
            purchase_price DECIMAL(10,2),
            selling_price DECIMAL(10,2),
            quantity INT,
            min_limit INT DEFAULT 25,
            supplier_id VARCHAR(10),
            icon VARCHAR(10)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS stock (
            stock_id VARCHAR(10) PRIMARY KEY,
            product_id VARCHAR(20),
            exp_date DATE,
            stock_status VARCHAR(50),
            warehouse_id VARCHAR(10),
            supplier_id VARCHAR(10),
            manager_id VARCHAR(10)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS warehouses (
            w_id VARCHAR(10) PRIMARY KEY,
            w_name VARCHAR(100) NOT NULL,
            location VARCHAR(200)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS orders (
            order_id VARCHAR(10) PRIMARY KEY,
            manager_id VARCHAR(10),
            supplier_id VARCHAR(10),
            product VARCHAR(20),
            order_date DATE,
            status VARCHAR(50)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS invoices (
            invoice_id VARCHAR(15) PRIMARY KEY,
            order_id VARCHAR(10),
            amount DECIMAL(10,2),
            billing_date DATE,
            payment_status VARCHAR(50)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS users (
            email VARCHAR(100) PRIMARY KEY,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            role VARCHAR(20) DEFAULT 'admin',
            is_verified BOOLEAN DEFAULT FALSE,
            otp_code VARCHAR(6)
        )
        """
    ]
    
    try:
        for table_sql in tables:
            cursor.execute(table_sql)
        conn.commit()
        print("Tables created successfully.")
    except Error as e:
        print(f"Error creating tables: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    init_db()
