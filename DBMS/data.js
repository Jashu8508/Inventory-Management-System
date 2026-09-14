// ============================================================
//   FreshTrack – Sample Data (mirrors the ER diagram schema)
// ============================================================

const DB = {

  departments: [
    { dept_id: "D001", dept_name: "Cold Storage",     dept_type: "Storage",         manager_id: "M001" },
    { dept_id: "D002", dept_name: "Production Unit A", dept_type: "Production",      manager_id: "M002" },
    { dept_id: "D003", dept_name: "Quality Control",  dept_type: "Quality Control",  manager_id: "M003" },
    { dept_id: "D004", dept_name: "Logistics Hub",    dept_type: "Logistics",        manager_id: "M004" },
    { dept_id: "D005", dept_name: "Dry Goods Store",  dept_type: "Storage",          manager_id: "M005" },
    { dept_id: "D006", dept_name: "Processing Plant", dept_type: "Production",       manager_id: "M001" },
  ],

  managers: [
    { m_id: "M001", m_name: "Arjun Patel",      m_ph_no: "9845012345", m_email: "arjun.patel@freshtrack.in",   dept_id: "D001" },
    { m_id: "M002", m_name: "Priya Sharma",     m_ph_no: "9762034567", m_email: "priya.sharma@freshtrack.in",  dept_id: "D002" },
    { m_id: "M003", m_name: "Rahul Menon",      m_ph_no: "9834056789", m_email: "rahul.menon@freshtrack.in",   dept_id: "D003" },
    { m_id: "M004", m_name: "Sneha Gupta",      m_ph_no: "9901078901", m_email: "sneha.gupta@freshtrack.in",   dept_id: "D004" },
    { m_id: "M005", m_name: "Kiran Reddy",      m_ph_no: "9870090123", m_email: "kiran.reddy@freshtrack.in",   dept_id: "D005" },
  ],

  suppliers: [
    { s_id: "S001", s_name: "GreenLeaf Farms",     s_ph_no: "8011234567", s_type: "Produce",    manager_id: "M001" },
    { s_id: "S002", s_name: "DairyPure Ltd.",       s_ph_no: "8022345678", s_type: "Dairy",      manager_id: "M002" },
    { s_id: "S003", s_name: "GrainMart Corp.",      s_ph_no: "8033456789", s_type: "Grains",     manager_id: "M002" },
    { s_id: "S004", s_name: "FreshMeat Co.",        s_ph_no: "8044567890", s_type: "Meat",       manager_id: "M003" },
    { s_id: "S005", s_name: "QuenchBev Industries", s_ph_no: "8055678901", s_type: "Beverages",  manager_id: "M004" },
    { s_id: "S006", s_name: "FrostPack Frozen",     s_ph_no: "8066789012", s_type: "Frozen",     manager_id: "M005" },
    { s_id: "S007", s_name: "OrganicOasis",         s_ph_no: "8077890123", s_type: "Produce",    manager_id: "M001" },
  ],

  // ── Products ── (linked to stock via product_id)
  products: [
    {
      product_id: "PRD-101", name: "Fresh Spinach",
      category: "Vegetables", unit: "kg",
      description: "Tender, farm-fresh spinach leaves sourced directly from organic farms. Rich in iron, vitamins A & C, and antioxidants. Ideal for salads, smoothies, and cooked dishes.",
      purchase_price: 45,   // ₹ per kg — paid to supplier
      selling_price:  78,   // ₹ per kg — sold to retailer/customer
      quantity: 150,
      supplier_id: "S001",
      icon: "🥬"
    },
    {
      product_id: "PRD-102", name: "Full Cream Milk",
      category: "Dairy", unit: "L",
      description: "Premium full cream milk from pasture-raised cows. Undergoes pasteurisation and homogenisation. High in calcium, protein and natural fats for everyday nutrition.",
      purchase_price: 52,
      selling_price:  68,
      quantity: 200,
      supplier_id: "S002",
      icon: "🥛"
    },
    {
      product_id: "PRD-103", name: "Basmati Rice",
      category: "Grains", unit: "kg",
      description: "Long-grain, aromatic basmati rice aged for 12 months to develop its signature fragrance. Sourced from the northern plains. Low glycaemic index and gluten free.",
      purchase_price: 90,
      selling_price: 135,
      quantity: 500,
      supplier_id: "S003",
      icon: "🌾"
    },
    {
      product_id: "PRD-104", name: "Chicken Breast",
      category: "Meat", unit: "kg",
      description: "Skinless, boneless chicken breast from free-range birds. High-protein, low-fat — ideal for health-conscious consumers. Chilled and vacuum-sealed for freshness.",
      purchase_price: 220,
      selling_price: 290,
      quantity: 80,
      supplier_id: "S004",
      icon: "🍗"
    },
    {
      product_id: "PRD-105", name: "Mango Juice",
      category: "Beverages", unit: "L",
      description: "100% natural mango pulp juice with no added preservatives or artificial colours. Made from Alphonso mangoes during peak season and cold-pressed for maximum nutrients.",
      purchase_price: 60,
      selling_price:  95,
      quantity: 300,
      supplier_id: "S005",
      icon: "🥭"
    },
    {
      product_id: "PRD-106", name: "Frozen Peas",
      category: "Frozen", unit: "kg",
      description: "Flash-frozen garden peas harvested within hours of picking to lock in flavour and nutrition. Convenient and ready-to-cook. No additives or preservatives used.",
      purchase_price: 55,
      selling_price:  42,   // ← selling below cost (loss scenario)
      quantity: 0,
      supplier_id: "S006",
      icon: "🫛"
    },
    {
      product_id: "PRD-107", name: "Organic Tomatoes",
      category: "Vegetables", unit: "kg",
      description: "Certified organic vine-ripened tomatoes grown without synthetic pesticides. Deep red, juicy and flavourful — perfect for sauces, salads and fresh consumption.",
      purchase_price: 35,
      selling_price:  58,
      quantity: 120,
      supplier_id: "S007",
      icon: "🍅"
    },
    {
      product_id: "PRD-108", name: "Baby Spinach Bundle",
      category: "Vegetables", unit: "kg",
      description: "Tender baby spinach leaves, hand-picked and triple-washed. Milder flavour than mature spinach. Ready-to-eat straight from packaging — zero prep time.",
      purchase_price: 65,
      selling_price:  110,
      quantity: 90,
      supplier_id: "S001",
      icon: "🥗"
    },
    {
      product_id: "PRD-109", name: "Greek Yoghurt",
      category: "Dairy", unit: "kg",
      description: "Thick, creamy Greek-style yoghurt with 10g protein per 100g. Made from whole milk strained through fine muslin. No artificial sweeteners. Probiotic-rich.",
      purchase_price: 110,
      selling_price:  155,
      quantity: 60,
      supplier_id: "S002",
      icon: "🫙"
    },
    {
      product_id: "PRD-110", name: "Whole Wheat Flour",
      category: "Grains", unit: "kg",
      description: "Stone-ground whole wheat flour retaining the bran and germ for maximum fibre and nutrients. Ideal for chapati, bread and baked goods. Non-GMO certified.",
      purchase_price: 38,
      selling_price:  60,
      quantity: 400,
      supplier_id: "S003",
      icon: "🌾"
    },
    {
      product_id: "PRD-111", name: "Mutton Keema",
      category: "Meat", unit: "kg",
      description: "Fresh minced mutton from grass-fed sheep. Coarse-ground for better texture. Rich in zinc, iron and B12. Suitable for keema curries, stuffed paratha and kebabs.",
      purchase_price: 380,
      selling_price:  340,  // ← another loss scenario
      quantity: 0,
      supplier_id: "S004",
      icon: "🥩"
    },
    {
      product_id: "PRD-112", name: "Frozen Corn",
      category: "Frozen", unit: "kg",
      description: "Sweet yellow corn kernels individually quick-frozen (IQF) at peak ripeness. Retains natural sweetness and crunch. Versatile ingredient for soups, salads and stir-fries.",
      purchase_price: 48,
      selling_price:  72,
      quantity: 45,
      supplier_id: "S006",
      icon: "🌽"
    },
  ],

  stock: [
    { stock_id: "STK001", product_id: "PRD-101", exp_date: "2026-05-10", stock_status: "In Stock",      warehouse_id: "W001", supplier_id: "S001", manager_id: "M001" },
    { stock_id: "STK002", product_id: "PRD-102", exp_date: "2026-04-20", stock_status: "Expiring Soon", warehouse_id: "W002", supplier_id: "S002", manager_id: "M002" },
    { stock_id: "STK003", product_id: "PRD-103", exp_date: "2026-07-15", stock_status: "In Stock",      warehouse_id: "W001", supplier_id: "S003", manager_id: "M002" },
    { stock_id: "STK004", product_id: "PRD-104", exp_date: "2026-04-18", stock_status: "Expiring Soon", warehouse_id: "W003", supplier_id: "S004", manager_id: "M003" },
    { stock_id: "STK005", product_id: "PRD-105", exp_date: "2026-09-01", stock_status: "In Stock",      warehouse_id: "W002", supplier_id: "S005", manager_id: "M004" },
    { stock_id: "STK006", product_id: "PRD-106", exp_date: "2026-03-30", stock_status: "Out of Stock",  warehouse_id: "W004", supplier_id: "S006", manager_id: "M005" },
    { stock_id: "STK007", product_id: "PRD-107", exp_date: "2026-06-22", stock_status: "Low Stock",     warehouse_id: "W003", supplier_id: "S007", manager_id: "M001" },
    { stock_id: "STK008", product_id: "PRD-108", exp_date: "2026-08-05", stock_status: "In Stock",      warehouse_id: "W001", supplier_id: "S001", manager_id: "M001" },
    { stock_id: "STK009", product_id: "PRD-109", exp_date: "2026-04-22", stock_status: "Expiring Soon", warehouse_id: "W002", supplier_id: "S002", manager_id: "M002" },
    { stock_id: "STK010", product_id: "PRD-110", exp_date: "2026-10-11", stock_status: "In Stock",      warehouse_id: "W004", supplier_id: "S003", manager_id: "M003" },
    { stock_id: "STK011", product_id: "PRD-111", exp_date: "2025-12-31", stock_status: "Out of Stock",  warehouse_id: "W005", supplier_id: "S004", manager_id: "M004" },
    { stock_id: "STK012", product_id: "PRD-112", exp_date: "2026-05-28", stock_status: "Low Stock",     warehouse_id: "W005", supplier_id: "S006", manager_id: "M005" },
  ],

  warehouses: [
    { w_id: "W001", w_name: "Alpha Cold Hub",      location: "Chennai, TN" },
    { w_id: "W002", w_name: "Beta Grain Depot",    location: "Coimbatore, TN" },
    { w_id: "W003", w_name: "Gamma Fresh Store",   location: "Bengaluru, KA" },
    { w_id: "W004", w_name: "Delta Dry Goods",     location: "Hyderabad, TS" },
    { w_id: "W005", w_name: "Epsilon Freeze Zone", location: "Pune, MH" },
  ],

  orders: [
    { order_id: "ORD001", manager_id: "M001", supplier_id: "S001", product: "PRD-101", date: "2026-04-01", status: "Delivered" },
    { order_id: "ORD002", manager_id: "M002", supplier_id: "S002", product: "PRD-102", date: "2026-04-03", status: "Delivered" },
    { order_id: "ORD003", manager_id: "M003", supplier_id: "S004", product: "PRD-104", date: "2026-04-05", status: "In Transit" },
    { order_id: "ORD004", manager_id: "M004", supplier_id: "S005", product: "PRD-105", date: "2026-04-07", status: "Pending" },
    { order_id: "ORD005", manager_id: "M005", supplier_id: "S006", product: "PRD-106", date: "2026-04-08", status: "Delivered" },
    { order_id: "ORD006", manager_id: "M001", supplier_id: "S007", product: "PRD-107", date: "2026-04-10", status: "In Transit" },
    { order_id: "ORD007", manager_id: "M002", supplier_id: "S003", product: "PRD-108", date: "2026-04-11", status: "Pending" },
    { order_id: "ORD008", manager_id: "M003", supplier_id: "S004", product: "PRD-109", date: "2026-04-12", status: "Delivered" },
  ],
};
