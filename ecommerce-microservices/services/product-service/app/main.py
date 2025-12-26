from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import jwt
import time

app = FastAPI(title="Product Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)
JWT_SECRET = os.environ.get("JWT_SECRET", "ecommerce-secret-key-2024")

def get_db_connection():
    max_retries = 5
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=os.environ.get("DB_HOST", "product-db"),
                port=os.environ.get("DB_PORT", "5432"),
                database=os.environ.get("DB_NAME", "productdb"),
                user=os.environ.get("DB_USER", "postgres"),
                password=os.environ.get("DB_PASSWORD", "postgres123"),
                cursor_factory=RealDictCursor
            )
            return conn
        except psycopg2.OperationalError:
            if i < max_retries - 1:
                time.sleep(2)
            else:
                raise

def init_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                original_price DECIMAL(10, 2),
                category VARCHAR(100) NOT NULL,
                brand VARCHAR(100),
                image_url TEXT,
                stock INTEGER DEFAULT 100,
                rating DECIMAL(2, 1) DEFAULT 4.0,
                reviews_count INTEGER DEFAULT 0,
                is_featured BOOLEAN DEFAULT FALSE,
                discount_percent INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Check if products exist
        cur.execute("SELECT COUNT(*) as count FROM products")
        if cur.fetchone()["count"] == 0:
            # Insert sample products
            sample_products = [
                ("Apple iPhone 15 Pro Max", "Latest iPhone with A17 Pro chip, 256GB Storage, Titanium Design", 134999.00, 159999.00, "Electronics", "Apple", "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500", 50, 4.8, 2547, True, 16),
                ("Samsung Galaxy S24 Ultra", "AI-Powered Smartphone with S Pen, 512GB, Titanium Gray", 124999.00, 144999.00, "Electronics", "Samsung", "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500", 45, 4.7, 1823, True, 14),
                ("Sony WH-1000XM5 Headphones", "Industry Leading Noise Cancelling Wireless Headphones", 29999.00, 34999.00, "Electronics", "Sony", "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500", 100, 4.9, 5621, True, 14),
                ("MacBook Air M3", "13.6-inch Liquid Retina Display, 8GB RAM, 256GB SSD", 114999.00, 129999.00, "Electronics", "Apple", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500", 30, 4.9, 1245, True, 12),
                ("Nike Air Max 270", "Men's Running Shoes - Black/White", 12999.00, 15999.00, "Fashion", "Nike", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", 200, 4.5, 3421, False, 19),
                ("Levi's 501 Original Jeans", "Classic Straight Fit Denim, Dark Wash", 4999.00, 6999.00, "Fashion", "Levi's", "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500", 150, 4.4, 2156, False, 29),
                ("Dyson V15 Detect", "Cordless Vacuum Cleaner with Laser Detection", 62999.00, 69999.00, "Home", "Dyson", "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500", 25, 4.8, 892, True, 10),
                ("LG 55-inch OLED TV", "4K Smart TV with AI ThinQ, Dolby Vision", 129999.00, 159999.00, "Electronics", "LG", "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500", 20, 4.7, 654, True, 19),
                ("Canon EOS R6 Mark II", "Full-Frame Mirrorless Camera, 24.2MP", 215999.00, 249999.00, "Electronics", "Canon", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500", 15, 4.9, 423, False, 14),
                ("Instant Pot Duo 7-in-1", "Electric Pressure Cooker, 6 Quart", 8999.00, 12999.00, "Home", "Instant Pot", "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500", 80, 4.6, 7823, False, 31),
                ("Ray-Ban Aviator Classic", "Polarized Sunglasses, Gold Frame", 15999.00, 18999.00, "Fashion", "Ray-Ban", "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500", 120, 4.5, 1567, False, 16),
                ("Samsung 970 EVO Plus SSD", "1TB NVMe M.2 Internal SSD", 8999.00, 12999.00, "Electronics", "Samsung", "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500", 200, 4.8, 4521, False, 31),
                ("Adidas Ultraboost 23", "Men's Running Shoes - Core Black", 16999.00, 19999.00, "Fashion", "Adidas", "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500", 180, 4.6, 2891, False, 15),
                ("Bose QuietComfort Ultra", "Wireless Noise Cancelling Earbuds", 24999.00, 29999.00, "Electronics", "Bose", "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500", 75, 4.7, 1234, True, 17),
                ("Philips Air Fryer XXL", "Digital Twin TurboStar Technology", 19999.00, 24999.00, "Home", "Philips", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500", 60, 4.5, 3456, False, 20),
                ("Apple Watch Series 9", "GPS + Cellular, 45mm, Midnight Aluminum", 49999.00, 54999.00, "Electronics", "Apple", "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500", 40, 4.8, 1892, True, 9),
                ("Nintendo Switch OLED", "White Joy-Con, 64GB Storage", 34999.00, 39999.00, "Electronics", "Nintendo", "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500", 35, 4.7, 2341, True, 13),
                ("Fossil Gen 6 Smartwatch", "Wellness Features, Leather Strap", 24999.00, 29999.00, "Fashion", "Fossil", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500", 90, 4.3, 876, False, 17),
                ("JBL Flip 6", "Portable Bluetooth Speaker, Waterproof", 9999.00, 12999.00, "Electronics", "JBL", "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500", 150, 4.6, 5678, False, 23),
                ("Kindle Paperwhite", "16GB, 6.8-inch Display, Adjustable Warm Light", 14999.00, 16999.00, "Electronics", "Amazon", "https://images.unsplash.com/photo-1592434134753-a70f1a5a5c16?w=500", 100, 4.7, 8934, False, 12),
            ]
            
            for product in sample_products:
                cur.execute("""
                    INSERT INTO products (name, description, price, original_price, category, brand, image_url, stock, rating, reviews_count, is_featured, discount_percent)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, product)
        
        conn.commit()
        cur.close()
        conn.close()
        print("Product database initialized successfully")
    except Exception as e:
        print(f"Database init error: {e}")

@app.on_event("startup")
async def startup():
    init_db()

# Models
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    category: str
    brand: Optional[str] = None
    image_url: Optional[str] = None
    stock: int = 100
    is_featured: bool = False
    discount_percent: int = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    discount_percent: Optional[int] = None

def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "product-service"}

@app.get("/products")
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "created_at",
    limit: int = Query(default=50, le=100),
    offset: int = 0
):
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = %s"
        params.append(category)
    if search:
        query += " AND (name ILIKE %s OR description ILIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])
    if featured is not None:
        query += " AND is_featured = %s"
        params.append(featured)
    if min_price:
        query += " AND price >= %s"
        params.append(min_price)
    if max_price:
        query += " AND price <= %s"
        params.append(max_price)
    
    # Sorting
    sort_options = {
        "price_asc": "price ASC",
        "price_desc": "price DESC",
        "rating": "rating DESC",
        "newest": "created_at DESC",
        "created_at": "created_at DESC"
    }
    query += f" ORDER BY {sort_options.get(sort_by, 'created_at DESC')}"
    query += " LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    
    cur.execute(query, params)
    products = cur.fetchall()
    
    # Get total count
    count_query = "SELECT COUNT(*) as total FROM products WHERE 1=1"
    count_params = []
    if category:
        count_query += " AND category = %s"
        count_params.append(category)
    if search:
        count_query += " AND (name ILIKE %s OR description ILIKE %s)"
        count_params.extend([f"%{search}%", f"%{search}%"])
    
    cur.execute(count_query, count_params)
    total = cur.fetchone()["total"]
    
    cur.close()
    conn.close()
    
    return {
        "products": [dict(p) for p in products],
        "total": total,
        "limit": limit,
        "offset": offset
    }

@app.get("/products/featured")
async def get_featured_products():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE is_featured = TRUE ORDER BY rating DESC LIMIT 8")
    products = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(p) for p in products]

@app.get("/products/categories")
async def get_categories():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC")
    categories = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(c) for c in categories]

@app.get("/products/{product_id}")
async def get_product(product_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product = cur.fetchone()
    cur.close()
    conn.close()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return dict(product)

@app.post("/products")
async def create_product(product: ProductCreate, user: dict = Depends(verify_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO products (name, description, price, original_price, category, brand, image_url, stock, is_featured, discount_percent)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
    """, (product.name, product.description, product.price, product.original_price or product.price,
          product.category, product.brand, product.image_url, product.stock, product.is_featured, product.discount_percent))
    product_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product created", "product_id": product_id}

@app.put("/products/{product_id}")
async def update_product(product_id: int, product: ProductUpdate, user: dict = Depends(verify_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    
    updates = []
    values = []
    for field, value in product.dict(exclude_none=True).items():
        updates.append(f"{field} = %s")
        values.append(value)
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    values.append(product_id)
    cur.execute(f"UPDATE products SET {', '.join(updates)} WHERE id = %s", values)
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product updated"}

@app.delete("/products/{product_id}")
async def delete_product(product_id: int, user: dict = Depends(verify_admin)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product deleted"}

@app.put("/products/{product_id}/stock")
async def update_stock(product_id: int, quantity: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE products SET stock = stock - %s WHERE id = %s AND stock >= %s", (quantity, product_id, quantity))
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Insufficient stock")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Stock updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
