#!/bin/bash

# Database Access Script
# Use this script to connect to any database pod and verify data

set -e

echo "=========================================="
echo "  Database Access Helper"
echo "=========================================="
echo ""
echo "Available databases:"
echo "  1. user-db      (userdb)"
echo "  2. product-db   (productdb)"
echo "  3. cart-db      (cartdb)"
echo "  4. order-db     (orderdb)"
echo "  5. payment-db   (paymentdb)"
echo ""
echo "Usage Examples:"
echo ""
echo "1. Connect to User Database:"
echo "   kubectl exec -it deployment/user-db -n ecommerce -- psql -U postgres -d userdb"
echo ""
echo "2. Connect to Product Database:"
echo "   kubectl exec -it deployment/product-db -n ecommerce -- psql -U postgres -d productdb"
echo ""
echo "3. Connect to Cart Database:"
echo "   kubectl exec -it deployment/cart-db -n ecommerce -- psql -U postgres -d cartdb"
echo ""
echo "4. Connect to Order Database:"
echo "   kubectl exec -it deployment/order-db -n ecommerce -- psql -U postgres -d orderdb"
echo ""
echo "5. Connect to Payment Database:"
echo "   kubectl exec -it deployment/payment-db -n ecommerce -- psql -U postgres -d paymentdb"
echo ""
echo "=========================================="
echo ""
echo "Common PostgreSQL Commands:"
echo "  \\dt              - List all tables"
echo "  \\d+ tablename    - Describe table structure"
echo "  SELECT * FROM tablename;  - View all records"
echo "  \\q               - Quit"
echo ""

# If a database name is provided as argument, connect to it
if [ "$1" != "" ]; then
    case $1 in
        user|1)
            echo "Connecting to user-db..."
            kubectl exec -it deployment/user-db -n ecommerce -- psql -U postgres -d userdb
            ;;
        product|2)
            echo "Connecting to product-db..."
            kubectl exec -it deployment/product-db -n ecommerce -- psql -U postgres -d productdb
            ;;
        cart|3)
            echo "Connecting to cart-db..."
            kubectl exec -it deployment/cart-db -n ecommerce -- psql -U postgres -d cartdb
            ;;
        order|4)
            echo "Connecting to order-db..."
            kubectl exec -it deployment/order-db -n ecommerce -- psql -U postgres -d orderdb
            ;;
        payment|5)
            echo "Connecting to payment-db..."
            kubectl exec -it deployment/payment-db -n ecommerce -- psql -U postgres -d paymentdb
            ;;
        *)
            echo "Unknown database: $1"
            echo "Usage: ./access-db.sh [user|product|cart|order|payment|1-5]"
            ;;
    esac
fi
