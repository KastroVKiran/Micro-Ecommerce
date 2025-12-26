from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import jwt
import time
import httpx
import uuid
from datetime import datetime

app = FastAPI(title="Payment Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "ecommerce-secret-key-2024")
ORDER_SERVICE_URL = os.environ.get("ORDER_SERVICE_URL", "http://order-service:8000")
CART_SERVICE_URL = os.environ.get("CART_SERVICE_URL", "http://cart-service:8000")

def get_db_connection():
    max_retries = 5
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=os.environ.get("DB_HOST", "payment-db"),
                port=os.environ.get("DB_PORT", "5432"),
                database=os.environ.get("DB_NAME", "paymentdb"),
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
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                payment_id VARCHAR(50) UNIQUE NOT NULL,
                order_id VARCHAR(50) NOT NULL,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                card_last_four VARCHAR(4),
                card_holder_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                transaction_id VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Payment database initialized successfully")
    except Exception as e:
        print(f"Database init error: {e}")

@app.on_event("startup")
async def startup():
    init_db()

class PaymentRequest(BaseModel):
    order_id: str
    amount: float
    payment_method: str  # credit_card, debit_card, upi, net_banking
    card_number: Optional[str] = None
    card_holder_name: Optional[str] = None
    expiry_date: Optional[str] = None
    cvv: Optional[str] = None
    upi_id: Optional[str] = None

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_payment_id():
    return f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

def generate_transaction_id():
    return f"TXN{uuid.uuid4().hex[:12].upper()}"

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "payment-service"}

@app.post("/payments/process")
async def process_payment(payment: PaymentRequest, payload: dict = Depends(verify_token), credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Simulate payment processing
    # In production, integrate with actual payment gateway (Razorpay, Stripe, etc.)
    
    payment_id = generate_payment_id()
    transaction_id = generate_transaction_id()
    card_last_four = payment.card_number[-4:] if payment.card_number else None
    
    # Simulate payment success (90% success rate for demo)
    import random
    payment_success = random.random() < 0.95  # 95% success rate
    status = "completed" if payment_success else "failed"
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO payments (payment_id, order_id, user_id, amount, payment_method, 
                            card_last_four, card_holder_name, status, transaction_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        payment_id,
        payment.order_id,
        payload["user_id"],
        payment.amount,
        payment.payment_method,
        card_last_four,
        payment.card_holder_name,
        status,
        transaction_id if payment_success else None
    ))
    conn.commit()
    cur.close()
    conn.close()
    
    if payment_success:
        # Update order payment status
        try:
            async with httpx.AsyncClient() as client:
                await client.put(
                    f"{ORDER_SERVICE_URL}/orders/{payment.order_id}/payment",
                    params={"payment_id": payment_id, "status": "completed"}
                )
                # Clear cart after successful payment
                headers = {"Authorization": f"Bearer {credentials.credentials}"}
                await client.delete(f"{CART_SERVICE_URL}/cart", headers=headers)
        except:
            pass
        
        return {
            "success": True,
            "message": "Payment successful!",
            "payment_id": payment_id,
            "transaction_id": transaction_id,
            "order_id": payment.order_id,
            "amount": payment.amount
        }
    else:
        raise HTTPException(
            status_code=400,
            detail="Payment failed. Please try again or use a different payment method."
        )

@app.get("/payments/{payment_id}")
async def get_payment(payment_id: str, payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT payment_id, order_id, amount, payment_method, card_last_four,
               status, transaction_id, created_at
        FROM payments WHERE payment_id = %s AND user_id = %s
    """, (payment_id, payload["user_id"]))
    payment = cur.fetchone()
    cur.close()
    conn.close()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return dict(payment)

@app.get("/payments/order/{order_id}")
async def get_payment_by_order(order_id: str, payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT payment_id, order_id, amount, payment_method, card_last_four,
               status, transaction_id, created_at
        FROM payments WHERE order_id = %s AND user_id = %s
    """, (order_id, payload["user_id"]))
    payment = cur.fetchone()
    cur.close()
    conn.close()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return dict(payment)

@app.get("/payments")
async def get_user_payments(payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT payment_id, order_id, amount, payment_method, status, created_at
        FROM payments WHERE user_id = %s ORDER BY created_at DESC
    """, (payload["user_id"],))
    payments = cur.fetchall()
    cur.close()
    conn.close()
    
    return [dict(p) for p in payments]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
