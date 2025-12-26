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
import uuid
from datetime import datetime
import json

app = FastAPI(title="Order Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "ecommerce-secret-key-2024")
CART_SERVICE_URL = os.environ.get("CART_SERVICE_URL", "http://cart-service:8000")
PAYMENT_SERVICE_URL = os.environ.get("PAYMENT_SERVICE_URL", "http://payment-service:8000")
PRODUCT_SERVICE_URL = os.environ.get("PRODUCT_SERVICE_URL", "http://product-service:8000")

def get_db_connection():
    max_retries = 5
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=os.environ.get("DB_HOST", "order-db"),
                port=os.environ.get("DB_PORT", "5432"),
                database=os.environ.get("DB_NAME", "orderdb"),
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
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(50) UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                items JSONB NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL,
                shipping_cost DECIMAL(10, 2) DEFAULT 0,
                tax DECIMAL(10, 2) DEFAULT 0,
                total DECIMAL(10, 2) NOT NULL,
                shipping_address JSONB NOT NULL,
                payment_status VARCHAR(50) DEFAULT 'pending',
                order_status VARCHAR(50) DEFAULT 'pending',
                payment_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Order database initialized successfully")
    except Exception as e:
        print(f"Database init error: {e}")

@app.on_event("startup")
async def startup():
    init_db()

class ShippingAddress(BaseModel):
    full_name: str
    address: str
    city: str
    state: str
    pincode: str
    phone: str

class CreateOrder(BaseModel):
    shipping_address: ShippingAddress

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_order_id():
    return f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "order-service"}

@app.post("/orders")
async def create_order(order_data: CreateOrder, payload: dict = Depends(verify_token), credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Get cart items
    try:
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {credentials.credentials}"}
            cart_response = await client.get(f"{CART_SERVICE_URL}/cart", headers=headers)
            if cart_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch cart")
            cart_data = cart_response.json()
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Cart service unavailable")
    
    if not cart_data.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate totals
    subtotal = cart_data["total"]
    shipping_cost = 0 if subtotal >= 500 else 40  # Free shipping over ₹500
    tax = round(subtotal * 0.18, 2)  # 18% GST
    total = subtotal + shipping_cost + tax
    
    # Create order
    order_id = generate_order_id()
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO orders (order_id, user_id, items, subtotal, shipping_cost, tax, total, shipping_address)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
    """, (
        order_id,
        payload["user_id"],
        json.dumps(cart_data["items"]),
        subtotal,
        shipping_cost,
        tax,
        total,
        json.dumps(order_data.shipping_address.dict())
    ))
    db_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        "order_id": order_id,
        "subtotal": subtotal,
        "shipping_cost": shipping_cost,
        "tax": tax,
        "total": total,
        "items": cart_data["items"],
        "shipping_address": order_data.shipping_address.dict()
    }

@app.get("/orders")
async def get_orders(payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT order_id, items, subtotal, shipping_cost, tax, total, 
               shipping_address, payment_status, order_status, created_at
        FROM orders WHERE user_id = %s ORDER BY created_at DESC
    """, (payload["user_id"],))
    orders = cur.fetchall()
    cur.close()
    conn.close()
    
    return [dict(o) for o in orders]

@app.get("/orders/{order_id}")
async def get_order(order_id: str, payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT order_id, items, subtotal, shipping_cost, tax, total, 
               shipping_address, payment_status, order_status, payment_id, created_at
        FROM orders WHERE order_id = %s AND user_id = %s
    """, (order_id, payload["user_id"]))
    order = cur.fetchone()
    cur.close()
    conn.close()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return dict(order)

@app.put("/orders/{order_id}/payment")
async def update_payment_status(order_id: str, payment_id: str, status: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE orders SET payment_status = %s, payment_id = %s, 
               order_status = CASE WHEN %s = 'completed' THEN 'confirmed' ELSE order_status END,
               updated_at = CURRENT_TIMESTAMP
        WHERE order_id = %s
    """, (status, payment_id, status, order_id))
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Payment status updated"}

@app.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, payload: dict = Depends(verify_token)):
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE orders SET order_status = %s, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = %s AND user_id = %s
    """, (status, order_id, payload["user_id"]))
    conn.commit()
    cur.close()
    conn.close()
    
    return {"message": "Order status updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
