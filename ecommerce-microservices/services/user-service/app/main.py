from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import hashlib
import jwt
import datetime
import time

app = FastAPI(title="User Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "ecommerce-secret-key-2024")

# Database connection with retry
def get_db_connection():
    max_retries = 5
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=os.environ.get("DB_HOST", "user-db"),
                port=os.environ.get("DB_PORT", "5432"),
                database=os.environ.get("DB_NAME", "userdb"),
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
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database init error: {e}")

@app.on_event("startup")
async def startup():
    init_db()

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class ShippingAddress(BaseModel):
    address: str
    city: str
    state: str
    pincode: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "user-service"}

@app.post("/register")
async def register(user: UserRegister):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if user exists
    cur.execute("SELECT id FROM users WHERE email = %s", (user.email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    password_hash = hash_password(user.password)
    cur.execute(
        "INSERT INTO users (email, password_hash, full_name, phone) VALUES (%s, %s, %s, %s) RETURNING id",
        (user.email, password_hash, user.full_name, user.phone)
    )
    user_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    
    token = create_token(user_id, user.email)
    return {"message": "Registration successful", "token": token, "user_id": user_id}

@app.post("/login")
async def login(user: UserLogin):
    conn = get_db_connection()
    cur = conn.cursor()
    
    password_hash = hash_password(user.password)
    cur.execute(
        "SELECT id, email, full_name FROM users WHERE email = %s AND password_hash = %s",
        (user.email, password_hash)
    )
    db_user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(db_user["id"], db_user["email"])
    return {
        "message": "Login successful",
        "token": token,
        "user": {"id": db_user["id"], "email": db_user["email"], "full_name": db_user["full_name"]}
    }

@app.get("/profile")
async def get_profile(payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, email, full_name, phone, address, city, state, pincode FROM users WHERE id = %s",
        (payload["user_id"],)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user)

@app.put("/profile")
async def update_profile(user_update: UserUpdate, payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    
    updates = []
    values = []
    for field, value in user_update.dict(exclude_none=True).items():
        updates.append(f"{field} = %s")
        values.append(value)
    
    if updates:
        values.append(payload["user_id"])
        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", values)
        conn.commit()
    
    cur.close()
    conn.close()
    return {"message": "Profile updated successfully"}

@app.put("/shipping-address")
async def update_shipping(shipping: ShippingAddress, payload: dict = Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET address = %s, city = %s, state = %s, pincode = %s WHERE id = %s",
        (shipping.address, shipping.city, shipping.state, shipping.pincode, payload["user_id"])
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Shipping address updated"}

@app.get("/validate-token")
async def validate_token(payload: dict = Depends(verify_token)):
    return {"valid": True, "user_id": payload["user_id"], "email": payload["email"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
