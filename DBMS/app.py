from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import db
import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# --- SMTP Configuration ---
# To send real emails, fill in your SMTP details here:
SMTP_SERVER = "MAIL ID"
SMTP_PORT = #PORT iD
SMTP_EMAIL = "MAIL ID" 
SMTP_PASSWORD = "PASSWORD" # Please replace with your actual App Password

def send_otp_email(target_email, otp, subject="FreshTrack Verification Code"):
    msg_body = f"""
    <h2>FreshTrack Security Verification</h2>
    <p>Your one-time password (OTP) is:</p>
    <h1 style="color: #4ade80; font-size: 32px; letter-spacing: 5px;">{otp}</h1>
    <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    <hr>
    <p style="font-size: 10px; color: #888;">FreshTrack Inventory Management System</p>
    """
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = target_email
        msg['Subject'] = subject
        msg.attach(MIMEText(msg_body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent OTP to {target_email}")
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        # Fallback to file/console for demo purposes
        with open("otp_log.txt", "a") as f:
            f.write(f"[{target_email}] OTP: {otp} | Subject: {subject}\n")
        print(f"\n[FALLBACK] OTP for {target_email}: {otp}\n")
        return {"status": "fallback", "otp": otp}

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = db.fetch_one("SELECT * FROM users WHERE email = %s AND password = %s", (email, password))
    if user:
        if not user.get('is_verified'):
            return jsonify({"status": "unverified", "message": "Email not verified", "email": email}), 403
        return jsonify({"status": "success", "user": user})
    else:
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    
    # Check if exists
    existing = db.fetch_one("SELECT * FROM users WHERE email = %s", (email,))
    if existing:
        if existing.get('is_verified'):
            return jsonify({"status": "error", "message": "Email already registered and verified"}), 400
        else:
            # Not verified yet, let's just resend a new OTP
            otp = str(random.randint(100000, 999999))
            email_status = send_otp_email(email, otp, "Verify Your FreshTrack Account")
            db.execute_query("UPDATE users SET otp_code = %s, password = %s, full_name = %s WHERE email = %s", 
                             (otp, password, full_name, email))
            
            if isinstance(email_status, bool) and email_status == True:
                return jsonify({"status": "success", "message": "New OTP sent to your email"})
            else:
                return jsonify({"status": "success", "message": "New OTP generated", "dev_otp": otp})
    
    otp = str(random.randint(100000, 999999))
    email_status = send_otp_email(email, otp, "Welcome to FreshTrack - Verify Your Account")
    
    db.execute_query("INSERT INTO users (email, password, full_name, otp_code, is_verified) VALUES (%s, %s, %s, %s, FALSE)", 
                     (email, password, full_name, otp))
    
    if isinstance(email_status, bool) and email_status == True:
        return jsonify({"status": "success", "message": "OTP sent to your email"})
    else:
        return jsonify({"status": "success", "message": "OTP generated (Simulation Mode)", "dev_otp": otp})

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    
    user = db.fetch_one("SELECT * FROM users WHERE email = %s AND otp_code = %s", (email, otp))
    if user:
        db.execute_query("UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE email = %s", (email,))
        return jsonify({"status": "success", "message": "Email verified successfully"})
    else:
        return jsonify({"status": "error", "message": "Invalid OTP"}), 400

@app.route('/api/resend-otp', methods=['POST'])
def resend_otp():
    data = request.json
    email = data.get('email')
    
    otp = str(random.randint(100000, 999999))
    email_status = send_otp_email(email, otp, "FreshTrack - Your New Verification Code")
    db.execute_query("UPDATE users SET otp_code = %s WHERE email = %s", (otp, email))
    
    if isinstance(email_status, bool) and email_status == True:
        return jsonify({"status": "success", "message": "New OTP sent"})
    else:
        return jsonify({"status": "success", "message": "New OTP generated", "dev_otp": otp})

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    
    user = db.fetch_one("SELECT * FROM users WHERE email = %s", (email,))
    if user:
        otp = str(random.randint(100000, 999999))
        email_status = send_otp_email(email, otp, "FreshTrack Password Reset")
        db.execute_query("UPDATE users SET otp_code = %s WHERE email = %s", (otp, email))
        
        if email_status == True:
            return jsonify({"status": "success", "message": "Reset OTP sent"})
        else:
            return jsonify({"status": "success", "message": "Reset OTP generated", "dev_otp": otp})
    return jsonify({"status": "error", "message": "Email not found"}), 404

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    
    user = db.fetch_one("SELECT * FROM users WHERE email = %s AND otp_code = %s", (email, otp))
    if user:
        db.execute_query("UPDATE users SET password = %s, otp_code = NULL WHERE email = %s", (new_password, email))
        return jsonify({"status": "success", "message": "Password reset successful"})
    return jsonify({"status": "error", "message": "Invalid OTP"}), 400

@app.route('/api/data', methods=['GET'])
def get_all_data():
    # Trigger auto-reorder check whenever data is fetched
    auto_reorder_status, new_invoices = check_and_auto_reorder()
    
    data = {
        'departments': db.execute_query("SELECT * FROM departments", fetch=True),
        'managers': db.execute_query("SELECT * FROM managers", fetch=True),
        'suppliers': db.execute_query("SELECT * FROM suppliers", fetch=True),
        'products': db.execute_query("SELECT * FROM products", fetch=True),
        'stock': db.execute_query("SELECT * FROM stock", fetch=True),
        'warehouses': db.execute_query("SELECT * FROM warehouses", fetch=True),
        'orders': db.execute_query("SELECT * FROM orders", fetch=True),
        'invoices': db.execute_query("SELECT * FROM invoices", fetch=True),
        'auto_reorder_summary': auto_reorder_status,
        'new_auto_invoices': new_invoices
    }
    return jsonify(data)

def check_and_auto_reorder():
    """Checks for products with quantity <= min_limit and automatically creates orders/invoices."""
    products = db.execute_query("SELECT * FROM products WHERE quantity <= min_limit", fetch=True)
    if not products:
        return "No low stock items.", []

    import datetime
    today = datetime.date.today().isoformat()
    reordered_count = 0
    new_invoices = []

    for p in products:
        p_id = p['product_id']
        s_id = p['supplier_id']
        
        # 1. Check if a pending/active order already exists for this product to avoid duplicates
        existing = db.fetch_one("SELECT * FROM orders WHERE product = %s AND status IN ('Pending', 'In Transit')", (p_id,))
        if existing:
            continue

        # 2. Create Order
        # Generate a unique Order ID
        order_count = db.fetch_one("SELECT COUNT(*) as count FROM orders")['count']
        new_order_id = f"ORD{1000 + order_count + 1}"
        
        # Get a manager to assign to (fallback to a default if none exist)
        mgr = db.fetch_one("SELECT m_id FROM managers LIMIT 1")
        mgr_id = mgr['m_id'] if mgr else "M01"

        db.execute_query(
            "INSERT INTO orders (order_id, manager_id, supplier_id, product, order_date, status) VALUES (%s, %s, %s, %s, %s, 'Pending')",
            (new_order_id, mgr_id, s_id, p_id, today)
        )

        # 3. Create Invoice
        invoice_count = db.fetch_one("SELECT COUNT(*) as count FROM invoices")['count']
        new_inv_id = f"INV{5000 + invoice_count + 1}"
        amount = float(p['purchase_price']) * 100 # Order 100 units by default
        
        db.execute_query(
            "INSERT INTO invoices (invoice_id, order_id, amount, billing_date, payment_status) VALUES (%s, %s, %s, %s, 'Pending')",
            (new_inv_id, new_order_id, amount, today)
        )
        
        reordered_count += 1
        new_invoices.append(new_inv_id)
        print(f"AUTO-REORDER: Created {new_order_id} and {new_inv_id} for {p['name']}")

    return f"Processed auto-reorders for {reordered_count} products.", new_invoices

# --- CRUD API ROUTES ---

def generic_handle_request(table, id_col, fields):
    if request.method == 'GET':
        items = db.execute_query(f"SELECT * FROM {table}", fetch=True)
        return jsonify(items)
    elif request.method == 'POST':
        data = request.json
        cols = ", ".join(fields)
        placeholders = ", ".join(["%s"] * len(fields))
        update_str = ", ".join([f"{f}=%s" for f in fields if f != id_col])
        
        # Build query for INSERT ... ON DUPLICATE KEY UPDATE
        query = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {update_str}"
        
        # Prepare params
        vals = [data.get(f) for f in fields]
        update_vals = [data.get(f) for f in fields if f != id_col]
        params = tuple(vals + update_vals)
        
        db.execute_query(query, params)
        return jsonify({"status": "success"})
    elif request.method == 'DELETE':
        id_val = request.args.get('id')
        db.execute_query(f"DELETE FROM {table} WHERE {id_col} = %s", (id_val,))
        return jsonify({"status": "success"})

@app.route('/api/products', methods=['GET', 'POST', 'DELETE'])
def api_products():
    fields = ['product_id', 'name', 'category', 'unit', 'description', 'purchase_price', 'selling_price', 'quantity', 'min_limit', 'supplier_id', 'icon']
    return generic_handle_request('products', 'product_id', fields)

@app.route('/api/stock', methods=['GET', 'POST', 'DELETE'])
def api_stock():
    fields = ['stock_id', 'product_id', 'exp_date', 'stock_status', 'warehouse_id', 'supplier_id', 'manager_id']
    return generic_handle_request('stock', 'stock_id', fields)

@app.route('/api/suppliers', methods=['GET', 'POST', 'DELETE'])
def api_suppliers():
    fields = ['s_id', 's_name', 's_ph_no', 's_type', 'manager_id']
    return generic_handle_request('suppliers', 's_id', fields)

@app.route('/api/warehouses', methods=['GET', 'POST', 'DELETE'])
def api_warehouses():
    fields = ['w_id', 'w_name', 'location']
    return generic_handle_request('warehouses', 'w_id', fields)

@app.route('/api/departments', methods=['GET', 'POST', 'DELETE'])
def api_departments():
    fields = ['dept_id', 'dept_name', 'dept_type', 'manager_id']
    return generic_handle_request('departments', 'dept_id', fields)

@app.route('/api/managers', methods=['GET', 'POST', 'DELETE'])
def api_managers():
    fields = ['m_id', 'm_name', 'm_ph_no', 'm_email', 'dept_id']
    return generic_handle_request('managers', 'm_id', fields)

@app.route('/api/orders', methods=['GET', 'POST', 'DELETE'])
def api_orders():
    fields = ['order_id', 'manager_id', 'supplier_id', 'product', 'order_date', 'status']
    return generic_handle_request('orders', 'order_id', fields)

@app.route('/api/invoices', methods=['GET', 'POST', 'DELETE'])
def api_invoices():
    fields = ['invoice_id', 'order_id', 'amount', 'billing_date', 'payment_status']
    return generic_handle_request('invoices', 'invoice_id', fields)

@app.route('/api/ai/pricing-suggestion/<product_id>', methods=['GET'])
def api_ai_suggestion(product_id):
    product = db.fetch_one("SELECT * FROM products WHERE product_id = %s", (product_id,))
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    current_purchase = float(product['purchase_price'])
    current_selling = float(product['selling_price'])
    
    # Simulate Market Fluctuations
    # Market purchase price varies between -15% and +10% of current
    market_purchase_factor = 1 + random.uniform(-0.15, 0.10)
    market_purchase_price = round(current_purchase * market_purchase_factor, 2)
    
    # Market selling price varies between -5% and +20% of current
    market_selling_factor = 1 + random.uniform(-0.05, 0.20)
    market_selling_price = round(current_selling * market_selling_factor, 2)
    
    # AI Recommendation Logic
    suggested_purchase = round(market_purchase_price * 0.98, 2) # Try to negotiate 2% below market
    suggested_selling = round(market_selling_price * 1.05, 2) # Try to sell 5% above market average if quality is high
    
    # Ensure profit margin
    target_margin = 0.25 # 25%
    if suggested_selling < suggested_purchase * (1 + target_margin):
        suggested_selling = round(suggested_purchase * (1 + target_margin), 2)
        
    potential_profit = round(suggested_selling - suggested_purchase, 2)
    profit_margin_pct = round((potential_profit / suggested_selling) * 100, 2)
    
    # Trend Analysis
    trend = "upward" if market_purchase_factor > 1 else "downward"
    action = "BUY NOW" if trend == "downward" else "HOLD / NEGOTIATE"
    
    insight = f"The market for {product['name']} is showing a {trend} trend. "
    if trend == "downward":
        insight += f"Current market prices are lower than your last purchase. This is an excellent time to restock at ₹{suggested_purchase}."
    else:
        insight += f"Prices are rising. We recommend maintaining current stock and adjusting your selling price to ₹{suggested_selling} to protect margins."

    return jsonify({
        "product_id": product_id,
        "product_name": product['name'],
        "current_prices": {
            "purchase": current_purchase,
            "selling": current_selling
        },
        "market_analysis": {
            "market_purchase_price": market_purchase_price,
            "market_selling_price": market_selling_price,
            "trend": trend
        },
        "ai_recommendation": {
            "suggested_purchase_price": suggested_purchase,
            "suggested_selling_price": suggested_selling,
            "potential_profit_per_unit": potential_profit,
            "margin_percentage": profit_margin_pct,
            "recommended_action": action,
            "insight": insight
        }
    })

import google.generativeai as genai

# --- Gemini AI Configuration ---
GEMINI_API_KEY = "AIzaSyA9Nqvek9OyRHw1Dl00XQxm916bMJ7W_mQ" 
try:
    genai.configure(api_key=GEMINI_API_KEY)
    # Use a more modern model version if possible, fallback to others
    MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro-latest']
    model = None
    for m_name in MODELS:
        try:
            model = genai.GenerativeModel(m_name)
            # Test model
            model.generate_content("ping")
            print(f"Successfully initialized Gemini with model: {m_name}")
            break
        except Exception as e:
            print(f"Failed to init model {m_name}: {e}")
            model = None
except Exception as e:
    print(f"Gemini configuration error: {e}")
    model = None

@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    if not model:
        return jsonify({"response": "I'm currently in 'Offline Mode' because my AI brain (Gemini API) is having some connection issues. Try again later!"})

    try:
        user_message = request.json.get('message')
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Fetch current system state for context (Safe even in Mock Mode)
        data_context = {
            'products': db.execute_query("SELECT * FROM products", fetch=True),
            'stock': db.execute_query("SELECT * FROM stock", fetch=True),
            'suppliers': db.execute_query("SELECT * FROM suppliers", fetch=True),
            'warehouses': db.execute_query("SELECT * FROM warehouses", fetch=True)
        }
        
        prompt = f"""
        You are 'FreshAI Pro', a world-class Market Analyst and Procurement Specialist for the FreshTrack Inventory System.
        Your tone is professional, data-driven, and highly analytical.
        
        SYSTEM CONTEXT:
        - Current Inventory State: {data_context}
        - Your role: Help the manager optimize profits, identify financial leaks, and investigate market/supplier opportunities.
        
        USER QUERY:
        "{user_message}"
        
        RESPONSE GUIDELINES:
        - Use Markdown for structure (### Headers, **Bold**, * Lists).
        - If asked about P&L, provide specific numbers (₹) based on the data.
        - Always offer a "Pro Tip" at the end regarding procurement or market trends.
        - If data is empty, explain that the system is currently using sample data.
        """
        
        response = model.generate_content(prompt)
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"Gemini error during chat: {e}")
        return jsonify({"response": "I'm having a bit of a headache (API Error). Can we try that again in a moment?"})

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
