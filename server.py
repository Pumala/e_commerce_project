from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from flask import Flask, flash, redirect, request, jsonify
import pg, os
import bcrypt, uuid
import time

db = pg.DB(
    dbname=os.environ.get('PG_DBNAME'),
    host=os.environ.get('PG_HOST'),
    user=os.environ.get('PG_USERNAME'),
    passwd=os.environ.get('PG_PASSWORD')
)

tmp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
app = Flask('e_commerce_pro', static_url_path='', template_folder=tmp_dir)

def token_check(customer_id):
    # customer_id = 4
    token = db.query("select token from auth_token where customer_id = $1", customer_id).dictresult()
    if (token):
        return jsonify(token)
    else:
        return 403

@app.route('/')
def home():
    # results = db.query('select * from product')

    return app.send_static_file('index.html')

@app.route('/api/products')
def api_product_results():
    query = db.query('select * from product').dictresult()

    return jsonify(query)

@app.route('/api/product/<product_id>')
def api_product_details(product_id):
    query = db.query('select * from product where id = $1', product_id).dictresult()[0]
    return jsonify(query)

# @app.route('/api/user/signup')
# def render_user_signup():
#     return

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
    return "OKAY!"

@app.route('/api/user/login', methods=['POST'])
def api_user_login():

    data = request.get_json()

    # get email form user
    email = data['email']

    # get password from user
    password = data['password']

    # get encrypted password from the db
    # run a query to grab it
    query = db.query('select * from customer where email = $1', email).dictresult()[0]
    encrypted_password = query['password']

    # and grab id for use later
    customer_id = query['id']

    # rehash => (applying 1 way function) takes the user password and rehashes it to an encrypted password
    rehash = bcrypt.hashpw(password.encode('utf-8'), encrypted_password)

    # now we check both encypted passwords to see if they match
    if encrypted_password == rehash:
        # generate the authentication token using the uuid module
        token = uuid.uuid4()
        print "Login success!"
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
        return jsonify({
            "status": 401,
            "message": "You have failed!"
        })

@app.route('/api/shopping_cart', methods=['POST'])
def api_shopping_cart():
    # grab the user and product info using request
    results = request.get_json()

    customer_id = results['id']

    # user can only have access to shopping cart if token exists
    # make a token check
    token = token_check(customer_id)

    # if token doesn't exist, return "FAIL"
    if token == 403:
        return "Login failed", 403
    # else, continue on if token is a match
    else:
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
        return 'It was a success!'


@app.route('/api/shopping_cart')
def shopping_cart():

    # hardcode customer_id for now
    customer_id = 11

    # run a query to grab all the products in the shopping cart that belong to the customer
    query = db.query('select * from customer, product_in_shopping_cart, product where customer.id = product_in_shopping_cart.customer_id and product_in_shopping_cart.product_id = product.id and customer.id = $1', customer_id).dictresult()

    print "Printing the query for shopping cart..."
    print query

    return jsonify(query)

@app.route('/api/shopping_cart/checkout', methods=['POST'])
def api_checkout():

    # hardcode customer_id for now
    customer_id = 11

    # run a query to grab all the products in the shopping cart that belong to the customer
    query = db.query('select * from customer, product_in_shopping_cart, product where customer.id = product_in_shopping_cart.customer_id and product_in_shopping_cart.product_id = product.id and customer.id = $1', customer_id).dictresult()

    print "Length of query: "
    print len(query)

    total_price = 0;
    # loop through the items and add each item's price to get the total price
    for item in range(0, len(query)):
        total_price += query[item]['price']

    print "Total Price: "
    print total_price

    db.insert(
        'purchase',
        {
            'customer_id': customer_id,
            'total_price': total_price
        }
    );

    # run a query to grab all the product_id and purchase_id neccessary for next step
    newQuery = db.query('select product_id, purchase.id as purchase_id from product_in_shopping_cart, purchase where product_in_shopping_cart.customer_id = purchase.customer_id and purchase.customer_id = $1', customer_id).dictresult()

    # run a loop and insert the pair (product_id and purchase_id) into product_in_purchase table
    for item in newQuery:
        print "Item in newQuery: "
        print item
        db.insert(
            'product_in_purchase',
            {
                'product_id': item['product_id'],
                'purchase_id': item['purchase_id']
            }
        )

    # delete all the items in the customer's shopping cart
    db.query('delete from product_in_shopping_cart where customer_id = $1', customer_id)

    return "OKAY!"






if __name__ == '__main__':
    app.run(debug=True)
