from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from flask import Flask, flash, redirect, request, jsonify
import pg, os
import uuid, bcrypt, stripe

db = pg.DB(
    dbname=os.environ.get('PG_DBNAME'),
    host=os.environ.get('PG_HOST'),
    user=os.environ.get('PG_USERNAME'),
    passwd=os.environ.get('PG_PASSWORD')
)

tmp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
app = Flask('e_commerce_pro', static_url_path='', template_folder=tmp_dir)

@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/api/products')
def api_product_results():
    query = db.query('select * from product').dictresult()

    return jsonify(query)

@app.route('/api/product/<product_id>')
def api_product_details(product_id):
    query = db.query('select * from product where id = $1', product_id).dictresult()[0]
    return jsonify(query)

@app.route('/api/user/signup', methods=['POST'])
def api_user_signup():
    print "Shipping over form values from signup form: "
    print request.get_json

    username = request.get_json()['username']
    email = request.get_json()['email']
    password = request.get_json()['password']
    first_name = request.get_json()['first_name']
    last_name = request.get_json()['last_name']

    # encrypt a password using salt
    # first step, generates a new salt
    salt = bcrypt.gensalt()
    # second step, generate the encrypted password
    encrypted_password = bcrypt.hashpw(password.encode('utf-8'), salt)

    db.insert(
        'customer',
        {
            'username': username,
            'email': email,
            'password': encrypted_password,
            'first_name': first_name,
            'last_name': last_name
        }
    )
    print "Inserted new customer into DB!"
    return "Hello"

@app.route('/api/user/login', methods=['POST'])
def api_user_login():

    data = request.get_json()

    # get email form user
    username = data['username']

    # get password from user
    password = data['password']

    # get encrypted password from the db
    # run a query to grab it
    query = db.query('select * from customer where username = $1', username).dictresult()[0]
    encrypted_password = query['password']

    # and grab id for use later
    customer_id = query['id']

    # rehash => (applying 1 way function) takes the user password and rehashes it to an encrypted password
    rehash = bcrypt.hashpw(password.encode('utf-8'), encrypted_password)

    # now we check both encypted passwords to see if they match
    if encrypted_password == rehash:
        # generate the authentication token using the uuid module
        token = uuid.uuid4()
        print "Login success passwords match!"
        db.insert(
            'auth_token', {
                'token': token,
                'customer_id': customer_id
            }
        )
        return jsonify({
            "user":
                {
                    'id': query['id'],
                    'username': query['username'],
                    'email': query['email'],
                    'first_name': query['first_name'],
                    'last_name': query['last_name']
                },
                "auth_token": token
            })
    else:
        print "Login unsuccessful!!!"
        return jsonify({
            "status": 401,
            "message": "You have failed!"
        })

@app.route('/api/shopping_cart', methods=['POST'])
def api_shopping_cart():
    # grab the user's token and product info using request
    results = request.get_json()
    print "Results information: %s" % results

    # grab customer id from results
    customer_id = results['customer_id']
    print "Customer ID information: %s" % customer_id

    # user can only have access to shopping cart if token exists
    token = results['auth_token']
    print "Token information: %s" % token

    # if token doesn't exist, return "FAIL"
    if not token:
        return "Cannot access shopping cart", 403
    # else, doesn't do anything if token is not a match
    else:
        pass
    if results['add_remove'] == 'Add':
        # grab the user and product info using request
        product_id = results['product_id']

        # user is able to enter products into shopping cart
        db.insert(
            'product_in_shopping_cart',
            {
                'product_id': product_id,
                'customer_id': customer_id
            }
        )
        return 'It was a success adding item!'
    elif results['add_remove'] == 'Remove':

        # grab the user and product info using request
        product_id = results['product_id']

        # use product_id and customer_id to make a query to grab
        # product_in_shopping_cart id to delete
        deletedItemId = db.query('select id from product_in_shopping_cart where product_id = $1 and customer_id = $2', (product_id, customer_id)).namedresult()[0].id
        deletedItemId = int(deletedItemId)

        # deletedItemId = deletedItemId.namedresult()[0]['id']
        # user is able to delete products into shopping cart
        db.delete(
            'product_in_shopping_cart',
            {
                'id': deletedItemId
            }
        )
        return "Item deleted!!"


@app.route('/api/shopping_cart')
def shopping_cart():
    # grab the user's token and product info using request
    print "Request args %s" % request.args

    token = request.args.get('auth_token')
    print "Results information: %s" % token

    # if token doesn't exist, return "FAIL"
    if not token:
        return "Cannot access shopping cart", 403
    else:
        customer_id = db.query('select customer_id from auth_token where token = $1', token).namedresult()[0].customer_id
        print "Customer ID: %s", customer_id
        # run a query to grab all the products in the shopping cart that belong to the customer
        shopping_cart_products = db.query('select * from customer, product_in_shopping_cart, product where customer.id = product_in_shopping_cart.customer_id and product_in_shopping_cart.product_id = product.id and customer.id = $1', customer_id).dictresult()
        print "Printing the shopping_cart_products information..."
        print shopping_cart_products

        print "Length of query: "
        print len(shopping_cart_products)

        total_price = 0;
        # loop through the items and add each item's price to get the total price
        for item in range(0, len(shopping_cart_products)):
            total_price += shopping_cart_products[item]['price']

        print "Total Price: "
        print total_price

        return jsonify({
            'shopping_cart_products': shopping_cart_products,
            'total_price': total_price
        })

@app.route('/api/shopping_cart/checkout', methods=['POST'])
def api_checkout():

    results = request.get_json()
    # if results['shipping_info'] == None

    print "Results information: %s" % results

    # grab the user's token using request
    token = results['auth_token']
    print "TOKEN information: %s" % token

    # if token doesn't exist, return "FAIL"
    if not token:
        return "Cannot access shopping cart", 403
    else:

        # grab the user's payment's token
        stripe_token = results['stripe_token']['id']
        print "STRIPE TOKEN ID %s", stripe_token

        # grab the user's payment's token
        stripe_email = results['stripe_token']['email']
        print "STRIPE TOKEN EMAIL %s", stripe_email

        customer_id = db.query('select customer_id from auth_token where token = $1', token).namedresult()[0].customer_id
        print "Customer ID: %s", customer_id
        # run a query to grab all the products in the shopping cart that belong to the customer
        shopping_cart_products = db.query('select * from customer, product_in_shopping_cart, product where customer.id = product_in_shopping_cart.customer_id and product_in_shopping_cart.product_id = product.id and customer.id = $1', customer_id).dictresult()
        print "Printing the shopping_cart_products information..."
        print shopping_cart_products

        print "Length of query: "
        print len(shopping_cart_products)

        total_price = 0;
        # loop through the items and add each item's price to get the total price
        for item in range(0, len(shopping_cart_products)):
            total_price += shopping_cart_products[item]['price']

        print "Total Price: "
        print total_price

        # Stripe Secret key
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

        # to create a credit card charge, create a charge object
        credit_card_charge = stripe.Charge.create(
          amount= total_price * 100,
          currency="usd",
          source= stripe_token, # obtained with Stripe.js
          description="Charge for %s" % stripe_email
        )

        print 'CREDIT CARD CHARGE RESPONSE %s', credit_card_charge
        print '\n\n\nCREDIT CARD CHARGE RESPONSE for STATUS: %s\n\n\n' % credit_card_charge['status']
        print '\n\n\nCREDIT CARD CHARGE RESPONSE for SOURCE BRAND: %s\n\n\n', credit_card_charge['source']['brand']

        # if the credit card payment was successful, continue to insert order into db
        if credit_card_charge['status'] == 'succeeded':

            purchase_id = db.query(
            """
                INSERT INTO
                    purchase(
                        customer_id,
                        total_price,
                        address,
                        address_line_2,
                        city,
                        state,
                        zip_code
                    )
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
            """, (
                    customer_id,
                    total_price,
                    results['shipping_info']['address'],
                    results['shipping_info']['address_line_2'],
                    results['shipping_info']['city'],
                    results['shipping_info']['state'],
                    results['shipping_info']['zip_code']
                )
            )
            purchase_id = purchase_id.namedresult()[0].id

            # run a query to grab all the product_id neccessary for next step
            productIdQuery = db.query("""
                select
                    product_id,
                    purchase.id as purchase_id
                from
                    product_in_shopping_cart,
                    purchase
                where
                    product_in_shopping_cart.customer_id = purchase.customer_id and
                    purchase.customer_id = $1
                """,
                customer_id).dictresult()

            # run a loop and insert the pair (product_id and purchase_id) into product_in_purchase table
            for item in productIdQuery:
                print "Item in productIdQuery: "
                print item
                db.insert(
                    'product_in_purchase',
                    {
                        'product_id': item['product_id'],
                        'purchase_id': purchase_id
                    }
                )

            # delete all the items in the customer's shopping cart
            db.query('delete from product_in_shopping_cart where customer_id = $1', customer_id)

            return jsonify({
                'shopping_cart_products': shopping_cart_products,
                'total_price': total_price
            })
        else:
            # if payment charge wasn't sucessful
            # Stripe will handle the error
            # 400 => the request was unacceptable
            return "FAIL!!!!", 400

if __name__ == '__main__':
    app.run(debug=True)
