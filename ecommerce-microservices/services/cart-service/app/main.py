from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import jwt
import time
import httpx

app = FastAPI(title="Cart Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "ecommerce-secret-key-2024")
PRODUCT_SERVICE_URL = os.environ.get("PRODUCT_SERVICE_URL", "http://product-service:8000")

def get_db_connection():
    max_retries = 5
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=os.environ.get("DB_HOST", "cart-db"),
                port=os.environ.get("DB_PORT", "5432"),
                database=os.environ.get("DB_NAME", "cartdb"),
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
            CREATE TABLE IF NOT EXISTS cart_items (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Cart database initialized successfully")
    except Exception as e:
        print(f"Database init error: {e}")

@app.on_event("startup")
async def startup():
    init_db()

class CartItem(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_product_details(product_id: int):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PRODUCT_SERVICE_URL}/products/{product_id}")
            if response.status_code == 200:
                return response.json()
    except:
        pass
    return None

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "cart-service"}

@app.get("/cart")
async def get_cart(payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, product_id, quantity FROM cart_items WHERE user_id = %s ORDER BY created_at DESC",
        (payload["user_id"],)
    )
    items = cur.fetchall()
    cur.close()
    conn.close()
    
    # Fetch product details for each item
    cart_items = []
    total = 0
    for item in items:
        product = await get_product_details(item["product_id"])
        if product:
            item_total = float(product["price"]) * item["quantity"]
            cart_items.append({
                "id": item["id"],
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "product": product,
                "item_total": item_total
            })
            total += item_total
    
    return {
        "items": cart_items,
        "total": total,
        "item_count": len(cart_items)
    }

@app.post("/cart")
async def add_to_cart(item: CartItem, payload: dict = Depends(verify_token)):
    # Verify product exists
    product = await get_product_details(item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if item already in cart
    cur.execute(
        "SELECT id, quantity FROM cart_items WHERE user_id = %s AND product_id = %s",
        (payload["user_id"], item.product_id)
    )
    existing = cur.fetchone()
    
    if existing:
        # Update quantity
        new_quantity = existing["quantity"] + item.quantity
        cur.execute(
            "UPDATE cart_items SET quantity = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (new_quantity, existing["id"])
        )
    else:
        # Insert new item
        cur.execute(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (%s, %s, %s)",
            (payload["user_id"], item.product_id, item.quantity)
        )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Item added to cart"}

@app.put("/cart/{item_id}")
async def update_cart_item(item_id: int, update: CartItemUpdate, payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    
    if update.quantity <= 0:
        cur.execute(
            "DELETE FROM cart_items WHERE id = %s AND user_id = %s",
            (item_id, payload["user_id"])
        )
    else:
        cur.execute(
            "UPDATE cart_items SET quantity = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s",
            (update.quantity, item_id, payload["user_id"])
        )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Cart updated"}

@app.delete("/cart/{item_id}")
async def remove_from_cart(item_id: int, payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM cart_items WHERE id = %s AND user_id = %s",
        (item_id, payload["user_id"])
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Item removed from cart"}

@app.delete("/cart")
async def clear_cart(payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM cart_items WHERE user_id = %s", (payload["user_id"],))
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Cart cleared"}

@app.get("/cart/count")
async def get_cart_count(payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE user_id = %s",
        (payload["user_id"],)
    )
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    return {"count": int(result["count"])}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
