#!/bin/bash

# Add Products Script
# Use this script to add new products to the e-commerce platform

set -e

# Get the ALB URL
ALB_URL=$(kubectl get ingress ecommerce-ingress -n ecommerce -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -z "$ALB_URL" ]; then
    echo "Error: Could not get ALB URL. Make sure the ingress is deployed."
    echo "You can also use port-forward:"
    echo "  kubectl port-forward svc/product-service 8000:8000 -n ecommerce"
    echo "Then use: http://localhost:8000"
    exit 1
fi

API_URL="http://$ALB_URL"

echo "=========================================="
echo "  Add Product to E-Commerce Platform"
echo "=========================================="
echo ""
echo "API URL: $API_URL"
echo ""

# First, get an admin token (login as any user)
echo "Please provide admin credentials:"
read -p "Email: " EMAIL
read -s -p "Password: " PASSWORD
echo ""

# Login
echo "Logging in..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/api/users/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Login failed. Please check your credentials."
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Get product details
echo "Enter product details:"
read -p "Product Name: " NAME
read -p "Description: " DESCRIPTION
read -p "Price (e.g., 9999): " PRICE
read -p "Original Price (e.g., 12999): " ORIGINAL_PRICE
read -p "Category (e.g., Electronics, Fashion, Home): " CATEGORY
read -p "Brand: " BRAND
read -p "Image URL (or press Enter for placeholder): " IMAGE_URL
read -p "Stock quantity (e.g., 100): " STOCK
read -p "Is Featured? (true/false): " IS_FEATURED
read -p "Discount Percent (e.g., 20): " DISCOUNT

# Set defaults
IMAGE_URL=${IMAGE_URL:-"https://via.placeholder.com/500"}
IS_FEATURED=${IS_FEATURED:-"false"}
DISCOUNT=${DISCOUNT:-"0"}

# Create product
echo ""
echo "Creating product..."

RESPONSE=$(curl -s -X POST "$API_URL/api/products/products" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"name\": \"$NAME\",
        \"description\": \"$DESCRIPTION\",
        \"price\": $PRICE,
        \"original_price\": $ORIGINAL_PRICE,
        \"category\": \"$CATEGORY\",
        \"brand\": \"$BRAND\",
        \"image_url\": \"$IMAGE_URL\",
        \"stock\": $STOCK,
        \"is_featured\": $IS_FEATURED,
        \"discount_percent\": $DISCOUNT
    }")

echo "Response: $RESPONSE"
echo ""
echo "✅ Product added successfully!"
echo "The product will appear on the website immediately - no rebuild needed!"
